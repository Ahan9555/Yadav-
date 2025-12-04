import React, { useState, useEffect } from 'react';
import { Delete, Fingerprint, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthState } from '../types';

interface LockScreenProps {
  authState: AuthState;
  storedPin: string | null;
  onUnlock: () => void;
  onSetPin: (pin: string) => void;
  onClose: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ 
  authState, 
  storedPin, 
  onUnlock, 
  onSetPin,
  onClose
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>('enter');
  const [tempPin, setTempPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (authState === AuthState.SETUP) {
      setStep('create');
    } else {
      setStep('enter');
    }
    setPin('');
    setError(false);
  }, [authState]);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      // Auto submit on 4th digit
      if (newPin.length === 4) {
        handleSubmit(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleSubmit = (currentPin: string) => {
    setTimeout(() => {
      if (step === 'enter') {
        if (currentPin === storedPin) {
          onUnlock();
        } else {
          setError(true);
          setPin('');
        }
      } else if (step === 'create') {
        setTempPin(currentPin);
        setPin('');
        setStep('confirm');
      } else if (step === 'confirm') {
        if (currentPin === tempPin) {
          onSetPin(currentPin);
        } else {
          setError(true);
          setPin('');
          setStep('create'); // Reset to start
        }
      }
    }, 200);
  };

  const handleBiometric = () => {
    if (step !== 'enter') return;
    
    setIsScanning(true);
    setError(false);

    // Simulate Biometric Delay and Result
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate simulation
      setIsScanning(false);
      
      if (isSuccess) {
        onUnlock();
      } else {
        setError(true);
      }
    }, 1500);
  };

  const getTitle = () => {
    if (step === 'create') return "Set Vault PIN";
    if (step === 'confirm') return "Confirm Vault PIN";
    return "Vault Locked";
  };

  const getSubTitle = () => {
    if (error) return step === 'enter' ? 'Wrong PIN. Try again.' : 'PINs do not match.';
    if (step === 'create') return 'Create a 4-digit PIN for security';
    if (step === 'confirm') return 'Re-enter your PIN to confirm';
    return 'Enter PIN or use Biometrics';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-full max-w-[340px] bg-slate-900/80 border border-slate-700/50 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Background Gradient Effect */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <motion.div 
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
              error ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-blue-500 shadow-inner'
            }`}
          >
            {step === 'enter' ? <Lock size={28} /> : <ShieldCheck size={28} />}
          </motion.div>
          <h2 className="text-xl font-bold text-white tracking-tight">{getTitle()}</h2>
          <p className={`text-sm mt-2 transition-colors duration-300 font-medium ${error ? 'text-red-400' : 'text-slate-400'}`}>
            {getSubTitle()}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < pin.length 
                  ? (error ? 'bg-red-500 scale-110' : 'bg-blue-500 scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]') 
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-16 w-full rounded-2xl bg-slate-800/50 hover:bg-slate-700 hover:scale-[1.02] active:scale-95 text-2xl font-medium text-white transition-all duration-200"
            >
              {num}
            </button>
          ))}
          
          <div className="relative flex items-center justify-center">
             {step === 'enter' && (
               <button 
                onClick={handleBiometric}
                className={`h-16 w-full rounded-2xl flex items-center justify-center transition-all active:scale-95 group overflow-hidden ${isScanning ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-800/50 text-blue-500'}`}
              >
                {isScanning ? (
                  <motion.div 
                     animate={{ opacity: [0.5, 1, 0.5] }}
                     transition={{ repeat: Infinity, duration: 1 }}
                  >
                     <Fingerprint size={32} className="animate-pulse" />
                  </motion.div>
                ) : (
                   <Fingerprint size={28} className="group-hover:scale-110 transition-transform" />
                )}
                
                {/* Scanning line */}
                {isScanning && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                  />
                )}
              </button>
             )}
          </div>
          
          <button
            onClick={() => handleNumClick("0")}
            className="h-16 w-full rounded-2xl bg-slate-800/50 hover:bg-slate-700 hover:scale-[1.02] active:scale-95 text-2xl font-medium text-white transition-all duration-200"
          >
            0
          </button>
          
          <button
            onClick={handleBackspace}
            className="h-16 w-full rounded-2xl hover:bg-slate-800/50 hover:text-white flex items-center justify-center text-slate-400 transition-all active:scale-95"
          >
            <Delete size={24} />
          </button>
        </div>

        <button onClick={onClose} className="w-full py-3 text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors">
          Cancel & Return to Public Gallery
        </button>
      </motion.div>
    </div>
  );
};