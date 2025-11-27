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
    queryType?: string;
    tags?: string[];
}

const suggestedPrompts = [
    { icon: <Zap className="w-5 h-5" />, text: "How do I configure MIG on A100?", category: "Configuration" },
    { icon: <Code className="w-5 h-5" />, text: "Why is my CUDA kernel slow?", category: "Performance" },
    { icon: <Server className="w-5 h-5" />, text: "TensorRT FP16 optimization guide", category: "Optimization" },
    { icon: <Cpu className="w-5 h-5" />, text: "Set up NVLink on multi-GPU system", category: "Setup" }
];

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping, isLoading]);

    const handleSend = async (text: string = input, retryCount: number = 0) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString() + Math.random().toString(),
            role: "user",
            content: text,
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = text;
        setInput("");
        setIsLoading(true);
        setIsTyping(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch("http://localhost:8000/api/v1/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: currentInput,
                    n_results: 5,
                    include_code_examples: true,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString() + Math.random().toString(),
                role: "assistant",
                content: data.answer,
                sources: data.sources,
                queryType: data.query_type,
                tags: data.suggested_tags,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsTyping(false);
        } catch (error) {
            setIsTyping(false);
            let errorContent = "⚠️ Sorry, I encountered an error. ";

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    errorContent += "The request took too long. Please try again with a simpler query.";
                } else if (error.message.includes("Failed to fetch")) {
                    errorContent += "Could not connect to the backend. Please make sure the API server is running on http://localhost:8000";
                } else {
                    errorContent += error.message;
                }
            }

            // Retry logic for network errors
            if (retryCount < 2 && error instanceof Error && error.message.includes("fetch")) {
                errorContent += ` Retrying... (${retryCount + 1}/2)`;
                const errorMessage: Message = {
                    id: Date.now().toString() + Math.random().toString(),
                    role: "assistant",
                    content: errorContent,
                };
                setMessages((prev) => [...prev, errorMessage]);
                
                setTimeout(() => {
                    handleSend(currentInput, retryCount + 1);
                }, 2000);
                return;
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString() + Math.random().toString(),
                role: "assistant",
                content: errorContent,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handlePromptClick = (promptText: string) => {
        setInput("");
        handleSend(promptText);
        setTimeout(() => { inputRef.current?.focus(); }, 50);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#121a13] via-[#0a2215] to-[#13141a] text-white flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-2xl bg-black/30 z-20 relative">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                NVIDIA Doc Navigator
                            </h1>
                            <p className="text-xs text-gray-400">Your AI assistant for NVIDIA documentation</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/15 border border-green-500/10 rounded-full text-xs text-green-400">Online</span>
                </div>
            </header>

            {/* Glowing background accent */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[480px] h-[400px] rounded-full bg-green-500/10 blur-3xl z-0" />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto z-10 relative">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {messages.length === 0 && !isTyping ? (
                        // Welcome screen with suggested prompts
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-3xl bg-green-500/30 blur-2xl animate-pulse" />
                                <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30 animate-[pulse_2s_ease-in-out_infinite]">
                                    <Sparkles className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            
                            <div>
                                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent mb-2">
                                    Welcome to NVIDIA Doc Navigator
                                </h2>
                                <p className="text-gray-300 text-lg max-w-2xl">
                                    Your intelligent assistant for configuring, optimizing, and troubleshooting NVIDIA hardware and software
                                </p>
                            </div>

                            {/* Suggested prompts */}
                            <div className="w-full max-w-2xl mt-8">
                                <p className="text-sm text-gray-400 mb-3 text-left">Try asking about:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {suggestedPrompts.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePromptClick(prompt.text)}
                                            className="group flex p-4 bg-white/5 hover:bg-green-900/30 border border-white/10 hover:border-green-500/30 rounded-2xl items-center gap-3 text-left transition-all duration-300 hover:shadow-md hover:shadow-green-500/15 hover:-translate-y-1"
                                        >
                                            <div className="p-2 bg-green-500/10 rounded-lg text-green-400 group-hover:bg-green-500/15 transition-colors">
                                                {prompt.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-green-300 mb-1">{prompt.category}</div>
                                                <div className="text-base text-gray-100 group-hover:text-green-100 transition-colors font-medium leading-tight">
                                                    {prompt.text}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Chat mode
                        <div className="space-y-8 pb-36">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex w-full gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    
                                    <div className={`max-w-2xl whitespace-pre-wrap ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl rounded-tr-md px-6 py-4 shadow-lg shadow-green-700/25'
                                            : 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4 text-gray-100'
                                    }`}>
                                        <p className="text-base leading-relaxed">{msg.content}</p>
                                        
                                        {/* Tags */}
                                        {msg.tags && msg.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {msg.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs rounded-full bg-green-500/20 border border-green-500/30 text-green-300"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sources */}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <p className="text-sm font-semibold mb-2 text-green-300">📚 Sources:</p>
                                                <div className="space-y-2">
                                                    {msg.sources.map((source, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block text-sm hover:bg-white/10 p-2 rounded-lg transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <span className="text-emerald-300 hover:text-emerald-200">
                                                                    {source.title}
                                                                </span>
                                                                <span className="text-xs text-gray-400 ml-2">
                                                                    {(source.relevance * 100).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {msg.role === 'user' && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold">You</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isTyping && (
                                <div className="flex gap-4 justify-start">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            <div className="border-t border-white/10 backdrop-blur-xl bg-black/40 z-30 relative">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about NVIDIA configuration, optimization, or troubleshooting..."
                            className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                            disabled={isLoading || isTyping}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 transition-all"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Powered by RAG • ChromaDB • FastAPI</p>
                </div>
            </div>
        </div>
    );
}
