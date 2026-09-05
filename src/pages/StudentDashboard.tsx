import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Lock, Users, User } from 'lucide-react';
import { getEvents, getSystemSettings, getRegistrations, updateRegistration, deleteRegistration, getSampoornaStudentByAdmission } from '../lib/db';
import type { KalolsavamEvent, RegistrationEntry } from '../lib/db';
import { subscribeToAuthChanges, logoutStudent } from '../lib/auth';
import type { StudentProfile } from '../lib/auth';

const getCategoryFromClass = (classNum: string) => {
  const num = parseInt(classNum);
  if (!num) return '';
  if (num >= 1 && num <= 4) return 'LP';
  if (num >= 5 && num <= 7) return 'UP';
  if (num >= 8 && num <= 10) return 'HS';
  if (num >= 11 && num <= 12) return 'HSS';
  return '';
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  // Auth State
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [itemNames, setItemNames] = useState<string[]>([]);
  
  const [availableEvents, setAvailableEvents] = useState<KalolsavamEvent[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [existingReg, setExistingReg] = useState<RegistrationEntry | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');

  // 1. Check Auth & Load Settings
  useEffect(() => {
    getSystemSettings().then(settings => {
      setIsRegistrationClosed(!settings.registrationOpen);
      setIsSettingsLoading(false);
    });

    const unsubscribe = subscribeToAuthChanges((user, profile) => {
      if (!user || !profile) {
        navigate('/student-auth'); // Redirect to login if not authenticated
      } else {
        setStudentProfile(profile);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 2. Automatically load student details when profile is available
  useEffect(() => {
    if (!studentProfile) return;

    const loadStudentData = async () => {
      setErrorMsg('');
      
      try {
        const student = await getSampoornaStudentByAdmission(studentProfile.admissionNumber);
        if (student) {
          setStudentDetails(student);
          
          // Check if already registered
          const allRegs = await getRegistrations();
          const reg = allRegs.find(r => r.admissionNumber?.toString() === studentProfile.admissionNumber);
          if (reg) {
            setRegistrationId(reg.id);
            setExistingReg(reg);
            setItemNames(reg.itemNames || []);
          } else {
            // User hasn't registered yet, redirect to Registration Portal
            navigate('/register');
          }
        } else {
          setErrorMsg('Critical Error: Your admission number was not found in the school database. Please contact admin.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Error loading your details.');
      }
    };

    loadStudentData();
  }, [studentProfile, isRegistrationClosed]);

  // Auto-calculated fields
  const category = studentDetails ? getCategoryFromClass(studentDetails.classGrade) : '';
  const selectedEventInfos = availableEvents.filter(e => itemNames.includes(e.itemName));
  const itemCodes = selectedEventInfos.map(e => e.itemCode);

  useEffect(() => {
    // When category changes, load events for that category and reset item
    if (category) {
      getEvents().then(allEvents => {
        const categoryEvents = allEvents.filter(e => e.category === category);
        
        // Remove any duplicate items by itemName to ensure UI is perfectly clean
        const uniqueEvents = Array.from(new Map(
          categoryEvents.map(e => [e.itemName, e])
        ).values());
        
        setAvailableEvents(uniqueEvents);
      });
    } else {
      setAvailableEvents([]);
    }
  }, [category]);

  // Removed manual handleLookupStudent as it is now automated

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentDetails || itemNames.length === 0) {
      setErrorMsg('Please select at least one item.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Validation: Check if student already registered for any of these items (exclude current if editing)
      const allRegs = await getRegistrations();
      const existingRegs = allRegs.filter(
        r => r.admissionNumber?.toString() === studentDetails.admissionNumber?.toString() && r.id !== registrationId
      );

      let duplicateItems: string[] = [];
      existingRegs.forEach(reg => {
        itemNames.forEach(item => {
          if (reg.itemNames.includes(item)) {
            duplicateItems.push(item);
          }
        });
      });

      if (duplicateItems.length > 0) {
        setErrorMsg(`You have already registered for: ${duplicateItems.join(', ')}. A student cannot register for the same item multiple times.`);
        setIsSubmitting(false);
        return;
      }
      
      if (registrationId) {
        await updateRegistration(registrationId, {
          itemNames: itemNames,
          itemCodes: itemCodes
        });
      }
      
      setSubmitStatus('success');
    } catch (err: any) {
      console.error(err);
      setSubmitStatus('error');
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };



  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 bg-transparent flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/95 backdrop-blur-sm md:liquid-glass-panel p-6 md:p-10 rounded-2xl md:rounded-[40px] shadow-2xl max-w-md w-full text-center border border-slate-100"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-brand-primary mb-4">
            Dashboard Updated!
          </h2>
          <p className="text-text-muted mb-8">
            Your items have been successfully updated. We look forward to your performance!
          </p>
          <Link to="/" className="inline-block px-8 py-3 bg-brand-primary text-white rounded-full font-bold shadow-md">
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-20 px-4 relative overflow-hidden">
      {/* Background Doodles */}
      <motion.img 
        src="/assets/doodle_sitar.png" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15, y: [0, 15, 0] }}
        transition={{ 
          opacity: { duration: 2, ease: "easeOut" },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        className="fixed -top-20 -right-20 w-[500px] mix-blend-multiply pointer-events-none rotate-12 z-0" 
        alt="" 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-brand-primary mb-2">Student Dashboard</h1>
            <p className="text-text-muted">Manage your registered Kalolsavam items.</p>
          </div>
          <button
            onClick={() => { logoutStudent(); navigate('/student-auth'); }}
            className="text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
          >
            ← Logout
          </button>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md flex items-start gap-3 max-w-2xl mx-auto"
            >
              <AlertCircle size={20} className="text-red-500 mt-0.5" />
              <p className="text-red-700 font-medium">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {isSettingsLoading || isAuthLoading ? (
          <div className="bg-white/95 backdrop-blur-sm md:liquid-glass-panel rounded-2xl md:rounded-[40px] shadow-2xl p-6 md:p-10 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium">Authenticating & Loading Dashboard...</p>
          </div>
        ) : isRegistrationClosed && !studentDetails ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white md:bg-white/40 md:backdrop-blur-xl border border-red-100 md:border-white/50 rounded-2xl md:rounded-[40px] shadow-[0_20px_50px_-12px_rgba(239,68,68,0.1)] p-6 md:p-12 max-w-2xl mx-auto text-center"
          >
            {/* Background glowing effects */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-red-400/10 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-orange-400/10 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 border border-red-200/50 rounded-full flex items-center justify-center mb-6 shadow-inner"
              >
                <Lock size={48} className="text-red-500 drop-shadow-sm" />
              </motion.div>
              
              <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">
                Portal Locked
              </h2>
              
              <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed font-medium">
                The deadline for Kalolsavam registration has officially ended. We are no longer accepting new entries.
              </p>

              <div className="mt-10 px-6 py-3 bg-red-50/80 rounded-full border border-red-100/50 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-xs font-bold text-red-700 tracking-widest uppercase">Submissions Closed</span>
              </div>
            </div>
          </motion.div>
        ) : !studentDetails ? (
          <div className="bg-white/95 backdrop-blur-sm md:liquid-glass-panel rounded-2xl md:rounded-[40px] shadow-2xl p-6 md:p-10 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[200px]">
             <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 font-medium">Loading your profile from the school database...</p>
          </div>
        ) : null}
          {studentDetails && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-8 bg-white md:bg-white/95 md:backdrop-blur-xl border border-white/50 p-6 md:p-10 rounded-[2rem] shadow-xl md:liquid-glass-premium"
            >
                <div className="bg-green-50 border border-green-200 p-5 rounded-2xl mb-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="text-green-700" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-green-800 text-lg">{studentDetails.fullName}</h3>
                      {existingReg?.registrationType === 'group' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                          <Users size={11} /> Group: {existingReg.groupName || 'Unnamed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          <User size={11} /> Individual
                        </span>
                      )}
                    </div>
                    <p className="text-green-700 font-medium">Class {studentDetails.classGrade} - Division {studentDetails.division}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full">
                      Category: {category}
                    </span>
                    {existingReg?.registrationType === 'group' && existingReg.groupMembers && existingReg.groupMembers.length > 0 && (
                      <div className="mt-3">
                        <p className="text-green-700 text-xs font-bold mb-1">Group Members:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {existingReg.groupMembers.map(m => (
                            <span key={m.admissionNumber} className="text-xs bg-white border border-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                              {m.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* --- SEPARATE STUDENT DASHBOARD UI --- */}
                    <div className="space-y-8 animate-in fade-in duration-500">
                      {isRegistrationClosed && (
                        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4 shadow-sm">
                          <AlertCircle size={24} className="text-amber-600 mt-1 shrink-0" />
                          <div>
                            <h4 className="font-bold text-amber-900 text-lg">Registration Closed</h4>
                            <p className="text-amber-800 mt-1 font-medium">The deadline has passed. You can view your registered items, but you can no longer add, remove, or withdraw items.</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-inner">
                        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm">✓</span>
                          Your Registered Items
                        </h3>
                        
                        {itemNames.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 font-medium text-lg">You currently have no items registered.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {itemNames.map(name => {
                              const ev = availableEvents.find(e => e.itemName === name);
                              return (
                                <div key={name} className="bg-white/95 p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start group hover:border-brand-primary/30 transition-all">
                                  <div>
                                    <span className="text-xs font-mono font-bold text-brand-accent bg-brand-accent/10 px-3 py-1 rounded-full">{ev?.itemCode || 'SAVED'}</span>
                                    <h4 className="font-bold text-slate-800 mt-3 text-lg leading-tight">{name}</h4>
                                  </div>
                                  {!isRegistrationClosed && (
                                    <button 
                                      type="button"
                                      onClick={() => setItemNames(itemNames.filter(n => n !== name))}
                                      className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-70 group-hover:opacity-100"
                                      title="Remove Item"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {!isRegistrationClosed && (
                        <div className="bg-white/95 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                          <h3 className="text-xl font-bold text-brand-primary mb-6 border-b border-slate-100 pb-3">Add More Items</h3>
                          <div className="flex flex-col w-full rounded-2xl border border-slate-300 overflow-hidden shadow-inner bg-slate-50">
                            <div className="p-3 border-b border-slate-200 bg-white">
                              <input 
                                type="text" 
                                placeholder="Search available items to add..." 
                                value={itemSearchQuery}
                                onChange={e => setItemSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-accent/50 transition-all font-medium"
                              />
                            </div>
                            <div className="max-h-56 overflow-y-auto px-2 py-2 space-y-1">
                              {availableEvents.filter(e => !itemNames.includes(e.itemName) && e.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase())).length === 0 ? (
                                <p className="text-sm text-slate-500 p-6 text-center font-medium">No additional items available to add right now.</p>
                              ) : (
                                availableEvents
                                  .filter(e => !itemNames.includes(e.itemName) && e.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                                  .map(e => (
                                    <label key={e.id} className="flex items-center gap-4 cursor-pointer p-4 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all shadow-sm">
                                      <input 
                                        type="checkbox"
                                        checked={false}
                                        onChange={(ev) => {
                                          if (ev.target.checked) setItemNames([...itemNames, e.itemName]);
                                        }}
                                        className="w-5 h-5 text-brand-primary rounded border-slate-300 focus:ring-brand-accent"
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-slate-800 font-bold text-base">{e.itemName}</span>
                                        <span className="text-slate-400 font-mono text-xs mt-0.5">{e.itemCode}</span>
                                      </div>
                                    </label>
                                  ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {!isRegistrationClosed && (
                        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
                          <button 
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => {
                              if (window.confirm('WARNING: Are you sure you want to completely withdraw your registration? This will permanently remove all your items.')) {
                                if (registrationId) {
                                  deleteRegistration(registrationId);
                                  setStudentDetails(null);
                                  alert('Your registration has been successfully withdrawn.');
                                }
                              }
                            }}
                            className="px-6 py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors w-full md:w-auto text-center"
                          >
                            Withdraw Registration
                          </button>

                          <button 
                            type="submit"
                            disabled={isSubmitting || itemNames.length === 0}
                            className="px-10 py-4 bg-brand-primary text-white rounded-full font-black text-lg shadow-xl shadow-brand-primary/30 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:scale-100 w-full md:w-auto"
                          >
                            {isSubmitting ? 'Saving...' : 'Save Dashboard Changes'}
                          </button>
                        </div>
                      )}
                    </div>
                </form>
              </motion.div>
            )}
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
