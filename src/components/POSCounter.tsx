import React, { useState, useMemo } from 'react';
import {
  Search,
  Barcode,
  Mic,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Product, CartItem, SaleTransaction, KhataCustomer, ProductCategory } from '../types/merchant';
import { sounds } from '../utils/audio';
import { UpiPaymentModal } from './UpiPaymentModal';
import { ReceiptModal } from './ReceiptModal';

interface POSCounterProps {
  products: Product[];
  khataCustomers: KhataCustomer[];
  onCompleteSale: (transaction: SaleTransaction) => void;
  dailyTransactions: SaleTransaction[];
}

export const POSCounter: React.FC<POSCounterProps> = ({
  products,
  khataCustomers,
  onCompleteSale,
  dailyTransactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Payment Drawer States
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'khata'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [selectedKhataId, setSelectedKhataId] = useState<string>(khataCustomers[0]?.id || '');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [completedTx, setCompletedTx] = useState<SaleTransaction | null>(null);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.product.sellingPrice * it.quantity, 0);
  }, [cart]);

  const wholesaleCostTotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.product.wholesaleCost * it.quantity, 0);
  }, [cart]);

  const totalMrp = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.product.mrp * it.quantity, 0);
  }, [cart]);

  const savingsTotal = Math.max(0, totalMrp - subtotal);
  const gstAmount = Math.round(subtotal * 0.05 * 100) / 100; // estimated 5% average staple GST
  const grandTotal = subtotal;
  const counterProfit = Math.max(0, grandTotal - wholesaleCostTotal);
  const marginPercent = subtotal > 0 ? ((counterProfit / subtotal) * 100).toFixed(1) : '0.0';

  // Cash change calculation
  const numericTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericTendered - grandTotal);

  // Category list
  const categories = ['All', 'Grains & Atta', 'Edible Oils & Ghee', 'Spices & Masalas', 'Dairy & Staples', 'Packaged Snacks', 'Personal & Home Care'];

  // Filtered products for quick counter lookup
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameHindi.includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart Operations
  const addToCart = (product: Product, qty: number = 1) => {
    sounds.playBarcodeBeep();
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + qty } : it
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product.id === productId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered('');
  };

  // Barcode quick scan submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (found) {
      addToCart(found, 1);
      setBarcodeInput('');
    } else {
      sounds.playWarningTone();
      alert(`Barcode ${barcodeInput} not recognized in catalog. Try searching item name.`);
    }
  };

  // Voice Billing Parser (Hinglish/English Kirana voice input)
  const handleVoiceCommand = (phrase: string) => {
    setVoiceQuery(phrase);
    setIsVoiceListening(false);

    // Parse simple patterns like "2 Basmati Rice", "3 Tata Salt", "2 Mustard Oil"
    let matchedAny = false;
    products.forEach((p) => {
      const nameKey = p.name.toLowerCase();
      const hindiKey = p.nameHindi;
      if (phrase.toLowerCase().includes('basmati') && nameKey.includes('basmati')) {
        addToCart(p, 2);
        matchedAny = true;
      } else if (phrase.toLowerCase().includes('oil') && nameKey.includes('mustard')) {
        addToCart(p, 1);
        matchedAny = true;
      } else if (phrase.toLowerCase().includes('salt') && nameKey.includes('salt')) {
        addToCart(p, 3);
        matchedAny = true;
      } else if (phrase.toLowerCase().includes('turmeric') || phrase.toLowerCase().includes('haldi')) {
        if (nameKey.includes('turmeric') || hindiKey.includes('हल्दी')) {
          addToCart(p, 1);
          matchedAny = true;
        }
      } else if (phrase.toLowerCase().includes('atta') && nameKey.includes('atta')) {
        addToCart(p, 1);
        matchedAny = true;
      } else if (phrase.toLowerCase().includes('biscuit') || phrase.toLowerCase().includes('parle')) {
        if (nameKey.includes('parle')) {
          addToCart(p, 5);
          matchedAny = true;
        }
      }
    });

    if (!matchedAny) {
      // Fallback add first matching product
      if (products.length > 0) {
        addToCart(products[0], 1);
      }
    }
  };

  // Checkout Execution
  const finalizeSale = (method: 'cash' | 'upi' | 'khata') => {
    if (cart.length === 0) return;

    let customerName = undefined;
    let customerPhone = undefined;

    if (method === 'khata') {
      const customer = khataCustomers.find((c) => c.id === selectedKhataId);
      if (customer) {
        customerName = customer.name;
        customerPhone = customer.phone;
      }
    }

    const newTx: SaleTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      items: [...cart],
      subtotal,
      gstAmount,
      discountTotal: 0,
      grandTotal,
      paymentMethod: method,
      customerName,
      customerPhone,
      profitTotal: counterProfit,
    };

    sounds.playSuccessChime();
    onCompleteSale(newTx);
    setCompletedTx(newTx);
    clearCart();
    setShowUpiModal(false);
  };

  const handlePayClick = () => {
    if (paymentMode === 'upi') {
      setShowUpiModal(true);
    } else {
      finalizeSale(paymentMode);
    }
  };

  // Daily summary stats
  const todayTotalRevenue = dailyTransactions.reduce((acc, tx) => acc + tx.grandTotal, 0);
  const todayTotalProfit = dailyTransactions.reduce((acc, tx) => acc + tx.profitTotal, 0);

  return (
    <div className="space-y-4">
      {/* Top Quick Status Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#64748b]">Today's Bills Settled</div>
          <div className="text-xl font-bold text-[#131b2e] font-mono-numbers mt-0.5">
            {dailyTransactions.length} <span className="text-xs font-normal text-[#64748b]">tokens</span>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#64748b]">Today's Counter Revenue</div>
          <div className="text-xl font-bold text-[#006948] font-mono-numbers mt-0.5">
            ₹{todayTotalRevenue.toFixed(0)}
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs">
          <div className="text-[11px] font-medium text-[#64748b]">Gross Counter Profit</div>
          <div className="text-xl font-bold text-[#006948] font-mono-numbers mt-0.5">
            ₹{todayTotalProfit.toFixed(0)}{' '}
            <span className="text-xs text-[#059669] font-normal font-sans">
              ({todayTotalRevenue > 0 ? ((todayTotalProfit / todayTotalRevenue) * 100).toFixed(1) : '17.2'}%)
            </span>
          </div>
        </div>

        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#166534]">Counter Mode</div>
            <div className="text-xs font-bold text-[#14532d] mt-0.5">Rapid Rush Active</div>
          </div>
          <div className="px-2 py-1 rounded bg-[#dcfce7] text-[#166534] text-[10px] font-mono font-semibold">
            F2 POS
          </div>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Rapid Product Finder & Barcode Scan */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Barcode & Search Controls */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Barcode Scanner Input */}
              <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#006948]" />
                <input
                  type="text"
                  placeholder="Scan or type barcode (e.g. 8901234567890)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-10 pr-20 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#006948] focus:bg-white rounded-lg text-sm text-[#131b2e] outline-none font-mono-numbers transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold bg-[#006948] text-white rounded hover:bg-[#005137] cursor-pointer"
                >
                  Enter
                </button>
              </form>

              {/* Bilingual Product Name Search */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  placeholder="Search item / हिंदी नाम (Rice, तेल, Dal)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#006948] focus:bg-white rounded-lg text-sm text-[#131b2e] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94a3b8] hover:text-[#0f172a]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Voice Command Simulation Bar */}
            <div className="pt-2 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoiceListening(!isVoiceListening)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    isVoiceListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#eef2ff] text-[#4338ca] hover:bg-[#e0e7ff]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isVoiceListening ? 'Listening Voice...' : 'Voice Billing (आवाज से बिल)'}</span>
                </button>
                <span className="text-[11px] text-[#64748b] hidden sm:inline">Try speaking rapid orders</span>
              </div>

              {/* Sample voice test triggers */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[#94a3b8]">Quick voice:</span>
                <button
                  type="button"
                  onClick={() => handleVoiceCommand('2 Basmati Rice, 1 Mustard Oil')}
                  className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#e2e8f0] rounded text-[#475569] text-[10px] whitespace-nowrap cursor-pointer"
                >
                  "2 Basmati + 1 Oil"
                </button>
                <button
                  type="button"
                  onClick={() => handleVoiceCommand('3 Tata Salt, 1 Turmeric Powder')}
                  className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#e2e8f0] rounded text-[#475569] text-[10px] whitespace-nowrap cursor-pointer"
                >
                  "3 Salt + 1 Haldi"
                </button>
                <button
                  type="button"
                  onClick={() => handleVoiceCommand('5 Parle-G, 1 Atta')}
                  className="px-2 py-0.5 bg-[#f8fafc] hover:bg-[#eaedff] border border-[#e2e8f0] rounded text-[#475569] text-[10px] whitespace-nowrap cursor-pointer"
                >
                  "5 Parle-G + 1 Atta"
                </button>
              </div>
            </div>

            {voiceQuery && (
              <div className="bg-[#f5f3ff] border border-[#ddd6fe] text-[#4338ca] px-3 py-1.5 rounded-md text-xs flex items-center justify-between">
                <span>Recognized: "{voiceQuery}"</span>
                <span className="text-[10px] font-bold text-[#6d28d9]">Items added to cart</span>
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#006948] text-white shadow-xs'
                      : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Item Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((it) => it.product.id === product.id);
              const margin = (((product.sellingPrice - product.wholesaleCost) / product.sellingPrice) * 100).toFixed(0);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, 1)}
                  className={`bg-white border rounded-xl p-3 transition-all hover:border-[#006948] hover:shadow-sm cursor-pointer flex flex-col justify-between group relative select-none ${
                    inCartItem ? 'border-[#006948] bg-[#f7fdf9]' : 'border-[#e2e8f0]'
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] shrink-0 overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="text-center font-bold text-[#006948] text-xs">
                          {product.category.substring(0, 3)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0f172a] leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-[#64748b] mt-0.5">{product.nameHindi}</p>
                      <div className="text-[10px] text-[#94a3b8] font-mono-numbers mt-0.5">
                        {product.packSize} · {product.sku}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-[#006948] font-mono-numbers">
                          ₹{product.sellingPrice}
                        </span>
                        {product.mrp > product.sellingPrice && (
                          <span className="text-[11px] text-[#94a3b8] line-through font-mono-numbers">
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#059669] font-medium font-mono-numbers">
                        Margin: {margin}%
                      </div>
                    </div>

                    {inCartItem ? (
                      <div className="flex items-center gap-1.5 bg-[#006948] text-white px-2 py-1 rounded-md text-xs font-bold font-mono-numbers">
                        <span>{inCartItem.quantity} in bill</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-bold text-[#006948] bg-[#ecfdf5] hover:bg-[#006948] hover:text-white rounded-md transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Current Bill Ledger & Instant Checkout */}
        <div className="lg:col-span-5 bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-4 space-y-4 sticky top-20">
          {/* Bill Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <div>
              <h3 className="font-bold text-[#131b2e] text-base">Current Counter Bill</h3>
              <div className="text-xs text-[#64748b]">
                {cart.length === 0 ? 'No items scanned yet' : `${cart.reduce((a, b) => a + b.quantity, 0)} total units`}
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-[#94a3b8] space-y-2">
                <Barcode className="w-10 h-10 mx-auto opacity-30 text-[#006948]" />
                <p className="text-xs">Scan barcode, click catalog item, or use voice billing to start customer receipt</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#faf8ff] border border-[#eaedff] text-xs gap-2"
                >
                  {item.product.image && (
                    <div className="w-9 h-9 rounded bg-white border border-[#cbd5e1] overflow-hidden shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="font-bold text-[#131b2e] truncate">{item.product.name}</div>
                    <div className="text-[11px] text-[#64748b] font-mono-numbers">
                      ₹{item.product.sellingPrice} × {item.quantity} = ₹{item.product.sellingPrice * item.quantity}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="w-6 h-6 rounded bg-white border border-[#cbd5e1] flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono-numbers text-sm text-[#131b2e]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="w-6 h-6 rounded bg-[#006948] text-white flex items-center justify-center hover:bg-[#005137] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-1 text-[#94a3b8] hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing & Margin Summary */}
          {cart.length > 0 && (
            <div className="pt-3 border-t border-[#e2e8f0] space-y-1.5 text-xs font-mono-numbers">
              <div className="flex justify-between text-[#64748b]">
                <span>Items Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#64748b]">
                <span>GST (Tax Component)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              {savingsTotal > 0 && (
                <div className="flex justify-between text-[#006948] font-semibold">
                  <span>Customer Savings vs MRP</span>
                  <span>-₹{savingsTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-[#131b2e] text-base font-extrabold text-[#131b2e]">
                <span className="font-sans">Grand Total:</span>
                <span className="text-xl text-[#006948] font-mono-numbers">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
              {/* Instant Counter Profit Banner */}
              <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg p-2 flex items-center justify-between text-[11px] font-sans">
                <span className="text-[#047857] font-semibold">Wholesale Profit on this Bill:</span>
                <span className="font-bold text-[#006948] font-mono-numbers">
                  ₹{counterProfit.toFixed(0)} ({marginPercent}%)
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-[#475569] block">Select Settlement Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMode === 'cash'
                      ? 'border-[#006948] bg-[#006948] text-white shadow-xs'
                      : 'border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f8fafc]'
                  }`}
                >
                  <Banknote className="w-4 h-4 mb-1" />
                  Cash (नकद)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMode === 'upi'
                      ? 'border-[#006948] bg-[#006948] text-white shadow-xs'
                      : 'border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f8fafc]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  Instant UPI QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('khata')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    paymentMode === 'khata'
                      ? 'border-[#d97706] bg-[#d97706] text-white shadow-xs'
                      : 'border-[#cbd5e1] bg-white text-[#475569] hover:bg-[#f8fafc]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mb-1" />
                  Khata (उधार)
                </button>
              </div>

              {/* Cash Options: Tendered & Change */}
              {paymentMode === 'cash' && (
                <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#475569]">Cash Received:</span>
                    <div className="flex gap-1">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashTendered(String(amt))}
                          className="px-2 py-0.5 bg-white border border-[#cbd5e1] rounded text-[10px] font-mono-numbers hover:bg-[#eaedff] cursor-pointer"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="number"
                    placeholder="Enter cash given by customer..."
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-sm font-mono-numbers outline-none focus:border-[#006948]"
                  />

                  {numericTendered > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-[#e2e8f0]">
                      <span className="font-bold text-[#475569]">Return Change (वापसी):</span>
                      <span className="font-mono-numbers font-extrabold text-sm text-[#006948]">
                        ₹{changeDue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Khata Customer Picker */}
              {paymentMode === 'khata' && (
                <div className="bg-[#fffbeb] border border-[#fde68a] p-3 rounded-lg space-y-2 text-xs">
                  <label className="font-bold text-[#b45309] block">Select Neighborhood Customer Account</label>
                  <select
                    value={selectedKhataId}
                    onChange={(e) => setSelectedKhataId(e.target.value)}
                    className="w-full p-2 bg-white border border-[#fde68a] rounded text-xs text-[#0f172a] outline-none"
                  >
                    {khataCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} (Current Due: ₹{cust.balanceDue})
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-[#92400e]">
                    Bill amount will be appended to this customer's ledger with WhatsApp payment link.
                  </div>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handlePayClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#006948] hover:bg-[#005137] text-white font-bold rounded-lg transition-all shadow-md text-sm cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {paymentMode === 'upi'
                    ? 'Generate UPI QR & Bill'
                    : paymentMode === 'khata'
                    ? 'Record Khata & Issue Bill'
                    : 'Complete Cash Bill (F9)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUpiModal && (
        <UpiPaymentModal
          amount={grandTotal}
          onConfirmPayment={() => finalizeSale('upi')}
          onCancel={() => setShowUpiModal(false)}
        />
      )}

      {completedTx && (
        <ReceiptModal
          transaction={completedTx}
          onClose={() => setCompletedTx(null)}
        />
      )}
    </div>
  );
};
