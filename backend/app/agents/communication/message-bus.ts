/**
 * Message Bus
 * Event-driven inter-agent communication with request/response patterns
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  BROADCAST = 'broadcast',
  STATUS_UPDATE = 'status_update',
  ERROR = 'error'
}

export interface Message {
  id: string;
  type: MessageType;
  fromAgent: string;
  toAgent?: string;
  channel?: string;
  payload: any;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
}

export interface MessageHandler {
  (message: Message): Promise<any> | any;
}

export class MessageBus extends EventEmitter {
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private requestHandlers: Map<string, Map<string, MessageHandler>> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private messageHistory: Message[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    super();
    this.setMaxListeners(100); // Support many agents
  }

  /**
   * Subscribe to messages on a channel
   */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }

    this.handlers.get(channel)!.add(handler);

    console.log(`[MessageBus] Subscribed to channel: ${channel} (${this.handlers.get(channel)!.size} handlers)`);

    // Return unsubscribe function
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
        }
      }
    };
  }

  /**
   * Register handler for agent-specific requests
   */
  registerRequestHandler(agentId: string, requestType: string, handler: MessageHandler): void {
    if (!this.requestHandlers.has(agentId)) {
      this.requestHandlers.set(agentId, new Map());
    }

    this.requestHandlers.get(agentId)!.set(requestType, handler);

    console.log(`[MessageBus] Registered request handler: ${agentId}.${requestType}`);
  }

  /**
   * Send a request and wait for response
   */
  async request(fromAgent: string, toAgent: string, requestType: string, payload: any, timeout: number = 30000): Promise<any> {
    const messageId = uuidv4();

    const message: Message = {
      id: messageId,
      type: MessageType.REQUEST,
      fromAgent,
      toAgent,
      payload: {
        type: requestType,
        data: payload
      },
      timestamp: new Date()
    };

    // Store message in history
    this.addToHistory(message);

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout: ${requestType} to ${toAgent}`));
      }, timeout);

      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout: timeoutId
      });
    });

    // Emit request event
    this.emit('message', message);
    this.emit(`agent:${toAgent}:request`, message);

    // Check if there's a registered handler
    const agentHandlers = this.requestHandlers.get(toAgent);
    if (agentHandlers && agentHandlers.has(requestType)) {
      const handler = agentHandlers.get(requestType)!;

      try {
        const result = await handler(message);

        // Send response
        const response: Message = {
          id: uuidv4(),
          type: MessageType.RESPONSE,
          fromAgent: toAgent,
          toAgent: fromAgent,
          payload: result,
          timestamp: new Date(),
          correlationId: messageId,
          replyTo: messageId
        };

        this.handleResponse(response);
      } catch (error: any) {
        // Send error response
        const errorResponse: Message = {
          id: uuidv4(),
          type: MessageType.ERROR,
          fromAgent: toAgent,
          toAgent: fromAgent,
          payload: { error: error.message },
          timestamp: new Date(),
          correlationId: messageId,
          replyTo: messageId
        };

        this.handleResponse(errorResponse);
      }
    }

    return responsePromise;
  }

  /**
   * Send a response to a request
   */
  respond(originalMessage: Message, fromAgent: string, payload: any): void {
    const response: Message = {
      id: uuidv4(),
      type: MessageType.RESPONSE,
      fromAgent,
      toAgent: originalMessage.fromAgent,
      payload,
      timestamp: new Date(),
      correlationId: originalMessage.id,
      replyTo: originalMessage.id
    };

    this.handleResponse(response);
  }

  /**
   * Broadcast message to all subscribers on a channel
   */
  broadcast(fromAgent: string, channel: string, payload: any): void {
    const message: Message = {
      id: uuidv4(),
      type: MessageType.BROADCAST,
      fromAgent,
      channel,
      payload,
      timestamp: new Date()
    };

    // Store in history
    this.addToHistory(message);

    // Emit to channel subscribers
    this.emit('message', message);
    this.emit(`channel:${channel}`, message);

    const handlers = this.handlers.get(channel);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[MessageBus] Handler error on channel ${channel}:`, error);
        }
      });
    }

    console.log(`[MessageBus] Broadcast to ${channel}: ${handlers?.size || 0} handlers notified`);
  }

  /**
   * Send status update
   */
  sendStatus(fromAgent: string, status: any, channel?: string): void {
    const message: Message = {
      id: uuidv4(),
      type: MessageType.STATUS_UPDATE,
      fromAgent,
      channel: channel || 'status',
      payload: status,
      timestamp: new Date()
    };

    // Store in history
    this.addToHistory(message);

    // Emit to status channel
    this.emit('message', message);
    this.emit('status_update', message);
    this.emit(`agent:${fromAgent}:status`, message);

    if (channel) {
      this.emit(`channel:${channel}`, message);
    }
  }

  /**
   * Handle response message
   */
  private handleResponse(response: Message): void {
    // Store in history
    this.addToHistory(response);

    // Emit response event
    this.emit('message', response);
    this.emit('response', response);

    // Resolve pending request
    if (response.replyTo) {
      const pending = this.pendingRequests.get(response.replyTo);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.replyTo);

        if (response.type === MessageType.ERROR) {
          pending.reject(new Error(response.payload.error || 'Request failed'));
        } else {
          pending.resolve(response.payload);
        }
      }
    }
  }

  /**
   * Add message to history
   */
  private addToHistory(message: Message): void {
    this.messageHistory.push(message);

    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get message history
   */
  getHistory(filter?: {
    fromAgent?: string;
    toAgent?: string;
    channel?: string;
    type?: MessageType;
    since?: Date;
  }): Message[] {
    let history = [...this.messageHistory];

    if (filter) {
      if (filter.fromAgent) {
        history = history.filter(m => m.fromAgent === filter.fromAgent);
      }
      if (filter.toAgent) {
        history = history.filter(m => m.toAgent === filter.toAgent);
      }
      if (filter.channel) {
        history = history.filter(m => m.channel === filter.channel);
      }
      if (filter.type) {
        history = history.filter(m => m.type === filter.type);
      }
      if (filter.since) {
        const since = filter.since;
        history = history.filter(m => m.timestamp >= since);
      }
    }

    return history;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalMessages: number;
    channels: number;
    subscribers: number;
    pendingRequests: number;
    byType: Record<MessageType, number>;
  } {
    const byType: Record<MessageType, number> = {
      [MessageType.REQUEST]: 0,
      [MessageType.RESPONSE]: 0,
      [MessageType.BROADCAST]: 0,
      [MessageType.STATUS_UPDATE]: 0,
      [MessageType.ERROR]: 0
    };

    for (const message of this.messageHistory) {
      byType[message.type]++;
    }

    let totalSubscribers = 0;
    for (const handlers of this.handlers.values()) {
      totalSubscribers += handlers.size;
    }

    return {
      totalMessages: this.messageHistory.length,
      channels: this.handlers.size,
      subscribers: totalSubscribers,
      pendingRequests: this.pendingRequests.size,
      byType
    };
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
    console.log('[MessageBus] Message history cleared');
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clearPendingRequests(): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Message bus cleared'));
    }
    this.pendingRequests.clear();
    console.log('[MessageBus] Pending requests cleared');
  }
}

// Export singleton instance
export const messageBus = new MessageBus();
