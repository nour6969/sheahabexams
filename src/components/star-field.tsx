"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
};

const symbols = [
  "\u222B",
  "\u03C0",
  "\u03A3",
  "\u221A",
  "\u03B8",
  "\u221E",
  "\u25B3",
  "f(x)",
  "x\u00B2",
  "dy/dx"
];

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrame = 0;
    let stars: Star[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(180, Math.floor((width * height) / 8500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.4,
        speed: Math.random() * 0.22 + 0.05,
        alpha: Math.random() * 0.65 + 0.25
      }));
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(
        pointerRef.current.x || width / 2,
        pointerRef.current.y || height / 2,
        0,
        pointerRef.current.x || width / 2,
        pointerRef.current.y || height / 2,
        Math.max(width, height) * 0.55
      );
      gradient.addColorStop(0, "rgba(250, 204, 21, 0.12)");
      gradient.addColorStop(0.38, "rgba(37, 99, 235, 0.08)");
      gradient.addColorStop(1, "rgba(3, 7, 18, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        const dx = pointerRef.current.x - star.x;
        const dy = pointerRef.current.y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pull = pointerRef.current.active ? Math.max(0, 1 - distance / 220) : 0;

        star.x += dx * pull * 0.002;
        star.y += dy * pull * 0.002 + star.speed;

        if (star.y > height + 8) {
          star.y = -8;
          star.x = Math.random() * width;
        }

        context.beginPath();
        context.fillStyle = `rgba(255, 247, 204, ${star.alpha + pull * 0.35})`;
        context.shadowBlur = 10 + pull * 18;
        context.shadowColor = "rgba(250, 204, 21, 0.75)";
        context.arc(star.x, star.y, star.radius + pull * 1.2, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      animationFrame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
      {symbols.map((symbol, index) => (
        <motion.span
          aria-hidden="true"
          className="absolute select-none text-xl font-semibold text-yellow-200/20 blur-[0.2px] sm:text-3xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: [0.12, 0.32, 0.12],
            y: [0, -24, 0],
            rotate: [0, index % 2 === 0 ? 8 : -8, 0]
          }}
          transition={{
            duration: 8 + index,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.45
          }}
          style={{
            top: `${8 + ((index * 19) % 78)}%`,
            left: `${5 + ((index * 23) % 84)}%`
          }}
          key={symbol}
        >
          {symbol}
        </motion.span>
      ))}
    </div>
  );
}
