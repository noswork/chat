
import { Message, Role, ModelParameters, UsageMetadata } from "../types";
import { DEFAULT_SYSTEM_INSTRUCTION } from "../constants";

class HybridService {
  private googleAi: any;

  constructor() {
    // Google GenAI client is optional at build/runtime. Some environments
    // may not have the `@google/genai` package installed (e.g. CI). We avoid
    // a hard import to prevent build failures and keep runtime initialization
    // optional.
    this.googleAi = undefined;
  }

  // Retrieve and sanitize the Poe API Key
  private getPoeApiKey(): string | null {
    const usePoe = localStorage.getItem('use_poe_api') === 'true';
    let apiKey = localStorage.getItem('poe_api_key');
    
    if (usePoe && apiKey) {
        // Sanitize: Trim whitespace and remove any non-ASCII characters to prevent header errors
        return apiKey.trim().replace(/[^\x00-\x7F]/g, "");
    }
    return null;
  }

  // --- Google Helper ---
  private formatGoogleContent(history: Message[]) {
    return history
      .filter(m => m.role !== Role.SYSTEM && !m.isError && !m.excludeFromContext && !m.isContextDivider)
      .map(m => {
        const parts: any[] = [];
        if (m.attachments && m.attachments.length > 0) {
            m.attachments.forEach(att => {
                if (att.mimeType === 'text/plain') {
                    try {
                         const decoded = atob(att.data);
                         parts.push({ text: `[File: ${att.name}]\n${decoded}` });
                    } catch { /* ignore */ }
                } else {
                    parts.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: att.data
                        }
                    });
                }
            });
        }
        if (m.text) parts.push({ text: m.text });
        return {
          role: m.role === Role.MODEL ? 'model' : 'user',
          parts: parts.length > 0 ? parts : [{ text: ' ' }]
        };
      });
  }

  // --- Poe Helper ---
  private formatPoeMessages(history: Message[], systemInstruction: string): any[] {
    const formatted: any[] = [];
    
    // System instruction
    formatted.push({
        role: 'system',
        content: systemInstruction
    });

    history.forEach(m => {
        if (m.role === Role.SYSTEM || m.isError || m.excludeFromContext || m.isContextDivider) return;
        
        // Handle Content & Attachments
        if (m.attachments && m.attachments.length > 0) {
            const contentParts: any[] = [];
            
            // Add text if available
            if (m.text) {
                contentParts.push({ type: 'text', text: m.text });
            }

            m.attachments.forEach(att => {
                const dataUrl = `data:${att.mimeType};base64,${att.data}`;
                
                if (att.mimeType.startsWith('image/')) {
                    // Standard OpenAI Image
                    contentParts.push({
                        type: 'image_url',
                        image_url: { url: dataUrl }
                    });
                } else {
                     // Poe Specific File Attachment
                     // Supported: PDF, Text, Audio, Video
                     contentParts.push({
                        type: 'file',
                        file: {
                            filename: att.name,
                            file_data: dataUrl
                        }
                    });
                }
            });

            formatted.push({
                role: m.role === Role.MODEL ? 'assistant' : 'user',
                content: contentParts
            });
        } else {
            // Text only
            formatted.push({
                role: m.role === Role.MODEL ? 'assistant' : 'user',
                content: m.text || " "
            });
        }
    });
    return formatted;
  }

  public async getLatestUsage(): Promise<UsageMetadata | undefined> {
    const apiKey = this.getPoeApiKey();
    if (!apiKey) return undefined;

    try {
        const response = await fetch('https://api.poe.com/usage/points_history?limit=10', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (!response.ok) return undefined;

        const data = await response.json();
        // Assuming data structure based on description: { data: [ { creation_time, app_name, cost_points } ] }
        if (data && data.data && data.data.length > 0) {
            const entry = data.data[0];
            return {
                points: entry.cost_points,
                appName: entry.app_name,
                // API likely returns microseconds (1_000_000), convert to ms
                timestamp: entry.creation_time / 1000 
            };
        }
    } catch (e) {
        console.error("Failed to fetch usage:", e);
    }
    return undefined;
  }

  public async *sendMessageStream(
    history: Message[], 
    modelId: string,
    params: ModelParameters,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    
    const storedInstruction = localStorage.getItem('gemini_system_instruction');
    const systemInstruction = storedInstruction || DEFAULT_SYSTEM_INSTRUCTION;

    const poeApiKey = this.getPoeApiKey();

    if (poeApiKey) {
        // --- POE PATH (Fetch) ---
        try {
            let targetModel = modelId;

            const messages = this.formatPoeMessages(history, systemInstruction);

            // Base Payload
            const payload: any = {
                model: targetModel,
                messages: messages,
                stream: true
            };

            // Build Extra Body based on Params
            const extraBody: any = {};
            
            // Web Search (All models if enabled)
            if (params.webSearch) {
                extraBody.web_search = true;
            }

            // Thinking Level (Gemini Flash/Pro)
            if ((modelId === 'gemini-3-flash' || modelId === 'gemini-3-pro') && params.thinkingLevel) {
                extraBody.thinking_level = params.thinkingLevel;
            }

            // Nano Banana Pro Specifics
            if (modelId === 'nano-banana-pro') {
                if (params.imageSize) extraBody.image_size = params.imageSize;
                if (params.imageOnly) extraBody.image_only = true;
                if (params.aspectRatio) extraBody.aspect_ratio = params.aspectRatio;
            }

            // Hailuo Speech 02 Specifics
            if (modelId === 'hailuo-speech-02') {
                if (params.ttsLanguage && params.ttsLanguage !== 'auto') extraBody.language = params.ttsLanguage;
                if (params.ttsEmotion && params.ttsEmotion !== 'None') extraBody.emotion = params.ttsEmotion;
                if (params.ttsSpeed !== undefined) extraBody.speed = params.ttsSpeed;
                if (params.ttsVolume !== undefined) extraBody.volume = params.ttsVolume;
                if (params.ttsPitch !== undefined) extraBody.pitch = params.ttsPitch;
                if (params.ttsVoice) extraBody.voice = params.ttsVoice;
                if (params.ttsHd !== undefined) extraBody.hd = params.ttsHd;
            }

            if (Object.keys(extraBody).length > 0) {
                payload.extra_body = extraBody;
            }

            const response = await fetch('https://api.poe.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${poeApiKey}`
                },
                body: JSON.stringify(payload),
                signal: signal 
            });

            if (!response.ok) {
                 let errorMsg = response.statusText;
                 try {
                    const errJson = await response.json();
                    errorMsg = errJson.error?.message || errorMsg;
                 } catch {}
                 throw new Error(`Poe API Error: ${errorMsg}`);
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let accumulatedText = '';

            try {
                while (true) {
                    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; 

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') continue;
                            try {
                                const json = JSON.parse(dataStr);
                                const deltaContent = json.choices?.[0]?.delta?.content || '';
                                if (deltaContent) {
                                    accumulatedText += deltaContent;
                                    
                                    // Clean up repetitive status messages from Hailuo model
                                    // It tends to output: Generating Audio (Xs elapsed)...
                                    // We keep the last URL but remove the intermediate progress to reduce noise.
                                    let cleanText = accumulatedText.replace(/Generating Audio \(\d+s elapsed\)/g, '');
                                    
                                    // Sometimes multiple instances appear concatenated without spaces
                                    yield cleanText;
                                }
                            } catch (e) {
                                console.warn('SSE Parse Error', e);
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error("Poe API Error:", error);
            throw error;
        }

    } else {
        // --- GOOGLE PATH (Fallback) ---
        // Note: Google Path doesn't support the full range of Poe params, 
        // but we map what we can (web search).
        try {
             let targetModel = 'gemini-3-flash-preview'; 
             
             if (modelId === 'gemini-3-pro') {
                 targetModel = 'gemini-3-pro-preview';
             } else if (modelId === 'nano-banana-pro') {
                 targetModel = 'gemini-3-pro-image-preview'; 
             } else if (modelId === 'gemini-3-flash' || modelId === 'gpt-5.2-instant' || modelId === 'gpt-5-nano') {
                 targetModel = 'gemini-3-flash-preview';
             }

             const config: any = { systemInstruction };
             
             if (params.webSearch) {
                 config.tools = [{ googleSearch: {} }];
             }

             const contents = this.formatGoogleContent(history);
             
             const result = await this.googleAi.models.generateContentStream({
                model: targetModel,
                contents: contents,
                config: config
             });
             
             let accumulatedText = '';

             for await (const chunk of result) {
                if (signal?.aborted) break;
                
                const text = chunk.text || '';
                if (!text) continue;

                // Smart accumulation:
                if (text.length >= accumulatedText.length && text.startsWith(accumulatedText)) {
                    accumulatedText = text; // It was a snapshot, replace.
                } else if (text === accumulatedText) {
                    // Ignore duplicate full snapshot
                } else {
                    accumulatedText += text; // Standard delta
                }
                
                yield accumulatedText; 
             }
             
             // Removed access to result.response as it doesn't exist on the AsyncGenerator

        } catch (error: any) {
            if (signal?.aborted) return;
            console.error("Gemini API Error:", error);
            throw error;
        }
    }
  }

  public async generateSuggestions(language: string): Promise<string[]> {
    const poeApiKey = this.getPoeApiKey();
    const langLabel = language === 'zh-TW' ? 'Cantonese (Hong Kong)' : 'English';
    const prompt = `Generate 4 short, engaging, and diverse conversation starters or tasks for an AI chatbot. Return ONLY the 4 lines of text, no numbering, no preamble. Language: ${langLabel}`;

    try {
        let text = "";
        
        if (poeApiKey) {
            const response = await fetch('https://api.poe.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${poeApiKey}`
                },
                body: JSON.stringify({
                    model: 'Gemini-3-Flash',
                    messages: [{ role: 'user', content: prompt }],
                    extra_body: { thinking_level: 'minimal' }
                })
            });
            const data = await response.json();
            text = data.choices?.[0]?.message?.content || "";
        } else {
             // Fallback to Google
             const response = await this.googleAi.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            text = response.text || "";
        }
        
        return text.split('\n')
            .map(line => line.replace(/^[\d\-\.\*•]+\s*/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 4);
    } catch (e) {
        console.error("Failed to generate suggestions", e);
        return [];
    }
  }

  public async generateTitle(firstMessage: string): Promise<string> {
    const poeApiKey = this.getPoeApiKey();
    let title = "New Chat";
    
    if (poeApiKey) {
        try {
            const response = await fetch('https://api.poe.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${poeApiKey}`
                },
                body: JSON.stringify({
                    model: 'Gemini-3-Flash', 
                    messages: [
                        { role: 'system', content: 'Generate a 3-5 word title. No quotes.' },
                        { role: 'user', content: firstMessage }
                    ],
                    extra_body: {
                        thinking_level: 'minimal'
                    }
                })
            });

            const data = await response.json();
            title = data.choices?.[0]?.message?.content?.trim() || "New Chat";
        } catch {
            title = "New Chat";
        }
    } else {
        try {
            const response = await this.googleAi.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Generate a short title (3-5 words) for this chat message. Do not use quotes. Message: ${firstMessage}`,
            });
            title = response.text?.trim() || "New Chat";
        } catch {
            title = "New Chat";
        }
    }

    // Force strict length limit
    if (title.length > 40) {
        return title.substring(0, 40) + "...";
    }
    return title;
  }
}

export const geminiService = new HybridService();
