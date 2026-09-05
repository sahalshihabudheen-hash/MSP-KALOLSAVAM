import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/* ── Shared gradient — identical in LoadingScreen and Hero ── */
export const TITLE_GRADIENT = 'linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.75) 50%, rgba(56,189,248,0.7) 100%)';

/* ── Smooth spring config for shared layout transitions ── */
export const LAYOUT_SPRING = { type: 'spring' as const, stiffness: 60, damping: 18, mass: 1 };

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = 2400 / 20;
    let step = 0;
    const t = setInterval(() => {
      step++;
      setProgress(Math.floor(Math.min(100, Math.pow(step / steps, 0.5) * 100)));
      if (step >= steps) { clearInterval(t); setTimeout(onComplete, 200); }
    }, 20);
    return () => clearInterval(t);
  }, [onComplete]);

  return (
    <motion.div
      key="loading-screen"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#050c18' }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
    >
      {/* Slow-spinning Pookalam — full screen, centered */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 pointer-events-none"
        style={{
          width: '90vmin',
          height: '90vmin',
          marginLeft: '-45vmin',
          marginTop: '-45vmin',
          backgroundImage: 'url(/assets/pookalam_t.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
        }}
      />

      {/* Centered small progress bar */}
      <div className="absolute flex flex-col items-center gap-2">
        {/* Track */}
        <div className="w-40 h-[1px] bg-white/10 rounded-full overflow-hidden">
          {/* Fill */}
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(99,102,241,0.9) 0%, rgba(56,189,248,1) 100%)',
              boxShadow: '0 0 8px rgba(56,189,248,0.7)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
