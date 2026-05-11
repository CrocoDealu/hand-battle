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

CLASSES = {
    "Soldatul": {"hp": 120, "energy": 10, "regen": 5, "shield": 10},
    "Magul": {"hp": 80, "energy": 12, "regen": 6, "shield": 0},
    "Capcaunul": {"hp": 180, "energy": 6, "regen": 4, "shield": 0},
    "Asasinul": {"hp": 90, "energy": 15, "regen": 4, "shield": 0},
    "Bancherul": {"hp": 100, "energy": 20, "regen": 3, "shield": 0}
}
CARDS = {
    "Atac": {"name": "Atac", "cost": 2},
    "Magie": {"name": "Magie", "cost": 4},
    "Concentrare": {"name": "Concentrare", "cost": 4},
    "Garda_de_Fier": {"name": "Garda de Fier", "cost": 4},
    "Dubla": {"name": "Dubla sau Nimic", "cost": 3},
    "Scut": {"name": "Scut", "cost": 2},
    "Bariera": {"name": "Bariera Mistica", "cost": 4},
    "Reflectie": {"name": "Reflectie", "cost": 3},
    "Ghimpi": {"name": "Ghimpi", "cost": 2},
    "Purificare": {"name": "Purificare", "cost": 1},
    "Buff": {"name": "Buff", "cost": 3},
    "Pregatire": {"name": "Pregatire", "cost": 2},
    "Debuff": {"name": "Debuff", "cost": 3},
    "Vulnerabilitate": {"name": "Vulnerabilitate", "cost": 3},
    "Sacrificiu": {"name": "Sacrificiu", "cost": 1},
    "Adrenalina": {"name": "Adrenalina", "cost": 2},
    "Viziune": {"name": "Viziune", "cost": 1},
    "Arhiva": {"name": "Arhiva", "cost": 1}
}


def deal_hand(pid):
    p = players[pid]
    p['hand'] = []
    for _ in range(3):
        if len(p['deck']) == 0:
            p['deck'] = random.sample(p['original_deck'], len(p['original_deck']))
        if p['deck']:
            p['hand'].append(p['deck'].pop())

async def broadcast_state():
    state_players = {}
    for pid, p in players.items():
        state_p = p.copy()
        dynamic_hand = []
        for gesture in p['hand']:
            cost = CARDS.get(gesture, {}).get('cost', 0)
            if p['class'] == 'Magul' and gesture == 'Magie': 
                cost -= 1
            cost = max(0, cost - p['cost_reduction'])
            dynamic_hand.append({"id": gesture, "current_cost": cost})
        
        state_p['dynamic_hand'] = dynamic_hand
        state_players[pid] = state_p

    await sio.emit('game_state_update', {
        'players': state_players, 
        'active_player': game['active_player_id'],
        'round': game['round'],
        'max_rounds': game['max_rounds']
    })

@sio.event
async def connect(sid, environ):
    if len(players) >= 2: return False  

@sio.event
async def disconnect(sid):
    if sid in players: del players[sid]
    if sid in ready_players: ready_players.remove(sid)
    
    # If a game was active or starting, terminate for the remaining player
    if game['active_player_id'] is not None or len(players) == 1:
        remaining_sids = list(players.keys())
        for rem_sid in remaining_sids:
            await sio.emit('opponent_disconnected', to=rem_sid)
            await sio.disconnect(rem_sid) # Force websocket closure
            
        # Hard reset server state
        players.clear()
        ready_players.clear()
        game['active_player_id'] = None
        game['player_1_id'] = None
        game['round'] = 1
        await sio.emit('player_count', 0)

@sio.event
async def join_game(sid, data):
    name = data.get('name', f"Player {len(players)+1}")
    p_class = data.get('char_class', 'Soldatul')
    custom_deck = data.get('deck', [])
    
    stats = CLASSES[p_class]
    players[sid] = {
        "name": name, "class": p_class,
        "hp": stats["hp"], "energy": stats["energy"], 
        "shield": stats["shield"], "energy_regen": stats["regen"],
        "base_regen": stats["regen"],
        "first_card": True, "dmg_reduction": 0, "reflect": False, 
        "thorns": False, "next_attack_bonus": 0, "next_attack_double": False,
        "cost_reduction": 0, "vuln_turns": 0, "keep_hand": False,
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
    if sid != game['active_player_id']: return
    
    gesture = data.get('gesture')
    player = players[sid]
    opponent_id = [p for p in players if p != sid][0]
    opponent = players[opponent_id]

    if gesture == "Pass_Turn":
        await sio.emit('action_success', {'msg': f"{player['name']} passed!"})
        if not player['keep_hand']: player['hand'] = []
        player['keep_hand'] = False
    else:
        if gesture not in player['hand']: return
        card = CARDS.get(gesture)
        
        cost = card['cost']
        if player['class'] == 'Magul' and gesture == 'Magie': cost -= 1
        cost = max(0, cost - player['cost_reduction'])
        
        if player['energy'] < cost:
            await sio.emit('action_error', {'msg': "Not enough energy!"}, to=sid)
            return

        player['energy'] -= cost
        player['cost_reduction'] = 0
        player['hand'].remove(gesture)

        multiplier = 2 if (player['class'] == 'Asasinul' and player['first_card']) else 1
        if player['next_attack_double'] and gesture in ["Atac", "Magie", "Garda_de_Fier"]:
            multiplier *= 2
            player['next_attack_double'] = False
            
        player['first_card'] = False

        # --- LOGICA EFECTELOR ---
        if gesture == "Scut": player['shield'] += 20
        elif gesture == "Bariera": player['dmg_reduction'] = 0.5
        elif gesture == "Reflectie": player['reflect'] = True
        elif gesture == "Ghimpi": player['thorns'] = True
        elif gesture == "Purificare": player['vuln_turns'] = 0; opponent['energy_regen'] = CLASSES[opponent['class']]['regen']
        elif gesture == "Buff": player['energy_regen'] += 2
        elif gesture == "Pregatire": player['cost_reduction'] = 2
        elif gesture == "Debuff": opponent['energy_regen'] = max(1, opponent['energy_regen'] - 2)
        elif gesture == "Vulnerabilitate": opponent['vuln_turns'] = 2
        elif gesture == "Sacrificiu": player['hp'] -= 12; player['energy'] += 4
        elif gesture == "Adrenalina": 
            for _ in range(2):
                if player['deck']: player['hand'].append(player['deck'].pop())
        elif gesture == "Viziune": await sio.emit('action_success', {'msg': f"Opponent Hand: {opponent['hand']}"}, to=sid)
        elif gesture == "Arhiva": player['keep_hand'] = True
        elif gesture == "Concentrare": player['next_attack_bonus'] += 4
        elif gesture == "Dubla": player['next_attack_double'] = True
        elif gesture in ["Atac", "Magie", "Garda_de_Fier"]:
            base_dmg = 15 if gesture == "Atac" else (25 if gesture == "Magie" else player['shield'])
            if gesture == "Garda_de_Fier": player['shield'] = 0
            if player['class'] == 'Capcaunul' and gesture == 'Atac': base_dmg += 5
            
            base_dmg += player['next_attack_bonus']
            player['next_attack_bonus'] = 0
            
            total_dmg = base_dmg * multiplier
            if opponent['vuln_turns'] > 0: total_dmg *= 1.5
            if opponent['dmg_reduction'] > 0: total_dmg *= (1 - opponent['dmg_reduction']); opponent['dmg_reduction'] = 0
            
            if opponent['reflect']:
                player['hp'] -= total_dmg * 0.5
                opponent['reflect'] = False
            if opponent['thorns']:
                player['hp'] -= 8
                opponent['thorns'] = False

            if gesture == "Magie":
                opponent['hp'] -= total_dmg
            else:
                dmg_to_shield = min(opponent['shield'], total_dmg)
                opponent['shield'] -= dmg_to_shield
                opponent['hp'] -= (total_dmg - dmg_to_shield)

        await sio.emit('action_success', {'msg': f"{player['name']} cast {card['name']}!"})

    if opponent['hp'] <= 0 or player['hp'] <= 0:
        winner = sid if opponent['hp'] <= 0 else opponent_id
        await sio.emit('game_over', {'winner': winner, 'msg': "Game Over!"})
        return

    can_afford = any(player['energy'] >= max(0, CARDS[g]['cost'] - player['cost_reduction']) for g in player['hand'])
    
    if not player['hand'] or not can_afford or gesture == "Pass_Turn":
        game['active_player_id'] = opponent_id
        if not player['keep_hand']: player['hand'] = []
        player['keep_hand'] = False
        deal_hand(opponent_id)
        opponent['first_card'] = True
        
        if opponent['vuln_turns'] > 0: opponent['vuln_turns'] -= 1
        
        if game['active_player_id'] == game['player_1_id']:
            game['round'] += 1
            if game['round'] > game['max_rounds']:
                winner = game['player_1_id'] if players[game['player_1_id']]['hp'] > opponent['hp'] else opponent_id
                await sio.emit('game_over', {'winner': winner, 'msg': "Max Rounds Reached!"})
                return

            for pid in players:
                p = players[pid]
                p['energy'] = min(20, p['energy'] + p['energy_regen'])
            
            await sio.emit('action_success', {'msg': "Round Ended! Energy Restored."})
    
    await broadcast_state()

@sio.event
async def webrtc_offer(sid, data): await sio.emit('webrtc_offer', data, skip_sid=sid)
@sio.event
async def webrtc_answer(sid, data): await sio.emit('webrtc_answer', data, skip_sid=sid)
@sio.event
async def webrtc_ice(sid, data): await sio.emit('webrtc_ice', data, skip_sid=sid)

if __name__ == '__main__':
    uvicorn.run("backend:app_asgi", host="0.0.0.0", port=8000, reload=True)