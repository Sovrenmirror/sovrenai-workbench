/**
 * Connection Manager
 * Manages WebSocket connections with authentication and subscription tracking
 */

import { WebSocket } from 'ws';
import { verifyToken } from '../auth/dev-bootstrap.js';
import { EventEmitter } from 'events';

export interface ClientConnection {
  id: string;
  ws: WebSocket;
  userId?: string;
  username?: string;
  role?: string;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastPing: Date;
  authenticated: boolean;
}

export class ConnectionManager extends EventEmitter {
  private connections: Map<string, ClientConnection> = new Map();
  private pingInterval: NodeJS.Timeout;
  private pingIntervalMs: number = 30000; // 30 seconds

  constructor() {
    super();

    // Start ping interval
    this.pingInterval = setInterval(() => {
      this.pingAllConnections();
    }, this.pingIntervalMs);
  }

  /**
   * Add a new connection
   */
  addConnection(connectionId: string, ws: WebSocket): ClientConnection {
    const connection: ClientConnection = {
      id: connectionId,
      ws,
      subscriptions: new Set(),
      connectedAt: new Date(),
      lastPing: new Date(),
      authenticated: false
    };

    this.connections.set(connectionId, connection);

    console.log(`[ConnectionManager] New connection: ${connectionId} (total: ${this.connections.size})`);
    this.emit('connection_added', connection);

    return connection;
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);

    if (connection) {
      this.connections.delete(connectionId);
      console.log(`[ConnectionManager] Removed connection: ${connectionId} (total: ${this.connections.size})`);
      this.emit('connection_removed', connection);
    }
  }

  /**
   * Authenticate a connection
   */
  authenticateConnection(connectionId: string, token: string): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return false;
    }

    try {
      // Verify JWT token
      const payload = verifyToken(token);

      connection.authenticated = true;
      connection.userId = payload.userId;
      connection.username = payload.username || payload.email;
      connection.role = payload.role;

      console.log(`[ConnectionManager] Authenticated: ${connectionId} (${connection.username})`);
      this.emit('connection_authenticated', connection);

      return true;
    } catch (error) {
      console.error(`[ConnectionManager] Authentication failed for ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Subscribe connection to channel
   */
  subscribe(connectionId: string, channel: string): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return false;
    }

    connection.subscriptions.add(channel);
    console.log(`[ConnectionManager] ${connectionId} subscribed to ${channel}`);
    this.emit('subscription_added', { connectionId, channel });

    return true;
  }

  /**
   * Unsubscribe connection from channel
   */
  unsubscribe(connectionId: string, channel: string): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      return false;
    }

    connection.subscriptions.delete(channel);
    console.log(`[ConnectionManager] ${connectionId} unsubscribed from ${channel}`);
    this.emit('subscription_removed', { connectionId, channel });

    return true;
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);

    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[ConnectionManager] Error sending to ${connectionId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connections subscribed to channel
   */
  broadcast(channel: string, message: any): number {
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.subscriptions.has(channel) && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`[ConnectionManager] Error broadcasting to ${connection.id}:`, error);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`[ConnectionManager] Broadcast to ${channel}: ${sentCount} clients`);
    }

    return sentCount;
  }

  /**
   * Broadcast to all authenticated connections
   */
  broadcastToAll(message: any): number {
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.authenticated && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`[ConnectionManager] Error broadcasting to ${connection.id}:`, error);
        }
      }
    }

    console.log(`[ConnectionManager] Broadcast to all: ${sentCount} clients`);

    return sentCount;
  }

  /**
   * Ping all connections
   */
  private pingAllConnections(): void {
    const now = new Date();

    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.ping();
          connection.lastPing = now;
        } catch (error) {
          console.error(`[ConnectionManager] Error pinging ${connectionId}:`, error);
          this.removeConnection(connectionId);
        }
      } else {
        // Connection not open, remove it
        this.removeConnection(connectionId);
      }
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): ClientConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections subscribed to channel
   */
  getSubscribers(channel: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(conn =>
      conn.subscriptions.has(channel)
    );
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    totalSubscriptions: number;
    channelCounts: Record<string, number>;
  } {
    let authenticatedCount = 0;
    let totalSubscriptions = 0;
    const channelCounts: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      if (connection.authenticated) {
        authenticatedCount++;
      }

      totalSubscriptions += connection.subscriptions.size;

      for (const channel of connection.subscriptions) {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      }
    }

    return {
      totalConnections: this.connections.size,
      authenticatedConnections: authenticatedCount,
      totalSubscriptions,
      channelCounts
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    clearInterval(this.pingInterval);

    // Close all connections
    for (const connection of this.connections.values()) {
      try {
        connection.ws.close();
      } catch (error) {
        console.error(`[ConnectionManager] Error closing connection:`, error);
      }
    }

    this.connections.clear();
    console.log('[ConnectionManager] Cleanup complete');
  }
}

// Export singleton instance
export const connectionManager = new ConnectionManager();
