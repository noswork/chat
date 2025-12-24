
import { ModelConfig } from './types';

export const MODELS: ModelConfig[] = [
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    description: 'Poe: Google 最新高效多模態模型。',
    isPro: false,
    capabilities: ['Fast', 'Vision'],
    supportsThinking: true,
    allowedThinkingLevels: ['minimal', 'low', 'high']
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    description: 'Poe: Google 進階推理模型。',
    isPro: true,
    capabilities: ['Reasoning', 'Complex Tasks'],
    supportsThinking: true,
    allowedThinkingLevels: ['low', 'high']
  },
  {
    id: 'gpt-5.2-instant',
    name: 'GPT-5.2 Instant',
    description: 'Poe: 最新即時模型。',
    isPro: true,
    capabilities: ['Web Search', 'Analysis']
  },
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    description: 'Poe: 輕量級高效模型。',
    isPro: false,
    capabilities: ['Fast', 'Lightweight']
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    description: 'Poe: 進階多模態影像模型。',
    isPro: true,
    capabilities: ['Vision', 'Generation'],
    supportsImageOptions: true
  },
  {
    id: 'hailuo-speech-02',
    name: 'Hailuo Speech 02',
    description: 'Poe: 高擬真文字轉語音模型。',
    isPro: true,
    capabilities: ['Audio', 'TTS'],
    supportsTTS: true
  }
];

export const ASPECT_RATIOS = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16', '2:3', '3:2', '4:5', '5:4'];

export const TTS_VOICES = [
  'Wise_Woman', 'Friendly_Person', 'Inspirational_Girl', 'Deep_Voice_Man', 
  'Calm_Woman', 'Casual_Guy', 'Lively_Girl', 'Patient_Man', 'Young_Knight', 
  'Determined_Man', 'Lovely_Girl', 'Decent_Boy', 'Imposing_Manner', 
  'Elegant_Man', 'Abbess', 'Sweet_Girl_2', 'Exuberant_Girl'
];

export const TTS_EMOTIONS = [
  'None', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'
];

export const TTS_LANGUAGES = [
  'auto', 'Chinese', 'Chinese,Yue', 'English', 'Arabic', 'Russian', 'Spanish', 
  'French', 'Portuguese', 'German', 'Turkish', 'Dutch', 'Ukrainian', 
  'Vietnamese', 'Indonesian', 'Japanese', 'Italian', 'Korean', 'Thai', 
  'Polish', 'Romanian', 'Greek', 'Czech', 'Finnish', 'Hindi'
];

// Display Maps
export const TTS_EMOTION_MAP: Record<string, string> = {
    'None': '無 (None)',
    'happy': '快樂 (Happy)',
    'sad': '悲傷 (Sad)',
    'angry': '憤怒 (Angry)',
    'fearful': '恐懼 (Fearful)',
    'disgusted': '厭惡 (Disgusted)',
    'surprised': '驚訝 (Surprised)',
    'neutral': '中性 (Neutral)'
};

export const TTS_LANGUAGE_MAP: Record<string, string> = {
    'auto': '自動偵測 (Auto)',
    'Chinese': '中文 (Chinese)',
    'Chinese,Yue': '粵語 (Cantonese)',
    'English': '英文 (English)',
    'Japanese': '日文 (Japanese)',
    'Korean': '韓文 (Korean)',
    'French': '法文 (French)',
    'German': '德文 (German)',
    'Spanish': '西班牙文 (Spanish)',
    'Russian': '俄文 (Russian)',
    'Italian': '義大利文 (Italian)',
    'Vietnamese': '越南文 (Vietnamese)',
    'Thai': '泰文 (Thai)',
    'Indonesian': '印尼文 (Indonesian)',
    // Fallback for others
    'Arabic': '阿拉伯文 (Arabic)',
    'Portuguese': '葡萄牙文 (Portuguese)',
    'Turkish': '土耳其文 (Turkish)',
    'Dutch': '荷蘭文 (Dutch)',
    'Ukrainian': '烏克蘭文 (Ukrainian)',
    'Polish': '波蘭文 (Polish)',
    'Romanian': '羅馬尼亞文 (Romanian)',
    'Greek': '希臘文 (Greek)',
    'Czech': '捷克文 (Czech)',
    'Finnish': '芬蘭文 (Finnish)',
    'Hindi': '印地文 (Hindi)'
};

export const TTS_VOICE_MAP: Record<string, string> = {
  'Wise_Woman': '睿智女性 (Wise Woman)',
  'Friendly_Person': '友善之人 (Friendly Person)',
  'Inspirational_Girl': '勵志女孩 (Inspirational Girl)',
  'Deep_Voice_Man': '低沉男聲 (Deep Voice Man)',
  'Calm_Woman': '沉穩女性 (Calm Woman)',
  'Casual_Guy': '隨性男子 (Casual Guy)',
  'Lively_Girl': '活潑女孩 (Lively Girl)',
  'Patient_Man': '耐心男子 (Patient Man)',
  'Young_Knight': '年輕騎士 (Young Knight)',
  'Determined_Man': '堅毅男子 (Determined Man)',
  'Lovely_Girl': '可愛女孩 (Lovely Girl)',
  'Decent_Boy': '正直男孩 (Decent Boy)',
  'Imposing_Manner': '威嚴氣勢 (Imposing Manner)',
  'Elegant_Man': '優雅男子 (Elegant Man)',
  'Abbess': '女修道院長 (Abbess)',
  'Sweet_Girl_2': '甜美女孩 (Sweet Girl)',
  'Exuberant_Girl': '熱情女孩 (Exuberant Girl)'
};


export const DEFAULT_SYSTEM_INSTRUCTION = `You are a helpful AI assistant.
Provide clear, accurate, and concise answers.
Use Markdown for formatting.
Adopt a professional but conversational tone.`;

export type Language = 'zh-TW' | 'en';

export const TRANSLATIONS = {
  'zh-TW': {
    newChat: '新增對話',
    recents: '最近對話',
    noChats: '暫無對話',
    lightMode: '亮色模式',
    darkMode: '深色模式',
    settings: '設定',
    languageName: 'English',
    typeMessage: '輸入訊息...',
    aiDisclaimer: 'AI 可能會犯錯，請核實重要資訊。',
    you: '你',
    ai: 'AI',
    modelLabel: '模型',
    howCanIHelp: '今天有什麼可以幫你的？',
    suggestions: ['解釋量子計算', '寫一個 Python 爬蟲', '比較 React 和 Vue', '創作一首關於雨的詩'],
    error: '連線發生錯誤。',
    startChatting: '開始對話...',
    uploadTooltip: '上傳圖片或文件',
    searchTooltip: '搜尋網頁 (Google Search / Poe)',
    paramsTooltip: '參數設定 (思考/圖片/語音)',
    usageConsumed: '耗用',
    usagePoints: '點',
    contextCleared: '已清除上下文記憶',
    undo: '復原',
    copy: '複製',
    copied: '已複製',
    thinkingProcess: '思考過程',
    params: {
        title: '參數設定',
        thinkingLevel: '思考程度',
        webSearch: '啟用網絡搜索',
        imageSize: '圖片尺寸',
        imageOnly: '僅生成圖片',
        aspectRatio: '長寬比',
        ttsSection: '語音設定 (TTS)',
        voice: '聲音',
        emotion: '情緒',
        language: '語言',
        speed: '語速',
        volume: '音量',
        pitch: '音高',
        hd: '高清模式',
        levels: {
            minimal: '極簡',
            low: '低',
            high: '高'
        },
        sizes: {
            default: '預設',
            '1K': '1K',
            '2K': '2K',
            '4K': '4K'
        },
        ratios: {
            default: '預設'
        }
    },
    settingsModal: {
        title: '應用程式設定',
        sysInstructionLabel: '系統提示詞',
        save: '儲存設定',
        cancel: '取消',
        usePoeLabel: '使用 Poe API',
        poeApiKeyLabel: 'Poe API Key',
        poeApiKeyPlaceholder: 'sk-poe-...'
    },
    modelDescriptions: {
      'gemini-3-flash': 'Poe: Google 最新高效多模態模型。',
      'gemini-3-pro': 'Poe: Google 進階推理模型。',
      'gpt-5.2-instant': 'Poe: 最新即時模型。',
      'gpt-5-nano': 'Poe: 輕量級高效模型。',
      'nano-banana-pro': 'Poe: 進階多模態影像模型。',
      'hailuo-speech-02': 'Poe: 高擬真文字轉語音模型。'
    }
  },
  'en': {
    newChat: 'New Chat',
    recents: 'Recents',
    noChats: 'No chats yet.',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    settings: 'Settings',
    languageName: '繁體中文',
    typeMessage: 'Type a message...',
    aiDisclaimer: 'AI can make mistakes. Please verify important information.',
    you: 'You',
    ai: 'AI',
    modelLabel: 'Model',
    howCanIHelp: 'How can I help you today?',
    suggestions: ['Explain quantum computing', 'Write a Python script', 'Compare React vs Vue', 'Write a poem about rain'],
    error: 'Connection error.',
    startChatting: 'Start chatting...',
    uploadTooltip: 'Upload images or files',
    searchTooltip: 'Google Search / Poe',
    paramsTooltip: 'Parameters',
    usageConsumed: 'Used',
    usagePoints: 'points',
    contextCleared: 'Context memory cleared',
    undo: 'Undo',
    copy: 'Copy',
    copied: 'Copied',
    thinkingProcess: 'Thinking Process',
    params: {
        title: 'Parameters',
        thinkingLevel: 'Thinking Level',
        webSearch: 'Web Search',
        imageSize: 'Image Size',
        imageOnly: 'Image Only',
        aspectRatio: 'Aspect Ratio',
        ttsSection: 'Voice Settings (TTS)',
        voice: 'Voice',
        emotion: 'Emotion',
        language: 'Language',
        speed: 'Speed',
        volume: 'Volume',
        pitch: 'Pitch',
        hd: 'High Definition (HD)',
        levels: {
            minimal: 'Minimal',
            low: 'Low',
            high: 'High'
        },
        sizes: {
            default: 'Default',
            '1K': '1K',
            '2K': '2K',
            '4K': '4K'
        },
        ratios: {
            default: 'Default'
        }
    },
    settingsModal: {
        title: 'App Settings',
        sysInstructionLabel: 'System Instruction',
        save: 'Save Settings',
        cancel: 'Cancel',
        usePoeLabel: 'Use Poe API',
        poeApiKeyLabel: 'Poe API Key',
        poeApiKeyPlaceholder: 'sk-poe-...'
    },
    modelDescriptions: {
      'gemini-3-flash': 'Poe: Google\'s latest efficient multimodal model.',
      'gemini-3-pro': 'Poe: Google\'s advanced reasoning model.',
      'gpt-5.2-instant': 'Poe: Latest instant model.',
      'gpt-5-nano': 'Poe: Lightweight efficient model.',
      'nano-banana-pro': 'Poe: Advanced multimodal image model.',
      'hailuo-speech-02': 'Poe: High-fidelity Text-to-Speech model.'
    }
  }
};
