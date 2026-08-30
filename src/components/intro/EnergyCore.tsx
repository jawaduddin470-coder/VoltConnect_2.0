import React, { useEffect, useRef } from 'react';

interface EnergyCoreProps {
  scene: number; // 0 to 8
  progress: number; // 0 to 1
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseX: number;
  baseY: number;
  color: string;
}

export const EnergyCore: React.FC<EnergyCoreProps> = ({ scene, progress }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Persistent Global Particle System (70 Energy/Data Particles)
    const particleCount = 70;
    const particles: Particle[] = Array.from({ length: particleCount }, (_, idx) => {
      const px = Math.random() * width;
      const py = Math.random() * height;

      let pColor = 'rgba(34, 211, 238, '; // Cyan for VoltMap
      if (idx % 4 === 1) pColor = 'rgba(41, 182, 246, '; // Blue for VoltTrip
      else if (idx % 4 === 2) pColor = 'rgba(22, 199, 154, '; // Green for VoltHealth
      else if (idx % 4 === 3) pColor = 'rgba(34, 211, 238, '; // Teal for VoltAI

      return {
        x: px,
        y: py,
        baseX: px,
        baseY: py,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.2 + 1.2,
        alpha: Math.random() * 0.45 + 0.3,
        color: pColor,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Deep Navy-Black Background (#050A16)
      const bgAlpha = scene === 8 ? Math.max(0, 1 - (progress - 0.94) / 0.06) : 1;
      ctx.fillStyle = `rgba(5, 10, 22, ${bgAlpha})`;
      ctx.fillRect(0, 0, width, height);

      // =======================================================================
      // PERSISTENT GLOBAL PARTICLE DYNAMICS ACROSS 8 DETERMINISTIC SCENES
      // =======================================================================

      particles.forEach((p, i) => {
        // Scene 0: System Init (0.0 - 1.2s) -> Subtle floating drift
        if (scene === 0) {
          p.x += p.vx * 0.7;
          p.y += p.vy * 0.7;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        // Scene 1: VoltMap (1.2 - 2.9s) -> Cyan network nodes
        else if (scene === 1) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        // Scene 2: VoltTrip (2.9 - 4.6s) -> Blue route trails
        else if (scene === 2) {
          p.x += (p.vx + 2.8);
          if (p.x > width) p.x = 0;
        }
        // Scene 3: VoltHealth (4.6 - 6.3s) -> Green health pulses
        else if (scene === 3) {
          p.x += p.vx;
          p.y = p.baseY + Math.sin(p.x * 0.025 + performance.now() * 0.003) * 16;
          if (p.x < 0 || p.x > width) p.vx *= -1;
        }
        // Scene 4: VoltAI (6.3 - 8.0s) -> Teal intelligence clusters
        else if (scene === 4) {
          p.x += p.vx * 1.1;
          p.y += p.vy * 1.1;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        // Scenes 5-8: Convergence, Lightning & Logo Reveal (8.0s+) -> Gather to central energy point
        else {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          p.x += dx * 0.14;
          p.y += dy * 0.14;
        }

        // Render Particle
        const renderAlpha = p.alpha * (scene >= 5 ? 0.9 : 0.65);
        ctx.fillStyle = `${p.color}${renderAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect distance lines in VoltMap, VoltAI, and Convergence
        if (scene === 1 || scene === 4 || scene === 5) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[j].x - p.x;
            const dy = particles[j].y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = scene === 5 ? 140 : 100;

            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.22;
              ctx.strokeStyle = `${p.color}${lineAlpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      });

      // =======================================================================
      // SCENE 5 — CONVERGENCE ENERGY POINT (8.0 – 9.3s)
      // =======================================================================
      if (scene === 5) {
        const p = (progress - 0.67) / 0.10;
        const nucleusRadius = 12 + Math.sin(p * Math.PI * 2) * 8;

        const nucleusGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, nucleusRadius * 3);
        nucleusGrad.addColorStop(0, 'rgba(41, 182, 246, 0.95)');
        nucleusGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.35)');
        nucleusGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');

        ctx.fillStyle = nucleusGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, nucleusRadius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // =======================================================================
      // SCENE 6 — LIGHTNING SILHOUETTE FORMATION (9.3 – 10.3s)
      // =======================================================================
      else if (scene === 6) {
        const p = (progress - 0.77) / 0.09;
        ctx.strokeStyle = '#22D3EE';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#29B6F6';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(centerX + 8, centerY - 40 * p);
        ctx.lineTo(centerX - 12, centerY);
        ctx.lineTo(centerX + 4, centerY);
        ctx.lineTo(centerX - 8, centerY + 40 * p);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // =======================================================================
      // SCENE 7 & 8 — LOGO REVEAL BREATHING GLOW (10.3s+)
      // =======================================================================
      else if (scene >= 7) {
        const glowRadius = width * 0.24;
        const logoGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        logoGlow.addColorStop(0, 'rgba(41, 182, 246, 0.22)');
        logoGlow.addColorStop(0.6, 'rgba(34, 211, 238, 0.06)');
        logoGlow.addColorStop(1, 'rgba(5, 10, 22, 0)');

        ctx.fillStyle = logoGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [scene, progress]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};
