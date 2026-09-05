import { useState, useEffect } from 'react';
import { Save, AlertCircle, ToggleLeft, ToggleRight, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemSettings, updateSettings, wipeAllRegistrations, wipeSampoornaDb } from '../../lib/db';
import type { SystemSettings } from '../../lib/db';

const Settings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    registrationOpen: false,
    startDate: '',
    endDate: ''
  });
  const [saved, setSaved] = useState(false);

  // 2FA Modal State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [twoFAError, setTwoFAError] = useState('');

  useEffect(() => {
    getSystemSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleRegistration = () => {
    setSettings(prev => ({ ...prev, registrationOpen: !prev.registrationOpen }));
  };

  const handleEndKalolsavam = async () => {
    if (twoFAPassword === 'admin@kalolsavam@close') {
      await wipeAllRegistrations();
      await wipeSampoornaDb();
      setShow2FAModal(false);
      setTwoFAPassword('');
      alert('SUCCESS: The 2026 Kalolsavam has been officially closed and data has been wiped.');
    } else {
      setTwoFAError('Incorrect 2FA authorization password.');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">System Settings</h1>
        <p className="text-text-muted mt-1">Configure global platform behavior</p>
      </div>

      <div className="cin-card border-none/95 md:bg-transparent md:border-none md:shadow-none md:admin-glass-panel p-4 md:p-8 rounded-2xl md:rounded-[30px] shadow-sm border border-white/10 space-y-8">
        
        {/* Registration Toggle */}
        <div className="flex items-center justify-between p-6 bg-transparent border border-slate-100 rounded-xl">
          <div>
            <h3 className="font-bold text-brand-primary text-lg flex items-center gap-2">
              Registration Status
              <span className={`px-2 py-0.5 rounded-full text-xs ${settings.registrationOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {settings.registrationOpen ? 'Open' : 'Closed'}
              </span>
            </h3>
            <p className="text-white/50 text-sm mt-1">
              Enable or disable the public registration form completely.
            </p>
          </div>
          <button onClick={toggleRegistration} className="text-brand-primary transition-transform hover:scale-110">
            {settings.registrationOpen ? (
              <ToggleRight size={48} className="text-brand-accent" />
            ) : (
              <ToggleLeft size={48} className="text-slate-300" />
            )}
          </button>
        </div>

        {/* Date Config */}
        <div className="space-y-4">
          <h3 className="font-bold text-brand-primary text-lg border-b border-slate-100 pb-2">Registration Window</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Start Date</label>
              <input 
                type="date" 
                value={settings.startDate}
                onChange={e => setSettings({...settings, startDate: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">End Date</label>
              <input 
                type="date" 
                value={settings.endDate}
                onChange={e => setSettings({...settings, endDate: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 mt-2 text-sm text-white/50">
            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p>Note: Currently, dates are for display purposes. The toggle above is the master switch for the form.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          {saved ? (
            <span className="text-green-600 font-medium">Settings saved successfully!</span>
          ) : (
            <span />
          )}
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-brand-accent text-white rounded-xl font-bold shadow-md shadow-brand-accent/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
          >
            <Save size={18} /> Save Settings
          </button>
        </div>

      </div>

      <div className="bg-red-50 p-8 rounded-2xl border border-red-200 space-y-6 mt-8">
        <div>
          <h3 className="font-bold text-red-700 text-xl flex items-center gap-2">
            <AlertCircle size={24} /> Danger Zone
          </h3>
          <p className="text-red-600/80 mt-1">
            Destructive actions. Use these when the 2026 Kalolsavam ends to prepare for the next year.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <button 
            onClick={() => {
              if (window.confirm('WARNING: Are you sure you want to delete ALL Kalolsavam registrations? This cannot be undone.')) {
                wipeAllRegistrations();
                alert('All Kalolsavam registrations have been wiped.');
              }
            }}
            className="px-6 py-3 cin-card border-none text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors text-sm flex-1"
          >
            Wipe All Registrations
          </button>

          <button 
            onClick={() => {
              if (window.confirm('WARNING: Are you sure you want to delete the imported Sampoorna Database? This cannot be undone.')) {
                wipeSampoornaDb();
                alert('Sampoorna Database has been wiped.');
              }
            }}
            className="px-6 py-3 cin-card border-none text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors text-sm flex-1"
          >
            Wipe Sampoorna Database
          </button>

          <button 
            onClick={() => {
              setTwoFAPassword('');
              setTwoFAError('');
              setShow2FAModal(true);
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg hover:bg-red-700 hover:scale-[1.02] transition-all text-sm w-full mt-2 md:mt-0"
          >
            END 2026 KALOLSAVAM
          </button>
        </div>
      </div>

      {/* 2FA Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShow2FAModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative cin-card border-none/95 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100"
            >
              <button 
                onClick={() => setShow2FAModal(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Lock size={32} />
              </div>

              <h2 className="text-2xl font-black text-center text-white mb-2">2FA Authorization</h2>
              <p className="text-center text-white/50 mb-8 text-sm">
                Enter the master password to completely close the 2026 Kalolsavam and wipe all databases.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Master Password</label>
                  <input 
                    type="password" 
                    value={twoFAPassword}
                    onChange={(e) => {
                      setTwoFAPassword(e.target.value);
                      setTwoFAError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEndKalolsavam()}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono tracking-widest text-lg"
                    placeholder="••••••••••••••••"
                    autoFocus
                  />
                  {twoFAError && (
                    <p className="text-red-500 text-sm font-medium mt-2 flex items-center gap-1">
                      <AlertCircle size={14} /> {twoFAError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShow2FAModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 text-white/60 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEndKalolsavam}
                    disabled={!twoFAPassword}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20"
                  >
                    Verify & Wipe
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Settings;

