"use client";

import { useState, useRef, useEffect } from "react";

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

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "👋 Welcome to NVIDIA Doc Navigator! I can help you with CUDA, TensorRT, NeMo, Triton, MIG, NVLink, and more. Ask me anything about NVIDIA documentation!",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
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
                    query: input,
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
                queryType: data.query_type,
                tags: data.suggested_tags,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content:
                    "⚠️ Sorry, I couldn't connect to the backend. Please make sure the API server is running on http://localhost:8000",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const exampleQueries = [
        "How do I configure MIG on A100?",
        "Why is my CUDA kernel slow?",
        "TensorRT FP16 optimization example",
        "How to set up NVLink?",
    ];

    return (
        <div className="max-w-5xl mx-auto">
            {/* Chat Container */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Messages Area */}
                <div className="h-[600px] overflow-y-auto p-6 space-y-6">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-6 py-4 ${message.role === "user"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                        : "bg-white/20 backdrop-blur-sm text-white border border-white/30"
                                    }`}
                            >
                                {/* Message Content */}
                                <div className="prose prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>

                                {/* Tags */}
                                {message.tags && message.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {message.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 text-xs rounded-full bg-white/20 border border-white/30"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Sources */}
                                {message.sources && message.sources.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/20">
                                        <p className="text-sm font-semibold mb-2">📚 Sources:</p>
                                        <div className="space-y-2">
                                            {message.sources.map((source, idx) => (
                                                <a
                                                    key={idx}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-sm hover:bg-white/10 p-2 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <span className="text-blue-300 hover:text-blue-200">
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
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-white/20 bg-white/5 p-4">
                    {/* Example Queries */}
                    {messages.length === 1 && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-300 mb-2">Try asking:</p>
                            <div className="flex flex-wrap gap-2">
                                {exampleQueries.map((query, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setInput(query)}
                                        className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                                    >
                                        {query}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about NVIDIA documentation..."
                            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                            {isLoading ? "..." : "Send"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold">Fast Answers</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                        Get instant answers from NVIDIA documentation
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold">Verified Sources</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                        All answers cite official NVIDIA docs
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold">Code Examples</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                        Practical examples from NVIDIA repos
                    </p>
                </div>
            </div>
        </div>
    );
}
