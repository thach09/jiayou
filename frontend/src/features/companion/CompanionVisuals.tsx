// Lightweight SVG skeleton fallback for 3D canvas (0 CLS layout guarantee)
export function CompanionSkeletonFallback({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center animate-pulse ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="h-4/5 w-4/5 rounded-xl border border-rule/60 bg-tint/40 flex items-center justify-center">
        <svg viewBox="0 0 48 48" fill="none" className="w-1/2 h-1/2 text-fg-38 opacity-40">
          <rect x="12" y="14" width="24" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="19" cy="22" r="2.5" fill="currentColor" />
          <circle cx="29" cy="22" r="2.5" fill="currentColor" />
          <path d="M 21 28 Q 24 31 27 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// Clean SVG icon for food items (Bamboo, Apple, Peach, Fish)
export function FoodIcon({ type = 'bamboo', className = 'w-4 h-4' }: { type?: string; className?: string }) {
  if (type === 'apple') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
        <circle cx="12" cy="13" r="8" fill="#C83E31" stroke="#991B1B" strokeWidth="1.5" />
        <path d="M12 5V2" stroke="#2E7D6B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 3C14 2 16 3 16 5C14 5 13 4 12 3Z" fill="#2E7D6B" />
      </svg>
    );
  }
  if (type === 'peach') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
        <path
          d="M12 4C8 4 4 8 4 13C4 18 8 21 12 21C16 21 20 18 20 13C20 8 16 4 12 4Z"
          fill="#F43F5E"
          stroke="#E11D48"
          strokeWidth="1.5"
        />
        <path d="M12 4C10 8 10 16 12 21" stroke="#FB7185" strokeWidth="1.2" />
        <path d="M12 4C14 2 17 3 17 5C15 6 13 5 12 4Z" fill="#10B981" />
      </svg>
    );
  }
  if (type === 'fish') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
        <path
          d="M18 12C14 7 8 8 3 12C8 16 14 17 18 12Z"
          fill="#D97706"
          stroke="#B45309"
          strokeWidth="1.5"
        />
        <polygon points="18,12 23,8 21,12 23,16" fill="#D97706" stroke="#B45309" strokeWidth="1.2" />
        <circle cx="6" cy="11.5" r="1" fill="#FFFFFF" />
      </svg>
    );
  }
  // Default Bamboo
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
      <path
        d="M12 2C8 6 6 12 7 19C10 21 14 21 17 19C18 12 16 6 12 2Z"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="1.5"
      />
      <path d="M12 2V19" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 12C10 10 14 10 16 12" stroke="#059669" strokeWidth="1.2" />
      <path d="M7 16C10 14 14 14 17 16" stroke="#059669" strokeWidth="1.2" />
    </svg>
  );
}

