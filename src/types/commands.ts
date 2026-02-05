export type LLMCommandType = 'connect' | 'align' | 'group' | 'distribute';

export interface LLMCommand {
  id?: string;
  op: LLMCommandType;
  source?: string;       // Element ID
  target?: string;       // Element ID
  direction?: 'horizontal' | 'vertical';
  gridCell?: string;     // For grid-based operations
}

export interface CommandResult {
  success: boolean;
  modifiedEvents: any[];
  message?: string;
}
