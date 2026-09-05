import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet } from 'lucide-react';

interface ExcelLoadingOverlayProps {
  isOpen: boolean;
  slogans?: string[];
}

const defaultSlogans = [
  "Reading Excel File...",
  "Analyzing Data Layout...",
  "Detecting Categories...",
  "Extracting Records...",
  "Saving to Database...",
  "Almost Done..."
];

const ExcelLoadingOverlay = ({ isOpen, slogans = defaultSlogans }: ExcelLoadingOverlayProps) => {
  const [sloganIndex, setSloganIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSloganIndex(0);
      const interval = setInterval(() => {
        setSloganIndex((prev) => (prev < slogans.length - 1 ? prev + 1 : prev));
      }, 800); // Change slogan every 800ms
      return () => clearInterval(interval);
    }
  }, [isOpen, slogans]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-slate-100"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full w-20 h-20 -m-2"
              />
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                <FileSpreadsheet size={32} />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Processing File</h3>
            
            <div className="h-6 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={sloganIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-brand-accent font-medium text-center"
                >
                  {slogans[sloganIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExcelLoadingOverlay;

