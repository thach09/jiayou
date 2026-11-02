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
        className="absolute -top-20 right-[-4%] w-[520px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, rgba(255, 141, 115, 0.15) 0%, rgba(243, 193, 111, 0.08) 35%, transparent 70%)',
          filter: 'blur(32px)',
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[680px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 70% 70%, rgba(243, 193, 111, 0.08) 0%, rgba(255, 141, 115, 0.05) 35%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 2. Top-Right Imperial Palace Complex (Hoàng Thành & Điện Các Cung Đình) */}
      <div
        className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden z-0 w-[140px] sm:w-[240px] md:w-[300px] xl:w-[380px] h-[95px] sm:h-[150px] md:h-[190px] xl:h-[235px]"
      >
        <img
          src="/assets/decor/palace-top-right.jpg"
          alt=""
          className="w-full h-full object-cover object-[88%_10%] opacity-85 transition-opacity"
          style={{
            maskImage:
              'radial-gradient(ellipse at 100% 0%, black 42%, rgba(0,0,0,0.6) 65%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 100% 0%, black 42%, rgba(0,0,0,0.6) 65%, transparent 100%)',
          }}
        />
        {/* Soft edge blending gradients into #120E10 background */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#120E10] opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E10] via-transparent to-transparent opacity-50 pointer-events-none" />
      </div>

      {/* 3. Floating Kongming Lanterns (Khổng Minh Đăng - 孔明灯) matching reference layout */}
      <div
        data-lanterns
        className={`absolute inset-x-0 top-0 h-[480px] pointer-events-none transition-opacity duration-300 motion-reduce:transition-none ${
          isScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Lantern 1 - Center-Right Sky (between greeting and HSK pills on desktop) */}
        <div
          className="hidden sm:block absolute right-[33%] top-0 z-10 animate-lantern-sway"
          style={{ animationDuration: '6.5s' }}
        >
          {/* Thin hanging string */}
          <div className="w-[1px] h-3.5 bg-gradient-to-b from-stone-600 to-[#F3C16F] mx-auto opacity-60" />
          <div className="relative w-6 h-8 -mt-0.5">
            {/* Soft Ambient Radiance */}
            <div
              className="absolute inset-[-6px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(243, 193, 111, 0.45) 0%, rgba(255, 141, 115, 0.2) 45%, transparent 75%)',
                filter: 'blur(5px)',
              }}
            />
            <svg
              viewBox="0 0 56 72"
              fill="none"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(243,193,111,0.6)]"
            >
              <path
                d="M 14 10 Q 28 6 42 10 L 46 54 Q 28 62 10 54 Z"
                fill="url(#lantern-main-grad)"
                opacity="0.96"
              />
              <line x1="28" y1="8" x2="28" y2="58" stroke="#78350F" strokeWidth="1" opacity="0.6" />
              <ellipse cx="28" cy="46" rx="8" ry="9" fill="#FEF08A" opacity="0.95" />
              <ellipse cx="28" cy="46" rx="4" ry="5" fill="#FFFFFF" opacity="0.98" />
              <rect x="20" y="56" width="16" height="4" rx="2" fill="#991B1B" opacity="0.9" />
              <line x1="28" y1="60" x2="28" y2="68" stroke="#B91C1C" strokeWidth="1.5" opacity="0.8" />
              <circle cx="28" cy="68" r="1.5" fill="#F3C16F" />
            </svg>
          </div>
        </div>

        {/* Lantern 2 - Mid-Sky High Accent (above greeting on desktop) */}
        <div
          className="hidden sm:block absolute right-[50%] top-0 opacity-80"
          style={{ animationDuration: '8s', animationDelay: '-1.5s' }}
        >
          <div className="w-[1px] h-4 bg-stone-600 mx-auto opacity-50" />
          <div className="relative w-5 h-7">
            <div
              className="absolute inset-[-5px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(243, 193, 111, 0.35) 0%, transparent 70%)',
                filter: 'blur(4px)',
              }}
            />
            <svg
              viewBox="0 0 48 64"
              fill="none"
              className="w-full h-full drop-shadow-[0_0_8px_rgba(243,193,111,0.45)]"
            >
              <path
                d="M 12 8 Q 24 4 36 8 L 40 48 Q 24 54 8 48 Z"
                fill="url(#lantern-main-grad)"
                opacity="0.92"
              />
              <ellipse cx="24" cy="40" rx="6" ry="7" fill="#FEF08A" opacity="0.92" />
              <rect x="18" y="50" width="12" height="3" rx="1.5" fill="#B91C1C" opacity="0.8" />
              <line x1="24" y1="53" x2="24" y2="59" stroke="#B91C1C" strokeWidth="1" opacity="0.7" />
            </svg>
          </div>
        </div>

        {/* Lantern 3 - Far Corner Palace Accent */}
        <div
          className="hidden md:block absolute right-[9%] top-1 opacity-45"
          style={{ animationDuration: '9.5s', animationDelay: '-3.5s' }}
        >
          <div className="w-[1px] h-2 bg-stone-600 mx-auto opacity-40" />
          <div className="relative w-3.5 h-5">
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

      {/* 4. Bottom Horizon: Panoramic Misty Mountains & Second Illuminated Imperial Pagoda / City */}
      <div className="absolute bottom-0 inset-x-0 h-[240px] sm:h-[260px] pointer-events-none select-none overflow-hidden">
        <img
          src="/assets/decor/mountains-bottom.jpg"
          alt=""
          className="w-full h-full object-cover object-bottom opacity-75"
          style={{
            maskImage:
              'linear-gradient(to top, black 45%, rgba(0,0,0,0.5) 75%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 45%, rgba(0,0,0,0.5) 75%, transparent 100%)',
          }}
        />
        {/* Deep warm charcoal gradient at the very base for seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E10] via-transparent to-transparent opacity-85" />
      </div>
    </div>
  );
}
