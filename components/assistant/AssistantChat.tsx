"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Lightbulb,
  TrendingUp,
  Repeat,
  PenLine,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    setInput("");
    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: trimmed,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.response || "No response received.",
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      toast.error(error.message || "Failed to contact assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSend(suggestionText);
  };

  function renderMarkdown(text: string) {
    const lines = text.split("\n");
    let inList = false;
    const rendered = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Bold replacement
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Headers
      if (line.startsWith("### ")) {
        if (inList) {
          rendered.push("</ul>");
          inList = false;
        }
        rendered.push(`<h4 class="text-base font-bold text-white mt-4 mb-2">${line.slice(4)}</h4>`);
      } else if (line.startsWith("## ")) {
        if (inList) {
          rendered.push("</ul>");
          inList = false;
        }
        rendered.push(`<h3 class="text-lg font-bold text-white mt-5 mb-2">${line.slice(3)}</h3>`);
      } else if (line.startsWith("# ")) {
        if (inList) {
          rendered.push("</ul>");
          inList = false;
        }
        rendered.push(`<h2 class="text-xl font-bold text-white mt-6 mb-3">${line.slice(2)}</h2>`);
      }
      // Lists
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList) {
          rendered.push('<ul class="list-disc pl-5 my-2 space-y-1">');
          inList = true;
        }
        rendered.push(`<li class="text-sm text-zinc-300">${line.slice(2)}</li>`);
      }
      // Empty line
      else if (line === "") {
        if (inList) {
          rendered.push("</ul>");
          inList = false;
        }
        rendered.push('<div class="h-2"></div>');
      }
      // Regular text
      else {
        if (inList) {
          rendered.push("</ul>");
          inList = false;
        }
        rendered.push(`<p class="text-sm text-zinc-300 leading-relaxed">${line}</p>`);
      }
    }

    if (inList) {
      rendered.push("</ul>");
    }

    return (
      <div 
        className="space-y-1 text-sm text-zinc-300 leading-relaxed" 
        dangerouslySetInnerHTML={{ __html: rendered.join("") }} 
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col bg-[#090909]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            {/* Avatar */}
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1A1A] ring-1 ring-[#232323]">
              <Bot className="h-7 w-7 text-white" />
            </span>

            {/* Welcome */}
            <h1 className="mt-6 text-xl font-bold text-white">
              AI Content Assistant
            </h1>
            <p className="mt-2 max-w-lg text-center text-sm text-[#8A8A8A]">
              Hi! I'm your AI content assistant. Ask me anything about
              content strategy, repurposing, or social media growth.
            </p>

            {/* Suggestion Cards */}
            <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              <SuggestionCard
                icon={Lightbulb}
                title="Content Ideas"
                description="Generate fresh content ideas for my niche"
                onClick={() => handleSuggestionClick("Give me 5 fresh content ideas for a SaaS product founder")}
              />
              <SuggestionCard
                icon={TrendingUp}
                title="Growth Strategy"
                description="How can I grow my audience on LinkedIn?"
                onClick={() => handleSuggestionClick("How can I grow my audience on LinkedIn?")}
              />
              <SuggestionCard
                icon={Repeat}
                title="Repurposing"
                description="Turn my latest YouTube video into Twitter threads"
                onClick={() => handleSuggestionClick("How do I turn a YouTube video into a Twitter thread?")}
              />
              <SuggestionCard
                icon={PenLine}
                title="Writing Help"
                description="Improve my hook for better engagement"
                onClick={() => handleSuggestionClick("Give me some proven hook templates for social media posts")}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role !== "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] border border-[#232323]">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    message.role === "user"
                      ? "bg-white text-black font-normal"
                      : "bg-[#0F0F0F] border border-[#232323] text-white"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm text-black leading-relaxed">{message.content}</p>
                  ) : (
                    renderMarkdown(message.content)
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] border border-[#232323]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#0F0F0F] border border-[#232323] text-white flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-400">Assistant is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar – pinned to bottom */}
      <div className="border-t border-[#232323] bg-[#090909] px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mx-auto flex max-w-3xl items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the assistant anything..."
              disabled={isLoading}
              className="w-full rounded-xl border border-[#232323] bg-[#0F0F0F] px-4 py-3 pr-12 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#444] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-black transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] text-[#555]">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

/* ── Suggestion Card ──────────────────────────────────────────── */

interface SuggestionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

function SuggestionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-2xl border border-[#232323] bg-[#0F0F0F] p-4 text-left transition-colors hover:border-[#333] hover:bg-[#151515] group"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A1A1A] group-hover:bg-[#232323] transition-colors">
        <Icon className="h-4 w-4 text-[#8A8A8A]" />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-[#8A8A8A]">{description}</p>
      </div>
    </button>
  );
}
