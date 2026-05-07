import React, { useState, useRef, useEffect } from "react";
import { useOktaAuth } from "@okta/okta-react";
import { Send, Bot, User, Sparkles, Lock } from "lucide-react";
import apiClient from "../api/client.js";

const SUGGESTIONS = [
  "What is the salary of John Smith?",
  "Who works in the Marketing department?",
  "How many female employees do we have?",
  "What is the highest paid employee?",
  "Who was hired most recently?",
  "What titles exist in the Engineering department?",
];

export default function HRAsk() {
  const { authState } = useOktaAuth();
  const groups = authState?.idToken?.claims?.groups || [];
  const isHR = groups.includes("HR_Users") || groups.includes("Admin");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your HR AI Assistant. Ask me anything about employees — salary, department, title, hire date, and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question) {
    if (!question.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question.trim() }]);
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/hr/ask", { question: question.trim() });
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (e) {
      const msg = e.response?.data?.error || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${msg}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isHR) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-slate-400">
        <Lock className="w-12 h-12 opacity-30" />
        <p className="font-medium text-slate-500">HR Access Required</p>
        <p className="text-sm">This feature is only available to HR staff.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">HR AI Assistant</h1>
          <p className="text-xs text-slate-500">Ask any question about employees</p>
        </div>
        <span className="ml-auto text-xs bg-indigo-50 text-indigo-600 font-medium px-2.5 py-1 rounded-full border border-indigo-100">
          HR Only
        </span>
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : m.isError
                    ? "bg-red-50 text-red-700 border border-red-100 rounded-tl-sm"
                    : "bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm"
                }`}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about an employee, department, salary…"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-60 transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Suggestion chips */}
      <div>
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Try asking</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
