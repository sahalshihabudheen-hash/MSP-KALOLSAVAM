import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { HallOfFameEntry } from '../lib/db';

const HallOfFameSection = ({ entries }: { entries: HallOfFameEntry[] }) => {
  if (!entries || entries.length === 0) return null;

  return (
    <section className="relative flex flex-col justify-center w-full px-4 sm:px-8 py-8 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-8 md:mb-16">
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 sm:mb-6 text-white"
          >
            <Crown size={24} className="sm:w-8 sm:h-8" />
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-2 sm:mb-4 tracking-tight">Hall of Fame</h2>
          <p className="text-sm sm:text-lg text-white/60 font-medium max-w-2xl">
            Celebrating the extraordinary talents who have left an indelible mark on the MSP HSS Kalolsavam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {entries.map((entry, i) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group relative cin-card overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="aspect-[4/5] w-full relative overflow-hidden">
                <img 
                  src={entry.imageUrl} 
                  alt={entry.studentName} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-5 sm:p-6 md:p-8">
                  <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-500 text-white text-[10px] sm:text-xs font-black rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                        {entry.year}
                      </span>
                      <span className="text-amber-300 text-xs sm:text-sm font-bold tracking-wide">
                        {entry.itemWon}
                      </span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight mb-2 sm:mb-3">
                      {entry.studentName}
                    </h3>
                    
                    <p className="text-slate-200 text-xs sm:text-sm font-medium leading-relaxed mt-1 sm:mt-2 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                      {entry.aiDescription}
                    </p>
                  </div>
                </div>
                
                {/* Decorative glowing edge on hover */}
                <div className="absolute inset-0 border-2 border-amber-400/0 group-hover:border-amber-400/50 rounded-[32px] transition-colors duration-500 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HallOfFameSection;
