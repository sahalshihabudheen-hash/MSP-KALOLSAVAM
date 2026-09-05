import { useRef } from 'react';

/* ─── Cinematic Dark Background ─────────────────────────────────────
   Performance-optimised: orbs use NO filter:blur (GPU killer).
   Instead, the glow comes from a large radial-gradient with low
   opacity. CSS animations only animate `opacity` and `transform`
   (compositor-thread — zero main-thread paint cost).
──────────────────────────────────────────────────────────────────── */

const LiquidBackground = () => {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const blob4Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
      style={{
        background: 'linear-gradient(160deg, #07101f 0%, #0b1a38 30%, #0d2248 60%, #080e1c 100%)',
      }}
    >
      <style>{`
        /* ── Animated orbs — NO filter:blur, gradient does the softness ── */
        .cin-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          /* translateZ promotes to own compositor layer — no repaint */
          transform: translateZ(0);
          will-change: opacity;
        }
        /* Animate only opacity — cheapest possible GPU operation */
        @keyframes cpulse1 { 0%,100%{opacity:0.7} 50%{opacity:1.0} }
        @keyframes cpulse2 { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
        @keyframes cpulse3 { 0%,100%{opacity:0.6} 50%{opacity:0.9} }
        @keyframes cpulse4 { 0%,100%{opacity:0.4} 50%{opacity:0.75} }

        .cin-b1 {
          top:-10%; left:-10%; width:700px; height:700px;
          background: radial-gradient(circle, rgba(14,165,233,0.28) 0%, rgba(14,165,233,0.10) 40%, transparent 70%);
          animation: cpulse1 18s ease-in-out infinite;
        }
        .cin-b2 {
          top:20%; right:-15%; width:800px; height:800px;
          background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.08) 40%, transparent 70%);
          animation: cpulse2 22s ease-in-out infinite 1.5s;
        }
        .cin-b3 {
          bottom:-10%; left:5%; width:650px; height:650px;
          background: radial-gradient(circle, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0.06) 40%, transparent 70%);
          animation: cpulse3 25s ease-in-out infinite 3s;
        }
        .cin-b4 {
          bottom:-5%; right:0; width:600px; height:600px;
          background: radial-gradient(circle, rgba(168,85,247,0.20) 0%, rgba(168,85,247,0.06) 40%, transparent 70%);
          animation: cpulse4 20s ease-in-out infinite 2s;
        }

        /* ── Scan lines (static — zero animation cost) ── */
        .cin-scanlines {
          position:absolute; inset:0; pointer-events:none;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px
          );
        }

        /* ── Vignette (static) ── */
        .cin-vignette {
          position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(ellipse at 50% 50%,
            transparent 40%,
            rgba(0,0,0,0.5) 100%
          );
        }

        /* ── Light streaks (static, no animation) ── */
        .cin-streak {
          position:absolute;
          top:0; right:25%; bottom:0; width:1px;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(14,165,233,0.3) 25%,
            rgba(99,102,241,0.2) 60%,
            transparent 100%
          );
          transform: rotate(12deg) translateZ(0);
          transform-origin: top center;
          pointer-events: none;
        }
        .cin-streak2 {
          position:absolute;
          top:0; left:15%; bottom:0; width:1px;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(168,85,247,0.18) 30%,
            rgba(16,185,129,0.12) 65%,
            transparent 100%
          );
          transform: rotate(-8deg) translateZ(0);
          transform-origin: top center;
          pointer-events: none;
        }
      `}</style>

      {/* Orbs — GPU-friendly, no filter:blur */}
      <div className="cin-blob cin-b1" ref={blob1Ref} />
      <div className="cin-blob cin-b2" ref={blob2Ref} />
      <div className="cin-blob cin-b3" ref={blob3Ref} />
      <div className="cin-blob cin-b4" ref={blob4Ref} />

      {/* Static atmospheric layers */}
      <div className="cin-scanlines" />
      <div className="cin-streak" />
      <div className="cin-streak2" />
      <div className="cin-vignette" />
    </div>
  );
};

export default LiquidBackground;
