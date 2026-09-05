import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, Upload, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getEvents, addEvent, deleteEvent, updateEvent, wipeAllEvents } from '../../lib/db';
import type { KalolsavamEvent } from '../../lib/db';
import ExcelLoadingOverlay from '../../components/ExcelLoadingOverlay';

const CATEGORIES = ['LP', 'UP', 'HS', 'HSS'];

const Events = () => {
  const [events, setEvents] = useState<KalolsavamEvent[]>([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Event Form State
  const [category, setCategory] = useState('UP');
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KalolsavamEvent>>({});
  
  // Loading State
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const data = await getEvents();
    setEvents(data);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemCode) return;
    
    await addEvent({ category, itemName, itemCode });
    setItemName('');
    setItemCode('');
    loadEvents();
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      // Small artificial delay to allow user to see the nice animation
      await new Promise(r => setTimeout(r, 2500));
      
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        let importCount = 0;
        
        for (const wsname of wb.SheetNames) {
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          let nameCol = -1;
          let codeCol = -1;
          let catCol = -1;
          let typeCol = -1;
          
          // 1. Find the actual header row
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (!row) continue;
            
            row.forEach((cell, colIndex) => {
              if (typeof cell !== 'string') return;
              const text = cell.toLowerCase().trim();
              if (text.includes('item name') || text === 'name') nameCol = colIndex;
              else if (text.includes('item code') || text === 'code' || text === 'item no') codeCol = colIndex;
              else if (text.includes('vibhagam') || text.includes('item typ') || text.includes('type')) typeCol = colIndex;
              else if (text.includes('festname') || text.includes('category') || text.includes('section')) catCol = colIndex;
            });

            if (nameCol !== -1 && codeCol !== -1) {
              headerRowIndex = i;
              break;
            }
          }

          if (nameCol === -1 || codeCol === -1) {
            continue; // Skip this sheet, no valid headers found
          }

          // 2. Extract Data
          let lastSeenCategory = category; // Default to the selected dropdown category
          
          for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const rawName = row[nameCol];
            const rawCode = row[codeCol];
            const rawCat = catCol !== -1 ? row[catCol] : undefined;
            const rawType = typeCol !== -1 ? row[typeCol] : '';

            // Update last seen category if a new one is found (handles merged Excel cells)
            if (rawCat) {
              const catUpper = String(rawCat).toUpperCase().trim();
              const wsnameUpper = wsname.toUpperCase();
              
              if (catUpper.includes('HSS') || wsnameUpper.includes('HSS')) lastSeenCategory = 'HSS';
              else if (catUpper.includes('HS') || wsnameUpper.includes('HS')) lastSeenCategory = 'HS';
              else if (catUpper.includes('UP') || wsnameUpper.includes('UP')) lastSeenCategory = 'UP';
              else if (catUpper.includes('LP') || wsnameUpper.includes('LP')) lastSeenCategory = 'LP';
            }

            if (rawName && rawCode) {
              let finalCategory = lastSeenCategory;

              
              // Intelligent Type appending
              let finalItemName = String(rawName).trim();
              if (rawType) {
                const typeStr = String(rawType).toUpperCase();
                if (typeStr === 'S' || typeStr.includes('SINGLE')) {
                  if (!finalItemName.toUpperCase().includes('SINGLE')) finalItemName += ' (Single)';
                } else if (typeStr === 'G' || typeStr.includes('GROUP')) {
                  if (!finalItemName.toUpperCase().includes('GROUP')) finalItemName += ' (Group)';
                } else if (typeStr === 'D' || typeStr.includes('DUO')) {
                  if (!finalItemName.toUpperCase().includes('DUO')) finalItemName += ' (Duo)';
                } else if (typeStr === 'T' || typeStr.includes('TEAM')) {
                  if (!finalItemName.toUpperCase().includes('TEAM')) finalItemName += ' (Team)';
                }
              }

              await addEvent({ 
                category: finalCategory, 
                itemName: finalItemName, 
                itemCode: String(rawCode).trim() 
              });
              importCount++;
            }
          }
        }

        if (importCount === 0) {
          throw new Error('Could not find Item Name and Item Code columns in any sheet.');
        }

        setIsImporting(false);
        // Add tiny timeout so overlay disappears completely before alert
        setTimeout(() => {
          alert(`Successfully imported ${importCount} items! If your Excel had a 'Category' column, they were sorted automatically. Otherwise, they defaulted to ${category}.`);
          loadEvents();
        }, 300);
      } catch (err) {
        setIsImporting(false);
        setTimeout(() => alert('Error parsing Excel file. Please ensure it has columns for Item Name and Item Code.'), 300);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleWipeAll = async () => {
    if (confirm('WARNING: Are you absolutely sure you want to WIPE ALL ITEMS from the database? This cannot be undone.')) {
      await wipeAllEvents();
      loadEvents();
      alert('All items have been completely wiped.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteEvent(id);
      loadEvents();
    }
  };

  const handleEditClick = (event: KalolsavamEvent) => {
    setEditingId(event.id);
    setEditForm({ ...event });
  };

  const handleSaveEdit = async () => {
    if (editingId && editForm) {
      await updateEvent(editingId, editForm);
      setEditingId(null);
      loadEvents();
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesCat = filterCategory === 'All' || e.category === filterCategory;
    const matchesSearch = e.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <ExcelLoadingOverlay isOpen={isImporting} />
      
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Item Management</h1>
        <p className="text-text-muted mt-1">Add new items and auto-fill codes to specific categories</p>
      </div>

      {/* Add New Item Form */}
      <div className="cin-card border-none/95 md:bg-transparent md:border-none md:shadow-none md:admin-glass-panel p-4 md:p-6 rounded-2xl md:rounded-[30px] shadow-sm border border-white/10">
        <h2 className="text-lg font-bold text-brand-primary mb-4 border-b border-slate-100 md:border-white/30 pb-3">Create New Item</h2>
        <form onSubmit={handleAddEvent} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 ml-1">Category</label>
            <div className="relative">
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="appearance-none w-full px-4 py-3 pr-10 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all font-medium"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 ml-1">Item Name</label>
            <input 
              type="text" 
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="e.g. Folk Dance (Single)"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 ml-1">Item Code</label>
            <input 
              type="text" 
              value={itemCode}
              onChange={e => setItemCode(e.target.value)}
              placeholder="e.g. HS-102"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-transparent focus:cin-card border-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
              required
            />
          </div>
          <div className="md:col-span-4 mt-2 flex flex-col md:flex-row gap-4">
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-brand-accent text-white rounded-xl font-bold shadow-md shadow-brand-accent/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Item
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md shadow-green-600/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Import Excel (Auto-detects Category)
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleExcelImport} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
            <button 
              type="button"
              onClick={handleWipeAll}
              className="px-6 py-3 bg-red-600/10 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2 border border-red-200 hover:border-red-600"
              title="Wipe All Items"
            >
              <Trash2 size={18} /> Wipe All
            </button>
          </div>
        </form>
      </div>

      {/* Items List */}
      <div className="cin-card border-none/95 md:bg-transparent md:border-none md:shadow-none md:admin-glass-panel rounded-2xl md:rounded-[30px] shadow-sm border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-100 md:border-white/30 flex flex-col sm:flex-row gap-4 justify-between items-center bg-transparent md:bg-transparent">
          <h2 className="font-bold text-white/80">Existing Items</h2>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="Search items or codes..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/50 transition-all"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative w-full md:w-auto">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="appearance-none w-full md:w-auto px-4 py-2 pr-10 text-sm border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/50 cin-card border-none transition-all font-medium"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
            </div>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden p-4 space-y-4 bg-transparent">
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-medium">
                No items found in this category.
              </div>
            ) : (
              filteredEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="cin-card border-none/95 p-4 rounded-2xl shadow-sm border border-white/10 flex flex-col gap-3"
                >
                  {editingId === event.id ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <select 
                          value={editForm.category || ''} 
                          onChange={e => setEditForm({...editForm, category: e.target.value})}
                          className="appearance-none w-full px-3 py-2 pr-10 border border-brand-accent rounded-xl cin-card border-none text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                      </div>
                      <input 
                        type="text" 
                        value={editForm.itemName || ''} 
                        onChange={e => setEditForm({...editForm, itemName: e.target.value})}
                        className="w-full px-3 py-2 border border-brand-accent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                        placeholder="Item Name"
                      />
                      <input 
                        type="text" 
                        value={editForm.itemCode || ''} 
                        onChange={e => setEditForm({...editForm, itemCode: e.target.value})}
                        className="w-full px-3 py-2 border border-brand-accent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                        placeholder="Item Code"
                      />
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveEdit} className="flex-1 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
                          <Save size={16} /> Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-bold">
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white/80 text-lg leading-tight">{event.itemName}</h3>
                        <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold shrink-0 ml-2">
                          {event.category}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-white/50 bg-transparent px-3 py-2 rounded-lg border border-slate-100 self-start">
                        {event.itemCode}
                      </p>
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button 
                          onClick={() => handleEditClick(event)}
                          className="flex items-center justify-center gap-2 flex-1 py-2 text-brand-primary bg-brand-primary/10 rounded-xl hover:bg-brand-primary/20 transition-colors text-sm font-medium"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="flex items-center justify-center gap-2 flex-1 py-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="cin-card border-none/95 md:bg-transparent border-b border-slate-100 md:border-white/20">
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Code</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 md:divide-white/10">
              <AnimatePresence>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                      No items found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <motion.tr 
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-transparent md:hover:cin-card border-none/30 transition-colors"
                    >
                      {editingId === event.id ? (
                        <>
                          <td className="px-6 py-3">
                            <div className="relative">
                              <select 
                                value={editForm.category || ''} 
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                                className="appearance-none w-full px-3 py-2 pr-8 border border-brand-accent rounded-xl cin-card border-none text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <input 
                              type="text" 
                              value={editForm.itemName || ''} 
                              onChange={e => setEditForm({...editForm, itemName: e.target.value})}
                              className="w-full px-3 py-2 border border-brand-accent/50 bg-white/5 text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:bg-white/10 transition-colors"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input 
                              type="text" 
                              value={editForm.itemCode || ''} 
                              onChange={e => setEditForm({...editForm, itemCode: e.target.value})}
                              className="w-full px-3 py-2 border border-brand-accent/50 bg-white/5 text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:bg-white/10 transition-colors"
                            />
                          </td>
                          <td className="px-6 py-3 text-right space-x-2">
                            <button onClick={handleSaveEdit} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm">
                              <Save size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 cin-card border-none/80 text-white/60 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-colors shadow-sm">
                              <X size={16} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3">
                            <span className="px-3 py-1 cin-card border-none/50 text-brand-primary border border-white/30 rounded-full text-xs font-bold shadow-sm">
                              {event.category}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-medium text-white/80">{event.itemName}</td>
                          <td className="px-6 py-3 text-white/50 font-mono text-sm">{event.itemCode}</td>
                          <td className="px-6 py-3 text-right space-x-2">
                            <button 
                              onClick={() => handleEditClick(event)}
                              className="p-2 text-brand-primary cin-card border-none/50 border border-white/30 rounded-lg hover:cin-card border-none transition-all shadow-sm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(event.id)}
                              className="p-2 text-red-500 cin-card border-none/50 border border-white/30 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Events;

