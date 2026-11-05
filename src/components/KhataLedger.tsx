import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  X,
  CreditCard,
} from 'lucide-react';
import { KhataCustomer } from '../types/merchant';
import { sounds } from '../utils/audio';

interface KhataLedgerProps {
  customers: KhataCustomer[];
  onUpdateCustomer: (customer: KhataCustomer) => void;
  onAddCustomer: (customer: KhataCustomer) => void;
}

export const KhataLedger: React.FC<KhataLedgerProps> = ({
  customers,
  onUpdateCustomer,
  onAddCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [whatsappPreview, setWhatsappPreview] = useState<{ customer: KhataCustomer; message: string } | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New customer form state
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    locality: '',
    creditLimit: 5000,
  });

  const totalOutstanding = useMemo(() => {
    return customers.reduce((acc, c) => acc + c.balanceDue, 0);
  }, [customers]);

  const criticalOverdue = useMemo(() => {
    return customers
      .filter((c) => c.trustScore === 'critical' || c.daysPending > 14)
      .reduce((acc, c) => acc + c.balanceDue, 0);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.locality.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  // Handle recording payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    const newBalance = Math.max(0, selectedCustomer.balanceDue - amt);
    const updated: KhataCustomer = {
      ...selectedCustomer,
      balanceDue: newBalance,
      daysPending: newBalance === 0 ? 0 : selectedCustomer.daysPending,
      trustScore: newBalance > selectedCustomer.creditLimit ? 'critical' : 'high',
      history: [
        {
          id: `pay-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: `Settlement payment received`,
          amount: amt,
          type: 'payment',
        },
        ...selectedCustomer.history,
      ],
    };

    sounds.playSuccessChime();
    onUpdateCustomer(updated);
    setSelectedCustomer(null);
    setPaymentAmount('');
  };

  // WhatsApp reminder generator
  const triggerWhatsAppReminder = (customer: KhataCustomer) => {
    const text = `Namaste ${customer.name} ji, Laxmi Super Kirana store se namaskar. Aapka kul khata balance ₹${customer.balanceDue} hai jo ${customer.daysPending} dino se baki hai. Kripya is UPI link se bhugtan karein: upi://pay?pa=laxmi.kirana@icici&pn=LaxmiKirana&am=${customer.balanceDue} Dhanyawad! 🙏`;
    setWhatsappPreview({ customer, message: text });
  };

  // Add customer submit
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const created: KhataCustomer = {
      id: `khata-${Date.now()}`,
      name: newCust.name,
      phone: newCust.phone,
      locality: newCust.locality,
      balanceDue: 0,
      lastTransactionDate: new Date().toISOString().split('T')[0],
      daysPending: 0,
      creditLimit: Number(newCust.creditLimit),
      trustScore: 'high',
      history: [],
    };

    sounds.playSuccessChime();
    onAddCustomer(created);
    setShowAddCustomerModal(false);
    setNewCust({ name: '', phone: '', locality: '', creditLimit: 5000 });
  };

  return (
    <div className="space-y-4">
      {/* Top Ledger Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Total Udhaar Outstanding</span>
            <BookOpen className="w-4 h-4 text-[#006948]" />
          </div>
          <div className="text-2xl font-bold text-[#131b2e] font-mono-numbers mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Active credit across {customers.length} neighborhood customers
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Overdue Balance (&gt;14 Days)</span>
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
          </div>
          <div className="text-2xl font-bold text-[#ba1a1a] font-mono-numbers mt-1">
            ₹{criticalOverdue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#ba1a1a] font-medium mt-1">
            Immediate WhatsApp reminder recommended
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#64748b]">Recovery Health Score</div>
            <div className="text-2xl font-bold text-[#006948] font-mono-numbers mt-1">
              88.4%
            </div>
            <div className="text-[11px] text-[#059669] font-medium mt-1">
              +4.2% collected this month
            </div>
          </div>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#006948] hover:bg-[#005137] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Khata</span>
          </button>
        </div>
      </div>

      {/* Search & Customer Grid */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search customer by name, phone number, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#006948] rounded-lg text-xs text-[#131b2e] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredCustomers.map((c) => {
            const isCritical = c.trustScore === 'critical' || c.daysPending > 14;

            return (
              <div
                key={c.id}
                className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between transition-all hover:shadow-sm ${
                  isCritical ? 'border-[#fecdd3] bg-[#fff5f5]' : 'border-[#e2e8f0]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#131b2e] leading-tight">{c.name}</h4>
                      <p className="text-[11px] text-[#64748b] mt-0.5">{c.locality}</p>
                    </div>
                    {isCritical ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
                        {c.daysPending}d Overdue
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#475569] mt-2 font-mono-numbers">
                    <Phone className="w-3 h-3 text-[#64748b]" />
                    <span>{c.phone}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex justify-between items-baseline font-mono-numbers">
                    <span className="text-[11px] text-[#64748b] font-sans">Udhaar Due:</span>
                    <span className="text-base font-extrabold text-[#ba1a1a]">
                      ₹{c.balanceDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center gap-2">
                  <button
                    onClick={() => triggerWhatsAppReminder(c)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#128c7e] border border-[#25d366]/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#006948] hover:bg-[#005137] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Collect ₹</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Settlement Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-[#cbd5e1] overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <h3 className="font-bold text-[#131b2e] text-sm">Collect Khata Payment</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-3 text-xs">
              <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] space-y-1">
                <div className="font-bold text-[#131b2e] text-sm">{selectedCustomer.name}</div>
                <div className="text-[11px] text-[#64748b]">{selectedCustomer.phone}</div>
                <div className="text-base font-bold text-[#ba1a1a] font-mono-numbers pt-1">
                  Total Due: ₹{selectedCustomer.balanceDue.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Amount Received (₹):
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter collected amount..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-sm font-mono-numbers font-bold text-[#131b2e] outline-none focus:border-[#006948]"
                />
              </div>

              {/* Quick Full Settlement button */}
              <button
                type="button"
                onClick={() => setPaymentAmount(String(selectedCustomer.balanceDue))}
                className="text-xs text-[#006948] font-semibold hover:underline block"
              >
                Settle Full Balance (₹{selectedCustomer.balanceDue})
              </button>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3 py-1.5 text-xs text-[#64748b] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Receipt & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview Modal */}
      {whatsappPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#cbd5e1] overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25d366]" />
                <h3 className="font-bold text-[#131b2e] text-sm">
                  Send WhatsApp Payment Reminder
                </h3>
              </div>
              <button
                onClick={() => setWhatsappPreview(null)}
                className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="text-[#64748b]">
                Recipient:{' '}
                <span className="font-bold text-[#131b2e]">
                  {whatsappPreview.customer.name} ({whatsappPreview.customer.phone})
                </span>
              </div>

              {/* Chat Bubble Preview */}
              <div className="bg-[#e7fedb] border border-[#c1f7a6] p-3 rounded-lg text-[#0f172a] text-xs leading-relaxed font-sans shadow-inner">
                {whatsappPreview.message}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  onClick={() => setWhatsappPreview(null)}
                  className="px-3 py-1.5 text-xs text-[#64748b] cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    sounds.playSuccessChime();
                    alert(`WhatsApp reminder triggered to ${whatsappPreview.customer.name}!`);
                    setWhatsappPreview(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-[#cbd5e1] overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <h3 className="font-bold text-[#131b2e] text-sm">Open New Customer Khata</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded text-[#64748b] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#475569] block mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mukesh Kumar (Tailor)"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98..."
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Locality / House Details</label>
                <input
                  type="text"
                  placeholder="e.g. Block C, House 14"
                  value={newCust.locality}
                  onChange={(e) => setNewCust({ ...newCust, locality: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={newCust.creditLimit}
                  onChange={(e) => setNewCust({ ...newCust, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948] font-mono-numbers"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-1.5 text-[#64748b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white font-bold rounded-lg cursor-pointer"
                >
                  Create Khata Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
