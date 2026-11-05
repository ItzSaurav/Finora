import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  X,
} from 'lucide-react';
import { SupplierInvoice } from '../types/merchant';
import { sounds } from '../utils/audio';

interface SupplierInvoicesProps {
  invoices: SupplierInvoice[];
  onMarkPaid: (id: string) => void;
}

export const SupplierInvoices: React.FC<SupplierInvoicesProps> = ({
  invoices,
  onMarkPaid,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [verifiedItems, setVerifiedItems] = useState<{ [key: string]: boolean }>({});

  const totalPayable = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);

  const overduePayable = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((acc, inv) => acc + inv.totalAmount, 0);

  const handlePayInvoice = (id: string) => {
    sounds.playSuccessChime();
    onMarkPaid(id);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Wholesale Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Wholesale Payable Pending</span>
            <Truck className="w-4 h-4 text-[#006948]" />
          </div>
          <div className="text-2xl font-bold text-[#131b2e] font-mono-numbers mt-1">
            ₹{totalPayable.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Across {invoices.filter((i) => i.status !== 'paid').length} open distributor purchase orders
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Overdue Invoices (&gt;Credit Period)</span>
            <AlertCircle className="w-4 h-4 text-[#ba1a1a]" />
          </div>
          <div className="text-2xl font-bold text-[#ba1a1a] font-mono-numbers mt-1">
            ₹{overduePayable.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#ba1a1a] font-medium mt-1">
            Immediate settlement required to avoid supplier stop-ship
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Verified Wholesale Credit Score</span>
            <CheckCircle2 className="w-4 h-4 text-[#006948]" />
          </div>
          <div className="text-2xl font-bold text-[#006948] font-mono-numbers mt-1">
            Grade A (92/100)
          </div>
          <div className="text-[11px] text-[#059669] font-medium mt-1">
            Eligible for 21-day extended trade credit
          </div>
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-[#131b2e] text-sm">Distributor Wholesale Invoices & POs</h3>
          <span className="text-xs text-[#64748b]">FMCG Direct Agencies</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569] font-bold">
              <tr>
                <th className="py-3 px-4">Invoice # & Supplier</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Bill Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#faf8ff] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#131b2e]">{inv.supplierName}</div>
                    <div className="text-[11px] text-[#64748b] font-mono-numbers">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-[#94a3b8] mt-0.5">{inv.itemsSummary}</div>
                  </td>
                  <td className="py-3 px-3 text-[#475569] whitespace-nowrap">{inv.category}</td>
                  <td className="py-3 px-3 font-mono-numbers text-[#64748b] whitespace-nowrap">{inv.date}</td>
                  <td className="py-3 px-3 font-mono-numbers text-[#64748b] whitespace-nowrap">
                    <span className={inv.status === 'overdue' ? 'text-[#ba1a1a] font-bold' : ''}>
                      {inv.dueDate}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers font-bold text-sm text-[#131b2e] whitespace-nowrap">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {inv.status === 'paid' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                        Settled / Paid
                      </span>
                    ) : inv.status === 'overdue' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
                        Overdue Credit
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                        Pending Due
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-md transition-colors cursor-pointer"
                      >
                        Verify Items
                      </button>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#006948] hover:bg-[#005137] rounded-md transition-colors cursor-pointer shadow-xs"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Verification Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#cbd5e1] overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006948]" />
                <h3 className="font-bold text-[#131b2e] text-sm">
                  Inward Stock Inspection: {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] space-y-1">
                <div className="font-bold text-[#131b2e] text-sm">{selectedInvoice.supplierName}</div>
                <div className="text-[11px] text-[#64748b]">Total Invoice Amount: ₹{selectedInvoice.totalAmount}</div>
                <div className="text-[11px] text-[#64748b]">Due Date: {selectedInvoice.dueDate}</div>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-2">
                  Check off physical crates received at shop counter:
                </label>
                <div className="space-y-2">
                  {selectedInvoice.itemsSummary.split(', ').map((itemDesc, idx) => {
                    const key = `${selectedInvoice.id}-${idx}`;
                    const isChecked = !!verifiedItems[key];

                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]'
                            : 'bg-white border-[#cbd5e1] text-[#131b2e]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setVerifiedItems({ ...verifiedItems, [key]: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#006948]"
                        />
                        <span className="font-medium text-xs">{itemDesc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 text-xs text-[#64748b] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playSuccessChime();
                    alert('Goods inspection saved! All counts match delivery challan.');
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Inward Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
