"use client";

import { useEffect, useRef, useState } from "react";
import { Code, Cpu, Send, Server, Sparkles, Zap } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Array<{
        title: string;
        url: string;
        relevance: number;
    }>;
    codeExamples?: Array<{
        name: string;
        repo: string;
        url: string;
        path: string;
        description: string;
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

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        setMessages((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random()}`,
                role: "user",
                content: text
            }
        ]);
        setInput("");
        setIsLoading(true);
        setIsTyping(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch("http://localhost:8000/api/v1/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: text,
                    n_results: 5,
                    include_code_examples: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || `Server error: ${response.status}`);
            }

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    role: "assistant",
                    content: data.answer,
                    sources: data.sources,
                    codeExamples: data.code_examples,
                    queryType: data.query_type,
                    tags: data.suggested_tags
                }
            ]);
        } catch (error) {
            const details = error instanceof Error ? error.message : "An unexpected error occurred.";
            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-${Math.random()}`,
                    role: "assistant",
                    content: `⚠️ ${details}`
                }
            ]);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
            setIsTyping(false);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    };

    const handlePromptClick = (promptText: string) => {
        handleSend(promptText);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-green-950 to-gray-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-xl bg-black/20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                NVIDIA Doc Navigator
                            </h1>
                            <p className="text-xs text-gray-400 hidden sm:block">Your AI assistant for NVIDIA documentation</p>
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
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    {messages.length === 0 ? (
                        // Welcome Screen
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30 animate-pulse">
                                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                                </div>
                            </div>

                            <div className="space-y-3 px-4">
                                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-300 bg-clip-text text-transparent">
                                    Welcome to NVIDIA Doc Navigator
                                </h2>
                                <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
                                    Your intelligent assistant for configuring, optimizing, and troubleshooting NVIDIA hardware and software
                                </p>
                            </div>

                            {/* Suggested Prompts */}
                            <div className="w-full max-w-3xl mt-12">
                                <p className="text-sm text-gray-500 mb-4 text-left px-2">Try asking about:</p>
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
                                    className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] sm:max-w-3xl ${msg.role === "user"
                                                ? "bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl rounded-tr-md px-4 sm:px-6 py-3 sm:py-4 shadow-lg shadow-green-500/20"
                                                : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-4 sm:px-6 py-3 sm:py-4"
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                        {msg.codeExamples && msg.codeExamples.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <p className="text-xs uppercase text-green-300 tracking-wide font-semibold">Code Examples</p>
                                                {msg.codeExamples.map((example, index) => (
                                                    <a
                                                        key={index}
                                                        href={example.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block text-sm text-emerald-200 bg-white/5 border border-emerald-500/20 rounded-xl p-3 hover:border-emerald-300 transition-colors"
                                                    >
                                                        <span className="font-semibold text-white block">{example.name}</span>
                                                        <span className="text-xs text-gray-300 block mt-1">{example.repo} · {example.path}</span>
                                                        <span className="text-xs text-green-200 block mt-1">{example.description}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                                <p className="text-xs text-gray-400 mb-2">Sources:</p>
                                                {msg.sources.slice(0, 3).map((source, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-between text-xs text-gray-300 hover:text-white transition-colors"
                                                    >
                                                        <span className="truncate mr-2">{source.title}</span>
                                                        <span className="text-green-400">{Math.round(source.relevance * 100)}%</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === "user" && (
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-semibold">You</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-3 sm:gap-4 justify-start">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-4 sm:px-6 py-3 sm:py-4">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
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
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask about NVIDIA configuration, optimization, or troubleshooting..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                            disabled={isLoading || isTyping}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30"
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
