import React, { useEffect, useRef } from 'react';

interface EnergyNetworkCanvasProps {
  progress: number; // 0.0 to 1.0 driving the cinematic progression
  scene: 1 | 2 | 3 | 4 | 5 | 6;
  isReducedMotion?: boolean;
}

interface Node {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  pulsePhase: number;
}

interface Particle {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
}

export const EnergyNetworkCanvas: React.FC<EnergyNetworkCanvasProps> = ({
  progress,
  scene,
  isReducedMotion = false,
}) => {
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

    const centerX = width / 2;
    const centerY = height / 2;
    const radiusScale = Math.min(width, height) * 0.28;

    // 5 Nodes: EV, Charging, Route, Battery, Intelligence
    const nodeAngles = [
      -Math.PI / 2,                // Top: EV
      -Math.PI / 2 + (2 * Math.PI) / 5, // Charging
      -Math.PI / 2 + (4 * Math.PI) / 5, // Route
      -Math.PI / 2 + (6 * Math.PI) / 5, // Battery
      -Math.PI / 2 + (8 * Math.PI) / 5, // Intelligence
    ];

    const nodes: Node[] = nodeAngles.map(angle => ({
      x: centerX,
      y: centerY,
      targetX: centerX + Math.cos(angle) * radiusScale,
      targetY: centerY + Math.sin(angle) * radiusScale,
      radius: 4,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // Connecting particles along network lines
    const particles: Particle[] = [
      { fromNode: 0, toNode: 1, progress: 0.1, speed: 0.008 },
      { fromNode: 1, toNode: 2, progress: 0.4, speed: 0.007 },
      { fromNode: 2, toNode: 3, progress: 0.7, speed: 0.009 },
      { fromNode: 3, toNode: 4, progress: 0.2, speed: 0.008 },
      { fromNode: 4, toNode: 0, progress: 0.6, speed: 0.007 },
      { fromNode: 0, toNode: 2, progress: 0.3, speed: 0.006 },
      { fromNode: 1, toNode: 3, progress: 0.5, speed: 0.008 },
    ];

    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      if (isReducedMotion) {
        return;
      }

      // SCENE 1 — ENERGY PULSE (0s - 1.2s)
      if (scene === 1) {
        const pulseSize = 4 + Math.sin(elapsed * 4) * 1.5;
        const glowRadius = 24 + Math.sin(elapsed * 3) * 8;

        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
        grad.addColorStop(0.4, 'rgba(14, 165, 233, 0.4)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // SCENE 2 — ENERGY FIELD (1.2s - 2.5s)
      else if (scene === 2) {
        const fieldRadius = radiusScale * Math.min(1, (progress - 0.2) / 0.25);

        // Circular energy field ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, fieldRadius), 0, Math.PI * 2);
        ctx.stroke();

        // Expanding nodes
        nodes.forEach((node, i) => {
          const factor = Math.min(1, Math.max(0, (progress - 0.2 - i * 0.03) / 0.15));
          const currentX = centerX + (node.targetX - centerX) * factor;
          const currentY = centerY + (node.targetY - centerY) * factor;

          ctx.fillStyle = 'rgba(20, 184, 166, 0.85)';
          ctx.beginPath();
          ctx.arc(currentX, currentY, node.radius, 0, Math.PI * 2);
          ctx.fill();

          // Node glow
          const nodeGlow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 12);
          nodeGlow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
          nodeGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // SCENE 3 — NETWORK FORMATION (2.5s - 4.2s)
      else if (scene === 3) {
        // Outer energy field ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusScale, 0, Math.PI * 2);
        ctx.stroke();

        // Connective network lines
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const lineProgress = Math.min(1, Math.max(0, (progress - 0.45 - (i + j) * 0.02) / 0.15));
            if (lineProgress > 0) {
              const n1 = nodes[i];
              const n2 = nodes[j];

              ctx.strokeStyle = `rgba(14, 165, 233, ${0.4 * lineProgress})`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(n1.targetX, n1.targetY);
              ctx.lineTo(
                n1.targetX + (n2.targetX - n1.targetX) * lineProgress,
                n1.targetY + (n2.targetY - n1.targetY) * lineProgress
              );
              ctx.stroke();
            }
          }
        }

        // Nodes
        nodes.forEach(node => {
          ctx.fillStyle = '#14B8A6';
          ctx.beginPath();
          ctx.arc(node.targetX, node.targetY, node.radius + Math.sin(elapsed * 3 + node.pulsePhase) * 1, 0, Math.PI * 2);
          ctx.fill();

          const nodeGlow = ctx.createRadialGradient(node.targetX, node.targetY, 0, node.targetX, node.targetY, 14);
          nodeGlow.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
          nodeGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(node.targetX, node.targetY, 14, 0, Math.PI * 2);
          ctx.fill();
        });

        // Moving network particles
        particles.forEach(p => {
          p.progress = (p.progress + p.speed) % 1;
          const n1 = nodes[p.fromNode];
          const n2 = nodes[p.toNode];
          const px = n1.targetX + (n2.targetX - n1.targetX) * p.progress;
          const py = n1.targetY + (n2.targetY - n1.targetY) * p.progress;

          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // SCENE 4 — NETWORK COLLAPSE & LOGO EMERGENCE (4.2s - 5.5s)
      else if (scene === 4) {
        const collapseFactor = 1 - Math.min(1, Math.max(0, (progress - 0.7) / 0.15));

        nodes.forEach(node => {
          const cx = centerX + (node.targetX - centerX) * collapseFactor;
          const cy = centerY + (node.targetY - centerY) * collapseFactor;

          ctx.fillStyle = `rgba(56, 189, 248, ${collapseFactor})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 3 * collapseFactor, 0, Math.PI * 2);
          ctx.fill();
        });

        // Bright central pulse resolving into logo
        const coreGlow = 30 + (1 - collapseFactor) * 50;
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreGlow);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
        grad.addColorStop(0.5, 'rgba(20, 184, 166, 0.4)');
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreGlow, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [progress, scene, isReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
};
