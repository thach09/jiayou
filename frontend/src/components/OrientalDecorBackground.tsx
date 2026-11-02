import { useEffect, useState } from 'react';

/**
 * OrientalDecorBackground:
 * Authentic Chinese Imperial Night Sky & Citadel Atmosphere matching the approved reference design.
 * Features:
 * 1. Warm glowing hanging lanterns (Khổng Minh Đăng - 孔明灯) with radiant amber glow & gentle sway.
 * 2. Ancient Chinese imperial citadel / palace / capital silhouette (Hoàng Thành & Môn Lâu) in top-right.
 * 3. Blooming vermilion cherry blossom branches (Cành Đào Son) in top-right with drifting petals.
 * 4. Layered Three Kingdoms mountain pass & illuminated ancient pagoda on the misty horizon.
 * 5. Multi-layer ambient warm lighting gradients (#120E10, #181214, #FF8D73).
 */
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
      <div className="absolute -top-3 right-0 w-[460px] max-w-[48vw] h-[190px] pointer-events-none">
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

      {/* 4. Floating Kongming Lanterns (Khổng Minh Đăng - 孔明灯) */}
      <div
        data-lanterns
        className={`absolute inset-x-0 top-0 h-[480px] pointer-events-none transition-opacity duration-300 motion-reduce:transition-none ${
          isScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Prominent Hanging Lantern 1 (Top Center-Right, exactly like the reference mockup) */}
        <div
          className="absolute right-[5.5%] top-0 z-10 animate-lantern-sway"
          style={{ animationDuration: '6.5s' }}
        >
          {/* Hanging string */}
          <div className="w-[1.5px] h-9 bg-gradient-to-b from-stone-600 to-[#F3C16F] mx-auto opacity-70" />
          <div className="relative w-14 h-20 -mt-0.5">
            {/* Outer Radiant Glow */}
            <div
              className="absolute inset-[-14px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(243, 193, 111, 0.48) 0%, rgba(255, 141, 115, 0.28) 45%, transparent 75%)',
                filter: 'blur(10px)',
              }}
            />
            <svg
              viewBox="0 0 56 72"
              fill="none"
              className="w-full h-full drop-shadow-[0_0_22px_rgba(243,193,111,0.7)]"
            >
              {/* Outer Lantern Silk Shell */}
              <path
                d="M 14 10 Q 28 6 42 10 L 46 54 Q 28 62 10 54 Z"
                fill="url(#lantern-main-grad)"
                opacity="0.96"
              />
              {/* Bamboo Ribs */}
              <line
                x1="28"
                y1="8"
                x2="28"
                y2="58"
                stroke="#78350F"
                strokeWidth="0.9"
                opacity="0.6"
              />
              <line
                x1="19"
                y1="9"
                x2="17"
                y2="55"
                stroke="#78350F"
                strokeWidth="0.7"
                opacity="0.5"
              />
              <line
                x1="37"
                y1="9"
                x2="39"
                y2="55"
                stroke="#78350F"
                strokeWidth="0.7"
                opacity="0.5"
              />
              {/* Inner Glowing Candle / Flame Core */}
              <ellipse
                cx="28"
                cy="46"
                rx="8"
                ry="9"
                fill="#FEF08A"
                opacity="0.95"
              />
              <ellipse
                cx="28"
                cy="46"
                rx="4"
                ry="5"
                fill="#FFFFFF"
                opacity="0.98"
              />
              {/* Bottom Vermilion Wooden Collar & Tassel Ring */}
              <rect
                x="20"
                y="56"
                width="16"
                height="4"
                rx="2"
                fill="#991B1B"
                opacity="0.9"
              />
              <line
                x1="28"
                y1="60"
                x2="28"
                y2="70"
                stroke="#B91C1C"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <circle cx="28" cy="70" r="2" fill="#F3C16F" />
            </svg>
          </div>
        </div>

        {/* Lantern 2 - Mid distance, soft drift */}
        <div
          className="absolute right-[28%] top-5 opacity-80"
          style={{ animationDuration: '8s', animationDelay: '-1.5s' }}
        >
          <div className="w-[1px] h-6 bg-stone-600 mx-auto opacity-50" />
          <div className="relative w-9 h-12">
            <div
              className="absolute inset-[-8px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(243, 193, 111, 0.38) 0%, transparent 70%)',
                filter: 'blur(6px)',
              }}
            />
            <svg
              viewBox="0 0 48 64"
              fill="none"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(243,193,111,0.5)]"
            >
              <path
                d="M 12 8 Q 24 4 36 8 L 40 48 Q 24 54 8 48 Z"
                fill="url(#lantern-main-grad)"
                opacity="0.92"
              />
              <ellipse
                cx="24"
                cy="40"
                rx="6"
                ry="7"
                fill="#FEF08A"
                opacity="0.92"
              />
              <rect
                x="18"
                y="50"
                width="12"
                height="3"
                rx="1.5"
                fill="#B91C1C"
                opacity="0.8"
              />
              <line
                x1="24"
                y1="53"
                x2="24"
                y2="61"
                stroke="#B91C1C"
                strokeWidth="1"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>

        {/* Lantern 3 - Far distance, tiny gentle glow */}
        <div
          className="absolute right-[44%] top-8 opacity-55"
          style={{ animationDuration: '10s', animationDelay: '-4s' }}
        >
          <div className="relative w-6 h-8">
            <svg viewBox="0 0 48 64" fill="none" className="w-full h-full">
              <path
                d="M 12 8 Q 24 4 36 8 L 40 48 Q 24 54 8 48 Z"
                fill="#F3C16F"
                opacity="0.85"
              />
              <ellipse cx="24" cy="40" rx="5" ry="5" fill="#FEF08A" />
            </svg>
          </div>
        </div>

        {/* Lantern 4 - Distant Left Sky */}
        <div
          className="hidden sm:block absolute left-[16%] top-7 opacity-40"
          style={{ animationDuration: '9s', animationDelay: '-3s' }}
        >
          <div className="relative w-7 h-10">
            <svg viewBox="0 0 48 64" fill="none" className="w-full h-full">
              <path
                d="M 12 8 Q 24 4 36 8 L 40 48 Q 24 54 8 48 Z"
                fill="url(#lantern-main-grad)"
                opacity="0.8"
              />
              <ellipse cx="24" cy="40" rx="5" ry="6" fill="#FEF08A" opacity="0.85" />
            </svg>
          </div>
        </div>

        {/* Gradients */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <linearGradient id="lantern-main-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#F3C16F" stopOpacity="0.95" />
              <stop offset="85%" stopColor="#FEF08A" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
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
