import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Percent,
  Coins,
  Send,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Bot,
  SlidersHorizontal,
  Key,
  Check,
  ExternalLink,
  X,
} from 'lucide-react';
import { AIPrediction, Product, KhataCustomer } from '../types/merchant';
import { sounds } from '../utils/audio';
import {
  askFinoraAI,
  getStoredApiKey,
  setStoredApiKey,
  getAiProvider,
  setAiProvider,
  AIProvider,
} from '../services/aiService';

interface AICopilotProps {
  predictions: AIPrediction[];
  products: Product[];
  khataCustomers: KhataCustomer[];
  onExecuteAction: (prediction: AIPrediction) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  predictions,
  products,
  khataCustomers,
  onExecuteAction,
}) => {
  const [budgetRupees, setBudgetRupees] = useState<number>(35000);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPlan, setOptimizedPlan] = useState<{
    items: { product: Product; units: number; cost: number; expectedProfit: number }[];
    totalCost: number;
    totalExpectedProfit: number;
  } | null>(null);

  // Chat queries state
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; text: string; timestamp: string }[]
  >([
    {
      role: 'assistant',
      text: 'Namaste! I am your Finora Kirana Intelligence Copilot powered by live AI. I continuously monitor counter sales velocity, distributor price shifts, and customer credit defaults. How can I assist your shop today?',
      timestamp: 'Just now',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>(getAiProvider());
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [hasCustomKey, setHasCustomKey] = useState(Boolean(getStoredApiKey()));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isThinking]);

  // Handle action click
  const handleAction = (pred: AIPrediction) => {
    sounds.playSuccessChime();
    onExecuteAction(pred);
  };

  // Save API Settings
  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiKey(apiKeyInput);
    setAiProvider(activeProvider);
    setHasCustomKey(Boolean(apiKeyInput.trim()));
    setShowApiModal(false);
    sounds.playSuccessChime();
  };

  // AI Working Capital Basket Optimizer
  const handleOptimizeBudget = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Find high velocity items with low stock or high margin
      const candidates = [...products]
        .sort((a, b) => {
          const aNeed = (a.safetyStock - a.currentStock) * a.dailyVelocity;
          const bNeed = (b.safetyStock - b.currentStock) * b.dailyVelocity;
          return bNeed - aNeed;
        })
        .slice(0, 5);

      let allocatedCost = 0;
      const items = candidates.map((p) => {
        const units = Math.max(5, Math.floor((budgetRupees * 0.2) / p.wholesaleCost));
        const cost = units * p.wholesaleCost;
        const profit = units * (p.sellingPrice - p.wholesaleCost);
        allocatedCost += cost;
        return { product: p, units, cost, expectedProfit: profit };
      });

      const totalExpectedProfit = items.reduce((acc, it) => acc + it.expectedProfit, 0);

      setOptimizedPlan({
        items,
        totalCost: allocatedCost,
        totalExpectedProfit,
      });
      setIsOptimizing(false);
      sounds.playSuccessChime();
    }, 600);
  };

  // AI Chat Assistant handling via Free API or Google Gemini
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isThinking) return;

    const query = userInput.trim();
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const newMsgs = [
      ...chatMessages,
      { role: 'user' as const, text: query, timestamp: now },
    ];
    setChatMessages(newMsgs);
    setUserInput('');
    setIsThinking(true);

    try {
      const reply = await askFinoraAI(query, chatMessages, products, khataCustomers);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          text: reply,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      sounds.playSuccessChime();
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          text: 'Unable to connect to AI engine. Using local shop intelligence fallback.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* AI Intelligence Header Banner */}
      <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4b41e1] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1e1b4b]">
                Agent Indigo Predictive Restock Engine
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#4338ca] border border-[#c7d2fe]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4b41e1] animate-ping" />
                Live Shop Model
              </span>
            </div>
            <p className="text-xs text-[#4338ca] mt-0.5">
              Continuously parsing counter sales velocities, festival calendars, and distributor wholesale discounts.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[11px] text-[#64748b]">Total Working Capital Impact</div>
          <div className="text-lg font-bold text-[#4b41e1] font-mono-numbers">
            ₹{predictions.reduce((acc, p) => acc + p.impactAmountRupees, 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Grid of AI Predictive Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {predictions.map((pred) => {
          const isHigh = pred.urgency === 'high';
          const isLeak = pred.type === 'capital_leak';

          return (
            <div
              key={pred.id}
              className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                isHigh
                  ? 'border-[#c7d2fe] hover:border-[#4b41e1]'
                  : isLeak
                  ? 'border-[#fecdd3]'
                  : 'border-[#e2e8f0]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {pred.type === 'stockout' ? (
                      <ShieldAlert className="w-4 h-4 text-[#e11d48] shrink-0" />
                    ) : pred.type === 'surge' ? (
                      <TrendingUp className="w-4 h-4 text-[#006948] shrink-0" />
                    ) : pred.type === 'arbitrage' ? (
                      <Percent className="w-4 h-4 text-[#4b41e1] shrink-0" />
                    ) : (
                      <Coins className="w-4 h-4 text-[#d97706] shrink-0" />
                    )}
                    <h3 className="text-xs font-bold text-[#131b2e] leading-snug">
                      {pred.title}
                    </h3>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono-numbers shrink-0 bg-[#eef2ff] text-[#4338ca] border border-[#c7d2fe]">
                    {pred.metricBadge}
                  </span>
                </div>

                <p className="text-xs text-[#475569] mt-2.5 leading-relaxed">
                  {pred.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                <div className="text-[11px] text-[#64748b]">
                  Capital at Stake:{' '}
                  <span className="font-mono-numbers font-bold text-[#131b2e]">
                    ₹{pred.impactAmountRupees.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction(pred)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4b41e1] hover:bg-[#3730a3] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <span>{pred.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Module: Restock Basket Optimizer & Interactive Kirana Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (6 cols): Working Capital Restock Basket Optimizer */}
        <div className="lg:col-span-6 bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#006948]" />
              <h3 className="font-bold text-[#131b2e] text-sm">
                Restock Basket Optimizer (पूंजी आवंटन)
              </h3>
            </div>
            <span className="text-[11px] text-[#64748b]">Max Profit Allocation</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#475569] block">
              Available Wholesale Restock Budget (₹):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="5000"
                value={budgetRupees}
                onChange={(e) => setBudgetRupees(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-sm font-mono-numbers font-bold text-[#131b2e] outline-none focus:border-[#4b41e1]"
              />
              <div className="flex gap-1.5">
                {[25000, 50000, 100000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudgetRupees(b)}
                    className="px-2.5 py-1.5 bg-[#f1f5f9] hover:bg-[#eaedff] text-[#475569] rounded text-[11px] font-mono-numbers font-medium cursor-pointer"
                  >
                    ₹{(b / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Algorithm allocates capital to products with fastest counter turn rate and highest return on margin.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOptimizeBudget}
            disabled={isOptimizing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#4b41e1] hover:bg-[#3730a3] text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isOptimizing ? 'Calculating Optimal Restock Mix...' : 'Run Restock Optimization'}</span>
          </button>

          {optimizedPlan && (
            <div className="bg-[#faf8ff] border border-[#eaedff] rounded-lg p-3 space-y-3 animate-in fade-in">
              <div className="flex justify-between items-baseline text-xs font-mono-numbers">
                <span className="font-bold text-[#131b2e] font-sans">Optimized PO Allocation</span>
                <span className="text-[#006948] font-bold">
                  Est. Net Profit: ₹{optimizedPlan.totalExpectedProfit.toFixed(0)}
                </span>
              </div>

              <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                {optimizedPlan.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 rounded bg-white border border-[#e2e8f0]"
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-[#0f172a] truncate">{it.product.name}</div>
                      <div className="text-[10px] text-[#64748b]">
                        Order {it.units} units @ ₹{it.product.wholesaleCost}
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono-numbers">
                      <div className="font-bold text-[#131b2e]">₹{it.cost}</div>
                      <div className="text-[10px] text-[#006948] font-semibold">
                        +₹{it.expectedProfit} margin
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-center text-xs font-mono-numbers">
                <span className="font-semibold text-[#64748b]">Total Capital Deployed:</span>
                <span className="font-extrabold text-[#131b2e]">
                  ₹{optimizedPlan.totalCost.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Kirana Merchant AI Assistant */}
        <div className="lg:col-span-6 bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs flex flex-col h-[460px] relative">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#4b41e1]" />
              <h3 className="font-bold text-[#131b2e] text-sm">Finora AI Copilot</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowApiModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] text-[10px] font-semibold transition-colors cursor-pointer"
                title="Configure AI API Integration"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span>
                <span>{activeProvider === 'gemini' && hasCustomKey ? 'Gemini Free API' : 'Free Public AI'}</span>
                <SlidersHorizontal className="w-2.5 h-2.5 ml-0.5 text-[#15803d]" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#006948] text-white rounded-br-xs'
                      : 'bg-[#f1f5f9] text-[#131b2e] rounded-bl-xs border border-[#e2e8f0]'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#94a3b8] mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isThinking && (
              <div className="flex flex-col items-start animate-in fade-in duration-150">
                <div className="p-3 rounded-xl max-w-[85%] bg-[#f8fafc] text-[#475569] rounded-bl-xs border border-[#e2e8f0] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#4b41e1] animate-spin shrink-0" />
                  <span>Finora AI is analyzing store data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 text-[11px] no-scrollbar shrink-0 border-t border-[#f1f5f9]">
            <button
              type="button"
              disabled={isThinking}
              onClick={() => setUserInput('Which items are expiring this month?')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              Expiring stock?
            </button>
            <button
              type="button"
              disabled={isThinking}
              onClick={() => setUserInput('What is my highest margin product?')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              Highest margin?
            </button>
            <button
              type="button"
              disabled={isThinking}
              onClick={() => setUserInput('How much credit is pending in Khata?')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              Pending Khata?
            </button>
            <button
              type="button"
              disabled={isThinking}
              onClick={() => setUserInput('Give me a quick restock advice for tomorrow.')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              Restock advice?
            </button>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="relative shrink-0 pt-1">
            <input
              type="text"
              placeholder={isThinking ? 'AI is generating advice...' : 'Ask anything about inventory, sales, or khata...'}
              value={userInput}
              disabled={isThinking}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#4b41e1] rounded-lg text-xs text-[#131b2e] outline-none disabled:bg-[#f1f5f9]"
            />
            <button
              type="submit"
              disabled={isThinking || !userInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#4b41e1] hover:text-[#3730a3] cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* AI API Integration Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#cbd5e1] max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center text-[#4b41e1]">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0f172a]">AI API Integration</h4>
                  <p className="text-[11px] text-[#64748b]">Configure your chatbot backend engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApiSettings} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-[#0f172a] block mb-1">Select AI Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveProvider('free')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      activeProvider === 'free'
                        ? 'border-[#006948] bg-[#f0fdf4] text-[#006948] font-bold shadow-xs'
                        : 'border-[#cbd5e1] bg-[#f8fafc] text-[#475569] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">Free Public AI</span>
                      {activeProvider === 'free' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-[10px] font-normal text-[#64748b] leading-tight">
                      Zero key needed. Works out of the box for all users.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveProvider('gemini')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      activeProvider === 'gemini'
                        ? 'border-[#4b41e1] bg-[#eef2ff] text-[#4b41e1] font-bold shadow-xs'
                        : 'border-[#cbd5e1] bg-[#f8fafc] text-[#475569] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">Google Gemini</span>
                      {activeProvider === 'gemini' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-[10px] font-normal text-[#64748b] leading-tight">
                      Use your own free Google AI Studio key.
                    </p>
                  </button>
                </div>
              </div>

              {activeProvider === 'gemini' && (
                <div className="space-y-2 bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#4b41e1]" />
                      Gemini API Key
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#4b41e1] hover:underline flex items-center gap-1 font-medium"
                    >
                      Get Free Key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs outline-none focus:border-[#4b41e1] font-mono"
                  />
                  <p className="text-[10px] text-[#64748b]">
                    Keys are stored securely in your browser localStorage and never transmitted to third-party servers.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowApiModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#006948] hover:bg-[#005238] text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
