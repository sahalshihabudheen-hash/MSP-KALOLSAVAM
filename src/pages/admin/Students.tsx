import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Search, FileSpreadsheet, ChevronDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getRegistrations, updateRegistration, deleteRegistration, getEvents } from '../../lib/db';
import type { RegistrationEntry, KalolsavamEvent } from '../../lib/db';

const CATEGORIES = ['All', 'LP', 'UP', 'HS', 'HSS'];

const Students = () => {
  const [students, setStudents] = useState<RegistrationEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RegistrationEntry>>({});
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [allEvents, setAllEvents] = useState<KalolsavamEvent[]>([]);

  useEffect(() => {
    loadStudents();
    getEvents().then(events => setAllEvents(events));
  }, []);

  const loadStudents = async () => {
    try {
      const data = await getRegistrations();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleEditClick = (student: RegistrationEntry) => {
    setEditingId(student.id);
    setEditForm({ ...student });
    setItemSearchQuery('');
  };

  const handleSaveEdit = async () => {
    if (editingId && editForm) {
      await updateRegistration(editingId, editForm);
      setEditingId(null);
      loadStudents();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this registration?')) {
      await deleteRegistration(id);
      loadStudents();
    }
  };

  const categoryOrder = { 'LP': 1, 'UP': 2, 'HS': 3, 'HSS': 4 };

  const filteredStudents = students.filter(s => {
    const matchesCat = filterCategory === 'All' || s.category === filterCategory;
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (s.itemNames && s.itemNames.some(item => item.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    // 1. Category (LP -> UP -> HS -> HSS)
    const catA = categoryOrder[a.category as keyof typeof categoryOrder] || 99;
    const catB = categoryOrder[b.category as keyof typeof categoryOrder] || 99;
    if (catA !== catB) return catA - catB;

    // 2. Class Grade (Numeric sort: 1 then 2 ... 10, Plus One=11, Plus Two=12)
    const parseClassGrade = (grade: string) => {
      const g = (grade || '').toUpperCase().trim();
      const match = g.match(/^[A-Z]+(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num === 1) return 11;
        if (num === 2) return 12;
      }
      return parseInt(g) || 0;
    };
    
    const classNumA = parseClassGrade(a.classGrade);
    const classNumB = parseClassGrade(b.classGrade);
    if (classNumA !== classNumB) return classNumA - classNumB;

    // 3. Stream / Literal Class String (e.g. S1 vs C1 vs H1)
    const classStrA = (a.classGrade || '').toUpperCase().trim();
    const classStrB = (b.classGrade || '').toUpperCase().trim();
    if (classStrA !== classStrB) return classStrA.localeCompare(classStrB);

    // 4. Division (Alphabetical: A then B)
    const divA = (a.division || '').toUpperCase();
    const divB = (b.division || '').toUpperCase();
    if (divA !== divB) return divA.localeCompare(divB);

    // 5. Student Name (Alphabetical)
    const nameA = (a.fullName || '').toUpperCase();
    const nameB = (b.fullName || '').toUpperCase();
    return nameA.localeCompare(nameB);
  });

  const handleExportExcel = async () => {
    const year = new Date().getFullYear();
    const categoryTitle = filterCategory === 'All' ? 'All Categories List' : `${filterCategory} Section List`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    const totalCols = 8; // Fixed 8 columns: Sl, Name, Class, Div, Cat, Date, Item Codes, Items
    
    // Convert column number to Excel letter (e.g., 1 -> A, 8 -> H)
    const getColLetter = (col: number) => {
      let letter = '';
      while (col > 0) {
        let temp = (col - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        col = (col - temp - 1) / 26;
      }
      return letter;
    };
    const lastColLetter = getColLetter(totalCols);

    // 1. Add main heading
    worksheet.mergeCells(`A1:${lastColLetter}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `MSPHSS KALOLSAVAM ${year}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Tailwind blue-900
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // 2. Add subtitle
    worksheet.mergeCells(`A2:${lastColLetter}2`);
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = categoryTitle.toUpperCase();
    subtitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Tailwind blue-100
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // 3. Empty row
    worksheet.addRow([]);

    // 4. Headers
    const headers = ['Sl No', 'Student Name', 'Class', 'Division', 'Category', 'Registration Date', 'Item Codes', 'Items'];

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Tailwind indigo-600
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
      };
    });

    const sortedStudents = filteredStudents;

    // 5. Data rows
    sortedStudents.forEach((student, index) => {
      const rowData: any[] = [
        index + 1,
        student.fullName,
        student.classGrade,
        student.division,
        student.category,
        new Date(student.date).toLocaleDateString(),
        student.itemCodes && student.itemCodes.length > 0 ? student.itemCodes.join('\n') : 'N/A',
        student.itemNames && student.itemNames.length > 0 ? student.itemNames.join('\n') : 'None'
      ];

      const row = worksheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        // Default to Top-Center for multi-line rows
        cell.alignment = { 
          vertical: 'top', 
          horizontal: colNumber <= 6 ? 'center' : 'left',
          wrapText: colNumber === 7 || colNumber === 8 // Wrap text for the Item Codes and Items columns
        };
        
        // Left align and indent the text-heavy columns (Name and Items)
        if (colNumber === 2 || colNumber === 8) {
          cell.alignment.horizontal = 'left'; 
          cell.alignment.indent = 1; // Add a nice padding from the left border
        }
        
        // Center Item Codes
        if (colNumber === 7) {
          cell.alignment.horizontal = 'center';
        }

        cell.border = {
          top: {style:'thin', color: {argb:'FFEEEEEE'}},
          left: {style:'thin', color: {argb:'FFEEEEEE'}},
          bottom: {style:'thin', color: {argb:'FFEEEEEE'}},
          right: {style:'thin', color: {argb:'FFEEEEEE'}}
        };
      });
      // Alternate row colors for better readability
      if (index % 2 !== 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Tailwind gray-50
        });
      }
    });

    // 6. Adjust column widths perfectly
    worksheet.columns.forEach((col, i) => {
      if (i === 0) col.width = 6; // Sl No
      else if (i === 1) col.width = 28; // Name
      else if (i === 2) col.width = 10; // Class
      else if (i === 3) col.width = 10; // Division
      else if (i === 4) col.width = 14; // Category
      else if (i === 5) col.width = 18; // Date
      else if (i === 6) col.width = 15; // Item Codes
      else col.width = 50; // Items (Wider to fit text beautifully)
    });

    // 7. Add footer
    worksheet.addRow([]);
    const footerRow = worksheet.addRow(['msphss kalolsavam portal']);
    worksheet.mergeCells(`A${footerRow.number}:${lastColLetter}${footerRow.number}`);
    const footerCell = worksheet.getCell(`A${footerRow.number}`);
    footerCell.font = { italic: true, color: { argb: 'FF888888' } };
    footerCell.alignment = { horizontal: 'center' };

    // 8. Trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Kalolsavam_Students_${filterCategory}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">Registered Students</h1>
          <p className="text-text-muted mt-1">Manage and edit participant registrations</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="appearance-none w-full px-4 py-2 pr-10 text-sm border border-white/10 bg-transparent md:cin-card border-none/40 md:backdrop-blur-md rounded-xl focus:outline-none focus:border-brand-primary md:focus:border-white focus:ring-2 focus:ring-brand-accent/50 transition-all font-medium"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
          </div>
          <div className="relative w-full md:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name or item..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent md:cin-card border-none/40 md:backdrop-blur-md border border-white/10 md:border-white/50 rounded-xl focus:outline-none focus:border-brand-primary md:focus:border-white focus:ring-2 focus:ring-brand-accent/50 transition-all"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 w-full md:w-auto bg-green-600 text-white rounded-xl md:rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            <FileSpreadsheet size={18} />
            Print with Excel
          </button>
        </div>
      </div>

      <div className="rounded-2xl md:rounded-[30px] overflow-hidden border border-white/10" style={{ background: 'rgba(13,24,50,0.5)', backdropFilter: 'blur(20px)' }}>
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
          <AnimatePresence>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-medium">
                No registered students found matching your filters.
              </div>
            ) : (
              filteredStudents.map((student) => (
                <motion.div 
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="cin-card border-none/95 p-4 rounded-2xl shadow-sm border border-white/10 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-brand-primary text-lg">{student.fullName}</h3>
                      <p className="text-sm text-white/50 font-medium">{student.classGrade} - {student.division}</p>
                    </div>
                    <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold shrink-0">
                      {student.category}
                    </span>
                  </div>
                  
                  <div className="bg-transparent p-3 rounded-xl border border-slate-100">
                    <p className="text-sm font-medium text-white line-clamp-2">{student.itemNames?.join(', ') || 'None'}</p>
                    <p className="text-xs text-slate-400 mt-1">Codes: {student.itemCodes?.join(', ') || 'N/A'}</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => handleEditClick(student)} className="flex items-center justify-center gap-2 flex-1 py-2 text-brand-primary bg-brand-primary/10 rounded-xl hover:bg-brand-primary/20 transition-colors font-medium text-sm">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="flex items-center justify-center gap-2 flex-1 py-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm">
                      <X size={16} /> Delete
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-transparent border-b border-white/20">
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Class & Div</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <AnimatePresence>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No registered students found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <motion.tr 
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:cin-card border-none/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-brand-primary">{student.fullName}</td>
                      <td className="px-6 py-4 text-white/60 font-medium">{student.classGrade} - {student.division}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 cin-card border-none/50 text-brand-primary border border-white/30 rounded-full text-xs font-bold shadow-sm">
                          {student.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{student.itemNames?.join(', ') || 'None'}</div>
                        <div className="text-xs text-white/50 mt-1 font-medium">Code: {student.itemCodes?.join(', ') || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEditClick(student)} className="p-2 text-brand-primary cin-card border-none/50 border border-white/30 rounded-lg hover:cin-card border-none transition-all shadow-sm">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-500 cin-card border-none/50 border border-white/30 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
                          <X size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editingId && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setEditingId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative cin-card border-none/95 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-transparent/50">
                <h3 className="text-xl font-bold text-white">Edit Student Registration</h3>
                <button onClick={() => setEditingId(null)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Basic Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.fullName || ''} 
                      onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-white/10 bg-white/5 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Category</label>
                    <div className="relative">
                      <select 
                        value={editForm.category || ''} 
                        onChange={e => {
                          setEditForm({
                            ...editForm, 
                            category: e.target.value,
                            itemNames: [],
                            itemCodes: []
                          });
                        }}
                        className="appearance-none w-full px-4 py-2 pr-10 border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 bg-transparent transition-all font-medium"
                      >
                        {['LP', 'UP', 'HS', 'HSS'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Class</label>
                    <input 
                      type="text" 
                      value={editForm.classGrade || ''} 
                      onChange={e => setEditForm({...editForm, classGrade: e.target.value})}
                      className="w-full px-4 py-2 border border-white/10 bg-white/5 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/50 uppercase">Division</label>
                    <input 
                      type="text" 
                      value={editForm.division || ''} 
                      onChange={e => setEditForm({...editForm, division: e.target.value})}
                      className="w-full px-4 py-2 border border-white/10 bg-white/5 text-white placeholder-white/30 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Items Management */}
                <div className="flex flex-col h-[300px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white/80 uppercase flex items-center gap-2">
                        Manage Items
                        <span className="text-xs font-medium px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">
                          {editForm.itemNames?.length || 0} Selected
                        </span>
                      </h4>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search items..." 
                        value={itemSearchQuery}
                        onChange={e => setItemSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 text-white placeholder-white/40 border border-white/10 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-transparent rounded-xl p-4 border border-white/10 flex-1 overflow-y-auto">
                    {allEvents.filter(e => e.category === editForm.category).length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400 text-sm font-medium">No items available for {editForm.category} category.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-max">
                        {allEvents
                          .filter(e => e.category === editForm.category)
                          .filter(e => e.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()) || e.itemCode.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                          // Sort: Selected items always bubble up to the top
                          .sort((a, b) => {
                            const aSelected = editForm.itemNames?.includes(a.itemName) ? -1 : 1;
                            const bSelected = editForm.itemNames?.includes(b.itemName) ? -1 : 1;
                            return aSelected - bSelected;
                          })
                          .map(event => {
                            const isSelected = editForm.itemNames?.includes(event.itemName);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setEditForm({
                                      ...editForm,
                                      itemNames: editForm.itemNames?.filter(n => n !== event.itemName) || [],
                                      itemCodes: editForm.itemCodes?.filter(c => c !== event.itemCode) || []
                                    });
                                  } else {
                                    setEditForm({
                                      ...editForm,
                                      itemNames: [...(editForm.itemNames || []), event.itemName],
                                      itemCodes: [...(editForm.itemCodes || []), event.itemCode]
                                    });
                                  }
                                }}
                                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                                  isSelected 
                                    ? 'cin-card border-none border-brand-primary shadow-sm' 
                                    : 'cin-card border-none/50 border-white/10 hover:border-slate-300 hover:cin-card border-none'
                                }`}
                              >
                                <div>
                                  <div className={`font-bold text-sm ${isSelected ? 'text-brand-primary' : 'text-white/80'}`}>{event.itemName}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">Code: {event.itemCode}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                  isSelected ? 'bg-brand-primary border-brand-primary' : 'cin-card border-none border-slate-300'
                                }`}>
                                  {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-transparent/50 flex justify-end gap-3">
                <button onClick={() => setEditingId(null)} className="px-6 py-2 text-white/60 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} className="px-6 py-2 bg-brand-accent text-white font-bold rounded-xl shadow-md shadow-brand-accent/20 hover:shadow-lg hover:shadow-brand-accent/40 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;

