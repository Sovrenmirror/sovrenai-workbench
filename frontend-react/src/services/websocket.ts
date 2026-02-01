/**
 * WebSocket Client
 * Connects to backend WebSocket server and updates stores
 */

import { useAgentStore } from '../store/agentStore';
import { useActivityStore } from '../store/activityStore';
import { useUIStore } from '../store/uiStore';
import { AgentStatus, type AgentProgress } from '../types/agent';
import { config } from '../config/api';

interface WebSocketMessage {
  type: string;
  payload?: any;
  token?: string;
  channels?: string[];
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimeout: number | null = null;
  private url: string;
  private token?: string;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): void {
    this.token = token;

    try {
      console.log('[WebSocket] Connecting to', this.url);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        useUIStore.getState().setWsConnected(true);

        // Authenticate if token provided
        if (this.token) {
          this.send({
            type: 'authenticate',
            token: this.token
          });
        }

        // Subscribe to channels
        this.send({
          type: 'subscribe',
          channels: ['activity', 'events', 'agent.*']
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        useUIStore.getState().setWsConnected(false);
        this.reconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.reconnect();
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      useUIStore.getState().setWsReconnecting(false);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    useUIStore.getState().setWsReconnecting(true);

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect(this.token);
    }, delay);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('[WebSocket] Message:', message.type, message.payload);

    switch (message.type) {
      case 'connected':
        console.log('[WebSocket] Server acknowledged connection:', message.payload);
        break;

      case 'authenticated':
        console.log('[WebSocket] Authenticated:', message.payload);
        break;

      case 'subscribed':
        console.log('[WebSocket] Subscribed to channels:', message.payload);
        break;

      case 'agent_status':
        this.handleAgentStatus(message.payload);
        break;

      case 'agent_progress':
        this.handleAgentProgress(message.payload);
        break;

      case 'task_started':
      case 'task_completed':
      case 'task_failed':
        this.handleTaskEvent(message.type, message.payload);
        break;

      case 'workflow_started':
      case 'workflow_step':
      case 'workflow_completed':
      case 'workflow_failed':
        this.handleWorkflowEvent(message.type, message.payload);
        break;

      case 'activity':
        this.handleActivity(message.payload);
        break;

      case 'activity_history':
        this.handleActivityHistory(message.payload);
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'error':
        console.error('[WebSocket] Server error:', message.payload);
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }

  /**
   * Handle agent status update
   */
  private handleAgentStatus(payload: any): void {
    const { agentId, status } = payload;
    if (agentId && status) {
      useAgentStore.getState().updateAgentStatus(agentId, status as AgentStatus);
    }
  }

  /**
   * Handle agent progress update
   */
  private handleAgentProgress(payload: any): void {
    const { agentId, taskId, percent, message, stage } = payload;
    if (agentId) {
      const progress: AgentProgress = {
        taskId,
        percent,
        message,
        stage,
        startedAt: new Date()
      };
      useAgentStore.getState().updateAgentProgress(agentId, progress);
    }
  }

  /**
   * Handle task events
   */
  private handleTaskEvent(type: string, payload: any): void {
    const { agentId, taskId } = payload;

    if (type === 'task_started') {
      useAgentStore.getState().setCurrentTask(agentId, taskId);
      useAgentStore.getState().updateAgentStatus(agentId, AgentStatus.WORKING);
    } else if (type === 'task_completed') {
      useAgentStore.getState().setCurrentTask(agentId, undefined);
      useAgentStore.getState().updateAgentStatus(agentId, AgentStatus.COMPLETED);
      useAgentStore.getState().clearAgentProgress(agentId);

      // Update stats
      const agent = useAgentStore.getState().getAgent(agentId);
      if (agent) {
        useAgentStore.getState().updateAgentStats(agentId, {
          tasksCompleted: agent.stats.tasksCompleted + 1
        });
      }
    } else if (type === 'task_failed') {
      useAgentStore.getState().setCurrentTask(agentId, undefined);
      useAgentStore.getState().updateAgentStatus(agentId, AgentStatus.ERROR);
      useAgentStore.getState().clearAgentProgress(agentId);
    }
  }

  /**
   * Handle workflow events
   */
  private handleWorkflowEvent(_type: string, _payload: any): void {
    // Workflow events will be fully implemented in Phase 6
    // TODO: Implement workflow event handling
  }

  /**
   * Handle activity feed event
   */
  private handleActivity(payload: any): void {
    console.log('[WebSocket] Adding activity to store:', payload);
    useActivityStore.getState().addActivity({
      type: payload.type,
      message: payload.message,
      agentId: payload.agentId,
      taskId: payload.taskId,
      workflowId: payload.workflowId,
      status: payload.status,
      timestamp: new Date(payload.timestamp)
    });
    console.log('[WebSocket] Activity added, total activities:', useActivityStore.getState().activities.length);
  }

  /**
   * Handle activity history
   */
  private handleActivityHistory(payload: any): void {
    const { activities } = payload;
    if (Array.isArray(activities)) {
      activities.forEach((activity: any) => {
        useActivityStore.getState().addActivity({
          type: activity.payload?.type || 'unknown',
          message: activity.payload?.message || '',
          agentId: activity.payload?.agentId,
          taskId: activity.payload?.taskId,
          status: activity.payload?.status,
          timestamp: new Date(activity.timestamp)
        });
      });
    }
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, connection not open');
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    useUIStore.getState().setWsConnected(false);
    useUIStore.getState().setWsReconnecting(false);
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient(config.ws.url);
