import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const socket = io();

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
    let totalCards = Object.values(selectedDeckCount).reduce((a, b) => a + b, 0);
    const container = document.getElementById('deck-grid-container');
    container.innerHTML = "";
    for (const [key, card] of Object.entries(CARDS_DB)) {
        const count = selectedDeckCount[key];
        container.innerHTML += `
            <div class="deck-row" style="flex-direction: column; align-items: flex-start;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <div style="font-size: 1.1rem; text-align: left;">${card.icon} <b>${card.name}</b></div>
                    <div>
                        <button id="btn-minus-${key}">-</button>
                        <span style="display:inline-block; width: 35px; text-align:center; font-weight:bold;">${count}/${card.limit}</span>
                        <button id="btn-plus-${key}">+</button>
                    </div>
                </div>
                <div style="font-size: 0.85rem; color: #a9b7c6; margin-top: 5px; text-align: left;"><i>${card.desc}</i></div>
            </div>`;
    }
    const spanTotal = document.getElementById('deck-total');
    spanTotal.innerText = totalCards;
    spanTotal.style.color = totalCards === 15 ? "#03dac6" : "#ffeb3b";
    document.getElementById('join-btn').disabled = totalCards !== 15;

    for (const key of Object.keys(CARDS_DB)) {
        document.getElementById(`btn-minus-${key}`).onclick = () => { if (selectedDeckCount[key] > 0) { selectedDeckCount[key]--; updateDeckUI(); } };
        document.getElementById(`btn-plus-${key}`).onclick = () => {
            if (selectedDeckCount[key] < CARDS_DB[key].limit && Object.values(selectedDeckCount).reduce((a,b)=>a+b,0) < 15) {
                selectedDeckCount[key]++; updateDeckUI();
            }
        };
    }
}

socket.on('connect', () => { myId = socket.id; });

document.getElementById('next-btn').onclick = () => {
    myName = document.getElementById('player-name').value || "Anonymous";
    myClass = document.getElementById('player-class').value;
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('deck-builder').style.display = 'block';
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
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('test-screen').style.display = 'block';
    isTesting = true;
    try {
        testStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        document.getElementById('test-video').srcObject = testStream;
    } catch (e) { alert("Camera este necesară."); }
};

document.getElementById('back-lobby-btn').onclick = () => {
    document.getElementById('test-screen').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
    isTesting = false;
    if(testStream) { testStream.getTracks().forEach(t => t.stop()); testStream = null; }
};

// ============================================
// GAME ENGINE & SOCKETS
// ============================================

socket.on('player_count', (count) => document.getElementById('status-text').innerText = `Aștept adversar... (${count}/2)`);

socket.on('game_start', (data) => {
    document.getElementById('deck-builder').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    
    let secondsLeft = 5;
    const logEl = document.getElementById('combat-log');
    
    const timerInterval = setInterval(() => {
        logEl.innerText = `Waiting for camera permissions... Starting in ${secondsLeft}s`;
        secondsLeft--;
        
        if (secondsLeft < 0) {
            clearInterval(timerInterval);
            logEl.innerText = "Match starting...";
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
    
    document.getElementById('round-indicator').innerText = `RUNDA ${state.round} / ${state.max_rounds}`;
    
    // Store valid hand IDs for gesture validation
    myCurrentHand = me.dynamic_hand ? me.dynamic_hand.map(card => card.id) : [];
    
    const handContainer = document.getElementById('my-hand-container');
    handContainer.innerHTML = "";
    
    if (isMyTurn && me.dynamic_hand) {
        document.getElementById('turn-indicator').innerText = "RÂNDUL TĂU";
        document.getElementById('turn-indicator').style.color = "#03dac6";
        
        me.dynamic_hand.forEach(cardData => {
            const g = cardData.id;
            const cost = cardData.current_cost;
            handContainer.innerHTML += `
                <div class="card" id="card-${g}">
                    <div style="font-size: 1.5rem; margin-bottom: 5px;">${CARDS_DB[g].icon}</div>
                    <div style="font-size: 1.1rem;"><b>${CARDS_DB[g].name}</b></div>
                    <div style="color: #ffd600; font-weight: bold; margin: 4px 0;">⚡ ${cost}</div>
                    <div class="card-desc">${CARDS_DB[g].desc}</div>
                </div>`;
        });

        handContainer.innerHTML += `
            <div class="card" id="card-Pass_Turn" style="border-color:#cf6679;">
                <div style="font-size: 1.5rem; margin-bottom: 5px;">4️⃣</div>
                <div style="font-size: 1.1rem; color: #cf6679;"><b>Pass Turn</b></div>
                <div style="color: #ffd600; font-weight: bold; margin: 4px 0;">⚡ 0</div>
                <div class="card-desc">End your turn (Show 4 Fingers).</div>
            </div>`;
    } else {
        document.getElementById('turn-indicator').innerText = "RÂNDUL ADVERSARULUI";
        document.getElementById('turn-indicator').style.color = "#cf6679";
    }
    
    document.getElementById('local-hp').innerText = me.hp;
    document.getElementById('local-en').innerText = me.energy;
    document.getElementById('local-sh').innerText = me.shield;
    if (opp) {
        document.getElementById('remote-hp').innerText = opp.hp;
        document.getElementById('remote-en').innerText = opp.energy;
        document.getElementById('remote-sh').innerText = opp.shield;
    }
    
    const renderStatus = (p, containerId) => {
        let html = ""; if (!p) return;
        if (p.dmg_reduction > 0) html += `<div class="badge badge-buff">🛡️ -50% Dmg</div>`;
        if (p.reflect) html += `<div class="badge badge-buff">🪞 Reflect 50%</div>`;
        if (p.thorns) html += `<div class="badge badge-buff">🌵 8 Thorns</div>`;
        if (p.next_attack_double) html += `<div class="badge badge-buff">⚔️ x2 Damage</div>`;
        if (p.next_attack_bonus > 0) html += `<div class="badge badge-buff">🗡️ +${p.next_attack_bonus} Dmg</div>`;
        if (p.vuln_turns > 0) html += `<div class="badge badge-debuff">💔 +50% Dmg Taken (${p.vuln_turns}t)</div>`;
        
        if (p.energy_regen < p.base_regen) {
            html += `<div class="badge badge-debuff">📉 ${p.energy_regen - p.base_regen} Energy Regen</div>`;
        } else if (p.energy_regen > p.base_regen) {
            html += `<div class="badge badge-buff">📈 +${p.energy_regen - p.base_regen} Energy Regen</div>`;
        }
        document.getElementById(containerId).innerHTML = html;
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
    const bar = document.getElementById('charge-bar');
    if (bar) bar.style.width = `${p * 100}%`;
    
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    if (g && p > 0) {
        const cardEl = document.getElementById(`card-${g}`);
        if (cardEl) cardEl.classList.add('active');
    }
}

initMediaPipe();