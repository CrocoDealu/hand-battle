# ✋ Hand Battle

A real-time, browser-based card battler where you play cards using hand gestures!

Built with **Python (FastAPI + Socket.IO)** for the backend, **WebRTC** for peer-to-peer video streaming, and **Google MediaPipe** for on-device AI gesture recognition.

---

## 🚀 How to Run the Game

### Prerequisites

Make sure you have Python installed on your computer.

### 1. Install Dependencies

Open your terminal in the project folder and install the required Python libraries:

```bash
pip install fastapi uvicorn python-socketio
```

### 2. Start the Server

Run the backend server:

```bash
python backend.py
```

### 3. Open the Game

- **On your PC:** Open your browser and go to:

```
http://localhost:8000
```

- **On your Phone:** To play against yourself or a friend on the same Wi-Fi, use your computer's local IP address (for example):

```
http://192.168.1.X:8000
```

> **Note:** Mobile browsers require a secure context to access the camera. If you are not using `localhost`, you may need to use a tunneling service like `ngrok` to get a temporary `https://` link for your phone.

---

## 🎮 How to Play

### Join the Lobby

Enter your name and proceed to the Deck Builder.

### Build Your Deck

You must select **exactly 10 cards** for your deck.

- Maximum of **4 copies** of any single card type.

### Matchmaking

Once you click **"Find Match"**, wait for a second player to join.

### Camera Access

The browser will ask for camera permissions.

Both players must allow camera access for the video sync to complete and the match to start.

### The Match

- The game lasts a maximum of **5 Rounds**.
- Players start with **100 HP** and **10 Energy**.
- Every turn, you are dealt **3 cards** from your deck.
- Hold the gesture matching the card you want to play for **1.5 seconds** to cast it.
- Your turn ends automatically if you run out of playable cards or energy.
- You can also manually end your turn by doing the **Thumb Down** gesture.
- At the end of a round:
  - Shields are reset.
  - Both players regenerate **5 Energy** (up to a maximum of 10).

---

## 🃏 Card & Gesture Guide

Every card costs Energy (**⚡**) to play.

Make the corresponding hand gesture to cast the spell.

---

### ✊ Closed Fist (Shield)

- **Cost:** 2 ⚡
- **Effect:** Grants **+15 Shield**.
- Shields absorb incoming standard damage but disappear at the end of the round.

---

### 🖐 Open Palm (Damage)

- **Cost:** 3 ⚡
- **Effect:** Deals **20 Damage** to the opponent.
- Damage hits the shield first. Any leftover damage hits the opponent's HP.

---

### 👍 Thumb Up (Buff)

- **Cost:** 2 ⚡
- **Effect:** Increases your Energy Regeneration for the current round by **+3**.
- At the end of the round, you regenerate **8 Energy** instead of the standard 5.

---

### ✌️ Victory (Debuff)

- **Cost:** 2 ⚡
- **Effect:** Reduces your opponent's Energy Regeneration for the current round by **-3**.
- At the end of the round, they regenerate only **2 Energy** instead of 5.

---

### ☝️ Pointing Up (Magic)

- **Cost:** 4 ⚡
- **Effect:** Deals **30 True Damage** directly to the opponent's HP.
- This attack completely ignores shields.

---

### 👎 Thumb Down (Pass & Discard)

- **Cost:** 0 ⚡
- **Effect:** Discards any remaining cards in your hand and immediately passes the turn to your opponent.
- This is a permanent action available at all times.

---

## 🏆 Winning the Game

Reduce your opponent's HP to **0**, or have the most HP at the end of **Round 5**!

