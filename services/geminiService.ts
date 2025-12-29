import { AiModel, Message, ModelOption } from "../types";

declare const puter: any;

export const fetchAvailableModels = async (): Promise<ModelOption[]> => {
  if (typeof puter === 'undefined') {
    console.error("Puter.js is not loaded on window object.");
    return [
      { value: 'gpt-4o', label: 'GPT-4o (Fallback)', group: 'OpenAI' },
      { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Fallback)', group: 'Anthropic' }
    ];
  }

  try {
    const modelsRaw = await puter.ai.listModels();
    
    if (!Array.isArray(modelsRaw)) {
      console.warn("puter.ai.listModels() did not return an array", modelsRaw);
      return [];
    }

    const formatLabel = (id: string) => {
        const parts = id.split('/');
        // Take the last part and clean it up (e.g., 'meta-llama/Llama-2-7b' -> 'Llama-2-7b')
        let label = parts[parts.length - 1];
        // Replace dashes/underscores with spaces
        label = label.replace(/[-_]/g, ' ');
        // Title case
        return label.replace(/\b\w/g, c => c.toUpperCase());
    };

    const determineGroup = (id: string): string => {
        const lower = id.toLowerCase();
        if (lower.includes('gpt') || lower.includes('o1') || lower.includes('openai')) return 'OpenAI';
        if (lower.includes('claude') || lower.includes('anthropic')) return 'Anthropic';
        if (lower.includes('gemini') || lower.includes('google') || lower.includes('palm')) return 'Google';
        if (lower.includes('llama') || lower.includes('meta')) return 'Meta';
        if (lower.includes('mistral')) return 'Mistral';
        if (lower.includes('deepseek')) return 'DeepSeek';
        return 'Other';
    };

    // Use a Map to deduplicate models based on their value (ID)
    const uniqueModels = new Map<string, ModelOption>();

    modelsRaw.forEach((m: any) => {
        // Prioritize 'id' for the value used in API calls. 'name' is often a display string.
        const value = typeof m === 'string' ? m : (m.id || m.name || String(m));
        
        if (!value || uniqueModels.has(value)) return;

        // Determine the best label to show the user
        let label = formatLabel(value);
        if (typeof m === 'object' && m.name && !m.name.includes('/')) {
            // Use the provided name if it looks like a clean display name
            label = m.name;
        }

        uniqueModels.set(value, {
            value,
            label,
            group: determineGroup(value)
        });
    });

    const options = Array.from(uniqueModels.values());

    // Sort by group then label
    return options.sort((a, b) => {
        if (a.group === b.group) return a.label.localeCompare(b.label);
        return a.group.localeCompare(b.group);
    });

  } catch (error) {
    console.error("Failed to list models from Puter.js:", error);
    // Return a minimal fallback if fetch fails
    return [
      { value: 'gpt-4o', label: 'GPT-4o', group: 'OpenAI' },
      { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', group: 'Anthropic' },
      { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', group: 'Google' }
    ];
  }
};

export const createChatStream = async (
  model: AiModel,
  history: Message[],
  newMessage: string
): Promise<AsyncGenerator<string, void, unknown>> => {
  
  if (typeof puter === 'undefined') {
    throw new Error("Puter.js is not loaded.");
  }

  if (!model) {
    throw new Error("Please select an AI model before sending a message.");
  }

  // Format history for context
  const relevantHistory = history.filter(msg => msg.id !== 'init-1');
  
  // Construct structured messages for Puter.js (OpenAI-compatible format)
  const messages = relevantHistory.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.text
  }));

  // Add the new message
  messages.push({ role: 'user', content: newMessage });

  try {
      // Call Puter.js with messages array
      const response = await puter.ai.chat(messages, { model: model, stream: true });

      async function* streamGenerator() {
        // Handle non-stream response (rare edge case in some libraries)
        if (response && !response[Symbol.asyncIterator] && response.message) {
             yield response.message.content || response.text;
             return;
        }

        for await (const part of response) {
            // Check various common property names for text content in streaming chunks
            const text = part?.text || part?.content || part?.delta?.content || '';
            if (text) {
                yield text;
            }
        }
      }

      return streamGenerator();
  } catch (error: any) {
      console.error("Puter AI Chat Error:", error);
      
      let errorMessage = "Failed to generate response from Puter AI.";
      
      if (error) {
          if (typeof error === 'string') {
              errorMessage = error;
          } else if (error.message) {
              errorMessage = error.message;
          } else {
              // Try to stringify if it's an object without a message property
              try {
                  errorMessage = JSON.stringify(error);
              } catch (e) {
                  errorMessage = "Unknown error occurred.";
              }
          }
      }

      throw new Error(errorMessage);
  }
};