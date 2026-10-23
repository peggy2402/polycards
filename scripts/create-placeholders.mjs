import fs from "fs";
import path from "path";

// Clean vector colors and styles - NO EMOJIS!
const animals = [
  { slug: "deer", name: "Deer", vi: "Con Hươu", color: "#D97706", bg: "#FEF3C7", code: "DEER" },
  { slug: "cat", name: "Cat", vi: "Con Mèo", color: "#DB2777", bg: "#FCE7F3", code: "CAT" },
  { slug: "dog", name: "Dog", vi: "Con Chó", color: "#2563EB", bg: "#DBEAFE", code: "DOG" },
  { slug: "elephant", name: "Elephant", vi: "Con Voi", color: "#4F46E5", bg: "#E0E7FF", code: "ELEPHANT" },
  { slug: "lion", name: "Lion", vi: "Sư Tử", color: "#C2410C", bg: "#FFEDD5", code: "LION" },
  { slug: "panda", name: "Panda", vi: "Gấu Trúc", color: "#059669", bg: "#D1FAE5", code: "PANDA" },
];

function generateAnimalSvg(animal) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${animal.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${animal.bg}"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="shadow-${animal.slug}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background Card -->
  <rect width="600" height="600" rx="36" fill="url(#grad-${animal.slug})" />
  <circle cx="300" cy="270" r="170" fill="${animal.color}" fill-opacity="0.08"/>
  <circle cx="300" cy="270" r="130" fill="${animal.color}" fill-opacity="0.14"/>

  <!-- Geometric Symbol Container -->
  <g filter="url(#shadow-${animal.slug})">
    <rect x="180" y="150" width="240" height="240" rx="40" fill="#FFFFFF"/>
    <circle cx="300" cy="250" r="60" fill="${animal.color}" fill-opacity="0.15"/>
    <!-- Clean Stylized Vector Monogram -->
    <text x="300" y="275" font-size="72" font-weight="900" text-anchor="middle" fill="${animal.color}" font-family="system-ui, -apple-system, sans-serif">${animal.name.charAt(0)}</text>
    <text x="300" y="340" font-size="14" font-weight="700" letter-spacing="3" text-anchor="middle" fill="${animal.color}" font-family="system-ui, -apple-system, sans-serif">3D MODEL</text>
  </g>

  <!-- Title & Meaning -->
  <text x="300" y="440" font-size="34" font-weight="800" text-anchor="middle" fill="#1F2937" font-family="system-ui, -apple-system, sans-serif">${animal.name.toUpperCase()}</text>
  <text x="300" y="480" font-size="22" font-weight="600" text-anchor="middle" fill="#6B7280" font-family="system-ui, -apple-system, sans-serif">${animal.vi}</text>

  <!-- Clean Placeholder Label -->
  <g transform="translate(190, 520)">
    <rect width="220" height="32" rx="16" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="1.2"/>
    <text x="110" y="21" font-size="11" font-weight="700" letter-spacing="1" text-anchor="middle" fill="#4B5563" font-family="system-ui, -apple-system, sans-serif">SAMPLE ASSET</text>
  </g>
</svg>`;
}

function generatePosterSvg(animal) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <rect width="600" height="600" rx="24" fill="#0F172A" />
  <circle cx="300" cy="270" r="140" fill="${animal.color}" fill-opacity="0.2"/>
  <rect x="220" y="190" width="160" height="160" rx="30" fill="#1E293B" stroke="${animal.color}" stroke-width="2"/>
  <text x="300" y="285" font-size="54" font-weight="900" text-anchor="middle" fill="${animal.color}" font-family="system-ui, sans-serif">${animal.name.charAt(0)}</text>
  <text x="300" y="400" font-size="24" font-weight="700" text-anchor="middle" fill="#F8FAFC" font-family="system-ui, sans-serif">Poly Cards 3D Viewer</text>
  <text x="300" y="435" font-size="16" text-anchor="middle" fill="#94A3B8" font-family="system-ui, sans-serif">${animal.name} (${animal.vi})</text>
  <rect x="210" y="470" width="180" height="28" rx="14" fill="#334155"/>
  <text x="300" y="489" font-size="11" font-weight="700" letter-spacing="1" text-anchor="middle" fill="#CBD5E1" font-family="system-ui, sans-serif">LOADING 3D SCENE</text>
</svg>`;
}

for (const a of animals) {
  fs.writeFileSync(path.resolve(`public/images/animals/${a.slug}.svg`), generateAnimalSvg(a));
  fs.writeFileSync(path.resolve(`public/images/posters/${a.slug}-poster.svg`), generatePosterSvg(a));
}
console.log("SVG Placeholders updated without any emojis!");
