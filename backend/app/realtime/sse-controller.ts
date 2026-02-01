/**
 * SSE (Server-Sent Events) Controller
 * Fallback for WebSocket when not available
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eventBroadcaster } from './event-broadcaster.js';
import { EventEmitter } from 'events';

export interface SSEConnection {
  id: string;
  res: Response;
  userId?: string;
  channels: Set<string>;
  connectedAt: Date;
  lastEvent: Date;
}

export class SSEController extends EventEmitter {
  private connections: Map<string, SSEConnection> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    super();

    // Cleanup stale connections every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000);
  }

  /**
   * Handle SSE connection
   */
  handleConnection(req: Request, res: Response): void {
    const connectionId = uuidv4();

    console.log(`[SSE] New connection: ${connectionId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Enable CORS if needed
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    this.sendEvent(res, 'connected', {
      connectionId,
      timestamp: new Date(),
      message: 'Connected to SovrenAI SSE stream'
    });

    // Create connection
    const connection: SSEConnection = {
      id: connectionId,
      res,
      channels: new Set(['activity']), // Default to activity channel
      connectedAt: new Date(),
      lastEvent: new Date()
    };

    this.connections.set(connectionId, connection);

    // Handle client disconnect
    req.on('close', () => {
      console.log(`[SSE] Connection closed: ${connectionId}`);
      this.connections.delete(connectionId);
    });

    // Subscribe to activity events
    const activityHandler = (event: any) => {
      this.sendEvent(res, 'activity', event.payload);
      connection.lastEvent = new Date();
    };

    eventBroadcaster.on('activity', activityHandler);

    // Send heartbeat every 15 seconds
    const heartbeatInterval = setInterval(() => {
      if (this.connections.has(connectionId)) {
        this.sendEvent(res, 'heartbeat', { timestamp: new Date() });
      } else {
        clearInterval(heartbeatInterval);
        eventBroadcaster.off('activity', activityHandler);
      }
    }, 15000);

    // Send recent activity history
    const history = eventBroadcaster.getActivityHistory(20);
    this.sendEvent(res, 'history', {
      activities: history.map(h => h.payload),
      count: history.length
    });
  }

  /**
   * Send SSE event to client
   */
  private sendEvent(res: Response, event: string, data: any): void {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('[SSE] Error sending event:', error);
    }
  }

  /**
   * Broadcast event to all SSE connections
   */
  broadcast(event: string, data: any): void {
    for (const connection of this.connections.values()) {
      try {
        this.sendEvent(connection.res, event, data);
        connection.lastEvent = new Date();
      } catch (error) {
        console.error(`[SSE] Error broadcasting to ${connection.id}:`, error);
        this.connections.delete(connection.id);
      }
    }
  }

  /**
   * Broadcast to specific channel
   */
  broadcastToChannel(channel: string, event: string, data: any): void {
    for (const connection of this.connections.values()) {
      if (connection.channels.has(channel)) {
        try {
          this.sendEvent(connection.res, event, data);
          connection.lastEvent = new Date();
        } catch (error) {
          console.error(`[SSE] Error broadcasting to ${connection.id}:`, error);
          this.connections.delete(connection.id);
        }
      }
    }
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [connectionId, connection] of this.connections.entries()) {
      const timeSinceLastEvent = now - connection.lastEvent.getTime();

      if (timeSinceLastEvent > staleThreshold) {
        console.log(`[SSE] Removing stale connection: ${connectionId}`);
        try {
          connection.res.end();
        } catch (error) {
          // Ignore error
        }
        this.connections.delete(connectionId);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalConnections: number;
    byChannel: Record<string, number>;
  } {
    const byChannel: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      for (const channel of connection.channels) {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      }
    }

    return {
      totalConnections: this.connections.size,
      byChannel
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    clearInterval(this.cleanupInterval);

    // End all connections
    for (const connection of this.connections.values()) {
      try {
        connection.res.end();
      } catch (error) {
        // Ignore error
      }
    }

    this.connections.clear();
    console.log('[SSE] Cleanup complete');
  }
}

// Export singleton instance
export const sseController = new SSEController();
