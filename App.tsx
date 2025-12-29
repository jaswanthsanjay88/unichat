import React, { useState, useRef, useEffect } from 'react';
import { createChatStream, fetchAvailableModels } from './services/geminiService';
import { AiModel, Message, ModelOption } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ModelSelector } from './components/ModelSelector';
import { TypingIndicator } from './components/TypingIndicator';
import { INITIAL_MESSAGE } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'model',
      text: INITIAL_MESSAGE,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<AiModel>('');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const loadModels = async () => {
        setIsModelsLoading(true);
        const models = await fetchAvailableModels();
        setAvailableModels(models);
        
        if (models.length > 0) {
            const defaultModel = models.find(m => m.value.includes('gpt-4o')) || models[0];
            setCurrentModel(defaultModel.value);
        }
        setIsModelsLoading(false);
    };
    loadModels();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!currentModel) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: 'Error: No model selected. Please select a model from the top right menu.',
            timestamp: Date.now()
        }]);
        return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    try {
      const stream = await createChatStream(currentModel, messages, userMessage.text);
      
      const assistantMessageId = (Date.now() + 1).toString();
      
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'model',
          text: '',
          timestamp: Date.now(),
        },
      ]);

      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, text: fullText } : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Error generating response:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: `Error: ${error.message || 'Something went wrong with Puter AI.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const isInputDisabled = isLoading || isModelsLoading || !currentModel;
  const inputPlaceholder = isModelsLoading 
    ? "Loading AI models..." 
    : !currentModel 
        ? "Select a model to start..." 
        : "Type a message...";

  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden">
      
      <header className="flex-none p-4 md:p-6 border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">UNICHAT</h1>
        </div>
        <ModelSelector 
            currentModel={currentModel} 
            onSelect={setCurrentModel} 
            disabled={isLoading || isModelsLoading}
            models={availableModels}
        />
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="flex flex-col space-y-2 max-w-5xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
            <TypingIndicator />
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-none p-4 md:p-6 bg-black border-t border-zinc-900">
        <div className="max-w-5xl mx-auto w-full">
            <div className={`relative flex items-end gap-3 bg-zinc-900/50 p-2 rounded-xl border transition-colors ${isInputDisabled ? 'border-zinc-800 opacity-50' : 'border-zinc-800 focus-within:border-zinc-600'}`}>
                
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        adjustTextareaHeight();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={inputPlaceholder}
                    className="w-full bg-transparent text-white placeholder-zinc-500 px-3 py-3 max-h-[200px] resize-none focus:outline-none font-sans text-base disabled:cursor-not-allowed"
                    rows={1}
                    disabled={isInputDisabled}
                />

                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isInputDisabled}
                    className={`
                        flex-none p-3 rounded-lg mb-1 transition-all duration-200
                        ${!input.trim() || isInputDisabled 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                        }
                    `}
                    aria-label="Send message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                </button>
            </div>
            <div className="text-center mt-3">
                <p className="text-[10px] text-zinc-600 font-mono tracking-wider uppercase">
                    DESIGNED BY JASWANTH SANJAY NEKKANTI WITH LOVE❤️ • {currentModel || 'Select Model'}
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;