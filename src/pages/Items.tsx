import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEvents } from '../lib/db';
import type { KalolsavamEvent } from '../lib/db';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'LP', 'UP', 'HS', 'HSS'];

const CATEGORY_COLORS: Record<string, string> = {
  LP:  'from-emerald-400 to-teal-500',
  UP:  'from-sky-400 to-blue-500',
  HS:  'from-violet-400 to-purple-500',
  HSS: 'from-rose-400 to-pink-500',
};

const Items = () => {
  const [events, setEvents] = useState<KalolsavamEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getEvents().then(data => {
      setEvents(data);
      setIsLoading(false);
    });
  }, []);

  const categoryOrder = { LP: 1, UP: 2, HS: 3, HSS: 4 };

  const filteredEvents = events
    .filter(e => {
      const matchesCat = activeCategory === 'All' || e.category === activeCategory;
      const matchesSearch =
        e.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      const catA = categoryOrder[a.category as keyof typeof categoryOrder] || 99;
      const catB = categoryOrder[b.category as keyof typeof categoryOrder] || 99;
      if (catA !== catB) return catA - catB;
      return a.itemName.localeCompare(b.itemName);
    });

  return (
    <div className="min-h-screen bg-transparent pt-28 pb-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-3"
          >
            ✦ Festival Events ✦
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none"
          >
            Festival <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Items</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base text-white/50 max-w-xl mx-auto"
          >
            Explore all the cultural and artistic events at the Kalolsavam.
          </motion.p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10 p-4 md:p-5 rounded-2xl backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white'
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {cat === 'All' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search items or codes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 rounded-full focus:outline-none focus:bg-white/10 transition-all text-sm font-medium text-white placeholder-white/30"
            />
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={`sk-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-28 rounded-2xl animate-pulse border border-white/8"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              ))
            ) : filteredEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-24 text-center"
              >
                <p className="text-xl font-medium text-white/40">No items found.</p>
              </motion.div>
            ) : (
              filteredEvents.map((event, idx) => {
                const gradient = CATEGORY_COLORS[event.category] || 'from-slate-400 to-slate-500';
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '-5%' }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, delay: Math.min(idx * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
                    className="group relative rounded-2xl p-5 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
                  >
                    {/* Removed buggy top bar */}

                    <div className="flex items-start justify-between mb-3">
                      {/* Category badge */}
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest text-white bg-gradient-to-r ${gradient}`}>
                        {event.category}
                      </span>
                      {/* Code badge */}
                      <span className="px-2 py-1 text-[10px] font-mono font-bold text-white/40 border border-white/10 rounded-lg">
                        #{event.itemCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white/90 leading-snug group-hover:text-white transition-colors duration-200">
                      {event.itemName}
                    </h3>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Items;
