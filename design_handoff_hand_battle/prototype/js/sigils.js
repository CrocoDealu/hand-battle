// ===========================================================
// SIGILS — Abstract geometric glyphs for gestures + class emblems
// All composed from primitives: line, circle, polygon, path of straight lines.
// ===========================================================

const SVG_NS = "http://www.w3.org/2000/svg";

// Stroke style constant
const S = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const FILL = 'fill="currentColor"';

// Helper to make a viewBox-100 SVG with given inner markup
function svg(inner, vb = 100) {
  return `<svg viewBox="0 0 ${vb} ${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
}

// ====== CLASS EMBLEMS (5) ======
const CLASS_EMBLEMS = {
  soldat: svg(`
    <circle cx="50" cy="50" r="42" ${S} stroke-width="1.2" opacity="0.4"/>
    <!-- two crossed swords -->
    <line x1="22" y1="22" x2="78" y2="78" ${S} stroke-width="3"/>
    <line x1="78" y1="22" x2="22" y2="78" ${S} stroke-width="3"/>
    <!-- hilt diamonds -->
    <polygon points="22,22 28,16 34,22 28,28" ${FILL}/>
    <polygon points="78,22 84,16 78,28 72,22" ${FILL} transform="rotate(0)"/>
    <polygon points="50,50 56,44 62,50 56,56" ${FILL} opacity="0.7"/>
  `),
  mag: svg(`
    <circle cx="50" cy="50" r="42" ${S} stroke-width="1.2" opacity="0.4"/>
    <!-- vertical staff -->
    <line x1="50" y1="20" x2="50" y2="88" ${S} stroke-width="2.5"/>
    <!-- star at top -->
    <polygon points="50,12 53,22 64,22 55,28 58,38 50,32 42,38 45,28 36,22 47,22" ${FILL}/>
    <!-- runes on staff -->
    <circle cx="50" cy="55" r="3" ${FILL}/>
    <line x1="44" y1="68" x2="56" y2="68" ${S} stroke-width="1.5"/>
  `),
  capcaun: svg(`
    <circle cx="50" cy="50" r="42" ${S} stroke-width="1.2" opacity="0.4"/>
    <!-- fang / tusk pair -->
    <polygon points="36,22 44,22 50,72 42,68" ${FILL}/>
    <polygon points="56,22 64,22 58,68 50,72" ${FILL}/>
    <line x1="30" y1="22" x2="70" y2="22" ${S} stroke-width="2"/>
  `),
  asasin: svg(`
    <circle cx="50" cy="50" r="42" ${S} stroke-width="1.2" opacity="0.4"/>
    <!-- dagger blade -->
    <polygon points="50,12 56,60 50,68 44,60" ${FILL}/>
    <!-- crossguard -->
    <line x1="36" y1="64" x2="64" y2="64" ${S} stroke-width="2.5"/>
    <!-- hilt -->
    <line x1="50" y1="68" x2="50" y2="84" ${S} stroke-width="2.5"/>
    <circle cx="50" cy="88" r="3" ${FILL}/>
  `),
  bancher: svg(`
    <circle cx="50" cy="50" r="42" ${S} stroke-width="1.2" opacity="0.4"/>
    <!-- coin outer -->
    <circle cx="50" cy="50" r="28" ${S} stroke-width="2.5"/>
    <circle cx="50" cy="50" r="22" ${S} stroke-width="1"/>
    <!-- inner glyph: stacked lines -->
    <line x1="40" y1="44" x2="60" y2="44" ${S} stroke-width="2"/>
    <line x1="38" y1="52" x2="62" y2="52" ${S} stroke-width="2"/>
    <line x1="40" y1="60" x2="60" y2="60" ${S} stroke-width="2"/>
  `)
};

// ====== GESTURE SIGILS (19) — abstract geometric glyphs ======
const SIGILS = {
  // OFFENSIVE
  atac: svg(`
    <!-- angular bolt / chevron strike -->
    <polygon points="52,10 24,52 44,52 36,90 70,42 50,42 60,10" ${FILL}/>
  `),
  magie: svg(`
    <!-- 8-point star burst with center diamond -->
    <g transform="translate(50 50)">
      <polygon points="0,-38 6,-10 38,0 6,10 0,38 -6,10 -38,0 -6,-10" ${FILL}/>
      <polygon points="0,-22 22,0 0,22 -22,0" ${S} stroke-width="1.5" opacity="0.6"/>
    </g>
  `),
  concentrare: svg(`
    <!-- concentric circles + central dot -->
    <circle cx="50" cy="50" r="36" ${S} stroke-width="2"/>
    <circle cx="50" cy="50" r="26" ${S} stroke-width="1.5" opacity="0.7"/>
    <circle cx="50" cy="50" r="16" ${S} stroke-width="1.5" opacity="0.5"/>
    <circle cx="50" cy="50" r="5" ${FILL}/>
  `),
  garda: svg(`
    <!-- four-pointed compass star (fist guard) -->
    <polygon points="50,10 58,42 90,50 58,58 50,90 42,58 10,50 42,42" ${FILL}/>
    <circle cx="50" cy="50" r="6" ${FILL} fill="black" opacity="0.4"/>
  `),
  dubla: svg(`
    <!-- twin crescents / horns -->
    <path d="M 24 30 Q 30 70 50 76 Q 38 60 36 30 Z" ${FILL}/>
    <path d="M 76 30 Q 70 70 50 76 Q 62 60 64 30 Z" ${FILL}/>
  `),

  // DEFENSIVE
  scut: svg(`
    <!-- hexagonal shield with cross -->
    <polygon points="50,12 84,30 84,66 50,88 16,66 16,30" ${S} stroke-width="2.5"/>
    <polygon points="50,22 76,36 76,62 50,78 24,62 24,36" ${FILL} opacity="0.18"/>
    <line x1="50" y1="30" x2="50" y2="70" ${S} stroke-width="2"/>
    <line x1="34" y1="50" x2="66" y2="50" ${S} stroke-width="2"/>
  `),
  bariera: svg(`
    <!-- triangle over horizontal line (Spock-vibe wedge) -->
    <line x1="14" y1="80" x2="86" y2="80" ${S} stroke-width="2.5"/>
    <polygon points="50,16 86,72 14,72" ${S} stroke-width="2"/>
    <polygon points="50,28 76,68 24,68" ${FILL} opacity="0.4"/>
  `),
  reflectie: svg(`
    <!-- two mirrored triangles meeting at midline -->
    <polygon points="14,50 50,18 50,42" ${FILL}/>
    <polygon points="86,50 50,82 50,58" ${FILL}/>
    <polygon points="14,50 50,82 50,58" ${S} stroke-width="1" opacity="0.5"/>
    <polygon points="86,50 50,18 50,42" ${S} stroke-width="1" opacity="0.5"/>
  `),
  ghimpi: svg(`
    <!-- 12-point spike burst -->
    <g transform="translate(50 50)">
      ${Array.from({length:12}, (_,i) => `<polygon points="0,-40 -3,-12 3,-12" ${FILL} transform="rotate(${i*30})"/>`).join('')}
      <circle r="10" ${FILL}/>
    </g>
  `),
  purificare: svg(`
    <!-- triangle (flame) with inner triangle -->
    <polygon points="50,14 86,80 14,80" ${S} stroke-width="2.5"/>
    <polygon points="50,30 72,72 28,72" ${FILL} opacity="0.5"/>
    <polygon points="50,46 60,68 40,68" ${FILL}/>
  `),

  // UTILITY
  buff: svg(`
    <!-- upward arrow in circle -->
    <circle cx="50" cy="50" r="38" ${S} stroke-width="2"/>
    <line x1="50" y1="22" x2="50" y2="74" ${S} stroke-width="3"/>
    <polyline points="34,38 50,22 66,38" ${S} stroke-width="3"/>
  `),
  pregatire: svg(`
    <!-- pinch: dot + arc -->
    <circle cx="50" cy="50" r="34" ${S} stroke-width="1.2" stroke-dasharray="3 5"/>
    <circle cx="50" cy="50" r="18" ${S} stroke-width="2"/>
    <circle cx="50" cy="50" r="6" ${FILL}/>
  `),
  debuff: svg(`
    <!-- downward arrow in circle -->
    <circle cx="50" cy="50" r="38" ${S} stroke-width="2"/>
    <line x1="50" y1="22" x2="50" y2="74" ${S} stroke-width="3"/>
    <polyline points="34,58 50,74 66,58" ${S} stroke-width="3"/>
  `),
  vulnerabil: svg(`
    <!-- broken/L shape -->
    <line x1="22" y1="22" x2="22" y2="78" ${S} stroke-width="4"/>
    <line x1="22" y1="78" x2="78" y2="78" ${S} stroke-width="4"/>
    <polygon points="40,40 60,40 60,60" ${FILL} opacity="0.6"/>
    <circle cx="78" cy="22" r="6" ${FILL}/>
  `),
  sacrificiu: svg(`
    <!-- eight-armed asterisk + center -->
    <g transform="translate(50 50)" ${S} stroke-width="2.5">
      ${[0,45,90,135].map(a => `<line x1="-36" y1="0" x2="36" y2="0" transform="rotate(${a})"/>`).join('')}
    </g>
    <circle cx="50" cy="50" r="8" ${FILL}/>
  `),
  adrenalina: svg(`
    <!-- three slashing parallel lines -->
    <line x1="20" y1="74" x2="64" y2="22" ${S} stroke-width="4"/>
    <line x1="36" y1="78" x2="80" y2="26" ${S} stroke-width="4"/>
    <line x1="14" y1="58" x2="58" y2="6" ${S} stroke-width="2" opacity="0.5"/>
  `),
  viziune: svg(`
    <!-- eye: ellipse + iris -->
    <path d="M 14 50 Q 50 18 86 50 Q 50 82 14 50 Z" ${S} stroke-width="2.5"/>
    <circle cx="50" cy="50" r="14" ${FILL}/>
    <circle cx="50" cy="50" r="6" fill="black" opacity="0.5"/>
    <circle cx="46" cy="46" r="2" ${FILL}/>
  `),
  arhiva: svg(`
    <!-- square with X -->
    <rect x="20" y="20" width="60" height="60" ${S} stroke-width="2.5"/>
    <line x1="20" y1="20" x2="80" y2="80" ${S} stroke-width="2"/>
    <line x1="80" y1="20" x2="20" y2="80" ${S} stroke-width="2"/>
    <circle cx="50" cy="50" r="6" ${FILL}/>
  `),
  pass: svg(`
    <!-- four parallel lines, arrow-forward -->
    <line x1="20" y1="30" x2="60" y2="30" ${S} stroke-width="3"/>
    <line x1="20" y1="44" x2="68" y2="44" ${S} stroke-width="3"/>
    <line x1="20" y1="58" x2="68" y2="58" ${S} stroke-width="3"/>
    <line x1="20" y1="72" x2="60" y2="72" ${S} stroke-width="3"/>
    <polygon points="68,22 84,44 68,66" ${FILL} opacity="0.7"/>
  `)
};

// ====== SMALL UI ICONS (HP, EN, shield, search, etc) ======
const ICONS = {
  hp: svg(`
    <!-- chalice / heart-ish -->
    <path d="M 50 84 C 14 60 14 30 30 22 C 42 18 50 28 50 36 C 50 28 58 18 70 22 C 86 30 86 60 50 84 Z" ${FILL}/>
  `),
  energy: svg(`
    <!-- crystal -->
    <polygon points="50,8 84,40 70,86 30,86 16,40" ${FILL}/>
    <line x1="50" y1="8" x2="50" y2="86" stroke="black" stroke-width="1" opacity="0.3"/>
    <line x1="16" y1="40" x2="84" y2="40" stroke="black" stroke-width="1" opacity="0.3"/>
  `),
  shield: svg(`
    <polygon points="50,12 82,28 82,56 50,86 18,56 18,28" ${FILL}/>
  `),
  search: svg(`
    <circle cx="42" cy="42" r="24" ${S} stroke-width="6"/>
    <line x1="60" y1="60" x2="82" y2="82" ${S} stroke-width="6"/>
  `),
  back: svg(`
    <polyline points="58,18 24,50 58,82" ${S} stroke-width="5"/>
  `),
  flame: svg(`
    <path d="M 50 12 Q 30 36 32 56 Q 14 72 36 88 Q 30 70 50 70 Q 70 70 64 88 Q 86 72 68 56 Q 70 36 50 12 Z" ${FILL}/>
  `),
  cross: svg(`<line x1="22" y1="22" x2="78" y2="78" ${S} stroke-width="4"/><line x1="78" y1="22" x2="22" y2="78" ${S} stroke-width="4"/>`),
  flourish: svg(`
    <line x1="6" y1="50" x2="94" y2="50" stroke="currentColor" stroke-width="1"/>
    <circle cx="50" cy="50" r="4" ${FILL}/>
    <circle cx="30" cy="50" r="2" ${FILL}/>
    <circle cx="70" cy="50" r="2" ${FILL}/>
  `, 100)
};

// Export to global scope for prototype scripts
window.HB_SIGILS = SIGILS;
window.HB_CLASS_EMBLEMS = CLASS_EMBLEMS;
window.HB_ICONS = ICONS;
