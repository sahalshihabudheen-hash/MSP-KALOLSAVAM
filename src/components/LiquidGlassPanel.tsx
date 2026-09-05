import { type ReactNode } from 'react';

/**
 * LiquidGlassPanel
 *
 * Replicates the zqysl/liquid-glass-webgl look (Blur=4, Edge=0.85, Radius=60)
 * using CSS backdrop-filter + a very subtle directional highlight + inset rim glow.
 *
 * Key rule: keep white overlays VERY low (< 0.12) so the gradient behind shines through.
 */

interface LiquidGlassPanelProps {
  children: ReactNode;
  className?: string;
  /** Blur amount. Default 4 matches demo "Blur=4" (scaled to ~14px CSS blur). */
  blurPx?: number;
  /** Edge highlight strength 0–1. Default 0.85 matches demo "Edge=0.85". */
  edgeStart?: number;
  /** Border radius in px. 9999 = pill. Default 60 matches demo "Radius=60". */
  borderRadiusPx?: number;
  /** If true, adds a spinning light effect on the border (PC only) */
  animatedEdge?: boolean;
  style?: React.CSSProperties;
}

export function LiquidGlassPanel({
  children,
  className = '',
  blurPx = 4,
  edgeStart = 0.85,
  borderRadiusPx = 60,
  animatedEdge = false,
  style,
}: LiquidGlassPanelProps) {
  const radiusCss = borderRadiusPx >= 9999 ? '9999px' : `${borderRadiusPx}px`;
  const e = edgeStart; // shorthand

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius: radiusCss, ...style }}
    >
      {/* ── Layer 1: The actual glass blur — lets the gradient glow through ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radiusCss,
          // Reduced blur for 60fps — perceptually identical on dark backgrounds
          backdropFilter: `blur(${Math.round(blurPx * 1.5)}px) saturate(140%)`,
          WebkitBackdropFilter: `blur(${Math.round(blurPx * 1.5)}px) saturate(140%)`,
          backgroundColor: 'rgba(255,255,255,0.08)',
          zIndex: 0,
        }}
      />

      {/* ── Layer 2: Directional specular highlight (top-left rim only) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radiusCss,
          // The highlight is concentrated on the top edge only, like the demo lens rim
          background: `linear-gradient(
            160deg,
            rgba(255,255,255,${(e * 0.22).toFixed(2)}) 0%,
            rgba(255,255,255,0.04) 30%,
            rgba(255,255,255,0.0) 60%,
            rgba(255,255,255,${(e * 0.06).toFixed(2)}) 100%
          )`,
          zIndex: 1,
        }}
      />

      {/* ── Layer 3: Inset lens rim — bright top, subtle sides ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radiusCss,
          boxShadow: `
            inset 0  1.5px 0 rgba(255,255,255,${(e * 0.80).toFixed(2)}),
            inset 0   -1px 0 rgba(255,255,255,${(e * 0.20).toFixed(2)}),
            inset  1px 0 0 rgba(255,255,255,${(e * 0.45).toFixed(2)}),
            inset -1px 0 0 rgba(255,255,255,${(e * 0.15).toFixed(2)}),
            0 8px 32px rgba(0,0,0,0.08),
            0 2px 8px  rgba(0,0,0,0.04)
          `,
          border: `1px solid rgba(255,255,255,${(e * 0.38).toFixed(2)})`,
          zIndex: 2,
        }}
      />

      {/* ── Layer 3.5: Animated Glowing Edge (Optional) ── */}
      {animatedEdge && (
        <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 2.5, borderRadius: radiusCss, overflow: 'hidden' }}>
          <style>
            {`
              @keyframes spinEdge {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes colorCycle {
                0% { opacity: 0.8; }
                50% { opacity: 1; }
                100% { opacity: 0.8; }
              }
              .animated-edge-glow::before {
                content: "";
                position: absolute;
                inset: -50%;
                /* A single bright cyan beam that spins */
                background: conic-gradient(
                  from 0deg, 
                  transparent 70%, 
                  rgba(6, 182, 212, 0.4) 85%, 
                  rgba(34, 211, 238, 1) 100%
                );
                animation: 
                  spinEdge 3s linear infinite,
                  colorCycle 8s linear infinite;
              }
            `}
          </style>
          {/* Outer container with the spinning gradient */}
          <div className="animated-edge-glow absolute inset-0"
               style={{
                 borderRadius: radiusCss,
                 padding: '2px',
                 WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                 WebkitMaskComposite: 'xor',
                 maskComposite: 'exclude',
               }}
          >
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative h-full w-full flex items-center justify-center" style={{ zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}
