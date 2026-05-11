# Hand Battle — Design Brief

## Ce este aplicația

**Hand Battle** este un joc de cărți în timp real, jucat în browser, unde jucătorii aruncă vrăji folosind gesturi ale mâinii recunoscute de AI (Google MediaPipe). Doi jucători se confruntă față în față prin cameră web, fiecare ținând un gest cu mâna pentru 1.5 secunde ca să joace o carte din mână.

**Stack tehnic:** Python (FastAPI + Socket.IO) backend, WebRTC pentru video P2P, MediaPipe pentru AI gesture recognition în browser.

---

## Fluxul aplicației (3 ecrane principale)

1. **Lobby** → jucătorul introduce numele, alege o clasă de personaj, apasă "Pasul Următor"
2. **Deck Builder** → selectează exact 15 cărți din lista disponibilă, apoi caută adversar
3. **Joc** → ecran principal cu 2 camere video live, bara de statistici, log de luptă, și mâna de cărți curentă

Există și un ecran secundar **"Test Semne"** (debug) unde jucătorul poate testa dacă gesturile sunt recunoscute corect.

---

## Starea actuală a design-ului (ce există acum)

Aplicația este funcțională dar arată ca un proiect de laborator, nu ca un joc. Problemele principale:

- **Fără identitate vizuală** — nu există logo, iconițe proprii, sau un stil coerent
- **Tipografie plată** — font sans-serif generic, fără ierarhie vizuală clară
- **Cărțile sunt boxes fără personalitate** — nu arată a cărți de joc, arată a div-uri
- **Lobby-ul este gol** — un input, un select, un button pe fundal negru
- **Deck builder-ul este o listă plată** — fără preview vizual al cărților
- **Ecranul de joc e funcțional dar tern** — camerele video sunt ok, dar statisticile (HP/EN/Scut) și log-ul de luptă nu au impact vizual
- **Paleta de culori existentă:** background `#0a0a1a`, accent teal `#03dac6`, accent violet `#6200ea`/`#bb86fc`, roșu `#cf6679`

---

## Clasele de personaj disponibile

| Clasă | HP | Particularitate |
|---|---|---|
| Soldatul | 120 | 10 Scut de start, 5 Regenerare energie |
| Magul | 80 | Magie mai ieftină, 6 Regenerare energie |
| Căpcăunul | 180 | Atac +5, 4 Regenerare energie |
| Asasinul | 90 | Primul atac x2, 4 Regenerare energie |
| Bancherul | 100 | 20 Energie start, 3 Regenerare energie |

---

## Gesturile / Cărțile din joc

**Ofensive:** Atac (Pistol), Magie (Baghetă), Concentrare (Zen), Gardă (Pumn), Dublă (Coarne)  
**Defensive:** Scut (Stop), Barieră (Spock), Reflecție (Shaka), Ghimpi, Purificare (Thumb Up)  
**Utilitate:** Buff (OK), Pregătire (Pinch), Debuff (Thumb Down), Vulnerabil (L), Sacrificiu (Spider), Adrenalină (3 degete), Viziune, Arhivă (încrucișate), Pass Turn (4 degete)

---

## Ce vrem să obținem

### Direcție vizuală generală
Un joc cu atmosferă **fantasy dark** / **mystical** — ca un Hearthstone mai simplu, dar cu elemente de magic glow și particle effects. Nu pixel art. Nu neon cyberpunk pur. Undeva între **dark fantasy elegant** și **arcane magic**.

### Cerințe concrete

#### 1. Lobby
- Fundal cu o textură sau gradient subtil (nu negru plat)
- Titlul "Hand Battle" cu un font dramatic / fantasy (ex: Google Fonts: Cinzel, Uncial Antiqua, MedievalSharp)
- Fiecare clasă de personaj să aibă un icon / avatar mic și o descriere stilată, nu doar text în `<option>`
- Butonul principal să aibă un efect hover impactant

#### 2. Cărțile de joc
- Fiecare carte să arate ca o **carte fizică** — border decorativ, icon mare al gestului în centru, cost de energie vizibil, efect descris
- Starea `active` (gestul e recunoscut) să aibă un **glow animat** / shimmer
- Starea `disabled` (energie insuficientă) să fie clar diferențiată
- Cărțile să aibă culori diferite în funcție de tip: portocaliu/roșu pentru ofensive, albastru/teal pentru defensive, galben/auriu pentru utilitate

#### 3. Deck Builder
- Grid cu preview-uri vizuale ale cărților (nu liste text)
- Counter-ul "15/15" să fie un progress indicator frumos
- Butonul "Caută Adversar" să fie dezactivat vizual clar și să se activeze cu animație când deck-ul e complet

#### 4. Ecranul de joc
- HP bar animată (nu doar text) — se scurtează cu animație smooth când jucătorul ia damage
- Bara de energie ca niște "cristale" sau segmente (nu doar număr)
- Log-ul de luptă mai dramatic — textele de damage să apară cu animație, culori diferite per tip de acțiune
- Bara de "charge" (1.5s hold) să fie mai vizibilă și mai satisfăcătoare
- Badge-urile de status effects (buff/debuff) mai mari și mai clare

#### 5. Animații & Efecte
- Tranziții smooth între ecrane (fade sau slide)
- Efect de "cast" când o carte e jucată
- Pulse / glow pe camera adversarului când el joacă o carte
- Animație de victorie / înfrângere

---

## Fișierele de modificat

```
static/
├── index.html    — structura HTML a tuturor ecranelor
├── style.css     — tot stilul vizual (de modificat masiv)
└── app.js        — logica de joc (de atins minimal, doar clase CSS dacă e necesar)
```

---

## Constrângeri tehnice

- **Fără framework-uri UI** (no React, no Vue) — vanilla HTML/CSS/JS
- **Mobile-first** — jocul trebuie să meargă pe telefon (landscape + portrait)
- **Nu înlocui funcționalitatea** — doar stilul, nu logica din `app.js`
- Fonturile pot fi încărcate din Google Fonts
- Animațiile CSS sunt ok, biblioteci JS de animație (GSAP etc.) doar dacă sunt lightweight
- Culorile de accent existente pot fi păstrate sau înlocuite, dar paleta trebuie să fie **consistentă**

---

## Output așteptat

Un `style.css` complet rescris și un `index.html` actualizat (dacă e necesar pentru structura cărților sau a lobby-ului), care să transforme aplicația dintr-un prototip funcțional într-un joc care arată că merită jucat.
