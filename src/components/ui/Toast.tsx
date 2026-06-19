import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#009E49]" />,
    error: <XCircle className="w-5 h-5 text-[#8B1D1D]" />,
    info: <Info className="w-5 h-5 text-[#009E49]" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const colors = {
    success: 'border-[rgba(0,158,73,0.15)] bg-[rgba(0,158,73,0.10)] text-[#0A3D1F]',
    error: 'border-[rgba(139,29,29,0.15)] bg-[rgba(139,29,29,0.10)] text-[#8B1D1D]',
    info: 'border-[rgba(0,158,73,0.15)] bg-[rgba(0,158,73,0.10)] text-[#0A3D1F]',
    warning: 'border-amber-100 bg-amber-50 text-amber-900',
  };

  return (
    <div className={`fixed top-4 right-4 z-[70] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg border-opacity-30 transition-all duration-300 transform
      ${colors[type]} 
      ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
      animate-in slide-in-from-right-8`}
      style={{ minWidth: '300px', maxWidth: '450px' }}>
      
      <div className="shrink-0">{icons[type]}</div>
      
      <p className="flex-1 text-sm font-medium" style={{ fontFamily: 'var(--font-nunito)' }}>
        {message}
      </p>

      <button 
        onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }}
        className="p-1 rounded-full hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 opacity-40 hover:opacity-100" />
      </button>
    </div>
  );
}
