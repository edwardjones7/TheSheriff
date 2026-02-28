"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ShieldCheck, Loader2, Mic, MicOff } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { Message } from "@/types";

const EXAMPLE_PROMPTS = [
  "Someone asked me to connect my wallet to this site",
  "I received a random token in my wallet",
  "Someone wants me to send SOL first to unlock funds",
  "Is this NFT mint site safe to use?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // STT
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // TTS
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [ttsLoadingIndex, setTTSLoadingIndex] = useState<number | null>(null);
  const [ttsError, setTTSError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  // Stop audio and recording when page unmounts
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      recognitionRef.current?.stop();
    };
  }, []);

  // ── STT ────────────────────────────────────────────────────────────────────

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      inputRef.current?.focus();
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // ── TTS ────────────────────────────────────────────────────────────────────

  const playTTS = async (text: string, index: number) => {
    // If the same message is already playing, stop it
    if (playingIndex === index) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingIndex(null);
      return;
    }

    // Stop any other audio
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingIndex(null);

    setTTSLoadingIndex(index);

    setTTSError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 503) {
          throw new Error("ElevenLabs API key not configured in .env");
        }
        throw new Error(body.error ?? `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingIndex(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setPlayingIndex(null);
        setTTSError("Audio playback failed.");
        URL.revokeObjectURL(url);
      };

      setTTSLoadingIndex(null);
      setPlayingIndex(index);
      await audio.play();
    } catch (err) {
      setTTSLoadingIndex(null);
      setPlayingIndex(null);
      setTTSError(err instanceof Error ? err.message : "TTS failed.");
    }
  };

  // ── Chat ───────────────────────────────────────────────────────────────────

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    // Stop any playing audio when user sends a new message
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingIndex(null);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
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
      <div className="flex-1 overflow-y-auto">
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
            <ChatMessage
              key={i}
              message={msg}
              onPlayTTS={
                msg.role === "assistant" && msg.content
                  ? () => playTTS(msg.content, i)
                  : undefined
              }
              isPlaying={playingIndex === i}
              isTTSLoading={ttsLoadingIndex === i}
            />
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

          <div />
        </div>
      </div>

      {/* TTS error banner */}
      {ttsError && (
        <div className="border-t border-red-500/20 bg-red-950/40 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-red-300 text-xs">{ttsError}</p>
          <button
            onClick={() => setTTSError(null)}
            className="text-red-400 hover:text-red-300 text-xs flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input area */}
      <div
        className="border-t border-stone-700/50 bg-stone-900 px-4 py-4 animate-fade-in-up"
        style={{ animationDelay: "300ms" } as React.CSSProperties}
      >
        <div className="container mx-auto max-w-3xl flex gap-2">
          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Listening…"
                : "Ask the Sheriff about a potential scam..."
            }
            disabled={isLoading}
            className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50 transition-all duration-200 text-sm"
          />

          {/* Mic button */}
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 animate-pulse"
                : "bg-stone-800 border border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-500/50"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Send button */}
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
