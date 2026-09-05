import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Lock, User, Users, X, Loader2, ShieldCheck } from 'lucide-react';
import {
  getEvents, addRegistration, addGroupRegistration,
  getSystemSettings, getRegistrations,
  getSampoornaStudentByAdmission
} from '../lib/db';
import type { KalolsavamEvent, GroupMember } from '../lib/db';
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

type RegType = 'individual' | 'group';

const Registration = () => {
  const navigate = useNavigate();

  // Auth
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);

  // Registration type
  const [regType, setRegType] = useState<RegType>('individual');

  // Individual
  const [itemNames, setItemNames] = useState<string[]>([]);

  // Group
  const [groupName, setGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isVerifyingMember, setIsVerifyingMember] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [groupItemNames, setGroupItemNames] = useState<string[]>([]);

  // Common
  const [availableEvents, setAvailableEvents] = useState<KalolsavamEvent[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Auth & Settings
  useEffect(() => {
    getSystemSettings().then(settings => {
      setIsRegistrationClosed(!settings.registrationOpen);
      setIsSettingsLoading(false);
    });

    const unsubscribe = subscribeToAuthChanges((user, profile) => {
      if (!user || !profile) {
        navigate('/student-auth');
      } else {
        setStudentProfile(profile);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Load student details
  useEffect(() => {
    if (!studentProfile) return;
    const load = async () => {
      setErrorMsg('');
      try {
        const student = await getSampoornaStudentByAdmission(studentProfile.admissionNumber);
        if (student) {
          setStudentDetails(student);
          const allRegs = await getRegistrations();
          const existing = allRegs.find(r => r.admissionNumber?.toString() === studentProfile.admissionNumber);
          setAlreadyRegistered(!!existing);
        } else {
          setErrorMsg('Your admission number was not found in the school database. Please contact admin.');
        }
      } catch {
        setErrorMsg('Error loading your details.');
      }
    };
    load();
  }, [studentProfile]);

  // 3. Load events when category changes
  const category = studentDetails ? getCategoryFromClass(studentDetails.classGrade) : '';
  useEffect(() => {
    if (!category) { setAvailableEvents([]); return; }
    getEvents().then(all => {
      const filtered = all.filter(e => e.category === category);
      const unique = Array.from(new Map(filtered.map(e => [e.itemName, e])).values());
      setAvailableEvents(unique);
    });
  }, [category]);

  // Add group member by admission number
  const handleAddMember = async () => {
    const adm = memberInput.trim();
    if (!adm) return;
    if (adm === studentProfile?.admissionNumber) {
      setMemberError('You are already the group leader. No need to add yourself.');
      return;
    }
    if (members.find(m => m.admissionNumber === adm)) {
      setMemberError('This member is already in the group.');
      return;
    }
    if (members.length >= 9) {
      setMemberError('Maximum 10 members per group (including leader).');
      return;
    }
    setIsVerifyingMember(true);
    setMemberError('');
    try {
      const student = await getSampoornaStudentByAdmission(adm);
      if (!student) {
        setMemberError(`Admission number "${adm}" not found in the school database.`);
        return;
      }
      setMembers(prev => [...prev, {
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        classGrade: student.classGrade,
        division: student.division,
      }]);
      setMemberInput('');
    } catch {
      setMemberError('Could not verify member. Check connection.');
    } finally {
      setIsVerifyingMember(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentDetails) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (regType === 'individual') {
        if (itemNames.length === 0) {
          setErrorMsg('Please select at least one item.');
          setIsSubmitting(false);
          return;
        }
        // Check duplicates
        const allRegs = await getRegistrations();
        const myRegs = allRegs.filter(r => r.admissionNumber?.toString() === studentDetails.admissionNumber?.toString());
        const dupes = itemNames.filter(item => myRegs.some(r => r.itemNames.includes(item)));
        if (dupes.length > 0) {
          setErrorMsg(`Already registered for: ${dupes.join(', ')}.`);
          setIsSubmitting(false);
          return;
        }
        const selectedEvents = availableEvents.filter(e => itemNames.includes(e.itemName));
        const itemCodes = selectedEvents.map(e => e.itemCode);
        await addRegistration({
          admissionNumber: studentDetails.admissionNumber,
          fullName: studentDetails.fullName,
          classGrade: studentDetails.classGrade,
          division: studentDetails.division,
          category,
          itemNames,
          itemCodes,
          registrationType: 'individual',
        });
      } else {
        // Group
        if (!groupName.trim()) {
          setErrorMsg('Please enter a group name.');
          setIsSubmitting(false);
          return;
        }
        if (groupItemNames.length === 0) {
          setErrorMsg('Please select at least one item for the group.');
          setIsSubmitting(false);
          return;
        }
        if (members.length === 0) {
          setErrorMsg('Please add at least one group member besides yourself.');
          setIsSubmitting(false);
          return;
        }
        const selectedEvents = availableEvents.filter(e => groupItemNames.includes(e.itemName));
        const itemCodes = selectedEvents.map(e => e.itemCode);
        const leader = {
          admissionNumber: studentDetails.admissionNumber,
          fullName: studentDetails.fullName,
          classGrade: studentDetails.classGrade,
          division: studentDetails.division,
          category,
        };
        await addGroupRegistration(leader, members, groupItemNames, itemCodes, groupName.trim());
      }
      setSubmitStatus('success');
    } catch (err: any) {
      console.error(err);
      setSubmitStatus('error');
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Success screen ----
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen pt-32 pb-24 px-4 bg-transparent flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="cin-card p-6 md:p-10 max-w-md w-full text-center border-none"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Registration Successful!</h2>
          <p className="text-white/60 mb-8">
            {regType === 'group'
              ? `Group "${groupName}" has been registered for Kalolsavam!`
              : 'You have been registered for the MSP HSS Kalolsavam.'}
          </p>
          <Link to="/dashboard" className="inline-block px-8 py-3 bg-brand-accent text-white rounded-full font-bold shadow-md shadow-brand-accent/20">
            Go to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  // ---- Closed ----
  const showClosed = isRegistrationClosed && !alreadyRegistered;

  return (
    <div className="min-h-screen bg-transparent pt-32 pb-24 px-4 relative overflow-hidden">
      <motion.img
        src="/assets/doodle_sitar.png"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12, y: [0, 15, 0] }}
        transition={{ opacity: { duration: 2 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="fixed -top-20 -right-20 w-[500px] mix-blend-multiply pointer-events-none rotate-12 z-0"
        alt=""
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-brand-primary mb-1">Participant Registration</h1>
            <p className="text-text-muted">Register for the upcoming Kalolsavam items.</p>
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
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-xl flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 font-medium">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {(isSettingsLoading || isAuthLoading) && (
          <div className="cin-card border-none p-10 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 border-4 border-white/10 border-t-brand-accent rounded-full animate-spin mb-4" />
            <p className="text-white/50 font-medium">Loading...</p>
          </div>
        )}

        {/* Closed */}
        {!isSettingsLoading && !isAuthLoading && showClosed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="cin-card border-red-500/30 p-10 max-w-2xl mx-auto text-center"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-red-400 mb-4">Registration Closed</h2>
            <p className="text-white/60">The deadline for Kalolsavam registration has ended. No new entries are accepted.</p>
          </motion.div>
        )}

        {/* Already registered */}
        {!isSettingsLoading && !isAuthLoading && alreadyRegistered && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="cin-card border-brand-accent/30 p-10 max-w-2xl mx-auto text-center"
          >
            <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-brand-accent" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Already Registered!</h3>
            <p className="text-white/60 mb-8">You have already completed your registration. Visit your dashboard to manage items.</p>
            <Link to="/dashboard" className="inline-block px-8 py-4 bg-brand-accent text-white font-bold rounded-full shadow-lg shadow-brand-accent/20 hover:scale-105 transition-transform">
              Go to My Dashboard
            </Link>
          </motion.div>
        )}

        {/* Main form */}
        {!isSettingsLoading && !isAuthLoading && !showClosed && !alreadyRegistered && studentDetails && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Student info card */}
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                <Check className="text-green-400" size={20} />
              </div>
              <div>
                <p className="font-bold text-green-400">{studentDetails.fullName}</p>
                <p className="text-green-300/80 text-sm">Class {studentDetails.classGrade} – Division {studentDetails.division} &nbsp;·&nbsp;
                  <span className="font-bold text-white/90">{category}</span>
                </p>
              </div>
            </div>

            {/* Type selector tabs */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl w-fit">
              <button
                onClick={() => setRegType('individual')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${regType === 'individual'
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                  : 'text-white/50 hover:text-white/80'}`}
              >
                <User size={16} /> Individual
              </button>
              <button
                onClick={() => setRegType('group')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${regType === 'group'
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20'
                  : 'text-white/50 hover:text-white/80'}`}
              >
                <Users size={16} /> Group
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* ---------- INDIVIDUAL ---------- */}
                {regType === 'individual' && (
                  <motion.div key="individual"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                    className="cin-card border-none p-6 md:p-8 space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Select Items</label>
                      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-sm bg-white/5">
                        <div className="p-3 border-b border-white/10">
                          <input
                            type="text"
                            placeholder="Search items..."
                            value={itemSearchQuery}
                            onChange={e => setItemSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-transparent border border-transparent rounded-xl focus:outline-none text-white placeholder-white/30 focus:bg-white/5 focus:ring-2 focus:ring-brand-accent/50 font-medium transition-all"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto px-2 py-2 space-y-1">
                          {availableEvents.length === 0 ? (
                            <p className="text-sm text-white/50 p-4 text-center">No items available for your category.</p>
                          ) : (
                            availableEvents
                              .filter(e => e.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                              .map(e => (
                                <label key={e.id} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={itemNames.includes(e.itemName)}
                                    onChange={ev => {
                                      if (ev.target.checked) setItemNames(prev => [...prev, e.itemName]);
                                      else setItemNames(prev => prev.filter(n => n !== e.itemName));
                                    }}
                                    className="w-4.5 h-4.5 text-brand-accent rounded border-white/20 bg-white/10"
                                  />
                                  <span className="text-white font-semibold text-sm">{e.itemName}</span>
                                  <span className="ml-auto text-xs font-mono text-white/40">{e.itemCode}</span>
                                </label>
                              ))
                          )}
                        </div>
                      </div>
                    </div>

                    {itemNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {itemNames.map(name => (
                          <span key={name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-full text-sm font-bold">
                            {name}
                            <button type="button" onClick={() => setItemNames(prev => prev.filter(n => n !== name))}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || itemNames.length === 0}
                        className="px-8 py-4 bg-brand-accent text-white rounded-full font-black shadow-lg shadow-brand-accent/30 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:scale-100 flex items-center gap-2"
                      >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Registering...</> : <><Check size={18} /> Complete Registration</>}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ---------- GROUP ---------- */}
                {regType === 'group' && (
                  <motion.div key="group"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    className="cin-card border-none p-6 md:p-8 space-y-6"
                  >
                    {/* Group name */}
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Team Navarang"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none text-white placeholder-white/30 focus:bg-white/10 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 font-medium transition-all"
                      />
                    </div>

                    {/* Leader display */}
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Group Leader (You)</label>
                      <div className="flex items-center gap-3 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl px-4 py-3">
                        <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {studentDetails.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{studentDetails.fullName}</p>
                          <p className="text-white/60 text-xs">{studentDetails.admissionNumber} · Class {studentDetails.classGrade}-{studentDetails.division}</p>
                        </div>
                        <span className="ml-auto text-xs font-bold text-brand-accent bg-brand-accent/20 px-2 py-1 rounded-full">Leader</span>
                      </div>
                    </div>

                    {/* Add members */}
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">
                        Add Members <span className="text-white/40 font-normal">(up to 9 more)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Member admission number"
                          value={memberInput}
                          onChange={e => { setMemberInput(e.target.value); setMemberError(''); }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none text-white placeholder-white/30 focus:bg-white/10 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={isVerifyingMember || !memberInput.trim()}
                          className="px-4 py-3 bg-brand-accent text-white rounded-2xl font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                        >
                          {isVerifyingMember ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> Verify</>}
                        </button>
                      </div>
                      {memberError && (
                        <p className="text-red-400 text-xs font-medium mt-2 flex items-center gap-1">
                          <AlertCircle size={12} /> {memberError}
                        </p>
                      )}

                      {/* Members list */}
                      {members.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {members.map(m => (
                            <div key={m.admissionNumber} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                              <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white/80 text-xs font-bold shrink-0">
                                {m.fullName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{m.fullName}</p>
                                <p className="text-white/60 text-xs">{m.admissionNumber} · Class {m.classGrade}-{m.division}</p>
                              </div>
                              <button type="button" onClick={() => setMembers(prev => prev.filter(x => x.admissionNumber !== m.admissionNumber))}
                                className="text-white/40 hover:text-red-400 transition-colors p-1">
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Group items */}
                    <div>
                      <label className="block text-sm font-semibold text-white/80 mb-2">Select Group Items</label>
                      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-sm bg-white/5">
                        <div className="p-3 border-b border-white/10">
                          <input
                            type="text"
                            placeholder="Search items..."
                            value={itemSearchQuery}
                            onChange={e => setItemSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm bg-transparent border border-transparent rounded-xl focus:outline-none text-white placeholder-white/30 focus:bg-white/5 focus:ring-2 focus:ring-brand-accent/50 font-medium transition-all"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto px-2 py-2 space-y-1">
                          {availableEvents.length === 0 ? (
                            <p className="text-sm text-white/50 p-4 text-center">No items available.</p>
                          ) : (
                            availableEvents
                              .filter(e => e.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                              .map(e => (
                                <label key={e.id} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={groupItemNames.includes(e.itemName)}
                                    onChange={ev => {
                                      if (ev.target.checked) setGroupItemNames(prev => [...prev, e.itemName]);
                                      else setGroupItemNames(prev => prev.filter(n => n !== e.itemName));
                                    }}
                                    className="w-4.5 h-4.5 text-brand-accent rounded border-white/20 bg-white/10"
                                  />
                                  <span className="text-white font-semibold text-sm">{e.itemName}</span>
                                  <span className="ml-auto text-xs font-mono text-white/40">{e.itemCode}</span>
                                </label>
                              ))
                          )}
                        </div>
                      </div>
                      {groupItemNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {groupItemNames.map(name => (
                            <span key={name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded-full text-sm font-bold">
                              {name}
                              <button type="button" onClick={() => setGroupItemNames(prev => prev.filter(n => n !== name))}>
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Group summary */}
                    {(members.length > 0 || groupItemNames.length > 0) && (
                      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-sm text-white/60">
                        <p><span className="font-bold text-white/90">Members:</span> {1 + members.length} (Leader + {members.length})</p>
                        <p><span className="font-bold text-white/90">Items:</span> {groupItemNames.length > 0 ? groupItemNames.join(', ') : 'None selected'}</p>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || groupItemNames.length === 0 || !groupName.trim()}
                        className="px-8 py-4 bg-brand-accent text-white rounded-full font-black shadow-lg shadow-brand-accent/30 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:scale-100 flex items-center gap-2"
                      >
                        {isSubmitting
                          ? <><Loader2 className="animate-spin" size={18} /> Registering Group...</>
                          : <><Users size={18} /> Register Group</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Registration;
