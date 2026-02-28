"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ShieldCheck, Loader2 } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { Message } from "@/types";

const EXAMPLE_PROMPTS = [
  "Someone asked me to connect my wallet to this site",
  "I received a random token in my wallet",
  "Someone wants me to send SOL first to unlock funds",
  "Is this NFT mint site safe to use?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem("sheriff-chat");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldScrollRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("sheriff-chat", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    shouldScrollRef.current = true;
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: assistantContent },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I ran into an error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="container mx-auto max-w-3xl px-4 py-6 space-y-5">
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <ShieldCheck
                className="h-12 w-12 text-amber-400/50 mx-auto mb-4 animate-fade-in-up"
                style={{ animationDelay: "0ms" } as React.CSSProperties}
              />
              <h2
                className="text-xl font-bold text-stone-200 mb-2 animate-fade-in-up"
                style={{ animationDelay: "80ms" } as React.CSSProperties}
              >
                Howdy, partner. What can I help you with?
              </h2>
              <p
                className="text-stone-500 mb-8 max-w-md mx-auto animate-fade-in-up"
                style={{ animationDelay: "150ms" } as React.CSSProperties}
              >
                Tell me about something suspicious — a website, a message, a
                token — and I&apos;ll give you my honest assessment.
              </p>

              {/* Example prompts */}
              <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="bg-stone-800 border border-stone-700 hover:border-amber-500/50 hover:text-amber-400 text-stone-300 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200 hover:bg-stone-800/80 hover:-translate-y-0.5 animate-fade-in-up"
                    style={{ animationDelay: `${220 + i * 60}ms` } as React.CSSProperties}
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Loading indicator */}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 items-start animate-slide-in-left">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                </div>
                <div className="bg-stone-800 border border-stone-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-stone-700/50 bg-stone-900 px-4 py-4 animate-fade-in-up" style={{ animationDelay: "300ms" } as React.CSSProperties}>
        <div className="container mx-auto max-w-3xl flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Sheriff about a potential scam..."
            disabled={isLoading}
            className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50 transition-all duration-200 text-sm"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed text-stone-900 font-bold p-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
