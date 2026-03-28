import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sprout, Mail, Lock, User as UserIcon, Phone, Globe, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Tractor, Harvester, Farmer } from './FarmingAssets';

interface LoginHeroProps {
  authMode: 'login' | 'signup' | 'forgot';
  setAuthMode: (mode: 'login' | 'signup' | 'forgot') => void;
  formData: any;
  setFormData: (data: any) => void;
  handleAuth: (e: React.FormEvent) => void;
  error: string | null;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  strength: number;
  handleGoogleLogin: () => void;
  authConfigStatus: {
    emailEnabled: boolean;
    domainAuthorized: boolean;
  };
}

export default function LoginHero({
  authMode,
  setAuthMode,
  formData,
  setFormData,
  handleAuth,
  error,
  loading,
  showPassword,
  setShowPassword,
  strength,
  handleGoogleLogin,
  authConfigStatus
}: LoginHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setAnimationComplete(true);
      return;
    }
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2500); // Duration for machines to reach center
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const machineLeftVariants = {
    hidden: { x: '-100vw', opacity: 0 },
    visible: { 
      x: '0vw', 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 40, 
        damping: 15,
        duration: 2.5 
      } 
    }
  };

  const machineRightVariants = {
    hidden: { x: '100vw', opacity: 0 },
    visible: { 
      x: '0vw', 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 40, 
        damping: 15,
        duration: 2.5 
      } 
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 20 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 12,
        delay: 0.2
      } 
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 overflow-hidden relative flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-stone-100 border-t border-stone-200" />
        
        {/* Animated Machines */}
        {!shouldReduceMotion && (
          <>
            <motion.div 
              variants={machineLeftVariants}
              initial="hidden"
              animate="visible"
              className="absolute bottom-[10%] left-[10%] z-10 text-emerald-600/20"
            >
              <Tractor className="w-48 h-auto" />
            </motion.div>
            
            <motion.div 
              variants={machineRightVariants}
              initial="hidden"
              animate="visible"
              className="absolute bottom-[10%] right-[10%] z-10 text-stone-400/20"
            >
              <Harvester className="w-56 h-auto" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-[5%] left-1/2 -translate-x-1/2 z-10 text-stone-600/30"
            >
              <Farmer className="w-24 h-auto" />
            </motion.div>
          </>
        )}

        {/* Fallback Static Illustration if reduced motion or animation fails */}
        {(shouldReduceMotion || animationComplete) && (
          <div className="absolute bottom-[10%] left-0 right-0 flex justify-around items-end px-20 opacity-10 pointer-events-none">
            <Tractor className="w-32 h-auto text-emerald-600" />
            <Farmer className="w-16 h-auto text-stone-600" />
            <Harvester className="w-40 h-auto text-stone-400" />
          </div>
        )}
      </div>

      {/* Login Card */}
      <AnimatePresence>
        {animationComplete && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative z-20 max-w-md w-full bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-white/50"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200"
              >
                <Sprout className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-black text-stone-900 tracking-tight">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Join AgriFarm' : 'Reset Password'}
              </h1>
              <p className="text-stone-500 text-sm mt-2 font-medium">
                {authMode === 'login' ? 'Sign in to manage your digital farm' : authMode === 'signup' ? 'Start your agricultural journey today' : 'Enter your details to recover your account'}
              </p>
            </div>

            {/* Auth Configuration Banners */}
            <AnimatePresence>
              {(!authConfigStatus.emailEnabled || !authConfigStatus.domainAuthorized) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Configuration Required
                    </div>
                    
                    {!authConfigStatus.emailEnabled && (
                      <p className="text-[11px] text-amber-600 leading-relaxed">
                        <strong>Email Provider Disabled:</strong> Please enable "Email/Password" in your Firebase Console under Authentication &gt; Sign-in method.
                      </p>
                    )}
                    
                    {!authConfigStatus.domainAuthorized && (
                      <p className="text-[11px] text-amber-600 leading-relaxed">
                        <strong>Domain Unauthorized:</strong> Add <code>{window.location.hostname}</code> to "Authorized domains" in Firebase Console &gt; Authentication &gt; Settings.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full bg-stone-50/50 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-stone-50/50 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {(authMode === 'signup' || authMode === 'forgot') && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-stone-50/50 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider ml-1">Country</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full bg-stone-50/50 border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="KE">Kenya</option>
                      <option value="BR">Brazil</option>
                      <option value="IN">India</option>
                    </select>
                  </div>
                </div>
              )}

              {authMode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Password</label>
                    {authMode === 'login' && (
                      <button type="button" onClick={() => setAuthMode('forgot')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-tighter">Forgot Password?</button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-stone-50/50 border-stone-100 rounded-2xl py-4 pl-12 pr-12 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {authMode === 'signup' && formData.password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1.5 h-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= strength ? (strength <= 2 ? 'bg-red-400' : strength <= 4 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-stone-100'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-stone-400 font-medium">Security: Min 10 chars, upper, lower, number, symbol</p>
                    </div>
                  )}
                </div>
              )}

              {authMode === 'login' && (
                <div className="flex items-center gap-3 ml-1">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                      className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
                    />
                    <div className="w-5 h-5 border-2 border-stone-200 rounded-lg peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <label htmlFor="rememberMe" className="text-xs font-black text-stone-500 uppercase tracking-wide cursor-pointer select-none">
                    Remember Me
                  </label>
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest active:scale-95"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Send Reset Code'}
              </button>

              {authMode === 'login' && (
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-stone-400">
                    <span className="bg-white px-4">Or continue with</span>
                  </div>
                </div>
              )}

              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white border-2 border-stone-100 hover:border-emerald-100 text-stone-600 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider active:scale-95 disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
              )}
            </form>

            <div className="mt-10 text-center space-y-4">
              <p className="text-sm text-stone-400 font-medium">
                {authMode === 'login' ? "New to AgriFarm?" : "Already have an account?"}
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="ml-2 text-emerald-600 font-black hover:text-emerald-700 transition-colors uppercase text-xs tracking-tighter"
                >
                  {authMode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </p>

              {/* Auth Status Toggle */}
              <button 
                onClick={() => setShowStatus(!showStatus)}
                className="text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-stone-400 transition-colors"
              >
                {showStatus ? 'Hide Auth Status' : 'Show Auth Status'}
              </button>

              {showStatus && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-stone-50 rounded-2xl text-left space-y-2 border border-stone-100"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase">Email Provider</span>
                    <span className={`text-[10px] font-black uppercase ${authConfigStatus.emailEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {authConfigStatus.emailEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase">Domain Auth</span>
                    <span className={`text-[10px] font-black uppercase ${authConfigStatus.domainAuthorized ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {authConfigStatus.domainAuthorized ? 'Authorized' : 'Unauthorized'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[9px] font-bold text-stone-400 block mb-1">CURRENT HOST</span>
                    <code className="text-[10px] text-stone-600 bg-white px-2 py-1 rounded border border-stone-100 block truncate">
                      {window.location.hostname}
                    </code>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
