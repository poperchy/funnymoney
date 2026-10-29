/** Bill colours by denomination index: [light, mid, dark]. */
export const BILL_PAL: [string, string, string][] = [
  ['#93d3bc', '#3d927a', '#2b6e5b'],
  ['#f4cb73', '#d18a2b', '#9c6216'],
  ['#96bcef', '#3f6fc2', '#2b4f94'],
  ['#eba3ba', '#c1517a', '#8f3557'],
  ['#bea8ec', '#6f53c4', '#4f3994'],
  ['#f3a985', '#c95a36', '#963d20'],
];

export const METAL = {
  cu: ['#eab087', '#a65f31', '#6f3a1a'],
  br: ['#f5de95', '#b8933c', '#7f6020'],
  ag: ['#f4f4ef', '#a6a69f', '#6f6f69'],
} as const;

// Board and wallet colours live in skins.ts.

export const PIG = { fill: '#f5adc0', edge: '#d97692', glass: 'rgba(247,170,192,0.34)', dark: '#8a3f55', eye: '#3a2328' };
