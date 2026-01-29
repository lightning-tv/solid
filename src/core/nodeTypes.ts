export const NodeType = {
  Element: 'element',
  TextNode: 'textNode',
  Text: 'text',
} as const;
export type NodeTypes = (typeof NodeType)[keyof typeof NodeType];
