/** Les deux crochets du logo HEI, en trait (repris du symbole en verre). */
export default function HeiMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" aria-hidden="true" className={className}>
      <path d="M3 11V3h8" />
      <path d="M21 13v8h-8" />
    </svg>
  );
}
