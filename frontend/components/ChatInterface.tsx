"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Zap, Code, Server, Cpu } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Array<{
        title: string;
        url: string;
        relevance: number;
    }>;
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:8000/api/v1/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: text,
                    n_results: 5,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.answer,
                sources: data.sources,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content:
                    "I couldn't connect to the backend. Please make sure the API server is running on http://localhost:8000",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromptClick = (promptText: string) => {
        handleSend(promptText);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-xl bg-black/20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                NVIDIA Doc Navigator
                            </h1>
                            <p className="text-xs text-gray-400">Your AI assistant for NVIDIA documentation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">
                            Online
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    {messages.length === 0 ? (
                        // Welcome Screen
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
                                <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30 animate-pulse">
                                    <Sparkles className="w-12 h-12 text-white" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-300 bg-clip-text text-transparent">
                                    Welcome to NVIDIA Doc Navigator
                                </h2>
                                <p className="text-gray-400 text-lg max-w-2xl">
                                    Your intelligent assistant for configuring, optimizing, and troubleshooting NVIDIA hardware and software
                                </p>
                            </div>

                            {/* Suggested Prompts */}
                            <div className="w-full max-w-3xl mt-12">
                                <p className="text-sm text-gray-500 mb-4 text-left">Try asking about:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {suggestedPrompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handlePromptClick(prompt.text)}
                                            className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-green-500/10 rounded-lg text-green-400 group-hover:bg-green-500/20 transition-colors">
                                                    {prompt.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-500 mb-1">{prompt.category}</div>
                                                    <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
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
                        <div className="space-y-6 pb-32">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-3xl ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl rounded-tr-md px-6 py-4 shadow-lg shadow-green-500/20'
                                                : 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                                    Sources
                                                </p>
                                                <div className="space-y-1.5">
                                                    {msg.sources.map((source, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center space-x-2 text-sm text-green-400 hover:text-green-300 hover:underline"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            <span>{source.title}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold">You</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-4 justify-start">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 backdrop-blur-xl bg-black/40">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about NVIDIA configuration, optimization, or troubleshooting..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Powered by RAG • ChromaDB • FastAPI
                    </p>
                </div>
            </div>
        </div>
    );
}
