import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Bot, Send, User as UserIcon, Loader2, ShieldCheck, Database, Zap } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const Assistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Welcome to E-Ledger Intelligence. I am your specialized Supply Chain Auditor. I can analyze the current blockchain state to identify compliance issues, verify batch integrity, or assist with regulatory reporting. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await GeminiService.analyzeLedger(userMsg.text);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        sender: 'ai',
        text: "I encountered an error connecting to the blockchain analytics engine. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* AI Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-900/40">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight">Audit Analyst <span className="text-indigo-400 text-xs ml-1 font-mono uppercase">v2.5</span></h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Mainnet Node Connected
              </p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
           <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
              <Database size={12} />
              <span>Real-time Context</span>
           </div>
           <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Verifiable Audit</span>
           </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 ${
                  msg.sender === 'user' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 shadow-sm'
               }`}>
                  {msg.sender === 'user' ? <UserIcon size={16} /> : <Bot size={16} className="text-indigo-500" />}
               </div>
               <div className={`rounded-2xl px-5 py-4 shadow-sm border ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                  : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
               }`}>
                <div className="prose prose-sm max-w-none prose-slate">
                   <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div className={`text-[9px] mt-2 font-bold uppercase tracking-wider opacity-60 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-white border-slate-200 shadow-sm">
                   <Bot size={16} className="text-indigo-400 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-700 rounded-full animate-bounce delay-150"></div>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
            <Zap size={18} />
          </div>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. Identify any batches nearing expiry in Mumbai warehouse..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-14 py-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-6">
           <button type="button" onClick={() => setInput("Show me all batches with unpaid duty.")} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Analyze Duty Risks</button>
           <button type="button" onClick={() => setInput("Identify high-risk inventory.")} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Expiry Forecaster</button>
           <button type="button" onClick={() => setInput("Who are the top manufacturers this month?")} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Partner Insights</button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;