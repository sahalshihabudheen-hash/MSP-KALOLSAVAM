import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { HallOfFameEntry } from '../lib/db';

const HallOfFameSection = ({ entries }: { entries: HallOfFameEntry[] }) => {
  if (!entries || entries.length === 0) return null;

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center w-full px-8 py-20 md:py-32 overflow-hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6 text-white"
          >
            <Crown size={32} />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Hall of Fame</h2>
          <p className="text-lg text-white/60 font-medium max-w-2xl">
            Celebrating the extraordinary talents who have left an indelible mark on the MSP HSS Kalolsavam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {entries.map((entry, i) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group relative cin-card overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="aspect-[4/5] w-full relative overflow-hidden">
                <img 
                  src={entry.imageUrl} 
                  alt={entry.studentName} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-8">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                        {entry.year}
                      </span>
                      <span className="text-amber-300 text-sm font-bold tracking-wide">
                        {entry.itemWon}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl font-black text-white leading-tight mb-3">
                      {entry.studentName}
                    </h3>
                    
                    <p className="text-slate-200 text-sm font-medium leading-relaxed mt-2 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
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
