/**
 * Activity Feed Types
 */

export interface Activity {
  id: string;
  type: string;
  message: string;
  agentId?: string;
  taskId?: string;
  workflowId?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  payload?: any;
}

export interface ActivityEvent {
  type: 'activity';
  timestamp: Date;
  payload: Activity;
}
