import { useEffect, useRef, useState } from "react";

const CONFIG = {
  pupilMax: 6,
  lookSmooth: 7,
  tiltMax: 8,
  bounceAmp: 2.2,
  bounceSpeed: 5.0,
  shyThreshold: 0.28,
};

function clamp(v: any, min: any, max: any) {
  return Math.max(min, Math.min(max, v));
}

function expoLerp(current: any, target: any, speed: any, dt: any) {
  const alpha = 1 - Math.exp(-speed * dt);
  return current + (target - current) * alpha;
}

export default function AnimatedReceipt({ isPasswordActive = false }) {
  const containerRef = useRef(null);

  const targetRef = useRef({ x: 0, y: 0 });
  const lookRef = useRef({ x: 0, y: 0 });
  const distRef = useRef(1);
  const hoverRef = useRef(false);

  const [frame, setFrame] = useState({
    t: 0,
    lookX: 0,
    lookY: 0,
    blinkYLeft: 1,
    blinkYRight: 1,
    shy: false,
    cheating: false,
  });

  // Animation loop
  useEffect(() => {
    let rafId: any;
    let last = performance.now();
    let nextBlinkAt = performance.now() + 2000 + Math.random() * 3000;
    let blinkUntil = 0;
    let blinking = false;
    let peekAmount = 0;
    let nextPeekAt =  1000; // Start peeking after 1 second
    let peekUntil = 0;
    let isPeeking = false;

    const loop = (now: any) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Cheating behavior - occasional peek with one eye
      if (isPasswordActive) {
        // Trigger peek randomly
        if (!isPeeking && now >= nextPeekAt) {
          isPeeking = true;
          peekUntil = now + 600; // Peek lasts 600ms
          nextPeekAt = now + 2500 + Math.random() * 3000; // Next peek in 2.5-5.5 seconds
        }
        if (isPeeking && now >= peekUntil) {
          isPeeking = false;
        }

        if (isPeeking) {
          peekAmount = expoLerp(peekAmount, 1, 8, dt); // Quick peek in
          // Look down and slightly to the side (towards password field)
          targetRef.current.x = -0.3; // Look left (assuming password field is on left)
          targetRef.current.y = 0.8; // Look down
        } else {
          peekAmount = expoLerp(peekAmount, 0, 6, dt); // Quick peek out
          // When not peeking, look away (pretending to be innocent)
          targetRef.current.x = 0.4; // Look right/away
          targetRef.current.y = -0.2; // Look slightly up
        }
      } else {
        // When password is not active, normal eye movement
        if (!hoverRef.current) {
          targetRef.current.x = Math.sin(now / 1600) * 0.45;
          targetRef.current.y = Math.cos(now / 2300) * 0.2;
        }
        isPeeking = false;
        peekAmount = expoLerp(peekAmount, 0, 5, dt); // Smooth peek out
        nextPeekAt = now + 1000; // Reset peek timer for next time
      }

      // Smooth look direction
      lookRef.current.x = expoLerp(
        lookRef.current.x,
        targetRef.current.x,
        CONFIG.lookSmooth,
        dt
      );
      lookRef.current.y = expoLerp(
        lookRef.current.y,
        targetRef.current.y,
        CONFIG.lookSmooth,
        dt
      );

      const shy =
        hoverRef.current &&
        distRef.current < CONFIG.shyThreshold &&
        !isPasswordActive;

      // Blink logic - close eyes when password active
      let blinkYLeft = 1;
      let blinkYRight = 1;

      if (isPasswordActive) {
        // Base state: eyes closed when password is active
        blinkYLeft = 0.08;
        blinkYRight = 0.08;

        // Cheating/peeking behavior
        if (peekAmount > 0.3) {
          // Cheating mode: left eye stays closed, right eye peeks more
          blinkYLeft = 0.08; // Left eye stays fully closed
          blinkYRight = 0.3 + peekAmount * 0.4; // Right eye opens to peek (up to 70% open)
        }
      } else {
        // Normal behavior when password is not active
        if (!blinking && now >= nextBlinkAt) {
          blinking = true;
          blinkUntil = now + 120;
          nextBlinkAt = now + 2200 + Math.random() * 3000;
        }
        if (blinking && now >= blinkUntil) {
          blinking = false;
        }

        if (blinking) {
          blinkYLeft = 0.08;
          blinkYRight = 0.08;
        } else if (shy) {
          blinkYLeft = 0.65;
          blinkYRight = 0.65;
        }
      }

      setFrame({
        t: now,
        lookX: lookRef.current.x,
        lookY: lookRef.current.y,
        blinkYLeft,
        blinkYRight,
        shy,
        cheating: peekAmount > 0.3,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isPasswordActive]);

  // Pointer handlers
  const onPointerMove = (e: any) => {
    if (!containerRef.current || isPasswordActive) return; // Don't track mouse when password is active
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
    if (!isPasswordActive) {
      hoverRef.current = true;
    }
  };

  const onPointerLeave = () => {
    hoverRef.current = false;
    if (!isPasswordActive) {
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      distRef.current = 1;
    }
  };

  const pupilX = frame.lookX * CONFIG.pupilMax;
  const pupilY = frame.lookY * CONFIG.pupilMax;
  const tilt = frame.lookX * CONFIG.tiltMax;
  const extraBounce =
    hoverRef.current || frame.shy
      ? Math.sin(frame.t / (1000 / CONFIG.bounceSpeed)) * CONFIG.bounceAmp
      : 0;

  const pupilsVisibleLeft = frame.blinkYLeft > 0.2 ? 1 : 0;
  const pupilsVisibleRight = frame.blinkYRight > 0.2 ? 1 : 0;

  const cx = 160;
  const cy = 135;

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        width: "100%",
        maxWidth: 420,
        aspectRatio: "1 / 1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "default",
        pointerEvents: "auto",
      }}
    >
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) }
          50% { transform: translateY(-8px) }
          100% { transform: translateY(0) }
        }
        @keyframes coin {
          0% { transform: translateY(0) rotate(0deg) }
          50% { transform: translateY(-6px) rotate(8deg) }
          100% { transform: translateY(0) rotate(0deg) }
        }
        @keyframes wink {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.05); }
        }
        .float {
          animation: float 4.2s ease-in-out infinite;
          transform-origin: center;
        }
        .coin {
          animation: coin 3.4s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>

      <svg
        viewBox="0 0 320 260"
        width="100%"
        height="100%"
        style={{ pointerEvents: "none", display: "block" }}
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6B9D" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#FFC93D" stopOpacity="0.12" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background blob */}
        <ellipse cx={cx} cy={cy} rx="140" ry="100" fill="url(#g1)" />

        {/* Float group */}
        <g className="float">
          <g
            transform={`rotate(${tilt.toFixed(
              2
            )} ${cx} ${cy}) translate(0 ${extraBounce.toFixed(2)})`}
          >
            {/* Shadow */}
            <ellipse
              cx="160"
              cy="210"
              rx="70"
              ry="10"
              fill="#000"
              opacity="0.08"
            />

            {/* Receipt body - with gradient */}
            <defs>
              <linearGradient id="receipt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                <stop offset="100%" stopColor="#f5f5f5" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M95 40 h130 a12 12 0 0 1 12 12 v125 l-10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 -10 -7 -10 7 V52 a12 12 0 0 1 12 -12 z"
              fill="url(#receipt)"
              stroke="#ddd"
              strokeWidth="2"
              filter="url(#glow)"
            />

            {/* Title bar */}
            <rect
              x="110"
              y="62"
              width="100"
              height="8"
              rx="4"
              fill="#FF6B9D"
              opacity="0.85"
            />

            {/* Content lines */}
            <rect x="110" y="82" width="80" height="6" rx="3" fill="#D4D4D4" />
            <rect x="110" y="96" width="60" height="6" rx="3" fill="#E8E8E8" />
            <rect x="110" y="110" width="90" height="6" rx="3" fill="#D4D4D4" />
            <rect x="110" y="124" width="70" height="6" rx="3" fill="#E8E8E8" />

            {/* Paid badge */}
            <circle cx="210" cy="118" r="16" fill="#4CAF50" opacity="0.15" />
            <path
              d="M203 118 l6 6 10 -12"
              stroke="#4CAF50"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Face */}
            <g transform="translate(160,150)">
              {/* Eyebrows - vary with emotion */}
              <g opacity={frame.cheating ? 0.9 : 0.5}>
                {/* Left eyebrow */}
                <path
                  d="M-26 -8 Q-18 -12 -10 -8"
                  stroke="#FF9DB3"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Right eyebrow - raised when peeking */}
                <path
                  d={frame.cheating ? "M10 -10 Q18 -13 26 -10" : "M10 -8 Q18 -11 26 -8"}
                  stroke="#FF9DB3"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* Eyes (with individual blink) */}
              {/* Left eye */}
              <g transform={`scale(1 ${frame.blinkYLeft.toFixed(2)})`}>
                <g transform="translate(-18,0)">
                  <circle r="6.5" fill="#00000008" />
                  <circle
                    r="6"
                    fill="#fff"
                    stroke="#E8D5E8"
                    strokeWidth="1.5"
                  />
                  <g
                    transform={`translate(${pupilX.toFixed(2)} ${pupilY.toFixed(
                      2
                    )})`}
                    opacity={pupilsVisibleLeft}
                  >
                    <circle r="2.6" fill="#2D3436" />
                    <circle r="1.2" cx="1" cy="-1" fill="#fff" opacity="0.95" />
                  </g>
                </g>
              </g>

              {/* Right eye */}
              <g transform={`scale(1 ${frame.blinkYRight.toFixed(2)})`}>
                <g transform="translate(18,0)">
                  <circle r="6.5" fill="#00000008" />
                  <circle
                    r="6"
                    fill="#fff"
                    stroke="#E8D5E8"
                    strokeWidth="1.5"
                  />
                  <g
                    transform={`translate(${pupilX.toFixed(2)} ${pupilY.toFixed(
                      2
                    )})`}
                    opacity={pupilsVisibleRight}
                  >
                    <circle r="2.6" fill="#2D3436" />
                    <circle r="1.2" cx="1" cy="-1" fill="#fff" opacity="0.95" />
                  </g>
                </g>
              </g>

              {/* Cheeks - more visible when cheating */}
              <g
                opacity={frame.cheating ? 0.85 : frame.shy ? 0.7 : 0.3}
                transform="translate(0,2)"
              >
                <circle cx="-28" cy="8" r="6.5" fill="#FFB3D9" />
                <circle cx="28" cy="8" r="6.5" fill="#FFB3D9" />
              </g>

              {/* Smile - changes with emotions */}
              <path
                d={
                  frame.cheating
                    ? "M-14 14 Q0 16 14 14" // Mischievous smirk when peeking
                    : frame.shy
                    ? "M-12 12 q12 12 24 0"
                    : "M-10 12 q10 10 20 0"
                }
                stroke={frame.cheating ? "#FF6B9D" : "#666"}
                strokeWidth={frame.cheating ? "3.5" : "3"}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Nervous sweat drop when cheating */}
              {frame.cheating && (
                <circle cx="32" cy="-6" r="2.5" fill="#87CEEB" opacity="0.7" />
              )}
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
              fontFamily="Arial"
              fontWeight="bold"
              fill="#7A5B00"
            >
              ₹
            </text>
          </g>
        </g>

        {/* Sparkles - more when cheating */}
        <g opacity={frame.cheating ? 0.8 : 0.5}>
          <circle cx="65" cy="70" r="2" fill="#FF6B9D" />
          <circle cx="80" cy="58" r="3" fill="#FFC93D" />
          <circle cx="245" cy="170" r="2" fill="#FF6B9D" />
          {frame.cheating && (
            <>
              <circle cx="50" cy="100" r="2" fill="#FFB3D9" opacity="0.6" />
              <circle cx="270" cy="130" r="2" fill="#FFC93D" opacity="0.6" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}