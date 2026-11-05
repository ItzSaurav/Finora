import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { SaleTransaction } from '../types/merchant';

interface ReceiptModalProps {
  transaction: SaleTransaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-[#cbd5e1] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#006948]" />
            <h3 className="font-bold text-[#131b2e] text-base">Payment Complete & Bill Ready</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#64748b] hover:text-[#131b2e] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Slip Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono-numbers text-xs text-[#0f172a] bg-[#faf8ff]">
          <div className="bg-white p-5 border border-[#e2e8f0] rounded-lg shadow-xs space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#94a3b8]">
              <h2 className="text-base font-extrabold uppercase font-sans text-[#131b2e]">
                LAXMI SUPER KIRANA STORE
              </h2>
              <p className="text-[11px] text-[#64748b]">Shop #4, Main Market, Sector 12</p>
              <p className="text-[11px] text-[#64748b]">GSTIN: 07AAAPL1234F1Z8 · Ph: +91 98110 54321</p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-[#475569]">
                <span>Bill: {transaction.receiptNumber}</span>
                <span>{transaction.timestamp}</span>
              </div>
            </div>

            {/* Customer info if Khata */}
            {transaction.customerName && (
              <div className="bg-[#f1f5f9] p-2 rounded text-[11px]">
                <span className="font-semibold text-[#006948]">Khata Account:</span> {transaction.customerName}
                {transaction.customerPhone && ` (${transaction.customerPhone})`}
              </div>
            )}

            {/* Line items table */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-[11px] text-[#475569] border-b border-[#e2e8f0] pb-1">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/6 text-right">Rate</span>
                <span className="w-1/6 text-right">Amt (₹)</span>
              </div>

              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] py-0.5">
                  <div className="w-1/2 truncate font-sans">
                    <div className="font-semibold text-[#0f172a] truncate">{item.product.name}</div>
                    <div className="text-[10px] text-[#64748b]">{item.product.packSize}</div>
                  </div>
                  <div className="w-1/6 text-center">{item.quantity}</div>
                  <div className="w-1/6 text-right">₹{item.product.sellingPrice}</div>
                  <div className="w-1/6 text-right font-bold">
                    ₹{item.product.sellingPrice * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations breakdown */}
            <div className="pt-3 border-t border-dashed border-[#94a3b8] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#64748b]">
                <span>Items Subtotal:</span>
                <span>₹{transaction.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#64748b]">
                <span>GST (Incl. 5% / 12%):</span>
                <span>₹{transaction.gstAmount.toFixed(2)}</span>
              </div>
              {transaction.discountTotal > 0 && (
                <div className="flex justify-between text-[#006948] font-semibold">
                  <span>Merchant Discount:</span>
                  <span>-₹{transaction.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#131b2e] pt-2 border-t border-[#0f172a]">
                <span>NET TOTAL:</span>
                <span className="text-[#006948]">₹{transaction.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#64748b] pt-1">
                <span>Payment Mode:</span>
                <span className="uppercase font-bold text-[#0f172a]">{transaction.paymentMethod}</span>
              </div>
              <div className="bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] p-2 rounded text-center text-[11px] font-sans font-medium">
                Customer Saved ₹{(transaction.items.reduce((acc, it) => acc + (it.product.mrp - it.product.sellingPrice) * it.quantity, 0) + transaction.discountTotal).toFixed(0)} below MRP!
              </div>
            </div>

            <div className="text-center text-[10px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
              Thank you for visiting! Shubh Labh 🙏
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-[#e2e8f0] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#0f172a] rounded-lg transition-colors cursor-pointer"
          >
            Start Next Bill
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white text-sm font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
