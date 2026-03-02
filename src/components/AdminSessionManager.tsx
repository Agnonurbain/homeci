import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminSessionManagerProps {
  timeoutMinutes: number;
  onTimeout: () => void;
  children: React.ReactNode;
}

export default function AdminSessionManager({
  timeoutMinutes,
  onTimeout,
  children
}: AdminSessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    const warningTime = (timeoutMinutes - 1) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(60);
    }, warningTime);

    const timeoutTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(async () => {
      await signOut(auth);
      onTimeout();
    }, timeoutTime);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [timeoutMinutes]);

  useEffect(() => {
    if (showWarning) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showWarning]);

  const handleExtendSession = () => {
    resetTimer();
  };

  return (
    <>
      {showWarning && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Session sur le point d'expirer
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Votre session expirera dans <strong>{timeRemaining} secondes</strong> en raison d'inactivité.
                </p>
                <button
                  onClick={handleExtendSession}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                >
                  Prolonger la session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
