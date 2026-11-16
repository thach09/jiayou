import { useEffect, useState } from 'react';

/**
 * CherryBlossomIntro:
 * Elegant one-time cherry blossom introduction when the user opens Jiayou in a browsing session.
 * Features:
 * - Runs only once per browsing session (sessionStorage flag).
 * - Gentle falling petals with natural horizontal flutter and soft rotation.
 * - Petal colors harmonized with Jiayou's coral, rose, and muted peach palette (#FF8D73, #FF9B7A, #E04F42).
 * - Duration ~4 seconds, then gracefully fades away and completely unmounts from DOM.
 * - Non-blocking: pointer-events: none, aria-hidden="true".
 * - Respects prefers-reduced-motion: reduce (skips animation entirely).
 */

interface Petal {
  id: number;
  left: number; // percentage across screen (10% - 90%)
  size: number; // width in px (12px - 20px)
  delay: number; // seconds (0 - 1.2s)
  duration: number; // seconds (3.2 - 4.5s)
  color: string;
  driftX: number; // horizontal drift in px (-35px to 45px)
  rotStart: number;
  rotEnd: number;
}

const PETAL_COLORS = [
  '#FF8D73', // Primary Coral
  '#FF9B7A', // Coral Highlight
  '#E04F42', // Vermilion Blossom
  '#FCA5A5', // Soft Rose Peach
  '#FB923C', // Warm Amber Peach
];

const SESSION_KEY = 'jiayou_blossom_intro_done';

function getInitialPetals(): Petal[] | null {
  if (typeof window === 'undefined') return null;

  try {
    if (sessionStorage.getItem(SESSION_KEY)) return null;
  } catch {
    return null;
  }

  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      /* ignore */
    }
    return null;
  }

  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    /* ignore */
  }

  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 6 : 12;

  return Array.from({ length: count }, (_, i) => {
    const left = isMobile
      ? 15 + (i * 70) / count + (Math.random() * 10 - 5)
      : 20 + (i * 72) / count + (Math.random() * 12 - 6);

    return {
      id: i,
      left: Math.max(5, Math.min(95, left)),
      size: 11 + (i % 4) * 2.5 + Math.random() * 2,
      delay: (i * 0.18) % 1.2,
      duration: 3.4 + (i % 3) * 0.4 + Math.random() * 0.3,
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      driftX: (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 8),
      rotStart: -35 + ((i * 25) % 70),
      rotEnd: 160 + ((i * 45) % 180),
    };
  });
}

export function CherryBlossomIntro() {
  const [petals] = useState<Petal[] | null>(getInitialPetals);
  const [active, setActive] = useState(() => Boolean(petals && petals.length > 0));
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Start graceful fade out at 3.5s
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 3500);

    // Completely unmount and clear resources at 4.5s
    const cleanupTimer = window.setTimeout(() => {
      setActive(false);
    }, 4500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(cleanupTimer);
    };
  }, [active]);

  if (!active || !petals) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden select-none transition-opacity duration-1000 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute will-change-transform"
          style={{
            left: `${petal.left}%`,
            top: '-24px',
            width: `${petal.size}px`,
            height: `${petal.size * 1.3}px`,
            animation: `jiayou-petal-fall ${petal.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${petal.delay}s forwards`,
            ['--petal-drift-x' as string]: `${petal.driftX}px`,
            ['--petal-rot-start' as string]: `${petal.rotStart}deg`,
            ['--petal-rot-end' as string]: `${petal.rotEnd}deg`,
          }}
        >
          <svg
            viewBox="0 0 20 26"
            fill="none"
            className="w-full h-full drop-shadow-[0_2px_8px_rgba(255,141,115,0.45)]"
          >
            {/* Organic Chinese Cherry Blossom Petal Silhouette */}
            <path
              d="M 10 1 C 15 5, 19 12, 16 19 C 14 24, 7 26, 4 21 C 1 15, 4 6, 10 1 Z"
              fill={petal.color}
              opacity="0.88"
            />
            {/* Subtle Petal Vein Highlight */}
            <path
              d="M 10 4 C 11 10, 11 16, 9 21"
              stroke="#FFF"
              strokeWidth="0.6"
              opacity="0.3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
