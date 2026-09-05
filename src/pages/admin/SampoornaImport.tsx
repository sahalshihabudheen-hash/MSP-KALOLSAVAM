import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Check, AlertCircle, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { addSampoornaStudents, getSampoornaStudents } from '../../lib/db';
import type { SampoornaStudent } from '../../lib/db';
import ExcelLoadingOverlay from '../../components/ExcelLoadingOverlay';

const SampoornaImport = () => {
  const [parsedStudents, setParsedStudents] = useState<SampoornaStudent[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [existingCount, setExistingCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    getSampoornaStudents().then(students => setExistingCount(students.length));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      // Artificial delay for loading animation
      await new Promise(r => setTimeout(r, 2500));
      
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of objects
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];
        
        if (data.length === 0) {
          throw new Error('The uploaded Excel file is empty.');
        }

        const formattedStudents: SampoornaStudent[] = [];

        data.forEach((row) => {
          // Attempt to find dynamic column names
          const keys = Object.keys(row);
          
          let admissionNumber = '';
          let fullName = '';
          let classGrade = '';
          let division = '';

          keys.forEach(key => {
            const lowerKey = key.trim().toLowerCase();
            // Match admission number
            if (lowerKey === 'admission no' || lowerKey === 'admission no.' || lowerKey === 'admission number' || lowerKey === 'admn no' || lowerKey.includes('admission')) {
              admissionNumber = String(row[key]);
            } 
            // Match student name
            else if (lowerKey === 'name' || lowerKey === 'student name' || lowerKey === 'name of student' || lowerKey.includes('name')) {
              fullName = String(row[key]);
            } 
            // Match class (strict matching to avoid "Class on Admission")
            else if (lowerKey === 'class' || lowerKey === 'std' || lowerKey === 'standard' || lowerKey === 'class studying') {
              classGrade = String(row[key]);
            } 
            // Match division (strict matching to avoid "Individual", "Batch" etc.)
            else if (lowerKey === 'division' || lowerKey === 'div' || lowerKey === 'section') {
              division = String(row[key]);
            }
          });

          if (admissionNumber && fullName && classGrade) {
            let cleanDiv = division ? division.trim().toUpperCase() : 'A';
            
            // Remove academic years (e.g. 2023, 2024, 2026-2027, 2026-27)
            cleanDiv = cleanDiv.replace(/\d{4}(?:-\d{2,4})?/g, '').trim();
            
            // Remove the class grade if it prefixes the division (e.g. "8 B" -> "B", "10 G" -> "G")
            const classStr = classGrade.trim();
            if (classStr && cleanDiv.startsWith(classStr)) {
              cleanDiv = cleanDiv.substring(classStr.length).trim();
            }
            
            // Remove everything except alphabetical characters to get the raw division letter
            cleanDiv = cleanDiv.replace(/[^A-Z]/g, '').trim();
            
            // If it ends up empty after cleaning, default to A
            if (!cleanDiv) cleanDiv = 'A';

            formattedStudents.push({
              admissionNumber: admissionNumber.trim(),
              fullName: fullName.trim(),
              classGrade: classGrade.trim(),
              division: cleanDiv
            });
          }
        });

        if (formattedStudents.length === 0) {
          throw new Error('Could not find required columns (Admission Number, Name, Class) in the Excel file.');
        }

        setParsedStudents(formattedStudents);
        setIsImporting(false);
      } catch (err: any) {
        setIsImporting(false);
        setErrorMsg(err.message || 'Error parsing Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveToDb = async () => {
    try {
      await addSampoornaStudents(parsedStudents);
      setSuccessMsg(`Successfully imported ${parsedStudents.length} students into the database!`);
      const updatedStudents = await getSampoornaStudents();
      setExistingCount(updatedStudents.length);
      setParsedStudents([]);
    } catch (err) {
      setErrorMsg('Failed to save students to database.');
    }
  };

  return (
    <div className="space-y-6">
      <ExcelLoadingOverlay isOpen={isImporting} />
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Sampoorna Database Integration</h1>
        <p className="text-text-muted mt-1">Import student records from Kerala Sampoorna Excel export.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="cin-card border-none/95 md:bg-transparent md:border-none md:shadow-none md:admin-glass-panel p-8 rounded-[30px] shadow-sm border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Upload className="text-brand-accent" /> Upload Excel File
            </h2>
            
            <div className="border-2 border-dashed border-slate-300 md:border-white/40 rounded-[20px] p-10 text-center hover:cin-card border-none/30 transition-colors relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileSpreadsheet size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-white/80">Click or drag Excel file here</h3>
              <p className="text-white/50 text-sm mt-2">Supports .xlsx and .xls exports from Sampoorna</p>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3">
                  <AlertCircle size={20} /> {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3">
                  <Check size={20} /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {parsedStudents.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cin-card border-none/95 md:bg-transparent md:border-none md:shadow-none md:admin-glass-panel p-4 md:p-6 rounded-2xl md:rounded-[30px] shadow-sm border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Preview ({parsedStudents.length} Students)</h2>
                <button 
                  onClick={handleSaveToDb}
                  className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/80 transition-colors font-bold shadow-md flex items-center gap-2"
                >
                  <Database size={18} /> Save to Database
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto border border-white/10 rounded-xl cin-card border-none">
                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {parsedStudents.slice(0, 50).map((s, i) => (
                    <div key={i} className="p-4 cin-card border-none hover:bg-transparent transition-colors">
                      <div className="font-bold text-white text-lg mb-1">{s.fullName}</div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-brand-primary font-medium">Adm: {s.admissionNumber}</span>
                        <span className="text-white/50 bg-white/5 px-2 py-1 rounded-md">{s.classGrade} - {s.division}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden md:table w-full text-left text-sm">
                  <thead className="bg-transparent sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 font-bold text-white/60">Admission No.</th>
                      <th className="px-4 py-3 font-bold text-white/60">Full Name</th>
                      <th className="px-4 py-3 font-bold text-white/60">Class & Div</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudents.slice(0, 50).map((s, i) => (
                      <tr key={i} className="hover:bg-transparent transition-colors">
                        <td className="px-4 py-3 font-medium text-brand-primary">{s.admissionNumber}</td>
                        <td className="px-4 py-3 text-white/80 font-medium">{s.fullName}</td>
                        <td className="px-4 py-3 text-white/60">{s.classGrade} - {s.division}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedStudents.length > 50 && (
                  <div className="p-3 text-center text-white/50 bg-transparent text-xs font-medium border-t border-slate-100">
                    Showing first 50 rows only. All {parsedStudents.length} will be saved.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div>
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-6 rounded-2xl shadow-lg text-white">
            <Database size={32} className="mb-4 text-brand-accent" />
            <h2 className="text-xl font-bold mb-2">Database Status</h2>
            <p className="text-white/80 text-sm mb-6">
              Total Sampoorna student records currently active in the database.
            </p>
            <div className="text-5xl font-black text-brand-accent">
              {existingCount}
            </div>
            <div className="text-sm font-medium mt-2 text-white/90">Total School Students</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampoornaImport;

