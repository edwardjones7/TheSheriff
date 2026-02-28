"use client";

import { ShieldCheck, User, Volume2, VolumeX, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  onPlayTTS?: () => void;
  isPlaying?: boolean;
  isTTSLoading?: boolean;
}

export default function ChatMessage({
  message,
  onPlayTTS,
  isPlaying,
  isTTSLoading,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        isUser ? "flex-row-reverse animate-slide-in-right" : "animate-slide-in-left"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 transition-transform duration-200 hover:scale-110",
          isUser
            ? "bg-stone-700"
            : "bg-amber-500/20 border border-amber-500/30"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-stone-300" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-amber-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-stone-700 text-stone-100 rounded-tr-sm"
            : "bg-stone-800 border border-stone-700 text-stone-200 rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-amber-300">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li className="ml-2">{children}</li>,
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold text-amber-400 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-amber-400 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold text-amber-300 mb-1">{children}</h3>
                ),
                code: ({
                  inline,
                  children,
                }: {
                  inline?: boolean;
                  children?: React.ReactNode;
                }) =>
                  inline ? (
                    <code className="bg-stone-700 text-amber-300 px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-stone-900 text-stone-300 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
                      {children}
                    </code>
                  ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-amber-500/50 pl-3 text-stone-400 italic my-2">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    {children}
                  </a>
                ),
                hr: () => <hr className="border-stone-600 my-3" />,
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* TTS button — only shown when content is present */}
            {onPlayTTS && message.content && (
              <div className="mt-2 pt-2 border-t border-stone-700/60 flex justify-end">
                <button
                  onClick={onPlayTTS}
                  disabled={isTTSLoading}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  aria-label={isPlaying ? "Stop speaking" : "Read aloud"}
                >
                  {isTTSLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isPlaying ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                  {isTTSLoading ? "Loading…" : isPlaying ? "Stop" : "Read aloud"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
