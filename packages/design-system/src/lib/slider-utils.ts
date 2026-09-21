// Adapted from DialKit 2.0.2 (MIT). See ../licenses/dialkit.txt.
/** Decimal places needed by a step or range endpoint, including scientific notation. */
export function decimalsForStep(step: number, min = 0, max = 0): number {
  return Math.min(100, Math.max(...[step, min, max].map(value => {
    const [coefficient = '0', exponent = '0'] = String(value).toLowerCase().split('e');
    return Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent));
  })));
}

/** Snap relative to the minimum and keep exact endpoints reachable. */
export function roundValue(value: number, step: number, min?: number, max?: number): number {
  const lower = min ?? -Infinity;
  const upper = max ?? Infinity;
  const clamped = Math.max(lower, Math.min(upper, value));
  if (clamped === lower || clamped === upper || !Number.isFinite(step) || step <= 0) return clamped;
  const origin = min ?? 0;
  const snapped = origin + Math.round((clamped - origin) / step) * step;
  return Math.max(lower, Math.min(upper, Number(snapped.toPrecision(14))));
}

type KeyEvent = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'altKey' | 'metaKey' | 'ctrlKey' | 'target' | 'currentTarget' | 'preventDefault' | 'stopPropagation'>;

/** Keyboard steps are relative to the range minimum, including fractional ranges. */
export function sliderKeyValue(key: string, value: number, min: number, max: number, step: number, shift = false): number | undefined {
  if (key === 'Home') return min;
  if (key === 'End') return max;
  const direction = ['ArrowRight', 'ArrowUp', 'PageUp'].includes(key) ? 1
    : ['ArrowLeft', 'ArrowDown', 'PageDown'].includes(key) ? -1 : 0;
  if (!direction) return undefined;
  if (!(step > 0) || max <= min) return min;
  const amount = (key.startsWith('Page') || shift) ? 10 : 1;
  const position = (value - min) / step;
  const nextStep = direction > 0 ? Math.floor(position + 1e-9) + amount : Math.ceil(position - 1e-9) - amount;
  const next = min + nextStep * step;
  return Math.max(min, Math.min(max, Number(next.toPrecision(14))));
}

export function handleSliderKey(event: KeyEvent, value: number, min: number, max: number, step: number, change: (value: number) => void, edit: () => void): void {
  if (event.target !== event.currentTarget || event.altKey || event.metaKey || event.ctrlKey) return;
  const next = sliderKeyValue(event.key, value, min, max, step, event.shiftKey);
  if (next === undefined && event.key !== 'Enter') return;
  event.preventDefault();
  event.stopPropagation();
  if (next === undefined) edit();
  else change(next);
}


export function snapToDecile(rawValue: number, min: number, max: number): number {
  const normalized = (rawValue - min) / (max - min);
  const nearest = Math.round(normalized * 10) / 10;
  if (Math.abs(normalized - nearest) <= 0.03125) {
    return min + nearest * (max - min);
  }
  return rawValue;
}


export function magneticStep(raw: number, previous: number, min: number, max: number, step: number, releaseThreshold: number) {
  if (!(step > 0) || max <= min) return raw;
  const threshold = Math.max(0.5, Math.min(0.9, releaseThreshold));
  const last = Math.ceil((max - min) / step);
  const stop = (index: number) => Math.min(max, min + index * step);
  let index = Math.max(0, Math.min(last, Math.round((previous - min) / step)));
  const start = index;
  while (index < last && raw > stop(index) + (stop(index + 1) - stop(index)) * threshold) index++;
  if (index === start) {
    while (index > 0 && raw < stop(index) - (stop(index) - stop(index - 1)) * threshold) index--;
  }
  return Number(stop(index).toPrecision(14));
}
