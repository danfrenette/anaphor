type RGB = readonly [number, number, number];

function luminance(color: RGB): number {
  const linear = color.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}

export function contrastRatio(foreground: RGB, background: RGB, alpha = 1): number {
  const composite: RGB = [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
  ];
  const first = luminance(composite);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
