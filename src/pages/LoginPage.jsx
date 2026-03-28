import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Mail, Lock, ArrowRight, ShieldCheck, User, AlertCircle, Loader2 } from 'lucide-react';
import { GlassContainer } from '../components/UI/UIComponents';
import { login, register } from '../lib/api';

const LoginPage = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // login, signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let userData;
      if (mode === 'login') {
        userData = await login(email.trim().toLowerCase(), password);
      } else {
        userData = await register(name.trim(), email.trim().toLowerCase(), password);
      }

      // Success
      onLoginSuccess(userData);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg px-6"
    >
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center shadow-medical border border-[#F1E9DB] mx-auto mb-6"
        >
          <Fingerprint className="text-teal-700 w-12 h-12" />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? 'Provider Access' : 'Register Provider'}
        </h2>
        <p className="text-slate-500 font-medium mt-2">
          {mode === 'login' ? 'Secure portal for NeuroDect Clinical' : 'Join the neurological monitoring network'}
        </p>
      </div>

      <GlassContainer className="p-10 border-[#F1E9DB] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div 
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Julian Bashir"
                      className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] border border-[#F1E9DB] rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-slate-900 font-bold"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.bashir@starfleet.med"
                className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] border border-[#F1E9DB] rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] border border-[#F1E9DB] rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all text-slate-900 font-bold"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-teal-700 text-white rounded-2xl font-black shadow-xl shadow-teal-200/50 hover:bg-teal-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-6 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Authenticate' : 'Create Account'}
                <ArrowRight size={22} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#F1E9DB] text-center">
          <p className="text-slate-500 font-medium mb-4">
            {mode === 'login' ? "Don't have a provider account?" : "Already have an account?"}
          </p>
          <button 
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="px-8 py-3 bg-white text-teal-700 border border-teal-100 rounded-xl font-bold shadow-sm hover:bg-teal-50 transition-all active:scale-95"
          >
            {mode === 'login' ? 'Create New Account' : 'Back to Login'}
          </button>
        </div>
      </GlassContainer>
      
      <div className="mt-10 flex items-center justify-center gap-6 opacity-40">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-teal-700" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Encrypted</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Authorized Personnel Only</span>
      </div>
    </motion.div>
  );
};

export default LoginPage;
