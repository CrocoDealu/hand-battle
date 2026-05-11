// ===========================================================
// HAND BATTLE — Card data + game state simulation
// ===========================================================

const CARD_DATA = [
  // OFFENSIVE
  { id: "atac",         name: "Atac",         type: "offense", cost: 1, effect: "Provoacă <strong>8</strong> daune adversarului.",                            sigil: "atac" },
  { id: "magie",        name: "Magie",        type: "offense", cost: 3, effect: "Aruncă o vrajă: <strong>14</strong> daune magice ce ignoră scutul.",          sigil: "magie" },
  { id: "concentrare",  name: "Concentrare", type: "offense", cost: 2, effect: "Următorul atac face <strong>x2</strong> daune.",                              sigil: "concentrare" },
  { id: "garda",        name: "Gardă",        type: "offense", cost: 2, effect: "Contraatac de <strong>6</strong> dacă ești lovit în turul acesta.",          sigil: "garda" },
  { id: "dubla",        name: "Dublă",        type: "offense", cost: 4, effect: "Atacă de <strong>două ori</strong> consecutiv pentru <strong>6</strong> fiecare.", sigil: "dubla" },

  // DEFENSIVE
  { id: "scut",         name: "Scut",         type: "defense", cost: 1, effect: "Adaugă <strong>8</strong> Scut pentru tura curentă.",                        sigil: "scut" },
  { id: "bariera",      name: "Barieră",      type: "defense", cost: 3, effect: "Anulează <strong>complet</strong> următorul atac.",                          sigil: "bariera" },
  { id: "reflectie",    name: "Reflecție",   type: "defense", cost: 4, effect: "Reflectă <strong>75%</strong> din damage înapoi.",                            sigil: "reflectie" },
  { id: "ghimpi",       name: "Ghimpi",       type: "defense", cost: 2, effect: "Atacatorul primește <strong>4</strong> daune de fiecare lovitură.",          sigil: "ghimpi" },
  { id: "purificare",   name: "Purificare",   type: "defense", cost: 2, effect: "Elimină toate efectele <strong>negative</strong> active.",                   sigil: "purificare" },

  // UTILITY
  { id: "buff",         name: "Buff",         type: "utility", cost: 2, effect: "<strong>+3</strong> daune la toate atacurile timp de 3 ture.",               sigil: "buff" },
  { id: "pregatire",    name: "Pregătire",   type: "utility", cost: 1, effect: "Trage <strong>2 cărți</strong> în plus la finalul turei.",                    sigil: "pregatire" },
  { id: "debuff",       name: "Debuff",       type: "utility", cost: 2, effect: "Adversarul face <strong>-3</strong> daune timp de 3 ture.",                  sigil: "debuff" },
  { id: "vulnerabil",   name: "Vulnerabil",  type: "utility", cost: 1, effect: "Adversarul ia <strong>+50%</strong> daune din vrăji.",                        sigil: "vulnerabil" },
  { id: "sacrificiu",   name: "Sacrificiu",   type: "utility", cost: 0, effect: "Pierzi <strong>5</strong> HP, primești <strong>+4</strong> energie.",         sigil: "sacrificiu" },
  { id: "adrenalina",   name: "Adrenalină",  type: "utility", cost: 1, effect: "Energie maximă pentru următoarele <strong>2</strong> ture.",                  sigil: "adrenalina" },
  { id: "viziune",      name: "Viziune",      type: "utility", cost: 1, effect: "Vezi mâna <strong>adversarului</strong> pentru un moment.",                  sigil: "viziune" },
  { id: "arhiva",       name: "Arhivă",       type: "utility", cost: 2, effect: "Recuperează ultima carte jucată din groapă.",                                sigil: "arhiva" },
  { id: "pass",         name: "Pass Turn",    type: "utility", cost: 0, effect: "Cedezi tura; primești <strong>+3</strong> energie bonus.",                   sigil: "pass" }
];

const CLASSES = [
  { id: "soldat",   name: "Soldatul",   hp: 120, perk: "+10 Scut start · +5 Regen Energie",   emblem: "soldat" },
  { id: "mag",      name: "Magul",      hp: 80,  perk: "Magie -1 cost · +6 Regen Energie",    emblem: "mag" },
  { id: "capcaun",  name: "Căpcăunul",  hp: 180, perk: "Atac +5 · +4 Regen Energie",          emblem: "capcaun" },
  { id: "asasin",   name: "Asasinul",   hp: 90,  perk: "Primul atac x2 · +4 Regen Energie",   emblem: "asasin" },
  { id: "bancher",  name: "Bancherul",  hp: 100, perk: "+20 Energie start · +3 Regen Energie", emblem: "bancher" }
];

// Type → CSS class
const TYPE_CLASS = { offense: "type-offense", defense: "type-defense", utility: "type-utility" };
const TYPE_LABEL = { offense: "Ofensiv", defense: "Defensiv", utility: "Utilitate" };

// ===== Render a card =====
function renderCard(card, opts = {}) {
  const energy = opts.energyAvailable;
  const disabled = energy !== undefined && energy < card.cost;
  const sigil = window.HB_SIGILS[card.sigil] || window.HB_SIGILS.atac;
  const classes = [
    "card",
    TYPE_CLASS[card.type],
    opts.size ? "size-" + opts.size : "",
    disabled ? "disabled" : "",
    opts.selected ? "selected" : "",
    opts.active ? "active" : ""
  ].filter(Boolean).join(" ");
  return `
    <div class="${classes}" data-card-id="${card.id}" data-card-type="${card.type}">
      <div class="card-frame"></div>
      <div class="card-inner">
        <span class="card-fil-bl"></span><span class="card-fil-br"></span>
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-sigil">${sigil}</div>
        <div class="card-foot">
          <div class="card-type">${TYPE_LABEL[card.type]}</div>
          <div class="card-effect">${card.effect}</div>
        </div>
      </div>
    </div>
  `;
}

window.CARD_DATA = CARD_DATA;
window.CLASSES = CLASSES;
window.TYPE_LABEL = TYPE_LABEL;
window.renderCard = renderCard;
