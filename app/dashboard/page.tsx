'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LogoutButton } from "@/components/logout-button";

type ChatSession = { session_id: string; created_at: string };

const formatSessionDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};
type Message = {
  message_id: number;
  message: string;
  sender: "user" | "assistant";
  emotional_analysis: string | null;
  created_at?: string;
};

const fetchChatSessions = async (userId: string): Promise<ChatSession[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("session_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
  return data ?? [];
};

const fetchChatMessages = async (sessionId: string): Promise<Message[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data ?? [];
};

const createNewSession = async (userId: string): Promise<string | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert([{ user_id: userId }])
    .select("session_id")
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return null;
  }

  return data?.session_id ?? null;
};

const sendMessage = async (sessionId: string, userMessage: string) => {
    const supabase = createClient();

    // Call API to get assistant response
    const res = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Groq API error");
    }

    const { response, emotional_analysis } = data;

  // Store user message
  const { error: userError } = await supabase.from("chat_messages").insert([
    {
      session_id: sessionId,
      sender: "user",
      message: userMessage,
    },
  ]);
  if (userError) throw userError;

  // Store assistant response
  const { error: aiError } = await supabase.from("chat_messages").insert([
    {
      session_id: sessionId,
      sender: "assistant",
      message: response,
      emotional_analysis,
    },
  ]);
  if (aiError) throw aiError;

  return { response, emotional_analysis };
};

export default function Page() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data?.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (userId) {
      fetchChatSessions(userId).then(setSessions);
    }
  }, [userId]);

  useEffect(() => {
    if (selectedSession) {
      fetchChatMessages(selectedSession).then(setMessages);
    } else {
      setMessages([]);
    }
  }, [selectedSession]);

  const handleCreateNewChat = async () => {
    if (!userId) return;
    const newSessionId = await createNewSession(userId);
    if (newSessionId) {
      setSelectedSession(newSessionId);
      fetchChatSessions(userId).then(setSessions);
    }
  };

  const handleSummarize = async () => {
    if (!selectedSession) return;
  
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("message, sender")
      .eq("session_id", selectedSession)
      .order("created_at", { ascending: true });
  
    if (error || !data) {
      console.error("Failed to fetch messages for summary", error);
      return;
    }
  
    const textHistory = data
      .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.message}`)
      .join("\n");
  
    const res = await fetch("/api/groq", {
      method: "POST",
      body: JSON.stringify({ message: textHistory, type: "summary" }),
      headers: { "Content-Type": "application/json" },
    });
  
    const json = await res.json();
    setSummary(json.summary ?? "No summary available.");
  };
  

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedSession) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sendMessage(selectedSession, input);
      setMessages((prev) => [
        ...prev,
        {
          message_id: Date.now(),
          sender: "user",
          message: input,
          emotional_analysis: "",
        },
        {
          message_id: Date.now() + 1,
          sender: "assistant",
          message: result.response,
          emotional_analysis: result.emotional_analysis,
        },
      ]);
      setInput("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      console.error("Send message error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
              <AppSidebar
          chatHeads={sessions.map((s) => ({ 
            id: s.session_id, 
            title: formatSessionDate(s.created_at) 
          }))}
          onSelectChatHead={setSelectedSession}
          selectedChatHead={selectedSession}
          onCreateNewChat={handleCreateNewChat}
        />
      <SidebarInset>
      <header className="flex h-16 items-center justify-between px-4 bg-[#1E1E1E] border-b border-[#3A3A3A]">
  <div className="text-[#E6E6E6] font-medium">
    {selectedSession ? "Chat" : "Mental Health AI"}
  </div>
  {selectedSession && (
    <button
      onClick={handleSummarize}
      className="text-sm text-[#10A37F] border border-[#10A37F] px-3 py-1 rounded-lg hover:bg-[#10A37F] hover:text-white"
    >
      Summarize Mental State
    </button>
  )}
  <LogoutButton />
</header>

        <div className="flex flex-1 flex-col bg-[#1E1E1E]">
          {selectedSession ? (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.message_id} className="max-w-4xl mx-auto space-y-2">
                    <div
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg max-w-2xl ${
                          msg.sender === "user"
                            ? "bg-[#343541] text-[#E6E6E6]"
                            : "bg-[#444654] text-[#E6E6E6]"
                        }`}
                      >
                        <div className="font-medium text-[#10A37F]">
                          {msg.sender === "user" ? "You" : "AI"}
                        </div>
                        <div>{msg.message}</div>
                        {msg.sender === "assistant" && msg.emotional_analysis && (
                          <div className="mt-2 text-xs text-[#A0A0A0]">
                            Emotional Analysis: {msg.emotional_analysis}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {summary && (
  <div className="max-w-4xl mx-auto p-4 mt-4 border border-[#3A3A3A] rounded-lg bg-[#292A2E] text-[#E6E6E6]">
    <h2 className="text-lg font-semibold mb-2">Mental State Summary</h2>
    <p className="text-sm text-[#CCCCCC] whitespace-pre-wrap">{summary}</p>
  </div>
)}
                {error && (
                  <div className="text-[#F44336] text-center">{error}</div>
                )}
              </div>
              <div className="border-t border-[#3A3A3A] bg-[#1E1E1E] p-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2 bg-[#444654] border border-[#3A3A3A] rounded-lg p-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 border-0 bg-transparent text-[#E6E6E6] placeholder:text-[#6B6B6B] focus:ring-0"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="bg-[#10A37F] hover:bg-[#18C999] text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-2xl mx-auto text-center px-4">
                <h1 className="text-4xl font-bold text-[#E6E6E6] mb-4">
                  How can I help you today?
                </h1>
                <p className="text-lg text-[#A0A0A0] mb-8">
                  I&apos;m here to support your mental health journey. Start a conversation or select a recent one.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleCreateNewChat}
                    className="bg-[#10A37F] hover:bg-[#18C999] text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Start New Chat
                  </button>
                  {sessions.length > 0 && (
                    <button
                      onClick={() => setSelectedSession(sessions[0].session_id)}
                      className="bg-[#343541] hover:bg-[#444654] text-[#E6E6E6] px-6 py-3 rounded-lg font-medium"
                    >
                      Continue Last Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
