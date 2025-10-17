import React, { useEffect, useRef, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { keyframes } from "@mui/system";

const float = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-8px) }
  100% { transform: translateY(0) }
`;

const coin = keyframes`
  0% { transform: translateY(0) rotate(0deg) }
  50% { transform: translateY(-6px) rotate(8deg) }
  100% { transform: translateY(0) rotate(0deg) }
`;

type AnimatedReceiptProps = {
  isPasswordActive?: boolean; // eyes close while typing/focused
};

// Tunables for cuteness/performance
const CONFIG = {
  pupilMax: 6,          // px pupil travel
  lookSmooth: 7,        // higher = snappier pupil follow
  tiltMax: 8,           // deg
  bounceAmp: 2.2,       // px extra bounce when hover/shy
  bounceSpeed: 5.0,     // Hz-ish feel
  shyThreshold: 0.28,   // how close to center triggers shy
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function expoLerp(current: number, target: number, speed: number, dt: number) {
  // exponential smoothing: 1 - e^(-k*dt)
  const alpha = 1 - Math.exp(-speed * dt);
  return current + (target - current) * alpha;
}

export default function AnimatedReceipt({ isPasswordActive = false }: AnimatedReceiptProps) {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const paper = theme.palette.mode === "dark" ? theme.palette.grey[900] : "#fff";
  const stroke = theme.palette.mode === "dark" ? theme.palette.grey[700] : theme.palette.grey[300];
  const accent = theme.palette.primary.main;
  const success = theme.palette.success.main;
  const textLight = theme.palette.mode === "dark" ? theme.palette.grey[300] : theme.palette.grey[600];
  const textPrimary = theme.palette.text.primary;
  const cheek = theme.palette.mode === "dark" ? "#F28BA5" : "#FF9DB3";

  // Pointer-follow state (normalized -1..1 from center)
  const targetRef = useRef({ x: 0, y: 0 }); // where eyes want to look
  const lookRef = useRef({ x: 0, y: 0 });   // smoothed actual look direction
  const distRef = useRef(1);
  const hoverRef = useRef(false);

  const [frame, setFrame] = useState({
    t: 0,
    lookX: 0,
    lookY: 0,
    blinkY: 1,     // 1=open, ~0=closed
    shy: false,
  });

  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId: number;
    let last = performance.now();
    let nextBlinkAt = performance.now() + 2000 + Math.random() * 3000;
    let blinkUntil = 0;
    let blinking = false;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // clamp dt
      last = now;

      // Autopilot when not hovering (good for touch/mobile)
      if (!hoverRef.current) {
        targetRef.current.x = Math.sin(now / 1600) * 0.45;
        targetRef.current.y = Math.cos(now / 2300) * 0.20;
      }

      // Smooth look direction
      lookRef.current.x = expoLerp(lookRef.current.x, targetRef.current.x, CONFIG.lookSmooth, dt);
      lookRef.current.y = expoLerp(lookRef.current.y, targetRef.current.y, CONFIG.lookSmooth, dt);

      // Blink logic (skip when password active)
      if (!isPasswordActive) {
        if (!blinking && now >= nextBlinkAt) {
          blinking = true;
          blinkUntil = now + 120; // duration of blink
          // next blink 2.2s to 5.2s
          nextBlinkAt = now + 2200 + Math.random() * 3000;
        }
        if (blinking && now >= blinkUntil) {
          blinking = false;
        }
      } else {
        blinking = false;
      }

      // Distance-based shy mode
      const shy = hoverRef.current && distRef.current < CONFIG.shyThreshold && !isPasswordActive;

      // Eyelids scale Y
      let blinkY = 1;
      if (isPasswordActive) blinkY = 0.06; // fully closed
      else if (blinking) blinkY = 0.08;   // quick blink
      else if (shy) blinkY = 0.65;        // half-lids when shy

      setFrame({
        t: now,
        lookX: lookRef.current.x,
        lookY: lookRef.current.y,
        blinkY,
        shy,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, isPasswordActive]);

  // Pointer handlers
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || prefersReducedMotion) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = clamp((e.clientX - cx) / (rect.width / 2), -1, 1);
    const ny = clamp((e.clientY - cy) / (rect.height / 2), -1, 1);
    targetRef.current.x = nx;
    targetRef.current.y = ny;
    distRef.current = Math.sqrt(nx * nx + ny * ny);
  };

  const onPointerEnter = () => {
    hoverRef.current = true;
  };

  const onPointerLeave = () => {
    hoverRef.current = false;
    targetRef.current.x = 0;
    targetRef.current.y = 0;
    distRef.current = 1;
  };

  // Derived transforms and cute motions
  const pupilX = frame.lookX * CONFIG.pupilMax;
  const pupilY = frame.lookY * CONFIG.pupilMax;
  const tilt = frame.lookX * CONFIG.tiltMax;
  const extraBounce = (hoverRef.current || frame.shy) ? Math.sin(frame.t / (1000 / CONFIG.bounceSpeed)) * CONFIG.bounceAmp : 0;

  // When eyes are nearly closed, hide pupils to avoid bleed
  const pupilsVisible = frame.blinkY > 0.2 ? 1 : 0;

  const animFloat = prefersReducedMotion ? "none" : `${float} 4.2s ease-in-out infinite`;
  const animCoin = prefersReducedMotion ? "none" : `${coin} 3.4s ease-in-out infinite`;

  // Centers for transforms
  const cx = 160;
  const cy = 135;

  return (
    <Box
      aria-hidden
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      sx={{
        width: "100%",
        maxWidth: 420,
        aspectRatio: "1 / 1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // ensure it can receive pointer events
        cursor: "default",
        "& .float": { animation: animFloat, transformOrigin: "center" },
        "& .coin": { transformOrigin: "center", transformBox: "fill-box", animation: animCoin },
      }}
    >
      <svg viewBox="0 0 320 260" role="img" width="100%" height="100%">
        <title>Invoice Mascot</title>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.palette.primary.light} stopOpacity="0.16" />
            <stop offset="100%" stopColor={theme.palette.secondary?.light || "#FFD38A"} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Soft background blob */}
        <ellipse cx={cx} cy={cy} rx="140" ry="100" fill="url(#g1)" />

        {/* Float group (Y bob via CSS). Inside we apply our tilt + extra bounce via SVG transform. */}
        <g className="float">
          <g transform={`rotate(${tilt.toFixed(2)} ${cx} ${cy}) translate(0 ${extraBounce.toFixed(2)})`}>
            {/* Shadow */}
            <ellipse cx="160" cy="210" rx="70" ry="10" fill="#000" opacity="0.08" />

            {/* Receipt body */}
            <path
              d="M95 40 h130 a12 12 0 0 1 12 12 v125 l-10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 V52 a12 12 0 0 1 12 -12 z"
              fill={paper}
              stroke={stroke}
              strokeWidth="2"
            />

            {/* Title line */}
            <rect x="110" y="62" width="100" height="8" rx="4" fill={accent} opacity="0.9" />

            {/* Content lines */}
            <rect x="110" y="82" width="80" height="6" rx="3" fill={textLight} />
            <rect x="110" y="96" width="60" height="6" rx="3" fill={textLight} />
            <rect x="110" y="110" width="90" height="6" rx="3" fill={textLight} />
            <rect x="110" y="124" width="70" height="6" rx="3" fill={textLight} />

            {/* Paid badge */}
            <circle cx="210" cy="118" r="16" fill={success} opacity="0.12" />
            <path d="M203 118 l6 6 10 -12" stroke={success} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Face */}
            <g transform="translate(160,150)">
              {/* Eyelids scale (blink/shy/password) */}
              <g transform={`scale(1 ${frame.blinkY.toFixed(2)})`}>
                {/* Left eye */}
                <g transform="translate(-18,0)">
                  <circle r="6.5" fill="#00000008" />
                  <circle r="6" fill={paper} stroke={stroke} strokeWidth="1" />
                  {/* Pupil */}
                  <g transform={`translate(${pupilX.toFixed(2)} ${pupilY.toFixed(2)})`} opacity={pupilsVisible}>
                    <circle r="2.6" fill={textPrimary} />
                    <circle r="1" cx="0.8" cy="-0.8" fill="#fff" opacity="0.9" />
                  </g>
                </g>

                {/* Right eye */}
                <g transform="translate(18,0)">
                  <circle r="6.5" fill="#00000008" />
                  <circle r="6" fill={paper} stroke={stroke} strokeWidth="1" />
                  {/* Pupil */}
                  <g transform={`translate(${pupilX.toFixed(2)} ${pupilY.toFixed(2)})`} opacity={pupilsVisible}>
                    <circle r="2.6" fill={textPrimary} />
                    <circle r="1" cx="0.8" cy="-0.8" fill="#fff" opacity="0.9" />
                  </g>
                </g>
              </g>

              {/* Cheeks (visible in shy mode) */}
              <g opacity={frame.shy ? 0.9 : 0} transform="translate(0,2)">
                <circle cx="-28" cy="6" r="5.5" fill={cheek} />
                <circle cx="28" cy="6" r="5.5" fill={cheek} />
              </g>

              {/* Smile: wider when shy */}
              <path
                d={frame.shy ? "M-12 12 q12 12 24 0" : "M-10 12 q10 10 20 0"}
                stroke={theme.palette.text.secondary}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>

        {/* Floating coin */}
        <g className="coin">
          <g transform="translate(255,70)">
            <circle r="14" fill="#FDD835" stroke="#FBC02D" strokeWidth="2" />
            <text
              x="0"
              y="5"
              fontSize="12"
              textAnchor="middle"
              fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
              fill="#7A5B00"
            >
              ₹
            </text>
          </g>
        </g>

        {/* Sparkles */}
        <g opacity="0.5">
          <circle cx="65" cy="70" r="2" fill={accent} />
          <circle cx="80" cy="58" r="3" fill={accent} />
          <circle cx="245" cy="170" r="2" fill={accent} />
        </g>
      </svg>
    </Box>
  );
}