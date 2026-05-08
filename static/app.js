import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const socket = io();

// DOM Elements
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const nextBtn = document.getElementById('next-btn');
const joinBtn = document.getElementById('join-btn');
const nameInput = document.getElementById('player-name');
const statusText = document.getElementById('status-text');

const lobbyDiv = document.getElementById('lobby');
const deckBuilderDiv = document.getElementById('deck-builder');
const gameDiv = document.getElementById('game');

const turnIndicator = document.getElementById('turn-indicator');
const roundIndicator = document.getElementById('round-indicator');
const chargeBar = document.getElementById('charge-bar');
const combatLog = document.getElementById('combat-log');
const handContainer = document.getElementById('my-hand-container');
const deckGridContainer = document.getElementById('deck-grid-container');
const deckTotalSpan = document.getElementById('deck-total');

const CARDS_DB = {
    "Closed_Fist": { icon: "✊", name: "Shield", cost: 2 },
    "Open_Palm": { icon: "🖐", name: "Damage", cost: 3 },
    "Thumb_Up": { icon: "👍", name: "Buff", cost: 2 },
    "Victory": { icon: "✌️", name: "Debuff", cost: 2 },
    "Pointing_Up": { icon: "☝️", name: "Magic", cost: 4 }
};

let peerConnection;
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let myId = null;
let isMyTurn = false;
let myName = "";
let myCurrentHand = [];

// --- DECK BUILDER STATE ---
let selectedDeckCount = {
    "Closed_Fist": 2, // Starts with a balanced 10-card deck
    "Open_Palm": 2,
    "Thumb_Up": 2,
    "Victory": 2,
    "Pointing_Up": 2
};

function updateDeckUI() {
    let totalCards = 0;
    deckGridContainer.innerHTML = "";
    
    for (const [key, card] of Object.entries(CARDS_DB)) {
        const count = selectedDeckCount[key];
        totalCards += count;
        
        deckGridContainer.innerHTML += `
            <div class="deck-row">
                <div style="font-size: 1.2rem;">${card.icon} <b>${card.name}</b> (Cost: ${card.cost})</div>
                <div>
                    <button id="btn-minus-${key}">-</button>
                    <span style="display:inline-block; width: 40px; font-weight: bold; font-size:1.2rem;">${count}/4</span>
                    <button id="btn-plus-${key}">+</button>
                </div>
            </div>
        `;
    }

    deckTotalSpan.innerText = totalCards;
    joinBtn.disabled = totalCards !== 10;
    deckTotalSpan.style.color = totalCards === 10 ? "#03dac6" : "#ffeb3b";

    // Attach listeners after rendering
    for (const key of Object.keys(CARDS_DB)) {
        document.getElementById(`btn-minus-${key}`).addEventListener('click', () => {
            if (selectedDeckCount[key] > 0) { selectedDeckCount[key]--; updateDeckUI(); }
        });
        document.getElementById(`btn-plus-${key}`).addEventListener('click', () => {
            if (selectedDeckCount[key] < 4 && totalCards < 10) { selectedDeckCount[key]++; updateDeckUI(); }
        });
    }
}

// --- SOCKET.IO ---

socket.on('connect', () => { myId = socket.id; });

// Phase 1 -> Phase 2
nextBtn.addEventListener('click', () => {
    myName = nameInput.value.trim() || "Anonymous";
    lobbyDiv.style.display = 'none';
    deckBuilderDiv.style.display = 'block';
    updateDeckUI();
});

// Phase 2 -> Join Game
joinBtn.addEventListener('click', () => {
    // Convert counts to flat array (e.g. ["Closed_Fist", "Closed_Fist", "Open_Palm", ...])
    let finalDeck = [];
    for (const [key, count] of Object.entries(selectedDeckCount)) {
        for(let i=0; i<count; i++) finalDeck.push(key);
    }
    
    socket.emit('join_game', { name: myName, deck: finalDeck });
    joinBtn.style.display = 'none';
    document.getElementById('deck-count-display').style.display = 'none';
    deckGridContainer.style.display = 'none';
    statusText.style.display = 'block';
});

socket.on('player_count', (count) => {
    statusText.innerText = `Waiting for opponent... (${count}/2)`;
});

socket.on('game_start', (data) => {
    deckBuilderDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    startWebRTC(data.caller_id === myId);
});

socket.on('game_state_update', (state) => {
    isMyTurn = state.active_player === myId;
    resetCharge();

    const me = state.players[myId];
    const opponentId = Object.keys(state.players).find(id => id !== myId);
    const opponent = state.players[opponentId];

    roundIndicator.innerText = `ROUND ${state.round} / ${state.max_rounds}`;
    myCurrentHand = me.hand;

    // --- Render Hand ---
    handContainer.innerHTML = "";
    if (isMyTurn) {
        turnIndicator.innerText = "YOUR TURN";
        turnIndicator.style.color = "#03dac6";
        
        me.hand.forEach(gesture => {
            const cardData = CARDS_DB[gesture];
            handContainer.innerHTML += `
                <div class="card" id="card-${gesture}">
                    ${cardData.icon}<br><b>${cardData.name}</b><br>Cost: ${cardData.cost}
                </div>
            `;
        });
        handContainer.innerHTML += `<div class="card" id="card-Thumb_Down" style="border-color: #cf6679;">👎<br><b>Pass</b><br>Cost: 0</div>`;
    } else {
        const oppName = opponent ? opponent.name : "OPPONENT";
        turnIndicator.innerText = `${oppName.toUpperCase()}'S TURN`;
        turnIndicator.style.color = "#cf6679";
        handContainer.innerHTML = `<h3 style="color: gray;">Waiting for your turn...</h3>`;
    }

    // --- Update Stats ---
    document.getElementById('local-name').innerText = me.name;
    document.getElementById('local-hp').innerText = me.hp;
    document.getElementById('local-en').innerText = me.energy;
    document.getElementById('local-sh').innerText = me.shield;

    if (opponent) {
        document.getElementById('remote-name').innerText = opponent.name;
        document.getElementById('remote-hp').innerText = opponent.hp;
        document.getElementById('remote-en').innerText = opponent.energy;
        document.getElementById('remote-sh').innerText = opponent.shield;
    }

    // --- RENDER STATUS EFFECTS (BUFF/DEBUFF) ---
    const renderStatus = (playerObj, containerId) => {
        let container = document.getElementById(containerId);
        container.innerHTML = "";
        if (!playerObj) return;
        
        const baseRegen = 5;
        const diff = playerObj.energy_regen - baseRegen;
        
        // Afișează valoarea exactă calculată dinamic
        if (diff > 0) {
            container.innerHTML += `<div class="badge badge-buff">📈 +${diff} Energy Regen</div>`;
        } else if (diff < 0) {
            container.innerHTML += `<div class="badge badge-debuff">📉 ${diff} Energy Regen</div>`; // diff este deja negativ (ex: -3)
        }
    };

    renderStatus(me, 'local-status-container');
    renderStatus(opponent, 'remote-status-container');
});

socket.on('action_success', (data) => {
    combatLog.innerText = data.msg;
    combatLog.style.color = "#03dac6";
});

socket.on('action_error', (data) => {
    combatLog.innerText = data.msg;
    combatLog.style.color = "#cf6679";
    combatLog.style.transform = "translateX(10px)";
    setTimeout(() => combatLog.style.transform = "translateX(0px)", 100);
});

socket.on('game_over', (data) => {
    let finalMsg = data.msg ? data.msg + "\n" : "";
    alert(finalMsg + (data.winner === myId ? "YOU WIN!" : "YOU LOSE!"));
    location.reload();
});

socket.on('game_reset', () => {
    alert("Opponent disconnected. The game will reset.");
    location.reload();
});

// --- WebRTC ---
async function startWebRTC(isCaller) {
    if (!peerConnection) peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnection.ontrack = (event) => { remoteVideo.srcObject = event.streams[0]; };
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) socket.emit('webrtc_ice', event.candidate);
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: false 
        });
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    } catch (err) {
        combatLog.innerText = "Camera Error! Please allow camera access.";
        return;
    }

    if (isCaller) {
        combatLog.innerText = "Syncing cameras in 3 seconds...";
        setTimeout(async () => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('webrtc_offer', offer);
            combatLog.innerText = "Match started!";
        }, 3000);
    } else {
        combatLog.innerText = "Waiting for connection...";
    }
}

socket.on('webrtc_offer', async (offer) => {
    if (!peerConnection) peerConnection = new RTCPeerConnection(rtcConfig);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('webrtc_answer', answer);
});

socket.on('webrtc_answer', async (answer) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('webrtc_ice', async (candidate) => {
    if (!peerConnection) return;
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// --- MediaPipe Logic ---
let gestureRecognizer;
let currentGesture = "None";
let chargeStartTime = 0;
const CHARGE_DURATION_MS = 1500;
let isCharging = false;

async function initMediaPipe() {
    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: { 
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task" 
            },
            runningMode: "VIDEO",
            numHands: 1
        });
        renderLoop();
    } catch (error) {
        combatLog.innerText = "ERROR: Failed to load MediaPipe!";
        combatLog.style.color = "red";
    }
}

function renderLoop() {
    if (localVideo.currentTime > 0 && isMyTurn) {
        const results = gestureRecognizer.recognizeForVideo(localVideo, performance.now());
        processGestures(results);
    } else {
        resetCharge();
    }
    requestAnimationFrame(renderLoop);
}

function processGestures(results) {
    if (results.gestures && results.gestures.length > 0) {
        const detectedGesture = results.gestures[0][0].categoryName;
        
        if (detectedGesture === "None" || detectedGesture === "Unknown" || 
           (!myCurrentHand.includes(detectedGesture) && detectedGesture !== "Thumb_Down")) {
            resetCharge();
            return;
        }

        if (detectedGesture !== currentGesture) {
            currentGesture = detectedGesture;
            chargeStartTime = performance.now();
            isCharging = true;
            updateChargeUI(0, currentGesture);
        } else if (isCharging) {
            const progress = Math.min((performance.now() - chargeStartTime) / CHARGE_DURATION_MS, 1);
            updateChargeUI(progress, currentGesture);

            if (progress >= 1.0) {
                socket.emit('play_card', { gesture: currentGesture });
                resetCharge(); 
                chargeStartTime = performance.now() + 1000;
            }
        }
    } else {
        resetCharge();
    }
}

function resetCharge() {
    currentGesture = "None";
    isCharging = false;
    updateChargeUI(0, null);
}

function updateChargeUI(progress, gesture) {
    chargeBar.style.width = `${progress * 100}%`;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    if (gesture && progress > 0) {
        const card = document.getElementById(`card-${gesture}`);
        if (card) card.classList.add('active'); 
    }
}

initMediaPipe();