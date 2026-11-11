// Palet "Plop" untuk Rivora: krem hangat, hijau limau, biru tua, periwinkle, dan koral.
// Dirancang dengan kontras tinggi (High Contrast & Tactile Pop) agar card dan tombol terlihat sangat jelas.

export const INK = "#0E1236";
export const LIME = "#C5F23A";
export const LIME_INPUT = "#B1DD20";
export const PERIWINKLE = "#8B9CFF";
export const CORAL = "#FF7A66";
export const SUNFLOWER = "#FFC93C";

export const AVATAR_COLORS = [
  "#C5F23A", // limau
  "#8B9CFF", // periwinkle
  "#FF7A66", // koral
  "#FFC93C", // bunga matahari
  "#7EE0C3", // mint
  "#FF9EC7", // permen kapas
];

// Warna avatar tetap sama untuk satu pemain di semua layar.
export function colorFor(key = "") {
  let hash = 0;
  for (const ch of String(key)) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getSkin(isDark) {
  // Warna Card
  const cardBg = isDark ? "#141842" : "#FFFBEF";
  const cardText = isDark ? "#FFF8E7" : "#0E1236";
  const cardBorder = isDark ? "#323A7C" : "#0E1236";
  const cardShadow = isDark
    ? "0 8px 0 #080A20, 0 20px 40px rgba(0,0,0,0.7)"
    : "0 8px 0 #0E1236, 0 16px 32px rgba(14,18,54,0.12)";

  // Card Lime (Khas Plop)
  const limeCardBorder = "#0E1236";
  const limeCardShadow = isDark
    ? "0 8px 0 #0E1236, 0 20px 40px rgba(0,0,0,0.6)"
    : "0 8px 0 #0E1236, 0 20px 40px rgba(197,242,58,0.35)";

  // Tombol & Interaksi Tactile 3D Pop
  const btnBase =
    "cursor-pointer font-display font-bold transition-all duration-150 select-none active:translate-y-1 active:shadow-none";

  const btnNavy = `${btnBase} bg-[#0E1236] text-[#FFF8E7] border-[2.5px] border-[#0E1236] shadow-[0_4px_0_#06081B] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#06081B]`;
  const btnLime = `${btnBase} bg-[#C5F23A] text-[#0E1236] border-[2.5px] border-[#0E1236] shadow-[0_4px_0_#0E1236] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#0E1236]`;
  const btnGhost = `${btnBase} bg-transparent text-[${cardText}] border-[2.5px] border-[${cardBorder}] hover:bg-[#0E1236]/10`;

  return {
    isDark,
    // Nilai Hex untuk Style Attributes
    navy: INK,
    lime: LIME,
    limeInput: LIME_INPUT,
    limeCta: INK,
    periwinkle: PERIWINKLE,
    coral: CORAL,
    sunflower: SUNFLOWER,

    cardBg,
    cardText,
    cardBorder,
    cardShadow,
    limeCardBorder,
    limeCardShadow,

    // CSS Classes untuk Tailwind
    display: "font-['Fredoka',sans-serif]",
    page: isDark ? "bg-[#0B0F2E] text-[#FFF8E7]" : "bg-[#FFF3D6] text-[#0E1236]",
    well: isDark ? "bg-[#0A0D28]" : "#F2E8CB",
    muted: isDark ? "text-[#A6ACDE]" : "text-[#4A4F70]",
    divider: isDark ? "border-[#323A7C]" : "border-[#0E1236]/20",

    btnNavy,
    btnLime,
    btnGhost,
    btnPrimary: isDark ? btnLime : btnNavy,
  };
}
