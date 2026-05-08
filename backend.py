import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import socketio
import random

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app_asgi = socketio.ASGIApp(sio, app)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

players = {}
ready_players = set()

game = {
    "active_player_id": None,
    "player_1_id": None,
    "round": 1,
    "max_rounds": 5
}

CARDS = {
    "Closed_Fist": {"name": "Shield", "cost": 2},
    "Open_Palm": {"name": "Damage", "cost": 3},
    "Thumb_Up": {"name": "Buff", "cost": 2},
    "Victory": {"name": "Debuff", "cost": 2},
    "Pointing_Up": {"name": "Magic", "cost": 4}
}

DECK_BASE = ["Closed_Fist", "Closed_Fist", "Open_Palm", "Open_Palm", "Thumb_Up", "Thumb_Up", "Victory", "Victory", "Pointing_Up", "Pointing_Up"]

def deal_hand(pid):
    p = players[pid]
    p['hand'] = []
    for _ in range(3):
        if not p['deck']:
            p['deck'] = random.sample(p['original_deck'], len(p['original_deck']))
        p['hand'].append(p['deck'].pop())

async def broadcast_state():
    await sio.emit('game_state_update', {
        'players': players, 
        'active_player': game['active_player_id'],
        'round': game['round'],
        'max_rounds': game['max_rounds']
    })

@sio.event
async def connect(sid, environ):
    if len(players) >= 2:
        return False  
    print(f"Connection {sid} accepted.")

@sio.event
async def disconnect(sid):
    was_ready = sid in ready_players
    
    if sid in players: del players[sid]
    if sid in ready_players: ready_players.remove(sid)
    
    await sio.emit('player_count', len(ready_players))
    
    if was_ready and game['active_player_id'] is not None:
        game['active_player_id'] = None
        game['player_1_id'] = None
        ready_players.clear() 
        await sio.emit('game_reset')

@sio.event
async def join_game(sid, data):
    name = data.get('name', f"Player {len(players)+1}")
    custom_deck = data.get('deck', DECK_BASE)
    
    players[sid] = {
        "name": name, "hp": 100, "energy": 10, "shield": 0, "energy_regen": 5,
        "original_deck": custom_deck.copy(),
        "deck": random.sample(custom_deck, len(custom_deck)), 
        "hand": []
    }
    ready_players.add(sid)
    
    await sio.emit('player_count', len(ready_players))

    if len(ready_players) == 2:
        game['player_1_id'] = list(players.keys())[0]
        game['active_player_id'] = game['player_1_id']
        game['round'] = 1
        deal_hand(game['player_1_id'])
        await broadcast_state()
        await sio.emit('game_start', {'caller_id': game['player_1_id']})

@sio.event
async def play_card(sid, data):
    if sid != game['active_player_id']:
        await sio.emit('action_error', {'msg': "It's not your turn!"}, to=sid)
        return
    
    gesture = data.get('gesture')
    player = players[sid]
    opponent_id = [p for p in players if p != sid][0]
    opponent = players[opponent_id]

    if gesture == "Thumb_Down":
        await sio.emit('action_success', {'msg': f"{player['name']} discarded hand and passed!"})
        player['hand'] = []
    else:
        if gesture not in player['hand']:
            return
        
        card = CARDS[gesture]
        if player['energy'] < card['cost']:
            await sio.emit('action_error', {'msg': f"Not enough energy for {card['name']}!"}, to=sid)
            return

        player['energy'] -= card['cost']
        player['hand'].remove(gesture)

        if gesture == "Closed_Fist": player['shield'] += 15
        elif gesture == "Open_Palm":
            dmg = max(0, 20 - opponent['shield'])
            opponent['shield'] = max(0, opponent['shield'] - 20)
            opponent['hp'] -= dmg
        elif gesture == "Thumb_Up": player['energy_regen'] += 3
        elif gesture == "Victory": opponent['energy_regen'] = max(0, opponent['energy_regen'] - 3)
        elif gesture == "Pointing_Up": opponent['hp'] -= 30

        await sio.emit('action_success', {'msg': f"{player['name']} cast {card['name']}!"})

    if opponent['hp'] <= 0:
        await sio.emit('game_over', {'winner': sid, 'msg': f"{player['name']} destroyed their opponent!"})
        return

    can_afford = any(player['energy'] >= CARDS[g]['cost'] for g in player['hand']) if player['hand'] else False
    
    if not player['hand'] or not can_afford or gesture == "Thumb_Down":
        game['active_player_id'] = opponent_id
        player['hand'] = []
        deal_hand(opponent_id)
        
        if game['active_player_id'] == game['player_1_id']:
            game['round'] += 1
            if game['round'] > game['max_rounds']:
                p1 = players[game['player_1_id']]
                p2 = players[opponent_id]
                winner = game['player_1_id'] if p1['hp'] > p2['hp'] else opponent_id
                await sio.emit('game_over', {'winner': winner, 'msg': "Max Rounds Reached!"})
                return

            for pid in players:
                p = players[pid]
                p['energy'] = min(10, p['energy'] + p['energy_regen'])
                p['energy_regen'] = 5
                p['shield'] = 0
            
            await sio.emit('action_success', {'msg': "Round Ended! Energy Restored."})
        else:
            await sio.emit('action_success', {'msg': f"Turn passed to {opponent['name']}!"})
    
    await broadcast_state()

@sio.event
async def webrtc_offer(sid, data): await sio.emit('webrtc_offer', data, skip_sid=sid)
@sio.event
async def webrtc_answer(sid, data): await sio.emit('webrtc_answer', data, skip_sid=sid)
@sio.event
async def webrtc_ice(sid, data): await sio.emit('webrtc_ice', data, skip_sid=sid)

if __name__ == '__main__':
    uvicorn.run("backend:app_asgi", host="0.0.0.0", port=8000, reload=True)