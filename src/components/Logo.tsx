// Logo QuranWeb: buku terbuka dengan bintang segi delapan, warna mengikuti tema.
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M16 2l3.5 3.5H24.5V10.5L28 14l-3.5 3.5V22.5H19.5L16 26l-3.5-3.5H7.5V17.5L4 14l3.5-3.5V5.5H12.5L16 2z" fill="hsl(var(--primary))" opacity="0.15" />
      <path d="M6 12.5c3.5-1 7-.6 10 1.5 3-2.1 6.5-2.5 10-1.5v11c-3.5-1-7-.6-10 1.5-3-2.1-6.5-2.5-10-1.5v-11z" stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 14v11" stroke="hsl(var(--primary))" strokeWidth="1.8" />
      <circle cx="16" cy="8" r="1.8" fill="hsl(var(--gold))" />
    </svg>
  );
}
