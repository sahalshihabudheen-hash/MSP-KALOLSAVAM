import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AlertCircle, ArrowLeft, Loader2, CheckCircle2, LogIn } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithAdmissionNumber, subscribeToAuthChanges } from '../lib/auth';

/* ─── Cinematic grain overlay ─────────────────────────────────────── */
const grainStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 10,
  opacity: 0.035,
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundSize: '128px 128px',
};

const StudentAuth = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) navigate('/register');
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!admissionNumber.trim()) { setError('Please enter your Admission Number.'); return; }
    setError('');
    setIsLoading(true);
    try {
      await loginWithAdmissionNumber(admissionNumber.trim());
      setSuccess('Verified! Redirecting...');
      setTimeout(() => navigate('/register'), 800);
    } catch (err: any) {
      setError(err.message || 'Could not verify. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Cinematic film grain — PC only */}
      <div className="hidden md:block" style={grainStyle} />

      {/* ═══════════════════════════════════════════════
          MOBILE LAYOUT — simple, clean, centred card
      ═══════════════════════════════════════════════ */}
      <div className="md:hidden min-h-screen flex items-start justify-center px-4 pt-24 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium transition-colors text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="bg-white border border-slate-200 p-7 rounded-3xl shadow-xl shadow-slate-200/60">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#0f172a]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-[#0f172a]" />
              </div>
              <h1 className="text-xl font-black text-slate-800 mb-1">Student Login</h1>
              <p className="text-slate-400 text-xs">Enter your admission number to continue</p>
            </div>
            <MobileForm admissionNumber={admissionNumber} setAdmissionNumber={setAdmissionNumber}
              error={error} setError={setError} success={success} isLoading={isLoading} handleLogin={handleLogin} />
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════
          PC LAYOUT — cinematic split screen
      ═══════════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen w-full overflow-hidden">

        {/* ── LEFT: Cinematic panel ──────────────────── */}
        <div className="relative flex-1 flex flex-col justify-between p-14 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0a0f1e 0%, #0d1b3e 35%, #0f2847 65%, #0a1628 100%)' }}>

          {/* Animated colour orbs */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '-10%', right: '-15%',
              width: '65%', height: '60%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14,165,233,0.28) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            style={{
              position: 'absolute', bottom: '5%', left: '-10%',
              width: '55%', height: '50%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
            style={{
              position: 'absolute', top: '40%', left: '30%',
              width: '40%', height: '40%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Horizontal scan-line atmospheric effect */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
          }} />

          {/* Diagonal light streak */}
          <div style={{
            position: 'absolute', top: 0, right: '20%', width: '1px', height: '100%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(14,165,233,0.4) 30%, rgba(99,102,241,0.3) 60%, transparent 100%)',
            transform: 'rotate(12deg)', transformOrigin: 'top center',
          }} />

          {/* Floating festival art — top right */}
          <motion.img
            src="/assets/color_mudra.png"
            alt=""
            animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', right: '-5%', top: '8%',
              width: '260px', opacity: 0.18, mixBlendMode: 'screen',
              filter: 'saturate(2) hue-rotate(200deg)',
              pointerEvents: 'none',
            }}
          />
          <motion.img
            src="/assets/pookalam_t.png"
            alt=""
            animate={{ y: [0, 14, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            style={{
              position: 'absolute', left: '-8%', bottom: '5%',
              width: '220px', opacity: 0.12, mixBlendMode: 'screen',
              filter: 'saturate(2) hue-rotate(180deg)',
              pointerEvents: 'none',
            }}
          />

          {/* Top: Back link */}
          <div className="relative z-10">
            <Link to="/"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/90 transition-colors text-sm font-medium tracking-wide">
              <ArrowLeft size={15} />
              Back to Home
            </Link>
          </div>

          {/* Centre: Main cinematic text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex-1 flex flex-col justify-center"
          >
            {/* School logo + name */}
            <div className="flex items-center gap-3 mb-10">
              <img src="/assets/msp-logo-transparent-v2.png" alt="MSP HSS"
                className="w-10 h-10 object-contain opacity-90" />
              <div>
                <p className="text-white/90 font-black text-sm tracking-[0.2em] uppercase">MSP HSS</p>
                <p className="text-white/40 text-xs tracking-[0.15em] uppercase">Kalolsavam</p>
              </div>
            </div>

            {/* Hero title */}
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: 'white',
              textShadow: '0 0 80px rgba(14,165,233,0.4), 0 2px 40px rgba(0,0,0,0.6)',
            }}>
              Kerala's<br />
              <span style={{
                backgroundImage: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Grand Stage
              </span>
            </h1>

            <p className="text-white/40 text-base mt-5 font-medium max-w-xs leading-relaxed tracking-wide">
              The premier platform for Kalolsavam participant registration and management.
            </p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex gap-8 mt-12"
            >
              {[['Arts', 'Festival'], ['Students', 'Registered'], ['Items', 'Available']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-white/80 font-black text-xl">{val}</p>
                  <p className="text-white/30 text-xs tracking-widest uppercase mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom: Version stamp */}
          <div className="relative z-10">
            <p className="text-white/20 text-xs tracking-[0.25em] uppercase font-medium">
              2025–26 Academic Year
            </p>
          </div>
        </div>

        {/* ── RIGHT: Form panel ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-[480px] flex-shrink-0 flex flex-col justify-center px-14 py-16 relative"
          style={{ background: '#f8fafc', borderLeft: '1px solid rgba(15,23,42,0.07)' }}
        >
          {/* Faint brand watermark */}
          <div style={{
            position: 'absolute', bottom: '5%', right: '5%',
            opacity: 0.03, pointerEvents: 'none',
            fontSize: '120px', fontWeight: 900, lineHeight: 1,
            color: '#0f172a', userSelect: 'none',
          }}>K</div>

          {/* Form header */}
          <div className="mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}
            >
              <User size={22} className="text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Student Portal
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter your school admission number to access the Kalolsavam registration system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium border border-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Admission Number
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" size={17} />
                <input
                  type="text"
                  id="admissionNumber"
                  placeholder="e.g. 24001"
                  value={admissionNumber}
                  onChange={(e) => { setAdmissionNumber(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                  className="w-full bg-white border-2 border-slate-200 text-slate-800 pl-11 pr-4 py-4 rounded-2xl outline-none focus:bg-white focus:border-slate-900 transition-all font-semibold text-sm shadow-sm"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !admissionNumber.trim()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 disabled:pointer-events-none shadow-lg transition-shadow hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0ea5e9 100%)',
                boxShadow: '0 8px 32px -8px rgba(15,23,42,0.5)',
              }}
            >
              {isLoading
                ? <><Loader2 className="animate-spin" size={18} /> Verifying...</>
                : <><LogIn size={18} /> Continue to Registration</>}
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-300 mt-8 leading-relaxed">
            Your data is verified against the official<br />MSP HSS Sampoorna database.
          </p>
        </motion.div>
      </div>
    </>
  );
};

/* ─── Shared mobile form sub-component ────────────────────────────── */
function MobileForm({ admissionNumber, setAdmissionNumber, error, setError, success, isLoading, handleLogin }: any) {
  return (
    <form onSubmit={handleLogin} className="space-y-3">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 text-red-600 p-3.5 rounded-2xl flex items-start gap-3 text-sm font-medium border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p>{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div key="ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 text-green-700 p-3.5 rounded-2xl flex items-start gap-3 text-sm font-medium border border-green-100">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><p>{success}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative group">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={17} />
        <input type="text" placeholder="Enter your Admission Number"
          value={admissionNumber}
          onChange={(e) => { setAdmissionNumber(e.target.value); setError(''); }}
          onKeyDown={(e: any) => e.key === 'Enter' && handleLogin()}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/8 transition-all font-medium text-sm"
        />
      </div>
      <button type="submit" disabled={isLoading || !admissionNumber.trim()}
        className="w-full bg-[#0f172a] text-white font-bold py-3.5 rounded-2xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm">
        {isLoading ? <><Loader2 className="animate-spin" size={17} /> Verifying...</> : <><LogIn size={17} /> Continue</>}
      </button>
      <p className="text-center text-xs text-slate-400 pt-2 leading-relaxed">
        Verified against the MSP HSS Sampoorna database
      </p>
    </form>
  );
}

export default StudentAuth;
