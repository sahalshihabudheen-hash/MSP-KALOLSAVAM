import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Plus, Trash2, Edit2, Loader2, Save, Wand2 } from 'lucide-react';
import { getHallOfFame, addHallOfFameEntry, updateHallOfFameEntry, deleteHallOfFameEntry } from '../../lib/db';
import type { HallOfFameEntry } from '../../lib/db';

const TEMPLATES = [
  "Crowned the champion of {item} in {year}, {studentName} mesmerized the audience with an unforgettable performance that will be remembered for years to come.",
  "With unparalleled grace and unmatched talent, {studentName} secured the top spot in {item} during the {year} Kalolsavam.",
  "A true display of artistic brilliance! {studentName} captivated everyone's hearts, emerging victorious in {item} ({year}).",
  "Setting a new benchmark for excellence, {studentName} shone the brightest in {item} at the {year} cultural festival."
];

const generateAIDescription = (name: string, item: string, year: string) => {
  if (!name || !item || !year) return '';
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  return template.replace('{studentName}', name).replace('{item}', item).replace('{year}', year);
};

const HallOfFameAdmin = () => {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentName: '',
    itemWon: '',
    year: new Date().getFullYear().toString(),
    imageUrl: '',
    aiDescription: ''
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await getHallOfFame();
      setEntries(data);
    } catch (error) {
      console.error("Failed to load Hall of Fame:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = () => {
    const desc = generateAIDescription(formData.studentName, formData.itemWon, formData.year);
    setFormData({ ...formData, aiDescription: desc });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId && editingId !== 'new') {
        await updateHallOfFameEntry(editingId, formData);
      } else {
        await addHallOfFameEntry(formData);
      }
      await loadEntries();
      setEditingId(null);
      setFormData({ studentName: '', itemWon: '', year: new Date().getFullYear().toString(), imageUrl: '', aiDescription: '' });
    } catch (error) {
      console.error("Failed to save entry:", error);
      alert("Failed to save. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData({ ...formData, imageUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleEdit = (entry: HallOfFameEntry) => {
    setEditingId(entry.id);
    setFormData({
      studentName: entry.studentName,
      itemWon: entry.itemWon,
      year: entry.year,
      imageUrl: entry.imageUrl,
      aiDescription: entry.aiDescription || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteHallOfFameEntry(id);
      await loadEntries();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="rounded-[32px] p-6 md:p-8 relative overflow-hidden border border-white/10" style={{ background: 'rgba(13,24,50,0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Crown size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Crown className="text-amber-500" />
              Hall of Fame
            </h1>
            <p className="text-white/50 mt-2 font-medium">Manage top performers to display on the homepage.</p>
          </div>
          {!editingId && (
            <button
              onClick={() => setEditingId('new')}
              className="px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}
            >
              <Plus size={20} /> Add Champion
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editingId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl p-6 border border-brand-accent/20 mb-8 overflow-hidden"
              style={{ background: 'rgba(56,189,248,0.06)' }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                {editingId === 'new' ? 'New Champion' : 'Edit Champion'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/80">Student Name</label>
                    <input
                      type="text"
                      required
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      className="w-full cin-card border-none border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium bg-white/5 text-white placeholder-white/30"
                      placeholder="e.g. Abhinav K"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/80">Item Won</label>
                    <input
                      type="text"
                      required
                      value={formData.itemWon}
                      onChange={(e) => setFormData({...formData, itemWon: e.target.value})}
                      className="w-full cin-card border-none border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium bg-white/5 text-white placeholder-white/30"
                      placeholder="e.g. Bharatanatyam"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/80">Year</label>
                    <input
                      type="text"
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full cin-card border-none border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium bg-white/5 text-white placeholder-white/30"
                      placeholder="e.g. 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/80">Image</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">OR URL/Paste:</span>
                        <input
                          type="text"
                          required
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          onPaste={handlePaste}
                          className="w-full cin-card border-none border border-white/10 px-4 py-2 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium text-sm"
                          placeholder="Paste image or URL here..."
                        />
                      </div>
                      {formData.imageUrl && (
                        <div className="mt-2 h-20 w-20 rounded-lg overflow-hidden border border-white/10 shadow-sm relative">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white/80">Description (AI Generated)</label>
                    <button 
                      type="button" 
                      onClick={handleGenerateAI}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Wand2 size={14} /> Auto-Generate
                    </button>
                  </div>
                  <textarea
                    required
                    value={formData.aiDescription}
                    onChange={(e) => setFormData({...formData, aiDescription: e.target.value})}
                    className="w-full cin-card border-none border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium min-h-[100px] bg-white/5 text-white placeholder-white/30"
                    placeholder="Write a glowing description or use the auto-generate button..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => { setEditingId(null); setFormData({ studentName: '', itemWon: '', year: new Date().getFullYear().toString(), imageUrl: '', aiDescription: '' }); }}
                    className="px-6 py-3 font-bold text-white/50 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Champion
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-brand-primary" />
            <p className="font-medium">Loading Hall of Fame...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
            <Crown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/80 mb-2">No Champions Yet</h3>
            <p className="text-white/50 font-medium max-w-md mx-auto">
              Add top performers here to display a beautiful Hall of Fame section on the public homepage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(entry => (
              <div key={entry.id} className="group relative cin-card border-none border border-white/10 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-square w-full overflow-hidden relative">
                  <img src={entry.imageUrl} alt={entry.studentName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <span className="inline-block px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full mb-2 w-max">
                      {entry.year}
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight">{entry.studentName}</h3>
                    <p className="text-amber-300 font-medium text-sm">{entry.itemWon}</p>
                  </div>
                </div>
                
                <div className="p-5">
                  <p className="text-white/60 text-sm font-medium line-clamp-3">"{entry.aiDescription}"</p>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-white/40 hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HallOfFameAdmin;
