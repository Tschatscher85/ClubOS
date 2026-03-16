/**
 * Konvertiert eine Hex-Farbe (#rrggbb) zu HSL-Werten
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 221, s: 83, l: 53 }; // Fallback: #1a56db

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360 * 10) / 10,
    s: Math.round(s * 1000) / 10,
    l: Math.round(l * 1000) / 10,
  };
}

/**
 * Wendet die Vereinsfarbe auf alle CSS-Variablen an
 */
export function applyTenantTheme(primaryColor: string): void {
  const { h, s, l } = hexToHsl(primaryColor);
  const root = document.documentElement;

  root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
  root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
  root.style.setProperty(
    '--sidebar-accent',
    `${h} ${s}% ${Math.min(l + 40, 95)}%`,
  );
}
