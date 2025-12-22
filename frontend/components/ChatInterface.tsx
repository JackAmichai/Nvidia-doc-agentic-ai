import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Zap, Code, Server, Cpu, ExternalLink, AlertCircle, Loader2, Shield, Brain, Mic, Database } from 'lucide-react';
import NvidiaTechPopup, { useNvidiaTechPopup, NvidiaTechType } from './NvidiaTechPopup';

interface Source {
    title: string;
    url: string;
    relevance: number;
}

interface CodeExample {
    name: string;
    path: string;
    repo: string;
    url: string;
    description: string;
}

interface QueryResponse {
    query: string;
    answer: string;
    query_type: string;
    confidence: number;
    sources: Source[];
    code_examples: CodeExample[];
    matched_keywords: string[];
    suggested_tags: string[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    data?: QueryResponse; // Store full API response for assistant messages
    error?: boolean;
}

export default function NvidiaDocNavigator() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // NVIDIA Tech Popup state
    const { activePopup, showPopup, hidePopup } = useNvidiaTechPopup();
    const [shownTechs, setShownTechs] = useState<Set<NvidiaTechType>>(new Set());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const suggestedPrompts = [
        {
            icon: <Zap className="w-5 h-5" />,
            text: "How do I configure MIG on A100?",
            category: "Configuration"
        },
        {
            icon: <Code className="w-5 h-5" />,
            text: "Why is my CUDA kernel slow?",
            category: "Performance"
        },
        {
            icon: <Server className="w-5 h-5" />,
            text: "TensorRT FP16 optimization guide",
            category: "Optimization"
        },
        {
            icon: <Cpu className="w-5 h-5" />,
            text: "Set up NVLink on multi-GPU system",
            category: "Setup"
        }
    ];

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMessage: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Show NVIDIA tech popups based on what technologies are being used
        // Show NIM popup on first query (since we're using NVIDIA NIM)
        if (!shownTechs.has('nim')) {
            setTimeout(() => {
                showPopup('nim');
                setShownTechs(prev => new Set(prev).add('nim'));
            }, 500);
        }

        // Use local API route (serverless function)
        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: text,
                    n_results: 5,
                    include_code_examples: true
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data: QueryResponse = await response.json();

            const aiMessage: Message = {
                role: 'assistant',
                content: data.answer,
                data: data
            };
            setMessages(prev => [...prev, aiMessage]);

            // Show CUDA popup for programming queries
            if (!shownTechs.has('cuda') && (data.query_type === 'cuda_general' || data.query_type === 'cuda_profiling')) {
                setTimeout(() => {
                    showPopup('cuda');
                    setShownTechs(prev => new Set(prev).add('cuda'));
                }, 1000);
            }

            // Show TensorRT popup for inference queries
            if (!shownTechs.has('tensorrt') && data.query_type === 'tensorrt') {
                setTimeout(() => {
                    showPopup('tensorrt');
                    setShownTechs(prev => new Set(prev).add('tensorrt'));
                }, 1000);
            }

        } catch (error) {
            console.error("Failed to fetch answer:", error);
            const errorMessage: Message = {
                role: 'assistant',
                content: "I'm sorry, I encountered an error while connecting to the NVIDIA documentation server. Please ensure the backend is running.",
                error: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handlePromptClick = (promptText: string) => {
        handleSend(promptText);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/30 blur-md rounded-xl"></div>
                            <div className="relative w-10 h-10 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                NVIDIA Doc Navigator
                            </h1>
                            <p className="text-xs text-gray-400">Your AI assistant for NVIDIA documentation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Active NVIDIA Tech indicators */}
                        <div className="hidden md:flex items-center gap-2">
                            {shownTechs.has('nemo-guardrails') && (
                                <button 
                                    onClick={() => showPopup('nemo-guardrails')}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
                                >
                                    <Shield className="w-3 h-3" />
                                    <span>Guardrails</span>
                                </button>
                            )}
                            {shownTechs.has('nim') && (
                                <button 
                                    onClick={() => showPopup('nim')}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 hover:bg-green-500/20 transition-colors"
                                >
                                    <Brain className="w-3 h-3" />
                                    <span>NIM</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                                Online
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto pb-32">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    {messages.length === 0 ? (
                        // Welcome Screen
                        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 blur-[80px] rounded-full animate-pulse"></div>
                                <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-500/40">
                                    <Sparkles className="w-14 h-14 text-white animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-5xl font-bold bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent leading-tight">
                                    Welcome to NVIDIA<br />Doc Navigator
                                </h2>
                                <p className="text-gray-400 text-xl max-w-2xl leading-relaxed">
                                    Your intelligent assistant for configuring, optimizing, and troubleshooting NVIDIA hardware and software
                                </p>
                            </div>

                            {/* Suggested Prompts */}
                            <div className="w-full max-w-4xl mt-16">
                                <p className="text-sm text-gray-500 mb-6 text-left font-medium">Try asking about:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {suggestedPrompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handlePromptClick(prompt.text)}
                                            className="group relative p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/40 rounded-2xl text-left transition-all duration-500 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-2 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="relative flex items-start gap-4">
                                                <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl text-green-400 group-hover:from-green-500/20 group-hover:to-emerald-500/20 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-green-500/0 group-hover:shadow-green-500/20">
                                                    {prompt.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-green-400/80 mb-2 uppercase tracking-wider">{prompt.category}</div>
                                                    <div className="text-base text-gray-200 group-hover:text-white transition-colors leading-relaxed">
                                                        {prompt.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Chat Messages
                        <div className="space-y-8 py-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.error ? 'bg-red-500/20 text-red-400' : 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-green-500/30'}`}>
                                            {msg.error ? <AlertCircle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                        </div>
                                    )}

                                    <div className="max-w-3xl space-y-4">
                                        <div
                                            className={`${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl rounded-tr-md px-6 py-4 shadow-xl shadow-green-500/20'
                                                : 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-5'
                                                }`}
                                        >
                                            <p className="text-sm leading-loose whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {/* Additional Data Display for Assistant */}
                                        {msg.role === 'assistant' && msg.data && (
                                            <div className="space-y-4 pl-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">

                                                {/* Tags & Confidence */}
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-400 border border-white/5">
                                                        Confidence: {(msg.data.confidence * 100).toFixed(0)}%
                                                    </span>
                                                    <span className="px-2 py-1 bg-white/5 rounded-md text-xs text-gray-400 border border-white/5 uppercase">
                                                        Type: {msg.data.query_type}
                                                    </span>
                                                    {msg.data.suggested_tags.map((tag, i) => (
                                                        <span key={i} className="px-2 py-1 bg-green-500/10 rounded-md text-xs text-green-400 border border-green-500/20">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Sources */}
                                                {msg.data.sources && msg.data.sources.length > 0 && (
                                                    <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sources</h4>
                                                        <div className="space-y-2">
                                                            {msg.data.sources.map((source, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={source.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg group transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                                                        <span className="text-sm text-gray-300 truncate group-hover:text-green-400 transition-colors">{source.title}</span>
                                                                    </div>
                                                                    <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-green-400" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Code Examples */}
                                                {msg.data.code_examples && msg.data.code_examples.length > 0 && (
                                                    <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Code Examples</h4>
                                                        <div className="grid gap-3">
                                                            {msg.data.code_examples.map((example, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={example.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="block p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/30 rounded-lg transition-all"
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Code className="w-4 h-4 text-green-400" />
                                                                        <span className="text-sm font-medium text-gray-200">{example.name}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 truncate">{example.repo}</div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-11 h-11 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                                            <span className="text-sm font-bold">You</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Input Bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-2xl bg-black/60">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition duration-500"></div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Ask about NVIDIA configuration, optimization, or troubleshooting..."
                            className="relative w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pr-16 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all text-base"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 active:scale-95"
                        >
                            {isTyping ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                        </button>
                    </div>
                    {/* Powered by section with clickable NVIDIA tech badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        <span className="text-xs text-gray-500">Powered by</span>
                        <button 
                            onClick={() => showPopup('nim')}
                            className="px-2 py-1 text-xs bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-full text-green-400 transition-colors cursor-pointer"
                        >
                            NVIDIA NIM
                        </button>
                        <button 
                            onClick={() => showPopup('nemo-guardrails')}
                            className="px-2 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full text-blue-400 transition-colors cursor-pointer"
                        >
                            NeMo Guardrails
                        </button>
                        <button 
                            onClick={() => showPopup('triton')}
                            className="px-2 py-1 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full text-purple-400 transition-colors cursor-pointer"
                        >
                            Triton
                        </button>
                        <button 
                            onClick={() => showPopup('tensorrt')}
                            className="px-2 py-1 text-xs bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-full text-orange-400 transition-colors cursor-pointer"
                        >
                            TensorRT
                        </button>
                    </div>
                </div>
            </div>

            {/* NVIDIA Tech Popup */}
            {activePopup && (
                <NvidiaTechPopup
                    techType={activePopup}
                    isVisible={true}
                    onClose={hidePopup}
                    position="bottom-right"
                    autoHide={8000}
                />
            )}
        </div>
    );
}
