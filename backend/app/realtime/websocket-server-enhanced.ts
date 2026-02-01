/**
 * Enhanced WebSocket Server
 * Real-time agent updates, workflow progress, and activity streaming
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { connectionManager } from './connection-manager.js';
import { eventBroadcaster } from './event-broadcaster.js';

export interface WebSocketMessage {
  type: string;
  payload?: any;
  token?: string;
  channels?: string[];
  channel?: string;
}

export class EnhancedWebSocketServer {
  private wss: WebSocketServer;
  private server: HttpServer;

  constructor(server: HttpServer) {
    this.server = server;
    this.wss = new WebSocketServer({ server, path: '/ws' });

    // Initialize event broadcaster
    eventBroadcaster.initialize();

    this.setupWebSocketServer();

    console.log('[WebSocketServer] Enhanced WebSocket server initialized on /ws');
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const connectionId = uuidv4();

      console.log(`[WebSocketServer] New connection: ${connectionId}`);

      // Add connection
      const connection = connectionManager.addConnection(connectionId, ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        payload: {
          connectionId,
          timestamp: new Date(),
          message: 'Connected to SovrenAI WebSocket server'
        }
      });

      // Handle messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(connectionId, message, ws);
        } catch (error) {
          console.error(`[WebSocketServer] Error parsing message from ${connectionId}:`, error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle close
      ws.on('close', () => {
        console.log(`[WebSocketServer] Connection closed: ${connectionId}`);
        connectionManager.removeConnection(connectionId);
      });

      // Handle error
      ws.on('error', (error) => {
        console.error(`[WebSocketServer] Error on connection ${connectionId}:`, error);
        connectionManager.removeConnection(connectionId);
      });

      // Handle pong
      ws.on('pong', () => {
        const conn = connectionManager.getConnection(connectionId);
        if (conn) {
          conn.lastPing = new Date();
        }
      });
    });

    console.log('[WebSocketServer] Setup complete');
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(connectionId: string, message: WebSocketMessage, ws: WebSocket): void {
    console.log(`[WebSocketServer] Message from ${connectionId}: ${message.type}`);

    switch (message.type) {
      case 'auth':
      case 'authenticate':
        this.handleAuth(connectionId, message, ws);
        break;

      case 'subscribe':
        this.handleSubscribe(connectionId, message, ws);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(connectionId, message, ws);
        break;

      case 'get_activity':
        this.handleGetActivity(connectionId, message, ws);
        break;

      case 'ping':
        this.handlePing(connectionId, ws);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle authentication
   */
  private handleAuth(connectionId: string, message: WebSocketMessage, ws: WebSocket): void {
    if (!message.token) {
      this.sendError(ws, 'Token required for authentication');
      return;
    }

    const success = connectionManager.authenticateConnection(connectionId, message.token);

    if (success) {
      const connection = connectionManager.getConnection(connectionId);
      this.sendToClient(ws, {
        type: 'authenticated',
        payload: {
          connectionId,
          username: connection?.username,
          role: connection?.role,
          timestamp: new Date()
        }
      });
    } else {
      this.sendError(ws, 'Authentication failed');
    }
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(connectionId: string, message: WebSocketMessage, ws: WebSocket): void {
    const connection = connectionManager.getConnection(connectionId);

    if (!connection?.authenticated) {
      this.sendError(ws, 'Authentication required to subscribe');
      return;
    }

    const channels = message.channels || (message.channel ? [message.channel] : []);

    if (channels.length === 0) {
      this.sendError(ws, 'No channels specified');
      return;
    }

    for (const channel of channels) {
      connectionManager.subscribe(connectionId, channel);
    }

    this.sendToClient(ws, {
      type: 'subscribed',
      payload: {
        channels,
        timestamp: new Date()
      }
    });

    // If subscribing to activity, send recent history
    if (channels.includes('activity')) {
      const history = eventBroadcaster.getActivityHistory(50);
      this.sendToClient(ws, {
        type: 'activity_history',
        payload: {
          activities: history,
          count: history.length
        }
      });
    }
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(connectionId: string, message: WebSocketMessage, ws: WebSocket): void {
    const channels = message.channels || (message.channel ? [message.channel] : []);

    if (channels.length === 0) {
      this.sendError(ws, 'No channels specified');
      return;
    }

    for (const channel of channels) {
      connectionManager.unsubscribe(connectionId, channel);
    }

    this.sendToClient(ws, {
      type: 'unsubscribed',
      payload: {
        channels,
        timestamp: new Date()
      }
    });
  }

  /**
   * Handle get activity request
   */
  private handleGetActivity(connectionId: string, message: WebSocketMessage, ws: WebSocket): void {
    const connection = connectionManager.getConnection(connectionId);

    if (!connection?.authenticated) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const limit = message.payload?.limit || 100;
    const history = eventBroadcaster.getActivityHistory(limit);

    this.sendToClient(ws, {
      type: 'activity_history',
      payload: {
        activities: history,
        count: history.length,
        timestamp: new Date()
      }
    });
  }

  /**
   * Handle ping
   */
  private handlePing(connectionId: string, ws: WebSocket): void {
    this.sendToClient(ws, {
      type: 'pong',
      payload: {
        timestamp: new Date()
      }
    });
  }

  /**
   * Send message to client
   */
  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error to client
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendToClient(ws, {
      type: 'error',
      payload: {
        error,
        timestamp: new Date()
      }
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    connections: any;
    broadcaster: any;
  } {
    return {
      connections: connectionManager.getStats(),
      broadcaster: eventBroadcaster.getStats()
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    console.log('[WebSocketServer] Cleaning up...');

    // Close all connections
    this.wss.clients.forEach(client => {
      try {
        client.close();
      } catch (error) {
        console.error('[WebSocketServer] Error closing client:', error);
      }
    });

    // Cleanup connection manager
    connectionManager.cleanup();

    // Close server
    this.wss.close();

    console.log('[WebSocketServer] Cleanup complete');
  }
}

let enhancedWebSocketServer: EnhancedWebSocketServer | null = null;

/**
 * Initialize enhanced WebSocket server
 */
export function initializeEnhancedWebSocket(server: HttpServer): EnhancedWebSocketServer {
  if (enhancedWebSocketServer) {
    console.log('[WebSocketServer] Already initialized');
    return enhancedWebSocketServer;
  }

  enhancedWebSocketServer = new EnhancedWebSocketServer(server);
  return enhancedWebSocketServer;
}

/**
 * Get WebSocket server instance
 */
export function getEnhancedWebSocketServer(): EnhancedWebSocketServer | null {
  return enhancedWebSocketServer;
}
