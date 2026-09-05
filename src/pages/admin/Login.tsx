import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));

    // Unified Admin Auth Logic
    const isValidAdmin = username === 'admin' && password === 'admin123';

    if (isValidAdmin) {
      // Navigate to dashboard via prop
      onLogin();
    } else {
      setError('Invalid username or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="cin-card border-none/95 p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 max-w-md w-full border border-slate-100"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-brand-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Lock className="text-brand-accent w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl font-bold text-brand-primary mb-2">Admin Portal</h1>
          <p className="text-text-muted">Enter your credentials to manage the Kalolsavam platform.</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-brand-primary font-medium"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all text-brand-primary font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full py-4 bg-brand-accent text-white rounded-xl font-bold shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 mt-8 disabled:opacity-80"
          >
            {isLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Loader2 size={20} />
              </motion.div>
            ) : (
              "Secure Login"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

