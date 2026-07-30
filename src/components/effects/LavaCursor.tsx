"use client";

import { useEffect, useRef } from "react";
import styles from "./LavaCursor.module.css";

type Drop = {
  x: number;
  y: number;
  r: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  hue: number;
};

export default function LavaCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reduced.matches || !finePointer.matches) {
      canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drops: Drop[] = [];
    let mouseX = -9999;
    let mouseY = -9999;
    let prevX = -9999;
    let prevY = -9999;
    let raf = 0;
    let running = true;
    let lastSpawn = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(window.innerWidth * dpr);
      canvas!.height = Math.floor(window.innerHeight * dpr);
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnAlong(x0: number, y0: number, x1: number, y1: number) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) return;

      const steps = Math.min(8, Math.max(1, Math.floor(dist / 4)));
      for (let s = 0; s < steps; s++) {
        const t = (s + 1) / steps;
        const x = x0 + dx * t;
        const y = y0 + dy * t;
        const speed = dist;

        drops.push({
          x: x + (Math.random() - 0.5) * 2.5,
          y: y + (Math.random() - 0.5) * 2.5,
          r: 2.2 + Math.random() * 3.2 + Math.min(speed * 0.04, 2.5),
          life: 1,
          maxLife: 0.45 + Math.random() * 0.4,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          hue: 38 + Math.random() * 16,
        });
      }

      if (drops.length > 160) drops.splice(0, drops.length - 160);
    }

    function onMove(e: PointerEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const now = performance.now();

      if (prevX < -1000) {
        prevX = mouseX;
        prevY = mouseY;
        return;
      }

      if (now - lastSpawn > 8) {
        spawnAlong(prevX, prevY, mouseX, mouseY);
        lastSpawn = now;
        prevX = mouseX;
        prevY = mouseY;
      }
    }

    function draw() {
      if (!running || !ctx || !canvas) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.life -= 0.016 / d.maxLife;
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.96;
        d.vy *= 0.96;
        d.r *= 0.972;

        if (d.life <= 0 || d.r < 0.35) {
          drops.splice(i, 1);
          continue;
        }

        const t = d.life;
        const radius = d.r * (0.4 + t * 0.85);
        const gradient = ctx.createRadialGradient(
          d.x,
          d.y,
          0,
          d.x,
          d.y,
          radius,
        );
        gradient.addColorStop(0, `hsla(${d.hue + 10}, 96%, 74%, ${0.62 * t})`);
        gradient.addColorStop(0.4, `hsla(${d.hue}, 92%, 56%, ${0.34 * t})`);
        gradient.addColorStop(0.75, `hsla(${d.hue - 6}, 88%, 44%, ${0.12 * t})`);
        gradient.addColorStop(1, `hsla(${d.hue - 10}, 80%, 32%, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (mouseX > 0) {
        const head = ctx.createRadialGradient(
          mouseX,
          mouseY,
          0,
          mouseX,
          mouseY,
          10,
        );
        head.addColorStop(0, "hsla(46, 100%, 80%, 0.5)");
        head.addColorStop(0.5, "hsla(40, 95%, 56%, 0.22)");
        head.addColorStop(1, "hsla(32, 90%, 40%, 0)");
        ctx.beginPath();
        ctx.fillStyle = head;
        ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden />;
}
