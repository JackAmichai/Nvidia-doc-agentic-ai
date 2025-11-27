"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto max-w-4xl px-4">
        <ChatInterface />
      </main>
    </div>
  );
}
