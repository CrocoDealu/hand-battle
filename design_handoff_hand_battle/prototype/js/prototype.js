// ===========================================================
// PROTOTYPE — Screen orchestration, sim state, interactivity
// ===========================================================

const state = {
  screen: "lobby",      // lobby | builder | battle
  viewport: "desktop",  // desktop | mobile
  playerName: "Aelthar",
  playerClass: "mag",
  deck: [],             // card ids
  filter: "all",
  battle: {
    you:  { hp: 80, hpMax: 80, en: 6, enMax: 10, shield: 0, statuses: [] },
    foe:  { hp: 92, hpMax: 100, en: 4, enMax: 10, shield: 4, statuses: ["debuff"] },
    activeCard: null,
    charging: false,
    log: []
  }
};

// ====================== ROUTING ======================
function go(screen) {
  const stage = document.querySelector(".stage");
  const screens = stage.querySelectorAll(".screen");
  screens.forEach(s => s.classList.remove("is-active"));
  document.querySelector(`.screen.${screen}`).classList.add("is-active");
  state.screen = screen;
  document.querySelectorAll(".proto-tab[data-screen]").forEach(t => {
    t.classList.toggle("active", t.dataset.screen === screen);
  });
  if (screen === "lobby") renderLobby();
  if (screen === "builder") renderBuilder();
  if (screen === "battle") renderBattle();
}

function setViewport(v) {
  state.viewport = v;
  document.querySelector(".stage").dataset.viewport = v;
  document.querySelectorAll(".proto-tab[data-viewport]").forEach(t => {
    t.classList.toggle("active", t.dataset.viewport === v);
  });
}

// ====================== LOBBY ======================
function renderLobby() {
  const root = document.querySelector(".screen.lobby .lobby-content");
  if (!root) return;
  root.innerHTML = `
    <div class="lobby-hero">
      <div class="lobby-eyebrow">Hand of Spells &middot; AI Gesture Duel</div>
      <h1 class="lobby-title">
        <span class="lobby-title-flank">${window.HB_ICONS.flourish}</span>Hand Battle<span class="lobby-title-flank" style="transform: scaleX(-1) inline-block">${window.HB_ICONS.flourish}</span>
      </h1>
      <p class="lobby-subtitle">"Ridică-ți mâna. Lasă-i pe ceilalți să tremure."</p>
    </div>

    <div class="lobby-form">
      <div>
        <div class="field-label">&#9670;&nbsp; Numele vrăjitorului &nbsp;&#9670;</div>
        <input class="input" id="lobby-name" placeholder="Introdu numele tău..." value="${state.playerName}" maxlength="20"/>
      </div>

      <div>
        <div class="field-label">&#9670;&nbsp; Alege Clasa &nbsp;&#9670;</div>
        <div class="class-grid">
          ${window.CLASSES.map(c => `
            <button class="class-tile ${state.playerClass === c.id ? "selected" : ""}" data-class="${c.id}">
              <div class="class-sigil">${window.HB_CLASS_EMBLEMS[c.emblem]}</div>
              <div class="class-name">${c.name}</div>
              <div class="class-hp">${c.hp} HP</div>
              <div class="class-perk">${c.perk}</div>
            </button>
          `).join("")}
        </div>
      </div>

      <button class="btn btn-primary" data-go="builder" style="width: 100%; height: 60px;">
        Pasul Următor
        <span style="font-family: var(--f-mono); font-weight: 400; opacity: 0.6; letter-spacing: 0.1em;">&rarr;</span>
      </button>
    </div>
  `;

  root.querySelectorAll(".class-tile").forEach(t => {
    t.addEventListener("click", () => {
      state.playerClass = t.dataset.class;
      root.querySelectorAll(".class-tile").forEach(x => x.classList.toggle("selected", x === t));
    });
  });
  root.querySelector("#lobby-name").addEventListener("input", e => {
    state.playerName = e.target.value;
  });

  // JS-driven rise animation (CSS keyframes freeze in preview iframes)
  root.style.opacity = "0";
  root.style.transform = "translateY(20px)";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.style.opacity = "1";
      root.style.transform = "translateY(0)";
    });
  });
}

// ====================== DECK BUILDER ======================
function renderBuilder() {
  const root = document.querySelector(".screen.builder");
  if (!root) return;
  const filterTypes = ["all", "offense", "defense", "utility"];
  const filterLabels = { all: "Toate", offense: "Ofensive", defense: "Defensive", utility: "Utilitate" };

  const pool = window.CARD_DATA.filter(c =>
    state.filter === "all" || c.type === state.filter
  );

  const deckCount = state.deck.length;
  const deckFull = deckCount >= 15;
  const circ = 2 * Math.PI * 52;
  const progress = circ * (1 - Math.min(deckCount, 15) / 15);

  root.innerHTML = `
    <div class="builder-header">
      <div>
        <div class="builder-title">Construiește Decul</div>
        <div class="builder-subtitle">Alege exact <strong style="color:var(--gold-bright)">15 cărți</strong> din arhive · jucător <em>${state.playerName}</em></div>
      </div>
      <div class="builder-filters">
        ${filterTypes.map(f => `
          <button class="chip ${state.filter === f ? "active" : ""}" data-filter="${f}">${filterLabels[f]}</button>
        `).join("")}
      </div>
    </div>

    <div class="builder-body">
      <div class="card-pool">
        ${pool.map(c => window.renderCard(c, { selected: state.deck.includes(c.id) })).join("")}
      </div>

      <div class="panel panel-ornate deck-side filigree">
        <span class="filigree-bl"></span><span class="filigree-br"></span>
        <div style="text-align: center;">
          <div class="t-eyebrow t-gold" style="margin-bottom: 8px;">Decul tău</div>
        </div>

        <div class="deck-progress">
          <svg viewBox="0 0 120 120">
            <defs>
              <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#f5d28a"/>
                <stop offset="50%" stop-color="#d4a857"/>
                <stop offset="100%" stop-color="#8a6a2e"/>
              </linearGradient>
            </defs>
            <circle class="deck-progress-track" cx="60" cy="60" r="52"/>
            <circle class="deck-progress-fill" cx="60" cy="60" r="52"
              stroke-dasharray="${circ}" stroke-dashoffset="${progress}"/>
          </svg>
          <div class="deck-progress-center">
            <div class="deck-counter-num">${deckCount}<span style="color: var(--ink-faint); font-size: 28px;">/15</span></div>
            <div class="deck-counter-label">Cărți</div>
          </div>
        </div>

        <div class="deck-list">
          ${state.deck.length === 0 ? `
            <div style="text-align: center; padding: 24px 8px; font-family: var(--f-serif); font-style: italic; color: var(--ink-faint); font-size: 13px;">
              Selectează cărți din arhivă pentru a-ți construi decul.
            </div>
          ` : state.deck.map(id => {
            const c = window.CARD_DATA.find(x => x.id === id);
            return `
              <div class="deck-item ${window.TYPE_CLASS ? window.TYPE_CLASS[c.type] : ""}" data-deck-id="${id}">
                <span class="deck-item-sigil" style="color: ${c.type==='offense'?'#e88848':c.type==='defense'?'#5fb0e8':'#e8c14e'}">${window.HB_SIGILS[c.sigil]}</span>
                <span class="deck-item-name">${c.name}</span>
                <span class="deck-item-cost">${c.cost}&nbsp;EN</span>
                <button class="deck-item-remove" data-remove="${id}" title="Elimină">&times;</button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="builder-foot">
      <button class="btn btn-ghost" data-go="lobby">
        <span style="font-family: var(--f-mono); letter-spacing: 0.1em;">&larr;</span>
        Înapoi
      </button>
      <button class="btn btn-primary" data-go="battle" ${deckFull ? "" : "disabled"}>
        ${deckFull ? "Caută Adversar" : `Mai ai nevoie de ${15 - deckCount} cărți`}
        <span style="font-family: var(--f-mono); font-weight: 400; opacity: 0.6;">${deckFull ? "&rarr;" : ""}</span>
      </button>
    </div>
  `;

  // Pool cards toggle
  root.querySelectorAll(".card-pool .card").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.cardId;
      const idx = state.deck.indexOf(id);
      if (idx >= 0) state.deck.splice(idx, 1);
      else if (state.deck.length < 15) state.deck.push(id);
      else flashWarn("Decul tău e plin (15/15)");
      renderBuilder();
    });
  });

  // Filters
  root.querySelectorAll(".chip[data-filter]").forEach(el => {
    el.addEventListener("click", () => { state.filter = el.dataset.filter; renderBuilder(); });
  });

  // Remove from deck
  root.querySelectorAll("[data-remove]").forEach(el => {
    el.addEventListener("click", e => {
      e.stopPropagation();
      const id = el.dataset.remove;
      state.deck = state.deck.filter(x => x !== id);
      renderBuilder();
    });
  });
}

function flashWarn(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position: "fixed", top: "70px", left: "50%", transform: "translateX(-50%)",
    background: "rgba(193, 69, 69, 0.95)", color: "#fff",
    fontFamily: "var(--f-display)", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase",
    padding: "10px 18px", borderRadius: "999px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
    zIndex: 999, opacity: 0, transition: "opacity 240ms"
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = 1);
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 1800);
}

// ====================== BATTLE ======================
function renderBattle() {
  const root = document.querySelector(".screen.battle");
  if (!root) return;
  const cls = window.CLASSES.find(c => c.id === state.playerClass) || window.CLASSES[1];
  const b = state.battle;

  // Hand: pick 5 cards from deck (or sample)
  const handPool = (state.deck.length >= 5 ? state.deck : window.CARD_DATA.map(c => c.id)).slice(0, 5);
  const hand = handPool.map(id => window.CARD_DATA.find(c => c.id === id)).filter(Boolean);

  root.innerHTML = `
    <!-- Opponent band -->
    <div class="battle-band">
      <div class="player-block">
        <div class="player-meta">
          <span class="player-class-sigil">${window.HB_CLASS_EMBLEMS.capcaun}</span>
          <div>
            <div class="player-name">Korghaz</div>
            <div class="player-class">Căpcăunul</div>
          </div>
        </div>
        <div class="player-stats">
          <div class="hp-bar">
            <div class="hp-bar-fill" style="transform: scaleX(${b.foe.hp / b.foe.hpMax})"></div>
            <div class="hp-bar-text">${b.foe.hp} / ${b.foe.hpMax}</div>
          </div>
          <div class="energy-bar" data-en="${b.foe.en}">
            ${Array.from({length: b.foe.enMax}, (_, i) =>
              `<span class="energy-crystal ${i >= b.foe.en ? "spent" : ""}"></span>`
            ).join("")}
          </div>
          <div class="stat-row" style="justify-content: space-between;">
            <span class="stat-shield">
              <span class="stat-icon" style="color: var(--teal-glow)">${window.HB_ICONS.shield}</span>
              ${b.foe.shield}
            </span>
            <div class="player-statuses">
              ${b.foe.statuses.map(s => `<span class="status-badge ${s}"><span class="dot"></span>${s}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="video-tile" id="foe-video">
        <div class="video-tile-placeholder">Webcam · Adversar</div>
        <div class="video-tile-label">Korghaz</div>
      </div>

      <div style="text-align: right; padding-right: 8px;">
        <div class="t-eyebrow" style="margin-bottom: 6px;">Tura 4</div>
        <div class="t-display t-gold" style="font-size: 22px;">DUEL</div>
      </div>
    </div>

    <!-- Arena -->
    <div class="battle-arena">
      <div class="cast-zone" id="cast-zone"></div>

      <div class="charge-bar" id="charge-bar">
        <div class="charge-bar-fill"></div>
        <div class="charge-bar-glow"></div>
        <div class="charge-bar-label">Ține gestul · 1.5s</div>
      </div>

      <div class="battle-log" id="battle-log">
        ${renderInitialLog()}
      </div>
    </div>

    <!-- Your band -->
    <div class="battle-band">
      <div style="padding-left: 8px;">
        <div class="t-eyebrow" style="margin-bottom: 6px;">Mâna ta</div>
        <div class="t-display t-gold" style="font-size: 16px;">5 cărți</div>
      </div>

      <div class="video-tile" id="you-video">
        <div class="video-tile-placeholder">Webcam · Tu</div>
        <div class="video-tile-label">${state.playerName || "Tu"}</div>
      </div>

      <div class="player-block">
        <div class="player-meta" style="justify-content: flex-end;">
          <div style="text-align: right;">
            <div class="player-name">${state.playerName || "Tu"}</div>
            <div class="player-class">${cls.name}</div>
          </div>
          <span class="player-class-sigil">${window.HB_CLASS_EMBLEMS[cls.emblem]}</span>
        </div>
        <div class="player-stats">
          <div class="hp-bar">
            <div class="hp-bar-fill" style="transform: scaleX(${b.you.hp / b.you.hpMax})"></div>
            <div class="hp-bar-text">${b.you.hp} / ${b.you.hpMax}</div>
          </div>
          <div class="energy-bar" data-en="${b.you.en}">
            ${Array.from({length: b.you.enMax}, (_, i) =>
              `<span class="energy-crystal ${i >= b.you.en ? "spent" : ""}"></span>`
            ).join("")}
          </div>
          <div class="stat-row" style="justify-content: space-between;">
            <span class="stat-shield">
              <span class="stat-icon" style="color: var(--teal-glow)">${window.HB_ICONS.shield}</span>
              ${b.you.shield}
            </span>
            <div class="player-statuses">
              <span class="status-badge buff"><span class="dot"></span>buff</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hand -->
    <div class="hand" id="hand">
      ${hand.map((c, i) => window.renderCard(c, {
        size: "sm",
        energyAvailable: b.you.en,
        active: i === 2 && b.charging
      })).join("")}
    </div>
  `;

  // Wire hand: click to "cast"
  root.querySelectorAll(".hand .card").forEach((el, idx) => {
    if (el.classList.contains("disabled")) return;
    el.addEventListener("mousedown", () => startCharge(el));
    el.addEventListener("touchstart", e => { e.preventDefault(); startCharge(el); }, { passive: false });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(ev =>
      el.addEventListener(ev, () => cancelCharge(el))
    );
  });
}

function renderInitialLog() {
  const entries = state.battle.log.length ? state.battle.log : [
    { actor: "Korghaz",   text: "joacă <strong>Atac</strong> · daune <strong>13</strong>", cls: "damage" },
    { actor: state.playerName || "Tu", text: "ridică <strong>Scut</strong> · absoarbe <strong>8</strong>", cls: "buff" },
    { actor: state.playerName || "Tu", text: "lansează <strong>Magie</strong> · <strong>14</strong> daune magice", cls: "critical" },
    { actor: "Sistem",    text: "Korghaz este acum <strong>vulnerabil</strong>", cls: "" }
  ];
  return entries.slice(-6).map(e =>
    `<div class="log-entry ${e.cls || ""}"><span class="log-actor">${e.actor}</span><span class="log-text">${e.text}</span></div>`
  ).join("");
}

let chargeTimer = null;
function startCharge(cardEl) {
  if (state.battle.charging) return;
  const id = cardEl.dataset.cardId;
  const card = window.CARD_DATA.find(c => c.id === id);
  if (!card || state.battle.you.en < card.cost) return;
  state.battle.charging = true;
  state.battle.activeCard = card;
  cardEl.classList.add("active");
  document.getElementById("charge-bar").classList.add("charging");

  const motionScale = parseFloat(getComputedStyle(document.body).getPropertyValue("--motion-scale")) || 1;
  const dur = 1500 / motionScale;
  chargeTimer = setTimeout(() => doCast(card, cardEl), dur);
}

function cancelCharge(cardEl) {
  if (!state.battle.charging) return;
  clearTimeout(chargeTimer);
  state.battle.charging = false;
  state.battle.activeCard = null;
  cardEl.classList.remove("active");
  document.getElementById("charge-bar").classList.remove("charging");
}

function doCast(card, cardEl) {
  state.battle.charging = false;
  cardEl.classList.remove("active");
  document.getElementById("charge-bar").classList.remove("charging");

  // Spawn cast ring at center of arena
  const arena = document.querySelector(".battle-arena");
  const ring = document.createElement("div");
  ring.className = "cast-ring";
  ring.style.cssText = `left: 50%; top: 40%;`;
  arena.appendChild(ring);
  setTimeout(() => ring.remove(), 900);

  // Compute outcome — simplified sim
  const b = state.battle;
  b.you.en = Math.max(0, b.you.en - card.cost);

  let damage = 0, log = null;
  if (card.type === "offense") {
    damage = card.id === "magie" ? 14 : card.id === "dubla" ? 12 : card.id === "concentrare" ? 16 : 8;
    const absorbed = card.id === "magie" ? 0 : Math.min(b.foe.shield, damage);
    b.foe.shield = Math.max(0, b.foe.shield - absorbed);
    b.foe.hp = Math.max(0, b.foe.hp - (damage - absorbed));
    log = { actor: state.playerName || "Tu", text: `lansează <strong>${card.name}</strong> · <strong>${damage}</strong> daune`, cls: damage >= 12 ? "critical" : "damage" };
    shakeFoe();
    spawnDamage(damage);
  } else if (card.type === "defense") {
    if (card.id === "scut") b.you.shield += 8;
    if (card.id === "bariera") b.you.shield += 14;
    log = { actor: state.playerName || "Tu", text: `ridică <strong>${card.name}</strong> · <strong>+${card.id === "bariera" ? 14 : 8}</strong> scut`, cls: "buff" };
  } else {
    log = { actor: state.playerName || "Tu", text: `invocă <strong>${card.name}</strong>`, cls: "buff" };
    if (card.id === "sacrificiu") { b.you.hp = Math.max(1, b.you.hp - 5); b.you.en = Math.min(b.you.enMax, b.you.en + 4); }
  }

  if (log) {
    if (!state.battle.log.length) state.battle.log = [
      { actor: "Korghaz",   text: "joacă <strong>Atac</strong> · daune <strong>13</strong>", cls: "damage" },
      { actor: state.playerName || "Tu", text: "ridică <strong>Scut</strong> · absoarbe <strong>8</strong>", cls: "buff" },
      { actor: state.playerName || "Tu", text: "lansează <strong>Magie</strong> · <strong>14</strong> daune magice", cls: "critical" }
    ];
    state.battle.log.push(log);
  }
  renderBattle();

  // Maybe trigger foe cast after 1.2s
  setTimeout(() => foeCasts(), 1100);
}

function foeCasts() {
  const foeVideo = document.getElementById("foe-video");
  if (foeVideo) foeVideo.classList.add("casting");
  setTimeout(() => {
    foeVideo && foeVideo.classList.remove("casting");
    const b = state.battle;
    const dmg = 9;
    const absorbed = Math.min(b.you.shield, dmg);
    b.you.shield = Math.max(0, b.you.shield - absorbed);
    b.you.hp = Math.max(0, b.you.hp - (dmg - absorbed));
    state.battle.log.push({ actor: "Korghaz", text: `contraatacă · <strong>${dmg}</strong> daune (${absorbed} absorbit)`, cls: "damage" });
    shakeYou();
    renderBattle();
  }, 800);
}

function shakeFoe() {
  const el = document.getElementById("foe-video");
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}
function shakeYou() {
  const stage = document.querySelector(".screen.battle");
  stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
}

function spawnDamage(amount) {
  const arena = document.querySelector(".battle-arena");
  const el = document.createElement("div");
  el.className = "damage-popup";
  el.textContent = "-" + amount;
  el.style.left = "50%";
  el.style.top = "30%";
  arena.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ====================== TWEAKS ======================
function buildTweaks() {
  const panel = document.querySelector(".tweaks-panel");
  if (!panel) return;
  panel.innerHTML = `
    <h3>Tweaks</h3>
    <div class="tweak-group">
      <div class="tweak-group-label">Accent palette</div>
      <div class="tweak-row">
        <button class="tweak-opt active" data-palette="default"><span class="tweak-swatch" style="background:#6b4ee8"></span>Arcane</button>
        <button class="tweak-opt" data-palette="crimson"><span class="tweak-swatch" style="background:#b8385c"></span>Blood</button>
      </div>
      <div class="tweak-row">
        <button class="tweak-opt" data-palette="emerald"><span class="tweak-swatch" style="background:#2f9e7a"></span>Verdant</button>
        <button class="tweak-opt" data-palette="azure"><span class="tweak-swatch" style="background:#3f7be8"></span>Tide</button>
      </div>
    </div>
    <div class="tweak-group">
      <div class="tweak-group-label">Motion intensity</div>
      <div class="tweak-row">
        <button class="tweak-opt active" data-motion="max">Max</button>
        <button class="tweak-opt" data-motion="med">Med</button>
        <button class="tweak-opt" data-motion="low">Low</button>
      </div>
    </div>
    <div class="tweak-group">
      <div class="tweak-group-label">Ambient embers</div>
      <div class="tweak-row">
        <button class="tweak-opt active" data-embers="on">On</button>
        <button class="tweak-opt" data-embers="off">Off</button>
      </div>
    </div>
    <div class="tweak-group">
      <div class="tweak-group-label">Quick fill (debug)</div>
      <button class="tweak-opt" id="quick-fill-deck">Fill deck (15)</button>
      <button class="tweak-opt" id="reset-deck">Reset deck</button>
    </div>
    <div style="font-family: var(--f-serif); font-style: italic; font-size: 11px; color: var(--ink-faint); margin-top: 4px; line-height: 1.4;">
      Hold-click any card in the hand to charge the 1.5s gesture cast.
    </div>
  `;

  panel.querySelectorAll("[data-palette]").forEach(b => {
    b.addEventListener("click", () => {
      panel.querySelectorAll("[data-palette]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      document.body.classList.remove("palette-default", "palette-crimson", "palette-emerald", "palette-azure");
      document.body.classList.add("palette-" + b.dataset.palette);
    });
  });
  panel.querySelectorAll("[data-motion]").forEach(b => {
    b.addEventListener("click", () => {
      panel.querySelectorAll("[data-motion]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      document.body.classList.remove("motion-max", "motion-med", "motion-low");
      document.body.classList.add("motion-" + b.dataset.motion);
    });
  });
  panel.querySelectorAll("[data-embers]").forEach(b => {
    b.addEventListener("click", () => {
      panel.querySelectorAll("[data-embers]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      document.querySelector(".embers").style.display = b.dataset.embers === "on" ? "block" : "none";
    });
  });
  panel.querySelector("#quick-fill-deck").addEventListener("click", () => {
    state.deck = window.CARD_DATA.slice(0, 15).map(c => c.id);
    if (state.screen === "builder") renderBuilder();
    flashWarn("Deck filled 15/15");
  });
  panel.querySelector("#reset-deck").addEventListener("click", () => {
    state.deck = [];
    if (state.screen === "builder") renderBuilder();
  });
}

// ====================== EMBERS ======================
function startEmbers() {
  const canvas = document.querySelector(".embers");
  const ctx = canvas.getContext("2d");
  let w, h, particles = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    canvas.style.width = r.width + "px";
    canvas.style.height = r.height + "px";
    ctx.scale(devicePixelRatio, devicePixelRatio);
    w = r.width; h = r.height;
  }

  function spawn() {
    const density = parseFloat(getComputedStyle(document.body).getPropertyValue("--particle-density")) || 1;
    if (Math.random() > density * 0.6) return;
    particles.push({
      x: Math.random() * w,
      y: h + 8,
      vy: 0.3 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.3,
      r: 0.8 + Math.random() * 1.6,
      life: 0,
      max: 200 + Math.random() * 200,
      hue: Math.random() < 0.7 ? "212, 168, 87" : "184, 156, 255"
    });
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    spawn();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.y -= p.vy;
      p.x += p.vx + Math.sin(p.life * 0.03) * 0.2;
      const alpha = (1 - p.life / p.max) * 0.65;
      if (alpha <= 0 || p.y < -10) { particles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${alpha * 0.18})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", () => { ctx.setTransform(1,0,0,1,0,0); resize(); });
  tick();
}

// ====================== BOOT ======================
document.addEventListener("DOMContentLoaded", () => {
  // Wire chrome tabs
  document.querySelectorAll(".proto-tab[data-screen]").forEach(t => {
    t.addEventListener("click", () => go(t.dataset.screen));
  });
  document.querySelectorAll(".proto-tab[data-viewport]").forEach(t => {
    t.addEventListener("click", () => setViewport(t.dataset.viewport));
  });
  // Delegate go buttons inside screens
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-go]");
    if (t && !t.disabled) go(t.dataset.go);
  });

  buildTweaks();
  startEmbers();
  go("lobby");
});
