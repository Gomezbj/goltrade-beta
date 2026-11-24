

import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Chat } from '@google/genai';
import { useTranslations } from '../hooks/useTranslations';
import { ChatMessage, FractalAnalysisResult } from '../types';
import { createChatForAnalysis } from '../services/geminiService';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface FollowUpChatProps {
    analysisResult: FractalAnalysisResult;
    chatSession: Chat | null;
    setChatSession: Dispatch<SetStateAction<Chat | null>>;
    chatMessages: ChatMessage[];
    setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>;
    isChatLoading: boolean;
    setIsChatLoading: Dispatch<SetStateAction<boolean>>;
    isExpanded: boolean;
    onToggle: () => void;
}

const FollowUpChat: React.FC<FollowUpChatProps> = ({
    analysisResult,
    chatSession,
    setChatSession,
    chatMessages,
    setChatMessages,
    isChatLoading,
    setIsChatLoading,
    isExpanded,
    onToggle,
}) => {
    const { t } = useTranslations();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const rosseProfilePic = "https://raw.githubusercontent.com/Gomezbj/Rosse/main/ROSSE-AI.png";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isExpanded) {
            // scrollToBottom(); // User requested to disable auto-scroll
        }
    }, [chatMessages, isChatLoading, isExpanded]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isChatLoading) return;

        const userMessageText = input.trim();
        setInput('');
        
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        setChatMessages(prev => [...prev, { role: 'user', text: userMessageText, timestamp: Date.now() }]);
        setIsChatLoading(true);

        try {
            let currentChat = chatSession;
            if (!currentChat) {
                currentChat = createChatForAnalysis(analysisResult);
                setChatSession(currentChat);
            }
            
            const response = await currentChat.sendMessage({ message: userMessageText });
            const modelResponseText = response.text;
            setChatMessages(prev => [...prev, { role: 'model', text: modelResponseText, timestamp: Date.now() }]);
        
        } catch (error) {
            console.error("Error sending chat message:", error);
            const errorText = t('followUpChatError');
            setChatMessages(prev => [...prev, { role: 'model', text: errorText, timestamp: Date.now() }]);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <section aria-labelledby="follow-up-chat-heading" className="w-full bg-secondary-800 rounded-xl shadow-xl font-poppins">
            <button
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-controls="follow-up-chat-panel"
                className={`w-full flex justify-between items-center p-4 sm:p-6 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200 hover:bg-secondary-700/30 ${isExpanded ? 'rounded-t-xl border-b border-secondary-700' : 'rounded-xl'}`}
            >
                <div className="flex items-center space-x-3">
                     <img
                        src={rosseProfilePic}
                        alt={t('chatBotName')}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <h2 id="follow-up-chat-heading" className="text-xl font-semibold text-primary-300">
                        {t('followUpChatTitle')}
                    </h2>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-secondary-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isExpanded && (
                 <div id="follow-up-chat-panel" className="p-2 sm:p-4 animate-fadeIn">
                    <div className="bg-secondary-900 rounded-lg h-80 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.map((msg, index) => (
                                <div key={msg.timestamp + '-' + index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}>
                                    {msg.role === 'model' && (
                                        <div className="flex-shrink-0 flex flex-col items-center pt-1">
                                            <img
                                                src={rosseProfilePic}
                                                alt={t('chatBotName')}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="text-xs text-secondary-400 mt-1">{t('chatBotName')}</span>
                                        </div>
                                    )}
                                    <div className={`max-w-xs md:max-w-md lg:max-w-xl px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-none self-end' : 'bg-secondary-700 text-secondary-200 rounded-bl-none'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex gap-3 justify-start items-start">
                                    <div className="flex-shrink-0 flex flex-col items-center pt-1">
                                        <img
                                            src={rosseProfilePic}
                                            alt={t('chatBotName')}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span className="text-xs text-secondary-400 mt-1">{t('chatBotName')}</span>
                                    </div>
                                    <div className="max-w-xs px-4 py-2 rounded-2xl bg-secondary-700 text-secondary-200 rounded-bl-none">
                                        <div className="flex items-center space-x-1">
                                            <span className="text-sm italic">{t('followUpChatTyping', { botName: t('chatBotName') })}</span>
                                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse-fast [animation-delay:-0.3s]"></div>
                                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse-fast [animation-delay:-0.15s]"></div>
                                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse-fast"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-2 border-t border-secondary-700">
                            <div className="flex items-center space-x-2">
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onInput={(e) => {
                                        const target = e.currentTarget;
                                        target.style.height = 'auto';
                                        target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    placeholder={t('followUpChatPlaceholder')}
                                    aria-label={t('followUpChatAriaLabel')}
                                    className="flex-1 w-full p-2.5 bg-secondary-700 border border-secondary-600 text-white rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 resize-none overflow-y-auto max-h-36"
                                    disabled={isChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isChatLoading}
                                    aria-label={t('followUpChatSendButton')}
                                    className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FollowUpChat;