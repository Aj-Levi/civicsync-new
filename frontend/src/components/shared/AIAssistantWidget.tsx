import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Bot } from "lucide-react";
import { useLocation } from "react-router-dom";
import { aiResponses } from "../../data/dummyData";

interface Message {
  id: string;
  from: "ai" | "user";
  text: string;
}

const quickQuestions = [
  "How do I pay my bill?",
  "How to register a complaint?",
  "Track my request status",
  "Emergency contacts",
];

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const { pathname } = useLocation();

  const getResponses = () => {
    return aiResponses[pathname] ?? aiResponses.default;
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const responses = getResponses();
      const reply = responses[Math.floor(Math.random() * responses.length)];
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: "ai", text: reply },
      ]);
      setTyping(false);
    }, 1200);
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      const responses = getResponses();
      setMessages([{ id: "0", from: "ai", text: responses[0] }]);
    }
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-[#1E3A5F] shadow-lg flex items-center justify-center text-white"
        title="AI Assistant"
      >
        <Bot size={24} />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} />
                <span className="font-semibold text-sm">
                  CivicSync AI Assistant
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.from === "user"
                        ? "bg-[#1E3A5F] text-white rounded-br-sm"
                        : "bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl rounded-bl-sm px-4 py-2">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.7,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-white border-t border-gray-100">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-2 py-1 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <button className="text-gray-400 hover:text-[#1E3A5F] transition-colors">
                <Mic size={18} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask anything..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={() => sendMessage(input)}
                className="text-[#1E3A5F] hover:text-blue-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
