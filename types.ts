export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type AiModel = string;

export interface ModelOption {
  value: AiModel;
  label: string;
  group: string;
}
