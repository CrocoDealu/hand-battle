import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const socket = io();

// ============================================
// DESIGN SYSTEM — sigil / type mappings
// ============================================

const CARD_SIGIL_MAP = {
    "Atac": "atac", "Magie": "magie", "Concentrare": "concentrare",
    "Garda_de_Fier": "garda", "Dubla": "dubla", "Scut": "scut",
    "Bariera": "bariera", "Reflectie": "reflectie", "Ghimpi": "ghimpi",
    "Purificare": "purificare", "Buff": "buff", "Pregatire": "pregatire",
    "Debuff": "debuff", "Vulnerabilitate": "vulnerabil", "Sacrificiu": "sacrificiu",
    "Adrenalina": "adrenalina", "Viziune": "viziune", "Arhiva": "arhiva",
    "Pass_Turn": "pass"
};
const CARD_TYPE_MAP = {
    "Atac": "offense", "Magie": "offense", "Concentrare": "offense",
    "Garda_de_Fier": "offense", "Dubla": "offense",
    "Scut": "defense", "Bariera": "defense", "Reflectie": "defense",
    "Ghimpi": "defense", "Purificare": "defense",
    "Buff": "utility", "Pregatire": "utility", "Debuff": "utility",
    "Vulnerabilitate": "utility", "Sacrificiu": "utility",
    "Adrenalina": "utility", "Viziune": "utility", "Arhiva": "utility",
    "Pass_Turn": "utility"
};
const CARD_NAME_RO = {
    "Atac": "Atac", "Magie": "Magie", "Concentrare": "Concentrare",
    "Garda_de_Fier": "Gardă", "Dubla": "Dublă", "Scut": "Scut",
    "Bariera": "Barieră", "Reflectie": "Reflecție", "Ghimpi": "Ghimpi",
    "Purificare": "Purificare", "Buff": "Buff", "Pregatire": "Pregătire",
    "Debuff": "Debuff", "Vulnerabilitate": "Vulnerabil", "Sacrificiu": "Sacrificiu",
    "Adrenalina": "Adrenalină", "Viziune": "Viziune", "Arhiva": "Arhivă",
    "Pass_Turn": "Pass Turn"
};
const TYPE_LABEL_MAP = { offense: "Ofensiv", defense: "Defensiv", utility: "Utilitate" };
const CLASS_HP_MAP = {
    "Soldatul": 120, "Magul": 80, "Capcaunul": 180, "Asasinul": 90, "Bancherul": 100
};
const CLASS_DATA = [
    { id: "soldat",  appId: "Soldatul",  name: "Soldatul",  hp: 120, perk: "+10 Scut start · +5 Regen EN",    emblem: "soldat"  },
    { id: "mag",     appId: "Magul",     name: "Magul",     hp: 80,  perk: "Magie -1 cost · +6 Regen EN",     emblem: "mag"     },
    { id: "capcaun", appId: "Capcaunul", name: "Căpcăunul", hp: 180, perk: "Atac +5 · +4 Regen EN",           emblem: "capcaun" },
    { id: "asasin",  appId: "Asasinul",  name: "Asasinul",  hp: 90,  perk: "Primul atac x2 · +4 Regen EN",    emblem: "asasin"  },
    { id: "bancher", appId: "Bancherul", name: "Bancherul", hp: 100, perk: "+20 EN start · +3 Regen EN",       emblem: "bancher" }
];

let myHpMax = 100, myEnMax = 12, deckFilter = "all";

// Render a visual card element string
function renderVisualCard(cardKey, cost, opts = {}) {
    const sigilKey = CARD_SIGIL_MAP[cardKey];
    const sigil = (window.HB_SIGILS && sigilKey) ? (window.HB_SIGILS[sigilKey] || '') : '';
    const type = CARD_TYPE_MAP[cardKey] || 'utility';
    const name = CARD_NAME_RO[cardKey] || cardKey;
    const typeLabel = TYPE_LABEL_MAP[type] || '';
    const desc = CARDS_DB[cardKey] ? CARDS_DB[cardKey].desc : '';
    const classes = [
        "card", `type-${type}`,
        opts.size ? `size-${opts.size}` : '',
        opts.disabled ? 'disabled' : '',
        opts.active ? 'active' : '',
        opts.selected ? 'selected' : ''
    ].filter(Boolean).join(' ');
    const idAttr = opts.id ? `id="${opts.id}"` : '';
    return `
      <div class="${classes}" ${idAttr} data-card-key="${cardKey}">
        <div class="card-frame"></div>
        <div class="card-inner">
          <span class="card-fil-bl"></span><span class="card-fil-br"></span>
          <div class="card-cost">${cost}</div>
          <div class="card-name">${name}</div>
          <div class="card-sigil">${sigil}</div>
          <div class="card-foot">
            <div class="card-type">${typeLabel}</div>
            <div class="card-effect">${desc}</div>
          </div>
        </div>
      </div>`;
}

function renderEnergyCrystals(en, enMax, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const display = Math.min(enMax, 15);
    let html = '';
    for (let i = 0; i < display; i++) {
        html += `<span class="energy-crystal${i >= en ? ' spent' : ''}"></span>`;
    }
    el.innerHTML = html;
}

function updateHPBar(fillId, hp, hpMax) {
    const fill = document.getElementById(fillId);
    if (fill) fill.style.transform = `scaleX(${Math.max(0, Math.min(1, hp / hpMax))})`;
}

function flashWarn(msg) {
    let t = document.getElementById('hb-toast');
    if (!t) { t = document.createElement('div'); t.id = 'hb-toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

function updateDeckList() {
    const listEl = document.getElementById('deck-list');
    if (!listEl) return;
    const items = Object.entries(selectedDeckCount).filter(([, c]) => c > 0);
    if (items.length === 0) {
        listEl.innerHTML = '<div class="deck-empty-hint">Selectează cărți din arhivă pentru a-ți construi decul.</div>';
        return;
    }
    listEl.innerHTML = items.map(([key, count]) => {
        const sigilKey = CARD_SIGIL_MAP[key];
        const sigil = (window.HB_SIGILS && sigilKey) ? (window.HB_SIGILS[sigilKey] || '') : '';
        const name = CARD_NAME_RO[key] || key;
        const type = CARD_TYPE_MAP[key] || 'utility';
        return `<div class="deck-item" data-key="${key}">
          <span class="deck-item-sigil" style="color:var(--${type === 'offense' ? 'ember' : type === 'defense' ? 'azure' : 'amber'})">${sigil}</span>
          <span class="deck-item-name">${count > 1 ? `${name} ×${count}` : name}</span>
          <span class="deck-item-cost">${count} EN</span>
          <button class="deck-item-remove" onclick="window._hbRemoveDeckItem('${key}')" title="Elimină">×</button>
        </div>`;
    }).join('');
}

window._hbRemoveDeckItem = function(key) {
    if (selectedDeckCount[key] > 0) { selectedDeckCount[key]--; updateDeckUI(); }
};

function startEmbers() {
    const canvas = document.getElementById('embers-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w * devicePixelRatio; canvas.height = h * devicePixelRatio;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        ctx.scale(devicePixelRatio, devicePixelRatio);
    }
    function spawn() {
        if (Math.random() > 0.55) return;
        particles.push({ x: Math.random() * w, y: h + 8, vy: 0.4 + Math.random() * 0.7,
            vx: (Math.random() - 0.5) * 0.3, r: 0.8 + Math.random() * 1.6,
            life: 0, max: 200 + Math.random() * 200,
            hue: Math.random() < 0.65 ? '212, 168, 87' : '184, 156, 255' });
    }
    function tick() {
        ctx.clearRect(0, 0, w, h);
        spawn();
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]; p.life++;
            p.y -= p.vy; p.x += p.vx + Math.sin(p.life * 0.03) * 0.18;
            const alpha = (1 - p.life / p.max) * 0.55;
            if (alpha <= 0 || p.y < -10) { particles.splice(i, 1); continue; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.hue}, ${alpha})`; ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.hue}, ${alpha * 0.15})`; ctx.fill();
        }
        requestAnimationFrame(tick);
    }
    resize(); window.addEventListener('resize', () => { ctx.setTransform(1,0,0,1,0,0); resize(); }); tick();
}

function bootLobby() {
    // Render class tiles
    const grid = document.getElementById('class-grid');
    if (grid && window.HB_CLASS_EMBLEMS) {
        grid.innerHTML = CLASS_DATA.map(c => `
          <button class="class-tile" data-class-id="${c.appId}" type="button">
            <div class="class-sigil">${window.HB_CLASS_EMBLEMS[c.emblem] || ''}</div>
            <div class="class-name">${c.name}</div>
            <div class="class-hp">${c.hp} HP</div>
            <div class="class-perk">${c.perk}</div>
          </button>`).join('');
        grid.querySelectorAll('.class-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                grid.querySelectorAll('.class-tile').forEach(t => t.classList.remove('selected'));
                tile.classList.add('selected');
                const sel = document.getElementById('player-class');
                if (sel) sel.value = tile.dataset.classId;
                myClass = tile.dataset.classId;
            });
        });
        // Select first by default
        const first = grid.querySelector('.class-tile');
        if (first) first.click();
    }

    // Lobby content rise animation (double-rAF to avoid freeze on display:none parents)
    const content = document.getElementById('lobby-content');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }));
    }

    // Deck builder filter chips
    const filters = document.getElementById('builder-filters');
    if (filters) {
        filters.addEventListener('click', e => {
            const chip = e.target.closest('.chip[data-filter]');
            if (!chip) return;
            filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            deckFilter = chip.dataset.filter;
            updateDeckUI();
        });
    }
}

// ============================================
// CONFIGURARE DATE JOC & AI
// ============================================

const GESTURE_MAP = {
    "Pistol": "Atac", "Bagheta": "Magie", "Zen": "Concentrare",
    "Pumn": "Garda_de_Fier", "Coarne": "Dubla", "Stop": "Scut",
    "Spock": "Bariera", "Shaka": "Reflectie", "Deget_mic": "Ghimpi",
    "Thumbs_up": "Purificare", "Ok": "Buff", "Pinch": "Pregatire",
    "Thumbs_down": "Debuff", "L": "Vulnerabilitate", "Spiderman": "Sacrificiu",
    "3": "Adrenalina", "Zen_inelar": "Viziune", "Degete_incrucisate": "Arhiva",
    "4": "Pass_Turn", "None": "None"
};

const CARDS_DB = {
    "Atac": { icon: "🔫", name: "Attack", limit: 4, desc: "Deal 15 Damage." },
    "Magie": { icon: "🪄", name: "Magic", limit: 2, desc: "Deal 25 Damage. Ignores Shield completely." },
    "Concentrare": { icon: "🧘", name: "Focus", limit: 2, desc: "Next attack deals +4 Base Damage." },
    "Garda_de_Fier": { icon: "✊", name: "Iron Guard", limit: 2, desc: "Consume all Shield to deal damage equal to that amount." },
    "Dubla": { icon: "🤘", name: "Double", limit: 2, desc: "Your next Attack, Magic, or Iron Guard deals x2 Damage." },
    "Scut": { icon: "🖐️", name: "Shield", limit: 4, desc: "Gain 20 Shield." },
    "Bariera": { icon: "🖖", name: "Barrier", limit: 2, desc: "Reduce the next incoming damage by 50%." },
    "Reflectie": { icon: "🤙", name: "Reflection", limit: 2, desc: "Reflect 50% of the next incoming damage back to the attacker." },
    "Ghimpi": { icon: "🤏", name: "Thorns", limit: 4, desc: "Attacker takes 8 damage the next time they hit you." },
    "Purificare": { icon: "👍", name: "Purify", limit: 2, desc: "Remove Vulnerability. Reset enemy Energy Regen." },
    "Buff": { icon: "👌", name: "Buff", limit: 4, desc: "Gain +2 Energy Regen per round." },
    "Pregatire": { icon: "🤏", name: "Preparation", limit: 4, desc: "Reduce the cost of your next card by 2." },
    "Debuff": { icon: "👎", name: "Debuff", limit: 4, desc: "Reduce enemy Energy Regen by 2." },
    "Vulnerabilitate": { icon: "👆", name: "Vulnerable", limit: 2, desc: "Enemy takes 1.5x damage for 2 turns." },
    "Sacrificiu": { icon: "🤟", name: "Sacrifice", limit: 2, desc: "Lose 12 HP. Gain 4 Energy." },
    "Adrenalina": { icon: "3️⃣", name: "Adrenaline", limit: 2, desc: "Draw 2 cards from your deck." },
    "Viziune": { icon: "🤚", name: "Vision", limit: 2, desc: "Reveal the opponent's current hand." },
    "Arhiva": { icon: "🤞", name: "Archive", limit: 2, desc: "Keep your unplayed cards for the next turn." }
};

let selectedDeckCount = { 
    "Atac": 3, "Magie": 2, "Concentrare": 0, "Garda_de_Fier": 0, "Dubla": 0, 
    "Scut": 3, "Bariera": 1, "Reflectie": 0, "Ghimpi": 0, "Purificare": 0, 
    "Buff": 2, "Pregatire": 2, "Debuff": 2, "Vulnerabilitate": 0, 
    "Sacrificiu": 0, "Adrenalina": 0, "Viziune": 0, "Arhiva": 0 
};

// State
let myId = null, isMyTurn = false, myName = "", myClass = "Soldatul", myCurrentHand = [];
let gestureRecognizer, currentGesture = "None", chargeStartTime = 0, isCharging = false;
let isTesting = false, testStream = null;
let peerConnection;
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ============================================
// UI & LOBBY LOGIC
// ============================================

function updateDeckUI() {
    const totalCards = Object.values(selectedDeckCount).reduce((a, b) => a + b, 0);
    const container = document.getElementById('deck-grid-container');
    if (!container) return;

    container.innerHTML = '';
    for (const [key] of Object.entries(CARDS_DB)) {
        const count = selectedDeckCount[key] || 0;
        const type = CARD_TYPE_MAP[key] || 'utility';
        if (deckFilter !== 'all' && type !== deckFilter) continue;
        container.innerHTML += renderVisualCard(key, 0, { selected: count > 0 });
    }

    // Attach click handlers to pool cards
    container.querySelectorAll('.card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const key = cardEl.dataset.cardKey;
            const total = Object.values(selectedDeckCount).reduce((a, b) => a + b, 0);
            const count = selectedDeckCount[key] || 0;
            if (count > 0) {
                selectedDeckCount[key]--;
            } else if (total < 15 && count < (CARDS_DB[key] ? CARDS_DB[key].limit : 1)) {
                selectedDeckCount[key] = (selectedDeckCount[key] || 0) + 1;
            } else if (total >= 15) {
                flashWarn('Decul tău e plin! Elimină o carte mai întâi.');
                return;
            }
            updateDeckUI();
        });
    });

    // Progress ring
    const circ = 326.73;
    const offset = circ * (1 - Math.min(totalCards, 15) / 15);
    const ring = document.getElementById('deck-progress-ring');
    if (ring) ring.style.strokeDashoffset = offset;

    // Counter
    const spanTotal = document.getElementById('deck-total');
    if (spanTotal) spanTotal.innerText = totalCards;

    // Deck list sidebar
    updateDeckList();

    // Join button
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
        joinBtn.disabled = totalCards !== 15;
        joinBtn.textContent = totalCards === 15
            ? 'Caută Adversar →'
            : `Mai ai nevoie de ${15 - totalCards} cărți`;
    }
}

socket.on('connect', () => { myId = socket.id; });

function showScreen(showId, displayValue) {
    ['lobby','deck-builder','game','test-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === showId) {
            el.style.display = displayValue;
            el.style.opacity = '0';
            requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
        } else {
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; }, 350);
        }
    });
}

document.getElementById('next-btn').onclick = () => {
    myName = document.getElementById('player-name').value || "Anonymous";
    myClass = document.getElementById('player-class').value;
    showScreen('deck-builder', 'flex');
    updateDeckUI();
};

document.getElementById('join-btn').onclick = () => {
    let finalDeck = [];
    for (const [key, count] of Object.entries(selectedDeckCount)) { for(let i=0; i<count; i++) finalDeck.push(key); }
    socket.emit('join_game', { name: myName, char_class: myClass, deck: finalDeck });
    document.getElementById('join-btn').style.display = 'none';
    document.getElementById('deck-grid-container').style.display = 'none';
    document.getElementById('status-text').style.display = 'block';
};

document.getElementById('test-signs-btn').onclick = async () => {
    showScreen('test-screen', 'flex');
    isTesting = true;
    try {
        testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        document.getElementById('test-video').srcObject = testStream;
    } catch (e) { alert("Camera este necesară."); }
};

document.getElementById('back-lobby-btn').onclick = () => {
    showScreen('lobby', 'flex');
    isTesting = false;
    if(testStream) { testStream.getTracks().forEach(t => t.stop()); testStream = null; }
};

// ============================================
// GAME ENGINE & SOCKETS
// ============================================

socket.on('player_count', (count) => document.getElementById('status-text').innerText = `Aștept adversar... (${count}/2)`);

function appendLog(text, cls = '') {
    const logEl = document.getElementById('combat-log');
    if (!logEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (cls ? ' ' + cls : '');
    entry.innerHTML = `<span class="log-actor">Sistem</span><span class="log-text">${text}</span>`;
    logEl.prepend(entry);
}

socket.on('game_start', (data) => {
    showScreen('game', 'grid');
    myHpMax = CLASS_HP_MAP[myClass] || 100;

    // Set local player name/class sigil
    const localName = document.getElementById('local-name');
    if (localName) localName.innerText = myName || 'Tu';
    const localLabel = document.getElementById('local-class-label');
    if (localLabel) localLabel.innerText = myClass || '';
    const localSigil = document.getElementById('local-class-sigil');
    if (localSigil && window.HB_CLASS_EMBLEMS) {
        const cls = CLASS_DATA.find(c => c.appId === myClass);
        if (cls) localSigil.innerHTML = window.HB_CLASS_EMBLEMS[cls.emblem] || '';
    }

    let secondsLeft = 5;
    const timerInterval = setInterval(() => {
        appendLog(`Pornire cameră... ${secondsLeft}s`);
        secondsLeft--;
        if (secondsLeft < 0) {
            clearInterval(timerInterval);
            appendLog('Meciul începe!', 'buff');
            startWebRTC(data.caller_id === myId);
        }
    }, 1000);
});

socket.on('game_state_update', (state) => {
    isMyTurn = state.active_player === myId;
    resetCharge();
    const me = state.players[myId];
    const oppId = Object.keys(state.players).find(id => id !== myId);
    const opp = state.players[oppId];

    const roundEl = document.getElementById('round-indicator');
    if (roundEl) roundEl.innerText = `RUNDA ${state.round} / ${state.max_rounds}`;

    // Store valid hand IDs for gesture validation
    myCurrentHand = me.dynamic_hand ? me.dynamic_hand.map(card => card.id) : [];

    const handContainer = document.getElementById('my-hand-container');
    if (handContainer) handContainer.innerHTML = '';

    if (isMyTurn && me.dynamic_hand) {
        const turnEl = document.getElementById('turn-indicator');
        if (turnEl) { turnEl.innerText = 'RÂNDUL TĂU'; turnEl.style.color = 'var(--teal-glow)'; }

        me.dynamic_hand.forEach(cardData => {
            const g = cardData.id;
            const cost = cardData.current_cost;
            const disabled = me.energy < cost;
            handContainer.innerHTML += renderVisualCard(g, cost, { id: `card-${g}`, size: 'sm', disabled });
        });
        handContainer.innerHTML += renderVisualCard('Pass_Turn', 0, { id: 'card-Pass_Turn', size: 'sm' });
    } else {
        const turnEl = document.getElementById('turn-indicator');
        if (turnEl) { turnEl.innerText = 'RÂNDUL ADVERSARULUI'; turnEl.style.color = 'var(--blood-glow)'; }
    }

    // HP bars
    document.getElementById('local-hp').innerText = me.hp;
    updateHPBar('local-hp-fill', me.hp, myHpMax);
    document.getElementById('local-sh').innerText = me.shield;

    // Energy crystals (local)
    document.getElementById('local-en').innerText = me.energy;
    renderEnergyCrystals(me.energy, myEnMax, 'local-energy-bar');

    if (opp) {
        document.getElementById('remote-hp').innerText = opp.hp;
        updateHPBar('remote-hp-fill', opp.hp, 100);
        document.getElementById('remote-sh').innerText = opp.shield;
        document.getElementById('remote-en').innerText = opp.energy;
        renderEnergyCrystals(opp.energy, myEnMax, 'remote-energy-bar');
    }

    const renderStatus = (p, containerId) => {
        let html = ''; if (!p) return;
        if (p.dmg_reduction > 0)   html += `<span class="badge badge-buff">Barieră</span>`;
        if (p.reflect)              html += `<span class="badge badge-buff">Reflecție</span>`;
        if (p.thorns)               html += `<span class="badge badge-buff">Ghimpi</span>`;
        if (p.next_attack_double)   html += `<span class="badge badge-buff">x2 Atac</span>`;
        if (p.next_attack_bonus > 0) html += `<span class="badge badge-buff">+${p.next_attack_bonus} Dmg</span>`;
        if (p.vuln_turns > 0)       html += `<span class="badge badge-debuff">Vulnerabil</span>`;
        if (p.energy_regen < p.base_regen) html += `<span class="badge badge-debuff">-EN Regen</span>`;
        else if (p.energy_regen > p.base_regen) html += `<span class="badge badge-buff">+EN Regen</span>`;
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = html;
    };
    renderStatus(me, 'local-status-container');
    renderStatus(opp, 'remote-status-container');
});

socket.on('opponent_disconnected', () => {
    alert("Opponent disconnected. Match cancelled.");
    window.location.reload(); 
});

// WebRTC
async function startWebRTC(isCaller) {
    peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnection.ontrack = e => document.getElementById('remote-video').srcObject = e.streams[0];
    peerConnection.onicecandidate = e => { if (e.candidate) socket.emit('webrtc_ice', e.candidate); };
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        document.getElementById('local-video').srcObject = stream;
        stream.getTracks().forEach(t => peerConnection.addTrack(t, stream));
    } catch (err) { alert("Camera este necesară."); }
    if (isCaller) {
        setTimeout(async () => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('webrtc_offer', offer);
        }, 3000);
    }
}
socket.on('webrtc_offer', async o => { peerConnection.setRemoteDescription(new RTCSessionDescription(o)); const a = await peerConnection.createAnswer(); peerConnection.setLocalDescription(a); socket.emit('webrtc_answer', a); });
socket.on('webrtc_answer', async a => peerConnection.setRemoteDescription(new RTCSessionDescription(a)));
socket.on('webrtc_ice', async c => peerConnection.addIceCandidate(new RTCIceCandidate(c)));

socket.on('game_over', (data) => {
    isMyTurn = false;
    resetCharge();
    
    const amIWinner = data.winner === myId;
    const resultMsg = amIWinner ? "🏆 YOU WIN!" : "💀 YOU LOSE!";
    
    // Optional: Hide the game container and show a result screen, or just use an alert for now
    alert(`${data.msg}\n${resultMsg}`);
    
    // Reset the game to lobby
    window.location.reload();
});

// ============================================
// AI GESTURE ENGINE
// ============================================

async function initMediaPipe() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "finetuned_gesture_recognizer.task", delegate: "GPU" },
        runningMode: "VIDEO", numHands: 1
    });
    console.log("🚀 Model AI personalizat încărcat!");
    renderLoop();
}

function renderLoop() {
    const gameVideo = document.getElementById('local-video');
    const testVideo = document.getElementById('test-video');
    let activeVideo = isTesting ? testVideo : (isMyTurn ? gameVideo : null);

    if (activeVideo && activeVideo.currentTime > 0) {
        const results = gestureRecognizer.recognizeForVideo(activeVideo, performance.now());
        let detectedRaw = "None", score = 0;

        if (results.gestures && results.gestures.length > 0) {
            detectedRaw = results.gestures[0][0].categoryName;
            score = results.gestures[0][0].score;
        }

        let detected = GESTURE_MAP[detectedRaw] || "None";

        if (isTesting) {
            document.getElementById('test-result').innerText = `Gest Detectat: ${detected}`;
            document.getElementById('test-debug').innerText = `AI Label: ${detectedRaw} (${(score * 100).toFixed(1)}%)`;
        } else if (isMyTurn) {
            handleGameGesture(detected);
        }
    } else {
        if (!isTesting) resetCharge();
    }
    requestAnimationFrame(renderLoop);
}

function handleGameGesture(detected) {
    const canPlay = myCurrentHand.includes(detected) || detected === "Pass_Turn";

    if (detected === "None" || !canPlay) {
        resetCharge();
    } else {
        if (detected !== currentGesture) {
            currentGesture = detected;
            chargeStartTime = performance.now();
            isCharging = true;
        } else {
            const progress = Math.min((performance.now() - chargeStartTime) / 1000, 1);
            updateChargeUI(progress, currentGesture);
            
            if (progress >= 1.0) {
                socket.emit('play_card', { gesture: currentGesture });
                resetCharge();
                chargeStartTime = performance.now() + 1500; 
            }
        }
    }
}

function resetCharge() {
    currentGesture = "None";
    isCharging = false;
    updateChargeUI(0, null);
}

function updateChargeUI(p, g) {
    const container = document.getElementById('charge-bar-container');
    if (container) {
        if (p > 0 && g) {
            if (!container.classList.contains('charging')) container.classList.add('charging');
        } else {
            container.classList.remove('charging');
        }
    }
    document.querySelectorAll('#my-hand-container .card').forEach(c => c.classList.remove('active'));
    if (g && p > 0) {
        const cardEl = document.getElementById(`card-${g}`);
        if (cardEl) cardEl.classList.add('active');
    }
}

// Boot visual systems
startEmbers();
bootLobby();

initMediaPipe();