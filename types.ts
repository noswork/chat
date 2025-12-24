
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface UsageMetadata {
  points: number;
  appName: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
  attachments?: Attachment[];
  modelId?: string; // Track specific model used for this message
  usage?: UsageMetadata; // New: Usage tracking
  excludeFromContext?: boolean; // New: If true, this message is ignored by the model context
  isContextDivider?: boolean; // New: Visual divider for cleared context
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  isPro?: boolean;
  capabilities: string[];
  // New config flags
  supportsThinking?: boolean;
  allowedThinkingLevels?: ('minimal' | 'low' | 'high')[];
  supportsImageOptions?: boolean;
  supportsTTS?: boolean;
}

export interface ModelParameters {
  thinkingLevel?: 'minimal' | 'low' | 'high';
  webSearch: boolean;
  imageSize?: '1K' | '2K' | '4K';
  imageOnly?: boolean;
  aspectRatio?: string;
  // TTS Specifics
  ttsLanguage?: string;
  ttsEmotion?: string;
  ttsSpeed?: number;
  ttsVolume?: number;
  ttsPitch?: number;
  ttsVoice?: string;
  ttsHd?: boolean;
}
