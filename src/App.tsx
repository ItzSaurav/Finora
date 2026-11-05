import React, { useState } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_AI_PREDICTIONS,
  INITIAL_KHATA_CUSTOMERS,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_TRANSACTIONS,
} from './data/mockData';
import { Product, KhataCustomer, SupplierInvoice, AIPrediction, SaleTransaction } from './types/merchant';
import { Header, NavTab } from './components/Header';
import { POSCounter } from './components/POSCounter';
import { InventoryIntelligence } from './components/InventoryIntelligence';
import { AICopilot } from './components/AICopilot';
import { KhataLedger } from './components/KhataLedger';
import { SupplierInvoices } from './components/SupplierInvoices';
import { sounds } from './utils/audio';
import { MapPin, ShieldCheck, Sparkles, Store } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('counter');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [predictions, setPredictions] = useState<AIPrediction[]>(INITIAL_AI_PREDICTIONS);
  const [khataCustomers, setKhataCustomers] = useState<KhataCustomer[]>(INITIAL_KHATA_CUSTOMERS);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(INITIAL_SUPPLIER_INVOICES);
  const [dailyTransactions, setDailyTransactions] = useState<SaleTransaction[]>(INITIAL_TRANSACTIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Handler when counter sale is completed
  const handleCompleteSale = (tx: SaleTransaction) => {
    setDailyTransactions((prev) => [tx, ...prev]);

    // Deduct inventory counts
    setProducts((prev) => {
      return prev.map((p) => {
        const itemSold = tx.items.find((it) => it.product.id === p.id);
        if (itemSold) {
          const newStock = Math.max(0, p.currentStock - itemSold.quantity);
          const newStatus = newStock <= p.safetyStock ? 'low_stock' : p.status;
          return { ...p, currentStock: newStock, status: newStatus };
        }
        return p;
      });
    });

    // If Khata transaction, update customer balance
    if (tx.paymentMethod === 'khata' && tx.customerName) {
      setKhataCustomers((prev) =>
        prev.map((c) => {
          if (c.name === tx.customerName) {
            return {
              ...c,
              balanceDue: c.balanceDue + tx.grandTotal,
              daysPending: Math.max(1, c.daysPending),
              lastTransactionDate: new Date().toISOString().split('T')[0],
              history: [
                {
                  id: `tx-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  description: `Bill #${tx.receiptNumber}`,
                  amount: tx.grandTotal,
                  type: 'credit',
                },
                ...c.history,
              ],
            };
          }
          return c;
        })
      );
      showToast(`Bill ${tx.receiptNumber} added to ${tx.customerName}'s Khata account!`);
    } else {
      showToast(`Bill ${tx.receiptNumber} recorded successfully!`);
    }
  };

  // Update product inventory
  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Inventory updated for ${updated.name}`);
  };

  // Add new product
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Registered SKU: ${newProd.name}`);
  };

  // Update customer
  const handleUpdateCustomer = (updated: KhataCustomer) => {
    setKhataCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Khata ledger updated for ${updated.name}`);
  };

  // Add customer
  const handleAddCustomer = (newCust: KhataCustomer) => {
    setKhataCustomers((prev) => [newCust, ...prev]);
    showToast(`Created Khata for ${newCust.name}`);
  };

  // Mark invoice paid
  const handleMarkInvoicePaid = (id: string) => {
    setSupplierInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'paid' as const } : inv))
    );
    showToast('Distributor invoice marked as paid');
  };

  // Execute AI Prediction action
  const handleExecuteAIPrediction = (pred: AIPrediction) => {
    if (pred.type === 'stockout') {
      // Auto replenish
      setProducts((prev) =>
        prev.map((p) => {
          if (p.name.includes('Basmati') || p.name.includes('Toor')) {
            return { ...p, currentStock: p.currentStock + 20, status: 'optimal' };
          }
          return p;
        })
      );
      showToast('1-Click PO issued! 20 units added to Basmati Rice & Toor Dal.');
    } else if (pred.type === 'surge') {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.category === 'Edible Oils & Ghee' || p.category === 'Spices & Masalas') {
            return { ...p, safetyStock: p.safetyStock + 10 };
          }
          return p;
        })
      );
      showToast('Safety threshold boosted for festival surge preparation!');
    } else if (pred.type === 'arbitrage') {
      showToast('Locked ₹14/unit margin discount with Gujarat Milk Federation!');
    } else if (pred.type === 'capital_leak') {
      showToast('Bundle deal activated at counter: Detergent + Soap @ ₹499!');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-sans selection:bg-[#006948] selection:text-white">
      {/* Top Bar Header strictly adhering to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={0}
        onOpenQuickScan={() => {
          sounds.playBarcodeBeep();
          setActiveTab('counter');
        }}
      />

      {/* Merchant Shop Profile & Context Ribbon */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {/* Merchant Avatar */}
            <div className="w-10 h-10 rounded-full border-2 border-[#006948] overflow-hidden shrink-0 shadow-xs">
              <img
                src="/src/assets/images/kirana_merchant_avatar_1793871803596.jpg"
                alt="Proprietor"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#131b2e] text-sm">Laxmi Super Kirana Store</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006948]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Merchant
                </span>
              </div>
              <div className="text-[11px] text-[#64748b] flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#94a3b8]" />
                  Sector 12 Market, Delhi NCR
                </span>
                <span>·</span>
                <span className="font-mono-numbers">GSTIN: 07AAAPL1234F1Z8</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-numbers">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-[#64748b]">Today's Realized Margin</div>
              <div className="font-bold text-[#006948] text-sm">
                17.8% (₹{dailyTransactions.reduce((a, b) => a + b.profitTotal, 0).toLocaleString('en-IN')})
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ecfdf5] border border-[#a7f3d0] rounded-md text-[#047857] text-[11px] font-medium font-sans">
              <Store className="w-3.5 h-3.5" />
              <span>Register Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeTab === 'counter' && (
          <POSCounter
            products={products}
            khataCustomers={khataCustomers}
            onCompleteSale={handleCompleteSale}
            dailyTransactions={dailyTransactions}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryIntelligence
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
          />
        )}

        {activeTab === 'copilot' && (
          <AICopilot
            predictions={predictions}
            products={products}
            khataCustomers={khataCustomers}
            onExecuteAction={handleExecuteAIPrediction}
          />
        )}

        {activeTab === 'khata' && (
          <KhataLedger
            customers={khataCustomers}
            onUpdateCustomer={handleUpdateCustomer}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {activeTab === 'suppliers' && (
          <SupplierInvoices
            invoices={supplierInvoices}
            onMarkPaid={handleMarkInvoicePaid}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-4 px-6 text-center text-xs text-[#64748b]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Finora © 2026 · Built for Indian Retail Kirana Merchants
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Fast Billing Hotkey: [F2]</span>
            <span>·</span>
            <span>All amounts in Indian Rupees (₹)</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#131b2e] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-[#334155] animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
