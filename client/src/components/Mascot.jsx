import { useEffect, useRef } from "react";

// "Plop", maskot Rivora. Matanya mengikuti kursor saat santai (mood "idle"),
// berkedip, dan berubah ekspresi sesuai keadaan permainan.
//
// mood   : "idle" | "happy" | "thinking" | "sad" | "shock" | "sleepy"
// variant: "peek" (badan bulat mengintip dari bawah) | "face" (hanya wajah)
// lookAt : [x, y] untuk memaksa arah pandang (mis. melihat ke form di bawah)

const INK = "#0E1236";
const MAX_REACH = 10;

const REDUCE_MOTION =
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const PUPIL_FIXED = {
  thinking: [7, -10],
  sad: [0, 9],
  shock: [0, 0],
};

const BROW_SHIFT = {
  idle: ["", ""],
  happy: ["translate(0 -5)", "translate(0 -5)"],
  thinking: ["translate(0 -9) rotate(-6)", ""],
  sad: ["rotate(-16)", "rotate(16)"],
  shock: ["translate(0 -10)", "translate(0 -10)"],
  sleepy: ["translate(0 4)", "translate(0 4)"],
};

function Eye({ cx, cy, mood, pupilRef }) {
  if (mood === "happy") {
    return (
      <path
        d={`M${cx - 21} ${cy + 7} Q${cx} ${cy - 19} ${cx + 21} ${cy + 7}`}
        fill="none"
        stroke={INK}
        strokeWidth="8"
        strokeLinecap="round"
      />
    );
  }

  if (mood === "sleepy") {
    return (
      <path
        d={`M${cx - 19} ${cy} Q${cx} ${cy + 11} ${cx + 19} ${cy}`}
        fill="none"
        stroke={INK}
        strokeWidth="7"
        strokeLinecap="round"
      />
    );
  }

  const eyeR = mood === "shock" ? 33 : 30;
  const pupilR = mood === "shock" ? 10 : 15;
  const blink = !REDUCE_MOTION && mood !== "shock";

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g>
        {blink && (
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1 1;1 1;1 0.08;1 1"
            keyTimes="0;0.93;0.965;1"
            dur="4.6s"
            repeatCount="indefinite"
          />
        )}
        <circle r={eyeR} fill="#FFFFFF" />
        <g ref={pupilRef} transform="translate(0 0)">
          <circle r={pupilR} fill={INK} />
          <circle
            cx={-pupilR * 0.35}
            cy={-pupilR * 0.4}
            r={pupilR * 0.34}
            fill="#FFFFFF"
          />
          <circle
            cx={pupilR * 0.38}
            cy={pupilR * 0.32}
            r={pupilR * 0.14}
            fill="#FFFFFF"
          />
        </g>
      </g>
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === "happy") {
    return (
      <path
        d="M86 128 Q100 144 114 128"
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
      />
    );
  }
  if (mood === "sad") {
    return (
      <path
        d="M89 140 Q100 130 111 140"
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
      />
    );
  }
  if (mood === "shock") {
    return <ellipse cx="100" cy="137" rx="7" ry="9" fill={INK} />;
  }
  return null;
}

function bobValues(mood) {
  if (mood === "happy") return { values: "0 0;0 -9;0 0", dur: "0.75s" };
  if (mood === "shock") return { values: "0 0;-3 0;3 0;0 0", dur: "0.35s" };
  if (mood === "sleepy") return { values: "0 0;0 2;0 0", dur: "4s" };
  return { values: "0 0;0 -4;0 0", dur: "3.4s" };
}

export default function Mascot({
  mood = "idle",
  variant = "peek",
  size = 180,
  color = "#C5F23A",
  sproutColor,
  lookAt = null,
  label,
  className = "",
}) {
  const svgRef = useRef(null);
  const leftPupil = useRef(null);
  const rightPupil = useRef(null);

  const lookX = lookAt ? lookAt[0] : null;
  const lookY = lookAt ? lookAt[1] : null;

  useEffect(() => {
    const pupils = [leftPupil.current, rightPupil.current].filter(Boolean);
    if (pupils.length === 0) return undefined;

    function place(x, y) {
      const value = `translate(${x.toFixed(1)} ${y.toFixed(1)})`;
      pupils.forEach((el) => el.setAttribute("transform", value));
    }

    if (mood !== "idle") {
      const [x, y] = PUPIL_FIXED[mood] || [0, 0];
      place(x, y);
      return undefined;
    }

    if (lookX !== null) {
      place(lookX, lookY);
      return undefined;
    }

    place(0, 0);

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function update() {
      frame = 0;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.55;
      const dx = pointerX - cx;
      const dy = pointerY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(dist / 16, MAX_REACH);
      place((dx / dist) * reach, (dy / dist) * reach);
    }

    function onMove(event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mood, lookX, lookY]);

  const sprout = sproutColor || (variant === "face" ? "#FFF8E7" : color);
  const bob = bobValues(mood);
  const wiggleDur = mood === "thinking" ? "0.9s" : "3.2s";
  const [leftBrow, rightBrow] = BROW_SHIFT[mood] || BROW_SHIFT.idle;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size * 0.8}
      viewBox="0 0 200 160"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <g>
        {!REDUCE_MOTION && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values={bob.values}
            dur={bob.dur}
            repeatCount="indefinite"
          />
        )}

        {/* Tunas di kepala */}
        <g transform="translate(100 34)">
          <g>
            {!REDUCE_MOTION && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-9;9;-9"
                dur={wiggleDur}
                repeatCount="indefinite"
              />
            )}
            <ellipse
              cx="-9"
              cy="-13"
              rx="8"
              ry="13"
              transform="rotate(-35 -9 -13)"
              fill={sprout}
            />
            <ellipse
              cx="9"
              cy="-15"
              rx="9"
              ry="14"
              transform="rotate(30 9 -15)"
              fill={sprout}
            />
          </g>
        </g>

        {variant === "peek" && (
          <path
            d="M0 185 V84 C0 46 42 32 100 32 C158 32 200 46 200 84 V185 Z"
            fill={color}
          />
        )}

        {/* Alis */}
        <g transform="translate(62 46)">
          <path
            d="M-17 0 Q0 -9 17 0"
            transform={leftBrow}
            fill="none"
            stroke={INK}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
        <g transform="translate(138 46)">
          <path
            d="M-17 0 Q0 -9 17 0"
            transform={rightBrow}
            fill="none"
            stroke={INK}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>

        <Eye cx={62} cy={92} mood={mood} pupilRef={leftPupil} />
        <Eye cx={138} cy={92} mood={mood} pupilRef={rightPupil} />

        {/* Hidung */}
        <circle cx="93" cy="122" r="3.2" fill={INK} />
        <circle cx="107" cy="122" r="3.2" fill={INK} />

        <Mouth mood={mood} />
      </g>
    </svg>
  );
}

