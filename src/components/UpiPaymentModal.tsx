import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface UpiPaymentModalProps {
  amount: number;
  onConfirmPayment: () => void;
  onCancel: () => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  amount,
  onConfirmPayment,
  onCancel,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateCustomerScan = () => {
    setIsVerifying(true);
    setTimeout(() => {
      sounds.playSuccessChime();
      setIsVerifying(false);
      onConfirmPayment();
    }, 1200);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-[#cbd5e1] overflow-hidden text-center">
        {/* Header */}
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#006948]" />
            <h3 className="font-bold text-[#131b2e] text-sm">Instant Counter UPI QR</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs text-[#64748b] font-medium">Scan to Pay via GPay / PhonePe / Paytm</div>
            <div className="text-3xl font-extrabold text-[#006948] font-mono-numbers mt-1">
              ₹{amount.toFixed(2)}
            </div>
            <div className="text-[11px] text-[#475569] font-mono mt-0.5">
              VPA: laxmi.kirana@icici
            </div>
          </div>

          {/* QR Code Container */}
          <div className="mx-auto w-52 h-52 bg-[#f8fafc] p-3 border-2 border-dashed border-[#006948] rounded-xl flex flex-col items-center justify-center relative shadow-inner">
            {/* SVG Dynamic QR Code simulation */}
            <svg
              className="w-44 h-44 text-[#131b2e]"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner position squares */}
              <rect x="5" y="5" width="28" height="28" fill="#006948" rx="3" />
              <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
              <rect x="13" y="13" width="12" height="12" fill="#006948" rx="1" />

              <rect x="67" y="5" width="28" height="28" fill="#006948" rx="3" />
              <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
              <rect x="75" y="13" width="12" height="12" fill="#006948" rx="1" />

              <rect x="5" y="67" width="28" height="28" fill="#006948" rx="3" />
              <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
              <rect x="13" y="75" width="12" height="12" fill="#006948" rx="1" />

              {/* Data matrix dots */}
              <rect x="38" y="10" width="8" height="8" />
              <rect x="50" y="14" width="6" height="6" />
              <rect x="42" y="24" width="14" height="6" />
              <rect x="10" y="38" width="6" height="12" />
              <rect x="22" y="44" width="8" height="8" />
              <rect x="38" y="38" width="10" height="10" />
              <rect x="52" y="38" width="8" height="6" />
              <rect x="64" y="40" width="12" height="6" />
              <rect x="80" y="44" width="14" height="6" />
              <rect x="38" y="54" width="12" height="8" />
              <rect x="56" y="52" width="6" height="14" />
              <rect x="68" y="54" width="10" height="8" />
              <rect x="42" y="68" width="8" height="8" />
              <rect x="54" y="72" width="12" height="6" />
              <rect x="40" y="82" width="14" height="10" />
              <rect x="68" y="70" width="8" height="14" />
              <rect x="82" y="74" width="10" height="12" />

              {/* Center UPI icon badge */}
              <circle cx="50" cy="50" r="10" fill="white" />
              <circle cx="50" cy="50" r="8" fill="#006948" />
              <text x="50" y="53" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">₹</text>
            </svg>

            {isVerifying && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 rounded-xl">
                <Loader2 className="w-8 h-8 text-[#006948] animate-spin" />
                <span className="text-xs font-bold text-[#131b2e]">Verifying Bank UPI...</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#64748b] flex items-center justify-center gap-1 font-mono-numbers">
            <span>Dynamic QR expires in:</span>
            <span className="font-bold text-[#0f172a]">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>

          {/* Quick Counter Simulation Button */}
          <div className="pt-2">
            <button
              onClick={handleSimulateCustomerScan}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#006948] hover:bg-[#005137] text-white text-sm font-bold rounded-lg transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulate Customer Scan & Pay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-[#64748b] mt-1.5">
              Instant sound alert & bill generation triggered upon webhook settlement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
