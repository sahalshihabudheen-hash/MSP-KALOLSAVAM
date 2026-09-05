import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Music, Palette, Drama, Award, Users, CalendarDays, ArrowRight, Star, Sparkles } from 'lucide-react';
import Hero from '../components/Hero';
import HallOfFameSection from '../components/HallOfFameSection';
import Footer from '../components/Footer';
import { getGalleryPreview, getHallOfFame } from '../lib/db';
import type { HallOfFameEntry } from '../lib/db';

/* ─── Cinematic Section Reveal Wrapper ─────────────────────────────── */
const SectionReveal = ({
  children,
  className = '',
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
}) => {
  const getInitial = () => {
    // Subtle offsets on mobile so elements never start far off-screen or cause horizontal jitter
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const offset = isMobile ? 24 : 80;
    if (direction === 'left') return { opacity: 0, x: -offset, filter: 'blur(8px)' };
    if (direction === 'right') return { opacity: 0, x: offset, filter: 'blur(8px)' };
    return { opacity: 0, y: offset, filter: 'blur(8px)' };
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Word-by-word animated heading ────────────────────────────────── */
const AnimatedHeading = ({
  text,
  className = '',
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) => {
  const words = text.split(' ');
  return (
    <div className={`pb-2 md:pb-3 ${className}`}>
      <div className="flex flex-wrap justify-center gap-x-2.5 sm:gap-x-4 gap-y-1">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ display: 'inline-block' }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

/* ─── Stats counter ─────────────────────────────────────────────────── */
const StatCard = ({ value, label, icon: Icon, delay }: { value: string; label: string; icon: any; delay: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-1.5 sm:gap-3 p-3 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/8 md:border-white/10 backdrop-blur-sm"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>
        <Icon size={16} className="text-white sm:w-[22px] sm:h-[22px]" />
      </div>
      <span className="text-xl sm:text-4xl md:text-5xl font-black text-white">{value}</span>
      <span className="text-white/50 text-[9px] sm:text-xs md:text-sm font-semibold uppercase tracking-wider sm:tracking-widest text-center">{label}</span>
    </motion.div>
  );
};

/* ─── Art Category Card ─────────────────────────────────────────────── */
const ArtCard = ({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: any;
  title: string;
  desc: string;
  delay: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-white/8 hover:border-brand-accent/30 hover:bg-white/5 transition-all duration-300 group cursor-default"
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
        style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.2)' }}>
        <Icon size={16} className="text-brand-accent sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-white text-xs sm:text-base mb-0.5">{title}</h3>
        <p className="text-white/50 text-[11px] sm:text-sm leading-snug line-clamp-1 sm:line-clamp-none">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-white/20 group-hover:text-brand-accent transition-colors sm:hidden shrink-0" />
    </motion.div>
  );
};

/* ─── Home ─────────────────────────────────────────────────────────── */
const Home = () => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [hallOfFameEntries, setHallOfFameEntries] = useState<HallOfFameEntry[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  useEffect(() => {
    const cachedImages = localStorage.getItem('kal_gallery_cache');
    const cachedHof = localStorage.getItem('kal_hof_cache');
    if (cachedImages) { setPreviewImages(JSON.parse(cachedImages)); setIsLoadingPreview(false); }
    if (cachedHof) setHallOfFameEntries(JSON.parse(cachedHof));

    const loadData = async () => {
      try {
        const [images, hof] = await Promise.all([getGalleryPreview(6), getHallOfFame()]);
        setPreviewImages(images);
        setHallOfFameEntries(hof);
        setIsLoadingPreview(false);
        localStorage.setItem('kal_gallery_cache', JSON.stringify(images));
        localStorage.setItem('kal_hof_cache', JSON.stringify(hof));
      } catch (err) {
        setIsLoadingPreview(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="w-full">

      {/* ══ FRAME 1: Hero ══════════════════════════════════════════════ */}
      <div className="snap-start w-full min-h-[100dvh] md:h-[100dvh]">
        <Hero />
      </div>

      {/* ══ FRAME 2: About ═════════════════════════════════════════════ */}
      <section id="about" className="snap-start relative md:sticky md:top-0 z-10 min-h-0 md:min-h-[100dvh] md:h-[100dvh] bg-[#0b1121] flex flex-col justify-center items-center w-full px-4 sm:px-6 md:px-20 py-8 sm:py-12 md:py-0 pb-16 md:pb-0 overflow-visible md:overflow-hidden">

        {/* Pookalam bg */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <motion.img
            src="/assets/pookalam.svg"
            alt=""
            animate={{ rotate: 360 }}
            transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
            className="w-[110vmin] h-[110vmin] opacity-[0.05] md:opacity-[0.07] object-contain"
          />
        </div>

        {/* Old doodle art – sitar left */}
        <motion.img
          src="/assets/color_sitar.png"
          className="hidden md:block absolute top-16 left-8 w-[260px] pointer-events-none"
          style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }}
          animate={{ y: [0, -14, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          alt=""
        />
        {/* Old doodle art – mudra right */}
        <motion.img
          src="/assets/color_mudra.png"
          className="hidden md:block absolute -bottom-6 right-10 w-[300px] pointer-events-none"
          style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }}
          animate={{ y: [0, 14, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          alt=""
        />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Section label */}
          <SectionReveal direction="left">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-brand-accent mb-2 sm:mb-6">
              <Sparkles size={11} /> Who We Are <Sparkles size={11} />
            </span>
          </SectionReveal>

          <AnimatedHeading
            text="About the Kalolsavam"
            className="text-2xl sm:text-4xl md:text-7xl font-black text-white mb-2 sm:mb-6 md:mb-8 leading-tight sm:leading-none tracking-tight md:tracking-tighter"
            delay={0.1}
          />

          <SectionReveal direction="right" className="mb-4 sm:mb-8 md:mb-10">
            <p className="text-xs sm:text-base md:text-xl text-white/55 leading-relaxed font-normal sm:font-medium max-w-xl mx-auto line-clamp-3 sm:line-clamp-none">
              The MSP HSS Kalolsavam is the premier cultural arts festival showcasing the incredible
              talents of our students. From traditional dance forms to modern artistic expressions,
              this week-long celebration is a testament to the rich heritage and vibrant future of Kerala's arts.
            </p>
          </SectionReveal>

          <SectionReveal>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-3">
              {['Classical Arts', 'Music', 'Drama', 'Literature', 'Fine Arts', 'Folk Arts'].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold text-white/70 border border-white/10 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ══ FRAME 3: Festival Stats ════════════════════════════════════ */}
      <section className="snap-start relative md:sticky md:top-0 z-20 min-h-0 md:min-h-[100dvh] md:h-[100dvh] bg-[#0b1121] flex flex-col justify-center w-full px-4 sm:px-6 md:px-20 py-8 sm:py-12 md:py-0 pb-16 md:pb-0 overflow-visible md:overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        {/* Subtle gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

        {/* Doodle arts */}
        <motion.img src="/assets/color_sitar.png" className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none" style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} alt="" />
        <motion.img src="/assets/color_mudra.png" className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none" style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} alt="" />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="mb-4 sm:mb-8 md:mb-16 text-center">
            <SectionReveal>
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-brand-accent mb-1.5 sm:mb-4">
                <Star size={11} /> The Festival in Numbers
              </span>
            </SectionReveal>
            <AnimatedHeading
              text="Celebrating Excellence"
              className="text-2xl sm:text-4xl md:text-7xl font-black text-white leading-tight sm:leading-none tracking-tight md:tracking-tighter"
              delay={0.05}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            <SectionReveal direction="left" className="w-full">
              <StatCard value="500+" label="Student Participants" icon={Users} delay={0.05} />
            </SectionReveal>
            <SectionReveal direction="left" className="w-full">
              <StatCard value="80+"  label="Art Items"            icon={Palette} delay={0.1} />
            </SectionReveal>
            <SectionReveal direction="right" className="w-full">
              <StatCard value="5"    label="Days of Festivities"  icon={CalendarDays} delay={0.15} />
            </SectionReveal>
            <SectionReveal direction="right" className="w-full">
              <StatCard value="30+"  label="Years of Legacy"      icon={Award} delay={0.2} />
            </SectionReveal>
          </div>

          <SectionReveal direction="up" className="mt-4 sm:mt-8 md:mt-14">
            <p className="text-white/35 text-[10px] sm:text-xs md:text-sm font-medium text-center tracking-wide">
              Held annually at MSP HSS Campus, Malappuram · Oct 15 – 20, 2026
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ══ FRAME 4: Art Categories ════════════════════════════════════ */}
      <section className="snap-start relative md:sticky md:top-0 z-30 min-h-0 md:min-h-[100dvh] md:h-[100dvh] bg-[#0b1121] flex flex-col justify-center w-full px-4 sm:px-6 md:px-20 py-8 sm:py-12 md:py-0 pb-20 md:pb-0 overflow-visible md:overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(56,189,248,0.06) 0%, transparent 70%)' }} />

        {/* Doodle arts — same position as Hero */}
        <motion.img
          src="/assets/color_sitar.png"
          className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none"
          style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }}
          animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          alt=""
        />
        <motion.img
          src="/assets/color_mudra.png"
          className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none"
          style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }}
          animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          alt=""
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-4 sm:gap-10 md:gap-20 items-center">

          <div>
            <SectionReveal direction="left">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-brand-accent mb-1.5 sm:mb-4">
                <Music size={11} /> Art Forms
              </span>
            </SectionReveal>
            <AnimatedHeading
              text="Every Art Has a Stage"
              className="text-2xl sm:text-4xl md:text-6xl font-black text-white leading-tight sm:leading-none tracking-tight md:tracking-tighter mb-2 sm:mb-4 md:mb-8"
              delay={0.05}
            />
            <SectionReveal direction="left">
              <p className="text-white/50 text-xs sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-6 md:mb-8 line-clamp-2 sm:line-clamp-none">
                From classical music to folk percussion — every artistic expression finds its spotlight at the Kalolsavam.
              </p>
            </SectionReveal>
            <SectionReveal>
              <Link to="/items">
                <motion.button
                  whileHover={{ scale: 1.04, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full font-bold text-white text-xs sm:text-sm tracking-wide mb-3 sm:mb-0"
                  style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}
                >
                  View All Items <ArrowRight size={14} />
                </motion.button>
              </Link>
            </SectionReveal>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-3">
            <SectionReveal direction="right">
              <ArtCard icon={Music}   title="Classical Music"        desc="Carnatic, Hindustani vocal & instrumental competitions across all age groups."    delay={0.05} />
            </SectionReveal>
            <SectionReveal direction="right">
              <ArtCard icon={Drama}   title="Drama & Performing Arts" desc="Stage plays, mime, mono-act, and group dance performances."                      delay={0.1} />
            </SectionReveal>
            <SectionReveal direction="right">
              <ArtCard icon={Palette} title="Visual Arts"             desc="Painting, sketching, collage-making, and on-the-spot drawing."                    delay={0.15} />
            </SectionReveal>
            <SectionReveal direction="right">
              <ArtCard icon={Users}   title="Folk & Traditional"      desc="Thiruvathira, Oppana, Duffmuttu, and other rich Kerala folk traditions."           delay={0.2} />
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ══ FRAME 5: Gallery Preview ════════════════════════════════════ */}
      <section id="gallery" className="snap-start relative md:sticky md:top-0 z-40 min-h-0 md:min-h-[100dvh] md:h-[100dvh] bg-[#0b1121] flex flex-col justify-center w-full px-4 sm:px-6 md:px-20 py-8 sm:py-12 md:py-0 pb-16 md:pb-0 overflow-visible md:overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />

        {/* Doodle arts */}
        <motion.img src="/assets/color_sitar.png" className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none" style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} alt="" />
        <motion.img src="/assets/color_mudra.png" className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none" style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} alt="" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">

          <div className="flex justify-between items-end mb-4 sm:mb-8 md:mb-12">
            <div>
              <SectionReveal>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-brand-accent mb-1 sm:mb-3">
                  <ImageIcon size={11} /> Captured Moments
                </span>
              </SectionReveal>
              <AnimatedHeading
                text="Festival Gallery"
                className="text-2xl sm:text-4xl md:text-6xl font-black text-white leading-tight sm:leading-none tracking-tight md:tracking-tighter"
                delay={0.05}
              />
            </div>
            <SectionReveal>
              <Link to="/gallery" className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-7 py-1.5 sm:py-3 text-white font-bold rounded-full text-[11px] sm:text-sm hover:-translate-y-1 transition-all" style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>
                View All <ArrowRight size={12} />
              </Link>
            </SectionReveal>
          </div>

          {isLoadingPreview ? (
            <div className="flex justify-center items-center h-32 md:h-48">
              <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-brand-accent" />
            </div>
          ) : previewImages.filter(img => img && img.length > 10 && img !== 'undefined').length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-3 md:gap-4">
              {previewImages.filter(img => img && img.length > 10 && img !== 'undefined').slice(0, 6).map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer aspect-square"
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-end p-2 sm:p-4">
                      <span className="text-white text-[10px] font-bold tracking-widest uppercase translate-y-1 group-hover:translate-y-0 transition-transform duration-300">View</span>
                    </div>
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      onError={e => { (e.target as HTMLImageElement).closest('div')!.style.display = 'none'; }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 md:h-48 text-white/30">
              <ImageIcon size={36} className="opacity-20 mb-2 md:mb-4" />
              <p className="text-xs sm:text-sm font-medium">Gallery photos coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* ══ FRAME 6: Hall of Fame (conditional) ════════════════════════ */}
      {hallOfFameEntries.length > 0 && (
        <div className="snap-start relative md:sticky md:top-0 z-50 bg-[#0b1121] w-full min-h-0 md:min-h-[100dvh] md:h-[100dvh] py-8 sm:py-16 md:py-0 pb-16 md:pb-0 overflow-visible md:overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <HallOfFameSection entries={hallOfFameEntries} />
        </div>
      )}

      {/* ══ FRAME 6/7: CTA + Footer ════════════════════════════════════ */}
      <section className="snap-start relative md:sticky md:top-0 z-[60] bg-[#0b1121] min-h-0 md:min-h-[100dvh] md:h-[100dvh] flex flex-col justify-between py-8 sm:py-12 md:py-0 pb-8 md:pb-0 overflow-visible md:overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        {/* Radial glow bg */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)' }} />
        </div>

        {/* Doodle arts */}
        <motion.img src="/assets/color_sitar.png" className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none" style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} alt="" />
        <motion.img src="/assets/color_mudra.png" className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none" style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} alt="" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-20 py-4 sm:py-8 md:py-0">

          <SectionReveal>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-brand-accent mb-2 sm:mb-8">
              <Sparkles size={11} /> Join the Festival
            </span>
          </SectionReveal>

          <AnimatedHeading
            text="Be Part of the Legacy"
            className="text-2xl sm:text-4xl md:text-8xl font-black text-white leading-tight sm:leading-none tracking-tight md:tracking-tighter mb-2 sm:mb-6 md:mb-8"
            delay={0.05}
          />

          <SectionReveal className="mb-4 sm:mb-8 md:mb-12">
            <p className="text-xs sm:text-base md:text-xl text-white/50 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-none">
              Register your participation, explore competing items, and write your name in the history of MSP HSS Kalolsavam 2026.
            </p>
          </SectionReveal>

          <SectionReveal>
            <div className="flex flex-wrap gap-2.5 sm:gap-4 justify-center">
              <Link to="/student-auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 sm:px-10 py-2.5 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-white shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg,#38bdf8,#6366f1)',
                    boxShadow: '0 8px 32px -6px rgba(56,189,248,0.4)',
                  }}
                >
                  Register Now →
                </motion.button>
              </Link>
              <Link to="/items">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 sm:px-10 py-2.5 sm:py-4 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest text-white/70 border border-white/15 hover:border-white/30 transition-colors"
                >
                  Browse Items
                </motion.button>
              </Link>
            </div>
          </SectionReveal>
        </div>

        <Footer />
      </section>

    </div>
  );
};

export default Home;
