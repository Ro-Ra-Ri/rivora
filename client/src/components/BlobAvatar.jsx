// Avatar pemain kecil: kotak bulat berwarna dengan sepasang mata.
// sleepy = slot kosong (garis putus-putus, mata terpejam).

const INK = "#0E1236";

export default function BlobAvatar({
  color = "#C5F23A",
  size = 44,
  sleepy = false,
  happy = false,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {sleepy ? (
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        />
      ) : (
        <rect x="1" y="1" width="46" height="46" rx="17" fill={color} />
      )}

      {sleepy ? (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        >
          <path d="M12 24 Q17 28 22 24" />
          <path d="M26 24 Q31 28 36 24" />
        </g>
      ) : happy ? (
        <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d="M11 25 Q17 17 23 25" />
          <path d="M25 25 Q31 17 37 25" />
        </g>
      ) : (
        <g>
          <circle cx="17" cy="22" r="7.5" fill="#FFFFFF" />
          <circle cx="31" cy="22" r="7.5" fill="#FFFFFF" />
          <circle cx="18" cy="23" r="3.8" fill={INK} />
          <circle cx="32" cy="23" r="3.8" fill={INK} />
          <circle cx="17" cy="21.6" r="1.3" fill="#FFFFFF" />
          <circle cx="31" cy="21.6" r="1.3" fill="#FFFFFF" />
        </g>
      )}

      {!sleepy && (
        <g fill={INK}>
          <circle cx="22" cy="34" r="1.4" />
          <circle cx="26" cy="34" r="1.4" />
        </g>
      )}
    </svg>
  );
}

