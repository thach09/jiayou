import { useEffect, useState } from 'react';

/**
 * OrientalDecorBackground:
 * Authentic Chinese Imperial Night Sky & Citadel Atmosphere matching the approved reference design.
 * Features:
 * 1. Traditional Chinese Palace Lanterns (Cung Đăng - 宫灯) with radiant amber glow & gentle sway.
 * 2. Ancient Chinese imperial citadel / palace / capital silhouette (Hoàng Thành & Môn Lâu) in top-right.
 * 3. Blooming vermilion cherry blossom branches (Cành Đào Son) in top-right with drifting petals.
 * 4. Layered Three Kingdoms mountain pass & illuminated ancient pagoda on the misty horizon.
 * 5. Multi-layer ambient warm lighting gradients (#120E10, #181214, #FF8D73).
 */
interface LanternProps {
  width?: number;
  height?: number;
  stringHeight?: number;
  glowInset?: number;
  glowBlur?: number;
  glowOpacity?: number;
}

function ChinesePalaceLantern({
  width = 38,
  height = 60,
  stringHeight = 22,
  glowInset = -16,
  glowBlur = 14,
  glowOpacity = 0.55,
}: LanternProps) {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Hanging silk cord */}
      <div
        className="w-[1.2px] bg-gradient-to-b from-[#78716C] via-[#B45309] to-[#F59E0B] opacity-80"
        style={{ height: `${stringHeight}px` }}
      />
      <div
        className="relative"
        style={{ width: `${width}px`, height: `${height}px`, marginTop: '-2px' }}
      >
        {/* Layer 1: Intense Inner Amber Halo */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: `${glowInset}px`,
            background: `radial-gradient(circle, rgba(251, 191, 36, ${glowOpacity}) 0%, rgba(249, 115, 22, ${glowOpacity * 0.6}) 40%, rgba(220, 38, 38, ${glowOpacity * 0.22}) 65%, transparent 80%)`,
            filter: `blur(${glowBlur}px)`,
          }}
        />
        {/* Layer 2: Soft Atmospheric Night Room Glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: `${glowInset * 1.8}px`,
            background: `radial-gradient(circle, rgba(255, 141, 115, ${glowOpacity * 0.35}) 0%, rgba(243, 193, 111, ${glowOpacity * 0.2}) 45%, transparent 75%)`,
            filter: `blur(${glowBlur * 1.7}px)`,
          }}
        />

        <svg
          viewBox="0 0 48 76"
          fill="none"
          className="w-full h-full drop-shadow-[0_0_14px_rgba(251,191,36,0.65)]"
        >
          <defs>
            <radialGradient id="lantern-body-grad" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="16%" stopColor="#FEF08A" />
              <stop offset="42%" stopColor="#FBBF24" />
              <stop offset="68%" stopColor="#F97316" />
              <stop offset="86%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#881337" />
            </radialGradient>
            <linearGradient id="lantern-cap-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6B1D1D" />
              <stop offset="100%" stopColor="#2D0606" />
            </linearGradient>
            <filter id="lantern-flame-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* Top suspension loop */}
          <circle cx="24" cy="2.5" r="2" stroke="#B45309" strokeWidth="0.9" fill="none" />

          {/* Top Cap (Mahogany / Oxblood wooden lid with gold accent) */}
          <rect x="13" y="4" width="22" height="3.2" rx="1.2" fill="url(#lantern-cap-grad)" />
          <line x1="14" y1="4.6" x2="34" y2="4.6" stroke="#FBBF24" strokeWidth="0.6" opacity="0.8" />

          {/* Traditional Chinese Barrel Silk Body */}
          <path
            d="M 14 7 Q 24 6.2 34 7 Q 38 28 34 49 Q 24 49.8 14 49 Q 10 28 14 7 Z"
            fill="url(#lantern-body-grad)"
          />

          {/* Vertical Bamboo Ribs (Nan tre dọc 3D) */}
          <line x1="24" y1="7" x2="24" y2="49" stroke="#78350F" strokeWidth="0.8" opacity="0.65" />
          <path d="M 19 7 Q 15 28 19 49" stroke="#78350F" strokeWidth="0.75" fill="none" opacity="0.55" />
          <path d="M 29 7 Q 33 28 29 49" stroke="#78350F" strokeWidth="0.75" fill="none" opacity="0.55" />
          <path d="M 14 7 Q 10 28 14 49" stroke="#991B1B" strokeWidth="0.85" fill="none" opacity="0.5" />
          <path d="M 34 7 Q 38 28 34 49" stroke="#991B1B" strokeWidth="0.85" fill="none" opacity="0.5" />

          {/* Horizontal Structural Rings (Nan vành ngang lụa) */}
          <path d="M 11.8 19 Q 24 21.5 36.2 19" stroke="#9A3412" strokeWidth="0.65" fill="none" opacity="0.5" />
          <path d="M 10 28 Q 24 31 38 28" stroke="#9A3412" strokeWidth="0.65" fill="none" opacity="0.5" />
          <path d="M 11.8 37 Q 24 39.5 36.2 37" stroke="#9A3412" strokeWidth="0.65" fill="none" opacity="0.5" />

          {/* Glowing Candle Flame Core */}
          <ellipse cx="24" cy="27" rx="8" ry="10.5" fill="#FEF08A" opacity="0.85" filter="url(#lantern-flame-blur)" />
          <ellipse cx="24" cy="27" rx="4" ry="6" fill="#FFFFFF" opacity="0.95" />

          {/* Bottom Cap (Mahogany / Oxblood collar with gold accent) */}
          <rect x="13" y="48.8" width="22" height="3.2" rx="1.2" fill="url(#lantern-cap-grad)" />
          <line x1="14" y1="51.4" x2="34" y2="51.4" stroke="#FBBF24" strokeWidth="0.6" opacity="0.8" />

          {/* Golden Bead (Hạt ngọc hoàng kim) */}
          <line x1="24" y1="52" x2="24" y2="54.5" stroke="#B91C1C" strokeWidth="1.2" />
          <circle cx="24" cy="56" r="2.2" fill="#FBBF24" stroke="#D97706" strokeWidth="0.5" />

          {/* Flowing Red Silk Tassel (Tua rua lụa đỏ - 流苏) */}
          <path d="M 22.8 58.2 L 25.2 58.2 L 25.8 72.5 L 24 75 L 22.2 72.5 Z" fill="#DC2626" opacity="0.95" />
          <line x1="23.2" y1="58.5" x2="22.6" y2="72.5" stroke="#B91C1C" strokeWidth="0.75" opacity="0.85" />
          <line x1="24.8" y1="58.5" x2="25.4" y2="72.5" stroke="#B91C1C" strokeWidth="0.75" opacity="0.85" />
          <line x1="24" y1="58.5" x2="24" y2="74" stroke="#F87171" strokeWidth="0.85" opacity="0.9" />
        </svg>
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Multi-Layer Ambient Warm Lighting Radiance */}
      <div
        className="absolute -top-24 right-[-5%] w-[740px] h-[560px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 65% 35%, rgba(255, 141, 115, 0.18) 0%, rgba(243, 193, 111, 0.10) 32%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[760px] h-[480px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 70% 70%, rgba(243, 193, 111, 0.09) 0%, rgba(255, 141, 115, 0.06) 35%, transparent 70%)',
          filter: 'blur(42px)',
        }}
      />

      {/* 2. Top-Right Imperial Palace Complex (Hoàng Thành & Điện Các Cung Đình) */}
      <div className="absolute top-0 right-0 w-[540px] max-w-[48vw] h-[300px] max-h-[35vh] pointer-events-none select-none overflow-hidden">
        <img
          src="/assets/decor/palace-top-right.jpg"
          alt=""
          className="w-full h-full object-cover object-top-right opacity-90 transition-opacity"
          style={{
            maskImage:
              'radial-gradient(ellipse 90% 85% at 90% 12%, black 35%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.2) 78%, transparent 92%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 85% at 90% 12%, black 35%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.2) 78%, transparent 92%)',
          }}
        />
      </div>

      {/* 3. Top-Right Blooming Cherry Blossom Branch (Cành Hoa Đào Son) */}
      <div className="absolute -top-3 right-0 w-[520px] max-w-[50vw] h-[210px] pointer-events-none">
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

      {/* 4. Authentic Chinese Hanging Palace Lanterns (Cung Đăng - 宫灯) */}
      <div
        data-lanterns
        className={`absolute inset-x-0 top-0 h-[480px] pointer-events-none transition-opacity duration-300 motion-reduce:transition-none ${
          isScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Lantern 2: Prominent Blossom Lantern (hanging from cherry blossom branch above HSK tabs) */}
        <div
          className="absolute right-[27.5%] top-0 z-10 animate-lantern-sway"
          style={{ animationDuration: '7s' }}
        >
          <ChinesePalaceLantern
            width={38}
            height={60}
            stringHeight={24}
            glowInset={-16}
            glowBlur={14}
            glowOpacity={0.55}
          />
        </div>

        {/* Lantern 1: Central Sky Lantern (hanging above the greeting / HSK 1 level selector) */}
        <div
          className="hidden sm:block absolute right-[50.5%] top-0 z-10 animate-lantern-sway"
          style={{ animationDuration: '8.5s', animationDelay: '-2.5s' }}
        >
          <ChinesePalaceLantern
            width={32}
            height={50}
            stringHeight={18}
            glowInset={-13}
            glowBlur={11}
            glowOpacity={0.48}
          />
        </div>
      </div>

      {/* 5. Bottom Horizon: Panoramic Misty Mountains & Second Illuminated Imperial Pagoda / City */}
      <div className="absolute bottom-0 inset-x-0 h-[300px] pointer-events-none select-none overflow-hidden">
        <img
          src="/assets/decor/mountains-bottom.jpg"
          alt=""
          className="w-full h-full object-cover object-bottom opacity-85"
          style={{
            maskImage:
              'linear-gradient(to top, black 50%, rgba(0,0,0,0.6) 80%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 50%, rgba(0,0,0,0.6) 80%, transparent 100%)',
          }}
        />
        {/* Deep warm charcoal gradient at the very base for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E10] via-transparent to-transparent opacity-80" />
      </div>
    </div>
  );
}
