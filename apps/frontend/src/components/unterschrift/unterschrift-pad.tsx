'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface UnterschriftPadProps {
  onGespeichert: (signatureDataUrl: string) => void;
  breite?: number;
  hoehe?: number;
}

export function UnterschriftPad({
  onGespeichert,
  breite = 400,
  hoehe = 200,
}: UnterschriftPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zeichnet, setZeichnet] = useState(false);
  const [hatInhalt, setHatInhalt] = useState(false);

  const getKoordinaten = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const zeichnenStarten = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const coords = getKoordinaten(e);
      if (!coords) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      setZeichnet(true);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    },
    [getKoordinaten],
  );

  const zeichnen = useCallback(
    (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      if (!zeichnet) return;

      const coords = getKoordinaten(e);
      if (!coords) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setHatInhalt(true);
    },
    [zeichnet, getKoordinaten],
  );

  const zeichnenStoppen = useCallback(() => {
    setZeichnet(false);
  }, []);

  const loeschen = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHatInhalt(false);
  }, []);

  const speichern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hatInhalt) return;

    const dataUrl = canvas.toDataURL('image/png');
    onGespeichert(dataUrl);
  }, [hatInhalt, onGespeichert]);

  // Canvas-Initialisierung
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Touch-Scrolling auf dem Canvas verhindern
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const verhindern = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchstart', verhindern, { passive: false });
    canvas.addEventListener('touchmove', verhindern, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', verhindern);
      canvas.removeEventListener('touchmove', verhindern);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={breite}
          height={hoehe}
          className="w-full cursor-crosshair rounded-md border border-gray-300 touch-none"
          style={{ maxWidth: `${breite}px` }}
          onMouseDown={zeichnenStarten}
          onMouseMove={zeichnen}
          onMouseUp={zeichnenStoppen}
          onMouseLeave={zeichnenStoppen}
          onTouchStart={zeichnenStarten}
          onTouchMove={zeichnen}
          onTouchEnd={zeichnenStoppen}
        />
        {!hatInhalt && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-gray-400">Hier unterschreiben</span>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={loeschen} className="flex-1">
          Loeschen
        </Button>
        <Button
          onClick={speichern}
          disabled={!hatInhalt}
          className="flex-1"
        >
          Unterschrift speichern
        </Button>
      </div>
    </div>
  );
}
