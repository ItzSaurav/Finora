import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

export type NavTab = 'counter' | 'inventory' | 'copilot' | 'khata' | 'suppliers';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  cartCount: number;
  onOpenQuickScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenQuickScan,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] px-4 md:px-8 py-3.5 shadow-xs">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Zone - Single clean wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#006948] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            V
          </div>
          <button
            onClick={() => setActiveTab('counter')}
            className="text-left cursor-pointer group"
          >
            <span className="text-lg md:text-xl font-bold tracking-tight text-[#131b2e] group-hover:text-[#006948] transition-colors whitespace-nowrap">
              Vibrant Merchant
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean text with underline / active state) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-[#64748b]">
          <button
            onClick={() => setActiveTab('counter')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'counter'
                ? 'border-[#006948] text-[#006948]'
                : 'border-transparent hover:text-[#131b2e]'
            }`}
          >
            Counter POS
            {cartCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] bg-[#006948] text-white font-mono-numbers">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'inventory'
                ? 'border-[#006948] text-[#006948]'
                : 'border-transparent hover:text-[#131b2e]'
            }`}
          >
            Inventory Intelligence
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'copilot'
                ? 'border-[#4b41e1] text-[#4b41e1]'
                : 'border-transparent hover:text-[#4b41e1]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4b41e1]" />
            AI Demand Forecast
          </button>

          <button
            onClick={() => setActiveTab('khata')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'khata'
                ? 'border-[#006948] text-[#006948]'
                : 'border-transparent hover:text-[#131b2e]'
            }`}
          >
            Khata & Udhaar
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'suppliers'
                ? 'border-[#006948] text-[#006948]'
                : 'border-transparent hover:text-[#131b2e]'
            }`}
          >
            Distributor Bills
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile quick tabs dropdown or toggle if needed */}
          <div className="lg:hidden flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab(activeTab === 'counter' ? 'inventory' : 'counter')}
              className="px-2.5 py-1.5 border border-[#cbd5e1] rounded-md font-medium text-[#131b2e]"
            >
              {activeTab === 'counter' ? 'View Inventory' : 'Open POS'}
            </button>
          </div>

          <button
            onClick={onOpenQuickScan}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#006948] hover:bg-[#005137] rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Fast Bill (F2)</span>
          </button>
        </div>
      </div>

      {/* Mobile scrollable secondary tab bar for responsive Kirana counter use */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pt-2.5 pb-1 text-xs border-t border-[#f1f5f9] mt-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('counter')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
            activeTab === 'counter' ? 'bg-[#006948] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
          }`}
        >
          Counter POS {cartCount > 0 ? `(${cartCount})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
            activeTab === 'inventory' ? 'bg-[#006948] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('copilot')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
            activeTab === 'copilot' ? 'bg-[#4b41e1] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
          }`}
        >
          AI Forecast
        </button>
        <button
          onClick={() => setActiveTab('khata')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
            activeTab === 'khata' ? 'bg-[#006948] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
          }`}
        >
          Khata
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
            activeTab === 'suppliers' ? 'bg-[#006948] text-white' : 'bg-[#f1f5f9] text-[#64748b]'
          }`}
        >
          Distributors
        </button>
      </div>
    </header>
  );
};
