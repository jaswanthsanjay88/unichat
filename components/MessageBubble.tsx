import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-2xl text-base leading-relaxed tracking-wide
          ${
            isUser
              ? 'bg-white text-black font-medium rounded-br-none'
              : 'bg-zinc-900 border border-zinc-800 text-gray-100 rounded-bl-none'
          }
        `}
      >
        <p className="whitespace-pre-wrap font-sans">{message.text}</p>
        <div className={`text-[10px] mt-2 uppercase tracking-wider opacity-50 ${isUser ? 'text-black' : 'text-gray-400'}`}>
           {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
