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
        <div className="min-h-screen bg-gradient-to-br from-[#060b0a] via-[#071b10] to-[#0c0c10] text-white flex flex-col">
            <header className="border-b border-white/10 backdrop-blur-2xl bg-black/30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-green-500 via-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.4)]">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                                NVIDIA Doc Navigator
                            </h1>
                            <p className="text-xs text-gray-400">AI assistant for NVIDIA hardware & software</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 text-xs text-green-300 border border-green-500/40 rounded-full bg-black/40">
                        Online
                    </span>
                </div>
            </header>

            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                <div className="mt-10 w-[420px] h-[420px] bg-gradient-to-br from-green-500/10 to-green-500/0 rounded-full blur-3xl" />
            </div>

            <main className="flex-1 overflow-y-auto relative">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    {messages.length === 0 && !isTyping ? (
                        <section className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 blur-3xl" />
                                <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-[0_30px_60px_rgba(16,185,129,0.35)]">
                                    <Sparkles className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-4xl font-extrabold bg-gradient-to-r from-white via-green-200 to-emerald-300 bg-clip-text text-transparent mb-3">
                                    Welcome to NVIDIA Doc Navigator
                                </h2>
                                <p className="text-gray-300 text-base md:text-lg max-w-2xl">
                                    Ask about configuration, optimization, troubleshooting, or NVIDIA best practices. We use RAG + NVIDIA docs to keep responses accurate.
                                </p>
                            </div>
                            <div className="w-full max-w-3xl">
                                <p className="text-sm text-gray-500 mb-3 text-left">Try asking about:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {suggestedPrompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handlePromptClick(prompt.text)}
                                            className="group flex flex-col gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-left transition duration-300 hover:bg-white/10 hover:border-green-500/30 hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-500/20 text-green-300 group-hover:bg-green-500/30">
                                                    {prompt.icon}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] tracking-wide uppercase text-gray-400">{prompt.category}</p>
                                                    <p className="text-sm font-semibold text-gray-100 group-hover:text-white">{prompt.text}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="space-y-6 pb-32">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_12px_24px_rgba(16,185,129,0.35)]">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-3xl whitespace-pre-wrap ${
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl rounded-tr-md px-6 py-4 shadow-[0_12px_24px_rgba(52,211,153,0.25)]"
                                                : "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4 text-gray-100"
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
                                                        className="flex flex-col gap-1 text-sm text-emerald-200 bg-white/5 border border-emerald-500/20 rounded-xl p-3 hover:border-emerald-300"
                                                    >
                                                        <span className="font-semibold text-white">{example.name}</span>
                                                        <span className="text-xs text-gray-300">{example.repo} · {example.path}</span>
                                                        <span className="text-xs text-green-200">{example.description}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                                {msg.sources.slice(0, 3).map((source, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-between text-xs text-gray-300 hover:text-white"
                                                    >
                                                        <span>{source.title}</span>
                                                        <span>{Math.round(source.relevance * 100)}%</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-semibold">You</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isTyping && (
                                <div className="flex gap-4 justify-start">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_12px_24px_rgba(16,185,129,0.35)]">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-md px-6 py-4">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </section>
                    )}
                </div>

            </div>

            <footer className="border-t border-white/10 backdrop-blur-2xl bg-black/40">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask about NVIDIA configuration, optimization, or troubleshooting..."
                            className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm tracking-wide text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                            disabled={isLoading || isTyping}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-[0_15px_30px_rgba(16,185,129,0.4)] hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 tracking-wider uppercase text-center mt-4">
                        Powered by RAG • ChromaDB • FastAPI
                    </p>
                </div>
            </footer>
        </div>
    );
}
