import { useEffect, useState } from 'react';

// Self-contained fallback art (inline SVG, zero network) so a card never shows a broken icon.
const THEMES = {
  Pothole:           { bg: '#475569', icon: 'M4 17h16M6 17c1-3 3-4 6-4s5 1 6 4' },
  Roads:             { bg: '#475569', icon: 'M8 20L10 4M16 20L14 4M12 6v2m0 4v2m0 4v2' },
  Sanitation:        { bg: '#15803d', icon: 'M6 8h12l-1 12H7L6 8zM9 8V5h6v3M10 12v5M14 12v5' },
  'Street Lighting': { bg: '#ca8a04', icon: 'M12 3a5 5 0 00-3 9v3h6v-3a5 5 0 00-3-9zM10 18h4M10 21h4' },
  Drainage:          { bg: '#0369a1', icon: 'M12 3s6 6 6 10a6 6 0 01-12 0c0-4 6-10 6-10z' },
  Water:             { bg: '#0369a1', icon: 'M12 3s6 6 6 10a6 6 0 01-12 0c0-4 6-10 6-10z' },
  Electricity:       { bg: '#b45309', icon: 'M13 2L5 14h6l-1 8 8-12h-6l1-8z' },
  'Public Property': { bg: '#6d28d9', icon: 'M3 20h18M5 20V9l7-5 7 5v11M10 20v-6h4v6' },
};
const DEFAULT = { bg: '#0f766e', icon: 'M12 8v5m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z' };

export default function IssueImage({ src, category, className = '', alt = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} onError={() => setFailed(true)} />;
  }
  const t = THEMES[category] || DEFAULT;
  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${className}`} style={{ background: t.bg }} role="img" aria-label={`${category || 'Issue'} (no photo)`}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".9"><path d={t.icon} /></svg>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{category || 'Issue'}</span>
    </div>
  );
}
