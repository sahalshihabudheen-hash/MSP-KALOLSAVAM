import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getSystemSettings } from '../lib/db';
import { TITLE_GRADIENT, LAYOUT_SPRING } from './LoadingScreen';

/* ─── Scroll-reveal wrapper ────────────────────────────────────────── */
const Reveal = ({
  children,
  delay = 0,
  y = 40,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-5%' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Countdown ────────────────────────────────────────────────────── */
const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center mx-2 md:mx-4">
    <div
      className="rounded-2xl flex items-center justify-center shadow-lg"
      style={{
        width: 72, height: 72,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span className="text-2xl md:text-3xl font-black text-white tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] md:text-xs text-white/40 mt-2 tracking-[0.2em] uppercase font-semibold">
      {label}
    </span>
  </div>
);

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const startTimer = (targetTime: number) => {
      const updateTimer = () => {
        const distance = targetTime - Date.now();
        if (distance < 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          clearInterval(timer);
          return;
        }
        setTimeLeft({
          days:    Math.floor(distance / 86400000),
          hours:   Math.floor((distance % 86400000) / 3600000),
          minutes: Math.floor((distance % 3600000)  / 60000),
          seconds: Math.floor((distance % 60000)    / 1000),
        });
      };
      updateTimer();
      if (timer) clearInterval(timer);
      timer = setInterval(updateTimer, 1000);
    };

    const init = async () => {
      const cached = localStorage.getItem('kal_countdown');
      if (cached) {
        const t = parseInt(cached);
        if (t > Date.now()) startTimer(t);
      }
      try {
        const settings = await getSystemSettings();
        // Use settings date OR fall back to default festival date
        const dateStr = settings.endDate || '2027-10-20';
        const [y, m, d] = dateStr.split('-').map(Number);
        const target = new Date(y, m - 1, d, 23, 59, 59).getTime();
        if (target > Date.now()) {
          localStorage.setItem('kal_countdown', target.toString());
          startTimer(target);
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          localStorage.removeItem('kal_countdown');
        }
      } catch (e) {
        // If backend unreachable, use default date
        const target = new Date(2027, 9, 20, 23, 59, 59).getTime();
        if (target > Date.now()) startTimer(target);
      }
    };

    init();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-1">
      <CountdownUnit value={timeLeft.days}    label="Days" />
      <span className="text-white/20 text-3xl font-thin mb-4">:</span>
      <CountdownUnit value={timeLeft.hours}   label="Hours" />
      <span className="text-white/20 text-3xl font-thin mb-4">:</span>
      <CountdownUnit value={timeLeft.minutes} label="Mins" />
      <span className="text-white/20 text-3xl font-thin mb-4">:</span>
      <CountdownUnit value={timeLeft.seconds} label="Secs" />
    </div>
  );
};

/* ─── Background rotating images ──────────────────────────────────── */
const backgroundImages = ['/assets/hero-bg-1.jpg', '/assets/hero-bg-2.jpg', '/assets/hero-bg-3.jpg'];

/* ─── Hero ─────────────────────────────────────────────────────────── */
const Hero = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: false, margin: '-5%' });

  useEffect(() => {
    const id = setInterval(() => setCurrentBg(p => (p + 1) % backgroundImages.length), 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div ref={heroRef} className="relative min-h-screen flex flex-col overflow-hidden justify-center">

      {/* ── Subtle rotating BG photo overlay ────────────────────── */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentBg}
          src={backgroundImages[currentBg]}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 0.07, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          alt=""
          style={{ willChange: 'opacity' }}
        />
      </AnimatePresence>

      {/* ── Floating festival art ─────────────────────────────── */}
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

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-center items-center px-6 md:px-20 h-[100dvh] gap-3 md:gap-4 py-16">


        {/* Logo — shared via layoutId, spring-animates from loading screen */}
        <motion.img
          layoutId="hero-logo"
          src="/assets/msp-logo-transparent-v2.png"
          alt="MSP Logo"
          className="h-16 md:h-24 w-auto drop-shadow-xl"
          transition={LAYOUT_SPRING}
        />

        {/* Sparkle tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 justify-center"
        >
          <Sparkles size={14} className="text-brand-accent" />
          <span className="text-xs md:text-sm tracking-[0.25em] uppercase font-bold text-white/50">
            MSP HSS Malappuram
          </span>
          <Sparkles size={14} className="text-brand-accent" />
        </motion.div>

        {/* Title — shared via layoutId, spring-animates from loading screen */}
        <motion.h1
          layoutId="hero-title"
          transition={LAYOUT_SPRING}
          className="pb-2 text-center"
          style={{
            fontFamily: "'Baloo Chettan 2', cursive",
            fontSize: 'clamp(2.5rem, 10vw, 7.5rem)',
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: TITLE_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          കലോത്സവം
        </motion.h1>

        <Reveal y={30} delay={0.2} className="text-center">
          <h2 className="text-lg md:text-3xl font-light text-white/40 tracking-[0.2em] uppercase">
            Arts Festival <span className="text-brand-accent font-bold">2026</span>
          </h2>
        </Reveal>

        {/* Countdown */}
        <Reveal y={24} delay={0.3} className="mt-4 md:mt-8 scale-90 md:scale-100 origin-center md:origin-left">
          <CountdownTimer />
        </Reveal>

        <Reveal y={20} delay={0.4} className="mt-4 md:mt-6 flex justify-center">
          <Link to="/student-auth">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest text-white shadow-2xl cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                boxShadow: '0 12px 48px -8px rgba(56,189,248,0.45)',
              }}
            >
              Register Now →
            </motion.div>
          </Link>
        </Reveal>
      </div>
    </div>
  );
};

export default Hero; 
