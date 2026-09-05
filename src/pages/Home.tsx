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
    if (direction === 'left') return { opacity: 0, x: -150, filter: 'blur(20px)' };
    if (direction === 'right') return { opacity: 0, x: 150, filter: 'blur(20px)' };
    return { opacity: 0, y: 150, filter: 'blur(20px)' };
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: false, margin: '-15%' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
    <div className={`pb-3 ${className}`}>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)', rotateX: -20 }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{
              duration: 1.2,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ display: 'inline-block', transformOrigin: 'bottom center' }}
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
      initial={{ opacity: 0, y: 60, filter: 'blur(15px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-3 p-6 rounded-3xl border border-white/10 backdrop-blur-sm"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-4xl md:text-5xl font-black text-white">{value}</span>
      <span className="text-white/50 text-sm font-semibold uppercase tracking-widest text-center">{label}</span>
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
      initial={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 p-5 rounded-2xl border border-white/8 hover:border-brand-accent/30 hover:bg-white/5 transition-all duration-500 group cursor-default"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110"
        style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.2)' }}>
        <Icon size={20} className="text-brand-accent" />
      </div>
      <div>
        <h3 className="font-bold text-white mb-1">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      </div>
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
      <div className="snap-start w-full h-[100dvh]">
        <Hero />
      </div>

      {/* ══ FRAME 2: About ═════════════════════════════════════════════ */}
      <section id="about" className="snap-start sticky top-0 z-10 h-[100dvh] bg-[#0b1121] flex flex-col justify-center items-center w-full px-6 md:px-20 overflow-hidden">

        {/* Pookalam bg */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <motion.img
            src="/assets/pookalam.svg"
            alt=""
            animate={{ rotate: 360 }}
            transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
            className="w-[110vmin] h-[110vmin] opacity-[0.07] object-contain"
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
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-6">
              <Sparkles size={12} /> Who We Are <Sparkles size={12} />
            </span>
          </SectionReveal>

          <AnimatedHeading
            text="About the Kalolsavam"
            className="text-5xl md:text-7xl font-black text-white mb-8 leading-none tracking-tighter"
            delay={0.1}
          />

          <SectionReveal direction="right" className="mb-10">
            <p className="text-lg md:text-xl text-white/55 leading-relaxed font-medium">
              The MSP HSS Kalolsavam is the premier cultural arts festival showcasing the incredible
              talents of our students. From traditional dance forms to modern artistic expressions,
              this week-long celebration is a testament to the rich heritage and vibrant future of Kerala's arts.
            </p>
          </SectionReveal>

          <SectionReveal>
            <div className="flex flex-wrap justify-center gap-3">
              {['Classical Arts', 'Music', 'Drama', 'Literature', 'Fine Arts', 'Folk Arts'].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white/70 border border-white/10 backdrop-blur-sm"
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
      <section className="snap-start sticky top-0 z-20 h-[100dvh] bg-[#0b1121] flex flex-col justify-center w-full px-6 md:px-20 overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        {/* Subtle gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />

        {/* Doodle arts */}
        <motion.img src="/assets/color_sitar.png" className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none" style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} alt="" />
        <motion.img src="/assets/color_mudra.png" className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none" style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} alt="" />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="mb-16">
            <SectionReveal>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-4">
                <Star size={12} /> The Festival in Numbers
              </span>
            </SectionReveal>
            <AnimatedHeading
              text="Celebrating Excellence"
              className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter"
              delay={0.05}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <SectionReveal direction="left" className="w-full">
              <StatCard value="500+" label="Student Participants" icon={Users} delay={0.1} />
            </SectionReveal>
            <SectionReveal direction="left" className="w-full">
              <StatCard value="80+"  label="Art Items"            icon={Palette} delay={0.2} />
            </SectionReveal>
            <SectionReveal direction="right" className="w-full">
              <StatCard value="5"    label="Days of Festivities"  icon={CalendarDays} delay={0.3} />
            </SectionReveal>
            <SectionReveal direction="right" className="w-full">
              <StatCard value="30+"  label="Years of Legacy"      icon={Award} delay={0.4} />
            </SectionReveal>
          </div>

          <SectionReveal direction="up" className="mt-14">
            <p className="text-white/35 text-sm font-medium text-center tracking-wide">
              Held annually at MSP HSS Campus, Malappuram · Oct 15 – 20, 2026
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* ══ FRAME 4: Art Categories ════════════════════════════════════ */}
      <section className="snap-start sticky top-0 z-30 h-[100dvh] bg-[#0b1121] flex flex-col justify-center w-full px-6 md:px-20 overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

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

        <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          <div>
            <SectionReveal direction="left">
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-4">
                <Music size={12} /> Art Forms
              </span>
            </SectionReveal>
            <AnimatedHeading
              text="Every Art Has a Stage"
              className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter mb-8"
              delay={0.05}
            />
            <SectionReveal direction="left">
              <p className="text-white/50 text-base md:text-lg leading-relaxed mb-8">
                From the delicate notes of classical Carnatic music to the energetic beats of folk percussion — every artistic expression finds its spotlight at the Kalolsavam.
              </p>
            </SectionReveal>
            <SectionReveal>
              <Link to="/items">
                <motion.button
                  whileHover={{ scale: 1.04, x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-bold text-white text-sm tracking-wide"
                  style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}
                >
                  View All Items <ArrowRight size={16} />
                </motion.button>
              </Link>
            </SectionReveal>
          </div>

          <div className="flex flex-col gap-3">
            <SectionReveal direction="right">
              <ArtCard icon={Music}   title="Classical Music"        desc="Carnatic, Hindustani vocal & instrumental competitions across all age groups."    delay={0.1} />
            </SectionReveal>
            <SectionReveal direction="right">
              <ArtCard icon={Drama}   title="Drama & Performing Arts" desc="Stage plays, mime, mono-act, and group dance performances."                      delay={0.2} />
            </SectionReveal>
            <SectionReveal direction="right">
              <ArtCard icon={Palette} title="Visual Arts"             desc="Painting, sketching, collage-making, and on-the-spot drawing."                    delay={0.3} />
            </SectionReveal>
            <SectionReveal direction="right">
              <ArtCard icon={Users}   title="Folk & Traditional"      desc="Thiruvathira, Oppana, Duffmuttu, and other rich Kerala folk traditions."           delay={0.4} />
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ══ FRAME 5: Gallery Preview ════════════════════════════════════ */}
      <section id="gallery" className="snap-start sticky top-0 z-40 h-[100dvh] bg-[#0b1121] flex flex-col justify-center w-full px-6 md:px-20 overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 40%, rgba(99,102,241,0.07) 0%, transparent 70%)' }} />

        {/* Doodle arts */}
        <motion.img src="/assets/color_sitar.png" className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none" style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} alt="" />
        <motion.img src="/assets/color_mudra.png" className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none" style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} alt="" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">

          <div className="flex justify-between items-end mb-8 md:mb-12">
            <div>
              <SectionReveal>
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-3">
                  <ImageIcon size={12} /> Captured Moments
                </span>
              </SectionReveal>
              <AnimatedHeading
                text="Festival Gallery"
                className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter"
                delay={0.05}
              />
            </div>
            <SectionReveal>
              <Link to="/gallery" className="hidden md:inline-flex items-center gap-2 px-7 py-3 text-white font-bold rounded-full text-sm hover:-translate-y-1 transition-all" style={{ background: 'linear-gradient(135deg,#38bdf8,#6366f1)' }}>
                View All <ArrowRight size={14} />
              </Link>
            </SectionReveal>
          </div>

          {isLoadingPreview ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent" />
            </div>
          ) : previewImages.filter(img => img && img.length > 10 && img !== 'undefined').length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {previewImages.filter(img => img && img.length > 10 && img !== 'undefined').slice(0, 6).map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ delay: i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-2xl overflow-hidden group cursor-pointer ${i === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''}`}
                  style={{ aspectRatio: i === 0 ? '1/1' : '4/3' }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-end p-4">
                      <span className="text-white text-xs font-bold tracking-widest uppercase translate-y-2 group-hover:translate-y-0 transition-transform duration-500">View</span>
                    </div>
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      onError={e => { (e.target as HTMLImageElement).closest('div')!.style.display = 'none'; }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-white/30">
              <ImageIcon size={48} className="opacity-20 mb-4" />
              <p className="font-medium">Gallery photos coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* ══ FRAME 6: Hall of Fame (conditional) ════════════════════════ */}
      {hallOfFameEntries.length > 0 && (
        <div className="snap-start sticky top-0 z-50 bg-[#0b1121] w-full h-[100dvh] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <HallOfFameSection entries={hallOfFameEntries} />
        </div>
      )}

      {/* ══ FRAME 6/7: CTA + Footer ════════════════════════════════════ */}
      <section className="snap-start sticky top-0 z-[60] bg-[#0b1121] h-[100dvh] flex flex-col justify-between overflow-hidden border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

        {/* Radial glow bg */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)' }} />
        </div>

        {/* Doodle arts */}
        <motion.img src="/assets/color_sitar.png" className="hidden md:block absolute top-20 left-6 w-[280px] pointer-events-none" style={{ opacity: 0.22, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, -18, 0], rotate: [0, 3, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} alt="" />
        <motion.img src="/assets/color_mudra.png" className="hidden md:block absolute -bottom-8 -right-12 w-[340px] pointer-events-none" style={{ opacity: 0.2, mixBlendMode: 'screen', filter: 'saturate(1.5)' }} animate={{ y: [0, 16, 0], rotate: [0, -3, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }} alt="" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 md:px-20">

          <SectionReveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-8">
              <Sparkles size={12} /> Join the Festival
            </span>
          </SectionReveal>

          <AnimatedHeading
            text="Be Part of the Legacy"
            className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter mb-8"
            delay={0.05}
          />

          <SectionReveal className="mb-12">
            <p className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed">
              Register your participation, explore competing items, and write your name in the history of MSP HSS Kalolsavam 2026.
            </p>
          </SectionReveal>

          <SectionReveal>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/student-auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest text-white shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg,#38bdf8,#6366f1)',
                    boxShadow: '0 12px 40px -8px rgba(56,189,248,0.4)',
                  }}
                >
                  Register Now →
                </motion.button>
              </Link>
              <Link to="/items">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest text-white/70 border border-white/15 hover:border-white/30 transition-colors"
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
