import React from "react";
import Image from "next/image";

export default function Header() {
    return (
        <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                NVIDIA Doc Navigator
                            </h1>
                            <p className="text-xs text-gray-400">
                                AI-Powered Documentation Assistant
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-300">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
