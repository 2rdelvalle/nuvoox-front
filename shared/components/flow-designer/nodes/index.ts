// Export all node types
export { MessageNode } from './MessageNode';
export { QuestionNode } from './QuestionNode';
export { ConditionNode } from './ConditionNode';
export { ActionNode } from './ActionNode';
export { WaitNode } from './WaitNode';
export { HandoffNode } from './HandoffNode';
export { EndNode } from './EndNode';

// Node type mapping for ReactFlow
import { MessageNode } from './MessageNode';
import { QuestionNode } from './QuestionNode';
import { ConditionNode } from './ConditionNode';
import { ActionNode } from './ActionNode';
import { WaitNode } from './WaitNode';
import { HandoffNode } from './HandoffNode';
import { EndNode } from './EndNode';

export const nodeTypes = {
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  action: ActionNode,
  wait: WaitNode,
  handoff: HandoffNode,
  end: EndNode,
} as const;
