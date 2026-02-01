/**
 * WebSocket Server
 * Real-time communication for agent updates, progress, and documents
 */

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import type { StepTrace } from '../agents/base/agent-types.js';
import type { Document } from '../services/document-service.js';

interface Client {
  ws: WebSocket;
  userId: string;
  conversationId?: string;
  clientId: string;
}

class SovrenWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();

      console.log(`[WebSocket] Client connected: ${clientId}`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('[WebSocket] Message error:', error);
        }
      });

      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error (${clientId}):`, error);
      });

      // Store client with temporary ID
      this.clients.set(clientId, { ws, userId: '', clientId });

      // Send connection confirmation
      this.send(ws, {
        type: 'connected',
        clientId,
        timestamp: Date.now()
      });
    });

    console.log('[WebSocket] Server initialized on /ws');
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'authenticate':
        client.userId = data.userId;
        console.log(`[WebSocket] Client authenticated: ${clientId} as user ${data.userId}`);
        this.send(client.ws, {
          type: 'authenticated',
          userId: data.userId,
          timestamp: Date.now()
        });
        break;

      case 'subscribe':
        client.conversationId = data.conversationId;
        console.log(`[WebSocket] Client subscribed: ${clientId} to conversation ${data.conversationId}`);
        this.send(client.ws, {
          type: 'subscribed',
          conversationId: data.conversationId,
          timestamp: Date.now()
        });
        break;

      case 'unsubscribe':
        console.log(`[WebSocket] Client unsubscribed: ${clientId} from conversation ${client.conversationId}`);
        client.conversationId = undefined;
        this.send(client.ws, {
          type: 'unsubscribed',
          timestamp: Date.now()
        });
        break;

      case 'ping':
        this.send(client.ws, {
          type: 'pong',
          timestamp: Date.now()
        });
        break;

      default:
        console.warn(`[WebSocket] Unknown message type: ${data.type}`);
    }
  }

  /**
   * Send message to WebSocket client
   */
  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
      }
    }
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, message: any): void {
    let sentCount = 0;
    this.clients.forEach(client => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, message);
        sentCount++;
      }
    });
    console.log(`[WebSocket] Sent message to ${sentCount} clients for user ${userId}`);
  }

  /**
   * Send message to users subscribed to a conversation
   */
  sendToConversation(conversationId: string, message: any): void {
    let sentCount = 0;
    this.clients.forEach(client => {
      if (client.conversationId === conversationId && client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, message);
        sentCount++;
      }
    });
    if (sentCount > 0) {
      console.log(`[WebSocket] Sent message to ${sentCount} clients in conversation ${conversationId}`);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: any): void {
    let sentCount = 0;
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, message);
        sentCount++;
      }
    });
    console.log(`[WebSocket] Broadcast message to ${sentCount} clients`);
  }

  /**
   * Send agent step update
   */
  sendAgentStep(conversationId: string, step: StepTrace): void {
    this.sendToConversation(conversationId, {
      type: 'agent_step',
      step,
      timestamp: Date.now()
    });
  }

  /**
   * Send progress update
   */
  sendProgress(
    conversationId: string,
    agentName: string,
    progress: number,
    details: string,
    currentStep?: string,
    estimatedCompletion?: Date
  ): void {
    this.sendToConversation(conversationId, {
      type: 'progress',
      agent: agentName,
      progress,
      details,
      currentStep,
      estimatedCompletion: estimatedCompletion?.toISOString(),
      timestamp: Date.now()
    });
  }

  /**
   * Send document update
   */
  sendDocumentUpdate(conversationId: string, document: Document): void {
    this.sendToConversation(conversationId, {
      type: 'document_update',
      document,
      timestamp: Date.now()
    });
  }

  /**
   * Send document creation started notification
   */
  sendDocumentCreating(
    conversationId: string,
    documentId: string,
    title: string,
    agent: string
  ): void {
    this.sendToConversation(conversationId, {
      type: 'document_creating',
      documentId,
      title,
      agent,
      timestamp: Date.now()
    });
  }

  /**
   * Send error notification
   */
  sendError(conversationId: string, error: { message: string; agent?: string }): void {
    this.sendToConversation(conversationId, {
      type: 'error',
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalClients: number;
    authenticatedClients: number;
    subscribedClients: number;
  } {
    let authenticatedClients = 0;
    let subscribedClients = 0;

    this.clients.forEach(client => {
      if (client.userId) authenticatedClients++;
      if (client.conversationId) subscribedClients++;
    });

    return {
      totalClients: this.clients.size,
      authenticatedClients,
      subscribedClients
    };
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close all connections and shut down server
   */
  close(): void {
    this.clients.forEach(client => {
      client.ws.close();
    });
    this.clients.clear();
    this.wss?.close();
    console.log('[WebSocket] Server closed');
  }
}

// Export singleton instance
export const wsServer = new SovrenWebSocketServer();
