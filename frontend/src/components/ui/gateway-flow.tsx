import { useEffect, useRef } from 'react';
import { cn } from './button';

interface GatewayFlowProps {
  className?: string;
  density?: number;
}

type FlowPath = {
  fromLeft: boolean;
  startY: number;
  t: number;
  speed: number;
};

export function GatewayFlow({ className, density = 1 }: GatewayFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pathCount = Math.max(16, Math.round(48 * Math.min(1.5, Math.max(0.5, density))));
    const paths: FlowPath[] = Array.from({ length: pathCount }, (_, index) => ({
      fromLeft: index % 2 === 0,
      startY: 0,
      t: Math.random(),
      speed: 0.00065 + Math.random() * 0.00075,
    }));

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      paths.forEach((path, index) => {
        path.startY = ((index / pathCount) * 1.4 - 0.2) * height;
      });
      if (reducedMotion) draw();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      paths.forEach((path) => {
        const p0 = { x: path.fromLeft ? 0 : width, y: path.startY };
        const p1 = { x: path.fromLeft ? centerX * 0.48 : width - centerX * 0.48, y: path.startY };
        const p2 = { x: path.fromLeft ? centerX * 0.82 : width - centerX * 0.82, y: centerY };
        const p3 = { x: centerX, y: centerY };

        context.beginPath();
        context.moveTo(p0.x, p0.y);
        context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        context.strokeStyle = 'rgba(244, 244, 245, 0.11)';
        context.lineWidth = 1;
        context.setLineDash([1, 7]);
        context.stroke();
        context.setLineDash([]);

        if (!reducedMotion) path.t = (path.t + path.speed) % 1;
        const t = path.t;
        const u = 1 - t;
        const x = u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x;
        const y = u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y;
        context.fillStyle = 'rgba(250, 250, 250, 0.72)';
        context.fillRect(x - 1, y - 1, 2, 2);
      });

      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();
    draw();

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={cn('pointer-events-none absolute inset-0 size-full', className)} aria-hidden="true" />;
}
