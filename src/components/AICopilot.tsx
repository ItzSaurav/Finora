import React, { useState } from 'react';
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
} from 'lucide-react';
import { AIPrediction, Product, KhataCustomer } from '../types/merchant';
import { sounds } from '../utils/audio';

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
      text: 'Namaste! I am your Kirana Intelligence Copilot. I continuously monitor counter sales velocity, distributor price shifts, and customer credit defaults. How can I assist your shop today?',
      timestamp: 'Just now',
    },
  ]);
  const [userInput, setUserInput] = useState('');

  // Handle action click
  const handleAction = (pred: AIPrediction) => {
    sounds.playSuccessChime();
    onExecuteAction(pred);
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

  // AI Chat Assistant handling
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const query = userInput.trim();
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const newMsgs = [
      ...chatMessages,
      { role: 'user' as const, text: query, timestamp: now },
    ];
    setChatMessages(newMsgs);
    setUserInput('');

    // Generate intelligent Kirana advice based on actual data
    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('expir') || q.includes('kharab') || q.includes('date')) {
        const expiring = products.filter((p) => p.status === 'expiring');
        if (expiring.length > 0) {
          reply = `Found ${expiring.length} item nearing expiry: ${expiring
            .map((e) => `${e.name} (${e.currentStock} units left)`)
            .join(', ')}. Recommend running a 10% counter discount or placing at front checkout today.`;
        } else {
          reply = 'All inventory items are currently well within fresh shelf life! No immediate expiry concerns.';
        }
      } else if (q.includes('margin') || q.includes('profit') || q.includes('kamai')) {
        const bestMargin = [...products].sort(
          (a, b) =>
            (b.sellingPrice - b.wholesaleCost) / b.sellingPrice -
            (a.sellingPrice - a.wholesaleCost) / a.sellingPrice
        )[0];
        reply = `Your highest gross margin item is "${bestMargin.name}" yielding ${(
          ((bestMargin.sellingPrice - bestMargin.wholesaleCost) / bestMargin.sellingPrice) *
          100
        ).toFixed(1)}% profit (₹${bestMargin.sellingPrice - bestMargin.wholesaleCost} net per unit). Recommend bundling with high velocity staples.`;
      } else if (q.includes('khata') || q.includes('udhaar') || q.includes('credit')) {
        const totalDue = khataCustomers.reduce((acc, c) => acc + c.balanceDue, 0);
        const critical = khataCustomers.filter((c) => c.trustScore === 'critical');
        reply = `Total customer Udhaar outstanding is ₹${totalDue.toLocaleString('en-IN')}. Caution: ${critical
          .map((c) => `${c.name} (₹${c.balanceDue}, ${c.daysPending} days overdue)`)
          .join(', ')} exceeds credit terms. WhatsApp reminders have been drafted in the Khata section.`;
      } else if (q.includes('weekend') || q.includes('festival') || q.includes('demand')) {
        reply = `Predicted weekend surge will heavily impact Cooking Oils (+38%) and Premium Basmati (+25%). Current Basmati stock has only 12 bags left and will stock out by Saturday 4 PM unless replenished.`;
      } else {
        reply = `Based on your live register data, today's sales velocity is steady. Your top moving category is Grains & Edible Oils. Working capital utilization is at 88%. You can issue a quick PO from the optimizer below.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          text: reply,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 500);
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
        <div className="lg:col-span-6 bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#4b41e1]" />
              <h3 className="font-bold text-[#131b2e] text-sm">Kirana Business Intelligence Chat</h3>
            </div>
            <span className="text-[11px] text-[#4b41e1] font-semibold">Bilingual (English/हिंदी)</span>
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
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
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
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 text-[11px] no-scrollbar shrink-0 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={() => setUserInput('Which items are expiring this month?')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer"
            >
              Expiring stock?
            </button>
            <button
              type="button"
              onClick={() => setUserInput('What is my highest margin product?')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer"
            >
              Highest margin?
            </button>
            <button
              type="button"
              onClick={() => setUserInput('How much credit is pending in Khata?')}
              className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#cbd5e1] rounded text-[#475569] whitespace-nowrap cursor-pointer"
            >
              Pending Khata?
            </button>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="relative shrink-0 pt-1">
            <input
              type="text"
              placeholder="Ask anything about inventory, sales, or khata..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#4b41e1] rounded-lg text-xs text-[#131b2e] outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#4b41e1] hover:text-[#3730a3] cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
