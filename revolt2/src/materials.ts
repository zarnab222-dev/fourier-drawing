import * as THREE from 'three';

// The seeded noise keeps each procedural surface stable across reloads.
export function surfaceTexture(kind: 'oak' | 'asphalt' | 'paper' | 'plaster'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(512, 512);
  let seed = 721;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const index = (y * 512 + x) * 4, noise = random() - .5;
    let r: number, g: number, b: number;
    if (kind === 'oak') {
      const grain = Math.sin(y * .68 + Math.sin(x * .008) * 3 + Math.sin(y * .025) * 4) * 6;
      const rings = Math.sin(y * .12 + Math.sin(x * .016) * 1.5) * 5;
      r = 112 + grain + rings + noise * 14; g = 76 + grain * .72 + rings + noise * 11; b = 45 + grain * .5 + noise * 8;
    } else if (kind === 'asphalt') {
      const value = 47 + noise * 25 + (random() > .98 ? 18 : 0); r = value * .87; g = value * .94; b = value;
    } else if (kind === 'plaster') {
      const value = noise * 11 + Math.sin(x * .025) * Math.cos(y * .04) * 3; r = 42 + value; g = 58 + value; b = 60 + value;
    } else { r = 216 + noise * 17; g = 202 + noise * 16; b = 175 + noise * 13; }
    image.data[index] = r; image.data[index + 1] = g; image.data[index + 2] = b; image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  if (kind === 'asphalt') {
    context.strokeStyle = '#13191e44'; context.lineWidth = 8;
    for (const y of [157, 211, 323, 373]) { context.beginPath(); context.moveTo(0, y); context.bezierCurveTo(130, y - 18, 350, y + 16, 512, y); context.stroke(); }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
}

export function contactTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!, gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(6,10,13,.8)'); gradient.addColorStop(.45, 'rgba(6,10,13,.4)'); gradient.addColorStop(1, 'rgba(6,10,13,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas);
}

export function windowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!, gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#233c63'); gradient.addColorStop(.65, '#718d9e'); gradient.addColorStop(1, '#c6a796');
  context.fillStyle = gradient; context.fillRect(0, 0, 256, 256);
  context.fillStyle = '#172e4266';
  for (let i = 0; i < 20; i++) context.fillRect(i * 19 - 10, 180 + Math.sin(i * 7) * 25, 13, 100);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
