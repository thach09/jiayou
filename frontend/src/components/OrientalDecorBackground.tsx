import { useEffect, useState } from 'react';

/**
 * OrientalDecorBackground:
 * Authentic Chinese Imperial Night Sky, Great Wall & Misty Mountain Atmosphere (V7).
 * Features:
 * 1. Traditional Chinese Palace Lanterns (Cung Đăng - 宫灯) with radiant amber glow & gentle sway.
 * 2. Floating Kongming Sky Lanterns (Khổng Minh Đăng - 孔明灯) drifting peacefully in the night sky.
 * 3. Ancient Chinese imperial citadel / palace silhouette in top-right with blooming cherry blossoms.
 * 4. Panoramic Great Wall of China (Vạn Lý Trường Thành) & layered misty mountains along the bottom horizon.
 * 5. Mobile-adapted scenery: zero giant pagodas, zero intrusive buildings, soft atmospheric mountain wash.
 * 6. Continuous, seamless base (#120E10) with gradual atmospheric dissolving—zero black cutoff bands.
 */

interface AuthenticLanternProps {
  width?: number;
  height?: number;
  stringHeight?: number;
  glowBlur?: number;
  glowOpacity?: number;
}

function AuthenticChineseLantern({
  width = 38,
  height = 57,
  stringHeight = 16,
  glowBlur = 14,
  glowOpacity = 0.65,
}: AuthenticLanternProps) {
  return (
    <div
      className="relative flex flex-col items-center select-none pointer-events-none"
      style={{ transformOrigin: 'top center' }}
    >
      {/* Hanging silk cord connecting to viewport or blossom branch */}
      {stringHeight > 0 && (
        <div
          className="w-[1.2px] bg-gradient-to-b from-[#A8A29E] via-[#D97706] to-[#F59E0B] opacity-80"
          style={{ height: `${stringHeight}px` }}
        />
      )}
      <div
        className="relative"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          marginTop: stringHeight > 0 ? '-2px' : '0',
        }}
      >
        {/* Layer 1: Core warm amber glow aura */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-14px',
            background: `radial-gradient(circle at 50% 60%, rgba(251, 191, 36, ${glowOpacity}) 0%, rgba(249, 115, 22, ${glowOpacity * 0.55}) 45%, rgba(220, 38, 38, ${glowOpacity * 0.2}) 65%, transparent 75%)`,
            filter: `blur(${glowBlur}px)`,
          }}
        />
        {/* Layer 2: Wide atmospheric night peach radiance */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-28px',
            background: `radial-gradient(circle at 50% 60%, rgba(255, 141, 115, ${glowOpacity * 0.45}) 0%, rgba(243, 193, 111, ${glowOpacity * 0.22}) 40%, transparent 70%)`,
            filter: `blur(${glowBlur * 1.5}px)`,
          }}
        />
        {/* High-fidelity Authentic Silk Palace Lantern Artwork */}
        <img
          src="/assets/decor/authentic-lantern.png"
          alt=""
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
        />
      </div>
    </div>
  );
}

export function OrientalDecorBackground() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none bg-[#120E10]"
    >
      {/* 1. Multi-Layer Ambient Warm Lighting Radiance */}
      <div
        className="absolute -top-24 right-[-5%] w-[740px] h-[560px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 65% 35%, rgba(255, 141, 115, 0.16) 0%, rgba(243, 193, 111, 0.08) 32%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />
      <div
        className="absolute bottom-[-5%] right-[-5%] w-[760px] h-[520px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 70% 70%, rgba(243, 193, 111, 0.07) 0%, rgba(255, 141, 115, 0.05) 35%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* 2. Top-Right Imperial Palace Complex (Hoàng Thành & Điện Các Cung Đình) */}
      <div className="absolute top-0 right-0 w-[520px] max-w-[45vw] h-[280px] max-h-[32vh] pointer-events-none select-none overflow-hidden max-[767px]:w-[280px] max-[767px]:max-w-[70vw] max-[767px]:h-[160px]">
        <img
          src="/assets/decor/palace-top-right.jpg"
          alt=""
          className="w-full h-full object-cover object-top-right opacity-85 transition-opacity max-[767px]:opacity-65"
          style={{
            maskImage:
              'radial-gradient(ellipse 90% 85% at 90% 12%, black 35%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.18) 78%, transparent 92%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 85% at 90% 12%, black 35%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.18) 78%, transparent 92%)',
          }}
        />
      </div>

      {/* 3. Top-Right Blooming Cherry Blossom Branch (Cành Hoa Đào Son) */}
      <div className="absolute -top-3 right-0 w-[520px] max-w-[50vw] h-[210px] pointer-events-none max-[767px]:w-[320px] max-[767px]:max-w-[75vw] max-[767px]:h-[140px]">
        <svg
          viewBox="0 0 540 220"
          fill="none"
          className="w-full h-full drop-shadow-[0_4px_14px_rgba(255,141,115,0.3)]"
        >
          {/* Main Gnarled Branches */}
          <path
            d="M 545 0 Q 420 50 320 25 Q 240 5 180 38 Q 140 60 110 50"
            stroke="#4A2F27"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 440 28 Q 380 90 320 85 Q 270 80 230 110"
            stroke="#4A2F27"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 330 27 Q 290 60 250 55"
            stroke="#4A2F27"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 245 10 Q 210 32 180 26"
            stroke="#4A2F27"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 490 15 Q 460 70 410 75"
            stroke="#4A2F27"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Blossom Clusters (Hoa Đào Cổ Thụ) */}
          {[
            { x: 505, y: 15, r: 1.1, rot: 15 },
            { x: 460, y: 32, r: 1.25, rot: 42 },
            { x: 425, y: 68, r: 0.95, rot: 78 },
            { x: 385, y: 88, r: 1.15, rot: 120 },
            { x: 345, y: 28, r: 1.3, rot: 5 },
            { x: 310, y: 75, r: 1.05, rot: 65 },
            { x: 280, y: 48, r: 0.9, rot: 140 },
            { x: 245, y: 98, r: 1.1, rot: 88 },
            { x: 220, y: 22, r: 1.2, rot: 33 },
            { x: 185, y: 35, r: 0.85, rot: 95 },
            { x: 150, y: 55, r: 0.95, rot: 50 },
            { x: 115, y: 48, r: 0.8, rot: 110 },
            { x: 440, y: 80, r: 0.85, rot: 160 },
            { x: 370, y: 40, r: 0.75, rot: 25 },
            { x: 275, y: 105, r: 0.7, rot: 70 },
          ].map((flower, idx) => (
            <g
              key={idx}
              transform={`translate(${flower.x} ${flower.y}) scale(${flower.r}) rotate(${flower.rot})`}
            >
              {/* Petals */}
              {[0, 72, 144, 216, 288].map((angle, pIdx) => (
                <ellipse
                  key={pIdx}
                  cx="0"
                  cy="-7"
                  rx="4.2"
                  ry="6.5"
                  transform={`rotate(${angle})`}
                  fill={pIdx % 2 === 0 ? '#E04F42' : '#FF8D73'}
                  opacity="0.94"
                />
              ))}
              {/* Center Stamen & Golden Core */}
              <circle cx="0" cy="0" r="2.8" fill="#FFF275" opacity="0.96" />
              <circle cx="0" cy="0" r="1.4" fill="#B45309" />
            </g>
          ))}

          {/* Drifting Petals with subtle motion */}
          {[
            { x: 410, y: 115, rot: 25, s: 0.9 },
            { x: 340, y: 140, rot: 70, s: 0.8 },
            { x: 250, y: 155, rot: 45, s: 0.85 },
            { x: 180, y: 125, rot: 80, s: 0.75 },
          ].map((petal, idx) => (
            <path
              key={idx}
              d="M 0 -5 C 3 -2, 3 3, 0 5 C -3 3, -3 -2, 0 -5 Z"
              fill="#FF8D73"
              opacity="0.82"
              transform={`translate(${petal.x} ${petal.y}) scale(${petal.s}) rotate(${petal.rot})`}
            />
          ))}
        </svg>
      </div>

      {/* 4. Authentic Traditional Chinese Hanging Palace Lanterns (Cung Đăng - 宫灯) */}
      <div
        data-lanterns
        className={`absolute inset-x-0 top-0 h-[480px] pointer-events-none transition-opacity duration-300 motion-reduce:transition-none ${
          isScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Distant Lantern A (V8.1): Small scale, muted amber glow in upper mid-left sky */}
        <div
          className="hidden md:block absolute right-[63%] top-1 z-[9] animate-lantern-sway opacity-80"
          style={{
            transformOrigin: 'top center',
            animationDuration: '10.5s',
            animationDelay: '-4.2s',
          }}
        >
          <AuthenticChineseLantern
            width={20}
            height={30}
            stringHeight={20}
            glowBlur={9}
            glowOpacity={0.38}
          />
        </div>

        {/* Primary Palace Lantern 1: Hanging from top roofbeam above header */}
        <div
          className="hidden sm:block absolute right-[51%] top-0 z-10 animate-lantern-sway"
          style={{
            transformOrigin: 'top center',
            animationDuration: '8.5s',
            animationDelay: '-2.5s',
          }}
        >
          <AuthenticChineseLantern
            width={36}
            height={54}
            stringHeight={14}
            glowBlur={13}
            glowOpacity={0.58}
          />
        </div>

        {/* Distant Lantern B (V8.1): Small scale, depth between Lantern 1 and blossom branch */}
        <div
          className="hidden lg:block absolute right-[39.5%] top-2 z-[9] animate-lantern-sway opacity-75"
          style={{
            transformOrigin: 'top center',
            animationDuration: '9.2s',
            animationDelay: '-1.8s',
          }}
        >
          <AuthenticChineseLantern
            width={19}
            height={28.5}
            stringHeight={15}
            glowBlur={8}
            glowOpacity={0.35}
          />
        </div>

        {/* Primary Palace Lantern 2: Hanging from cherry blossom branch */}
        <div
          className="absolute right-[27.3%] top-2 z-10 animate-lantern-sway"
          style={{ transformOrigin: 'top center', animationDuration: '7s' }}
        >
          <AuthenticChineseLantern
            width={38}
            height={57}
            stringHeight={18}
            glowBlur={14}
            glowOpacity={0.65}
          />
        </div>
      </div>

      {/* 5. Continuous Lower Scenery: Great Wall & Misty Mountains (Desktop) — Anchored to actual document bottom */}
      <div className="hidden sm:block absolute bottom-0 inset-x-0 h-[480px] pointer-events-none select-none overflow-hidden">
        <img
          src="/assets/decor/great-wall-mountains.jpg"
          alt=""
          className="w-full h-full object-cover object-[center_35%] opacity-90"
          style={{
            maskImage:
              'linear-gradient(to top, black 45%, rgba(0,0,0,0.45) 75%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 45%, rgba(0,0,0,0.45) 75%, transparent 100%)',
          }}
        />

        {/* Smooth, gradual base vignette dissolving completely into #120E10 at the bottom edge */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E10] from-2% via-transparent to-transparent opacity-60" />
      </div>

      {/* 6. Mobile Scenery: Zero giant pagodas, zero intrusive buildings, subtle misty mountain wash */}
      <div className="block sm:hidden absolute bottom-0 inset-x-0 h-[190px] pointer-events-none select-none overflow-hidden">
        <svg
          viewBox="0 0 390 190"
          className="w-full h-full text-[#1A1416] opacity-35"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          {/* Distant gentle mountain ridge */}
          <path d="M 0 190 L 0 95 Q 80 60 160 85 T 300 65 Q 350 75 390 80 L 390 190 Z" opacity="0.6" />
          {/* Foreground mountain ridge with soft mist transition */}
          <path d="M 0 190 L 0 120 Q 110 95 210 125 T 390 110 L 390 190 Z" opacity="0.85" />
        </svg>

        {/* Soft mobile gradient dissolving seamlessly into the base warm background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E10] from-5% via-[#120E10]/40 to-transparent" />
      </div>
    </div>
  );
}
