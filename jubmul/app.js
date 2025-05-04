const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

let deck = [];
let players = { bottom: [], left: [], top: [], right: [] };
let collectedCards = { bottom: [], left: [], top: [], right: [] };
let centerCards = [];
let currentTurn = 'bottom';
let currentLeadSuit = null;
let playingOrder = [];
let currentPlayerIndex = 0;
let scoreWindow = null;
let totalRounds = 1;
let currentRound = 0;
let roundScores = [];





document.getElementById('view-scores-btn').addEventListener('click', () => {
  if (!scoreWindow || scoreWindow.closed) {
    scoreWindow = window.open("", "CollectedCards", "width=600,height=500");
    scoreWindow.document.write(`
      <html>
        <head><title>Scores</title></head>
        <body>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .zone { margin-bottom: 20px; }
            .zone h3 { margin: 5px 0; }
            .zone img { width: 48px; height: 72px; margin-right: 5px; border: 1px solid #ccc; border-radius: 4px; }
          </style>
          
          <div id="score-root"></div>
        </body>
      </html>
    `);
  }

  updateScorePopup();
});

function updateScorePopup() {
  if (scoreWindow && !scoreWindow.closed) {
    const root = scoreWindow.document.getElementById('score-root');
    if (root) {
      root.innerHTML = '';
    root.innerHTML = generateScoreHTML(collectedCards);
    }
  }
}

function createDeck() {
  const deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push(`${rank}_of_${suit}`);
    });
  });
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCards() {
  deck = createDeck();
  shuffleDeck(deck);
  for (let i = 0; i < 13; i++) {
    players.bottom.push(deck.pop());
    players.left.push(deck.pop());
    players.top.push(deck.pop());
    players.right.push(deck.pop());
  }
}

function startNewTrick() {
  centerCards = [];
  currentPlayerIndex = 0;

  const allPlayers = ['bottom', 'left', 'top', 'right'];
  const leadIndex = allPlayers.indexOf(currentTurn);
  playingOrder = [];
  for (let i = 0; i < 4; i++) {
    playingOrder.push(allPlayers[(leadIndex + i) % 4]);
  }

  currentLeadSuit = null;
  renderHands();
  nextTurn();
}

function renderHands() {
  const bottomDiv = document.getElementById('player-bottom');
  const others = ['player-left', 'player-top', 'player-right'];
  bottomDiv.innerHTML = '';
  others.forEach(id => document.getElementById(id).innerHTML = '');
  players.bottom.sort(sortCards);

  players.bottom.forEach(card => {
    const img = document.createElement('img');
    img.src = `assets/cards/${card}.png`;
    img.className = 'card';

    img.onerror = () => {
      img.src = 'assets/cards/back.png';
    };

    if (isCardPlayable('bottom', card)) {
      img.onclick = () => playCard('bottom', card);
    } else {
      img.style.cursor = 'not-allowed';
    }

    bottomDiv.appendChild(img);
  });

  ['left', 'top', 'right'].forEach((pos, i) => {
    players[pos].forEach(() => {
      const img = document.createElement('img');
      img.src = 'assets/cards/back.png';
      img.className = 'card';
      document.getElementById(others[i]).appendChild(img);
    });
  });
}

function sortCards(a, b) {
  const sOrder = { clubs: 0, diamonds: 1, hearts: 2, spades: 3 };
  const rOrder = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
  };
  const [rA, sA] = a.split('_of_');
  const [rB, sB] = b.split('_of_');
  return sOrder[sA] !== sOrder[sB] ? sOrder[sA] - sOrder[sB] : rOrder[rA] - rOrder[rB];
}

function nextTurn() {
  if (currentPlayerIndex >= 4) {
    setTimeout(() => {
      const winner = findTrickWinner();
      const trickCards = centerCards.map(c => c.card);
      const scored = trickCards.filter(isScoringCard);
      collectedCards[winner].push(...scored);

      updateScorePopup();

      currentTurn = winner;

      setTimeout(() => {
        clearCenter();
        if (!isGameOver()) {
          startNewTrick();
        } else {
          setTimeout(() => {
            clearCenter();
            renderHands();
            updateScorePopup();

            const final = calculateFinalScores();
            let msg = `🎉 เกมจบแล้ว!\n\nคะแนนรวม:\n`;
            for (const p of ['bottom','left','top','right']) {
              msg += `${p.toUpperCase()}: ${final.scores[p]} คะแนน\n`;
            }
            if (final.mode === 'chuan') {
              msg += `\n💥 ผู้เล่น ${final.who.toUpperCase()} ช้วนไพ่โพแดงทั้งหมด!`;
            } else if (final.mode === 'super_chuan') {
              msg += `\n🚀 ผู้เล่น ${final.who.toUpperCase()} ช้วนชุดใหญ่! ได้ 1000 คะแนน!`;
            }
            roundScores.push(final.scores);
if (currentRound < totalRounds) {
  currentRound++;
  for (const p in collectedCards) collectedCards[p] = [];
  setTimeout(() => {
    dealCards();
    startFirstTrick();
  }, 1000);
} else {
  setTimeout(() => {
    showFinalSummary();
  }, 300);
}

          }, 300);
        }
      }, 800);
    }, 1200);
    return;
  }

  const player = playingOrder[currentPlayerIndex];
  if (player === 'bottom') {
    renderHands();
  } else {
    setTimeout(() => botPlay(player), 800);
  }
}

function playCard(player, card) {
  const [rank, suit] = card.split('_of_');
  if (currentPlayerIndex === 0) currentLeadSuit = suit;

  const idx = players[player].indexOf(card);
  if (idx > -1) players[player].splice(idx, 1);

  renderHands();

  const img = document.createElement('img');
  img.src = `assets/cards/${card}.png`;
  img.onerror = () => {
    img.src = 'assets/cards/back.png';
  };

  img.classList.add('card', 'center-card', `center-${player}`);
  document.getElementById('center-pile').appendChild(img);

  centerCards.push({ player, card });
  currentPlayerIndex++;
  nextTurn();
}

function botPlay(player) {
  const hand = players[player];
  let options = hand;

  if (currentLeadSuit) {
    const filtered = hand.filter(c => c.includes(`_of_${currentLeadSuit}`));
    if (filtered.length > 0) options = filtered;
  }

  const card = options[Math.floor(Math.random() * options.length)];
  playCard(player, card);
}

function isCardPlayable(player, card) {
  if (player !== playingOrder[currentPlayerIndex]) return false;
  if (currentPlayerIndex === 0) return true;

  const [, suit] = card.split('_of_');
  const hasSuit = players[player].some(c => c.includes(`_of_${currentLeadSuit}`));
  return hasSuit ? suit === currentLeadSuit : true;
}

function isScoringCard(card) {
  return (
    card.endsWith('_of_hearts') ||
    card === '10_of_clubs' ||
    card === 'jack_of_diamonds' ||
    card === 'queen_of_spades'
  );
}

function findTrickWinner() {
  let best = centerCards[0];
  let bestValue = rankToValue(best.card.split('_of_')[0]);

  for (let i = 1; i < centerCards.length; i++) {
    const { player, card } = centerCards[i];
    const [rank, suit] = card.split('_of_');
    if (suit === currentLeadSuit) {
      const value = rankToValue(rank);
      if (value > bestValue) {
        best = { player, card };
        bestValue = value;
      }
    }
  }

  return best.player;
}

function rankToValue(rank) {
  return {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'jack': 11, 'queen': 12,
    'king': 13, 'ace': 14
  }[rank];
}

function clearCenter() {
  document.getElementById('center-pile').innerHTML = '';
  centerCards = [];
}

function isGameOver() {
  return Object.values(players).every(p => p.length === 0);
}

function generateScoreHTML(data) {
  let html = `<h2>🃏 ไพ่ที่เก็บได้ รอบที่ ${currentRound}</h2>`;
  for (const player of ['bottom', 'left', 'top', 'right']) {
    html += `<div class="zone"><h3>${player.toUpperCase()}</h3>`;
    const cards = data[player] || [];
    if (cards.length === 0) {
      html += `<em>ไม่มีไพ่ที่มีแต้ม</em>`;
    } else {
      cards.forEach(card => {
        html += `<img src="assets/cards/${card}.png" onerror="this.src='assets/cards/back.png'" />`;
      });
    }
    html += `</div>`;
  }
  return html;
}

function calculateFinalScores() {
  const allHearts = ['2','3','4','5','6','7','8','9','10','jack','queen','king','ace'].map(r => `${r}_of_hearts`);
  const allScoring = new Set([...allHearts, 'queen_of_spades', 'jack_of_diamonds', '10_of_clubs']);

  let chuan = null, chuanBig = null;
  const scores = {};

  for (const player in collectedCards) {
    const cards = collectedCards[player];
    const set = new Set(cards);

    const hasAllHearts = allHearts.every(c => set.has(c));
    const hasAllScoring = [...allScoring].every(c => set.has(c));

    if (hasAllScoring) {
      chuanBig = player;
    } else if (hasAllHearts) {
      chuan = player;
    }
  }

  if (chuanBig) {
    for (const p in collectedCards) scores[p] = (p === chuanBig) ? 1000 : 0;
    return { scores, mode: 'super_chuan', who: chuanBig };
  }

  for (const player in collectedCards) {
    const cards = collectedCards[player];
    let score = 0;
    let hasScoring = false;
    let has10c = false;

    cards.forEach(card => {
      const [rank, suit] = card.split('_of_');
      let value = 0;

      if (suit === 'hearts') {
        value = ['jack','queen','king','ace'].includes(rank)
          ? { 'jack': -20, 'queen': -30, 'king': -40, 'ace': -50 }[rank]
          : -parseInt(rank);
        if (chuan) value *= -1;
        hasScoring = true;
      } else if (card === 'queen_of_spades') {
        value = chuan ? 100 : -100;
        hasScoring = true;
      } else if (card === 'jack_of_diamonds') {
        value = chuan ? -100 : 100;
        hasScoring = true;
      } else if (card === '10_of_clubs') {
        has10c = true;
      }

      score += value;
    });

    if (has10c) {
      score = hasScoring ? score * 2 : score + 50;
    }

    if (score === 0 && !hasScoring && !has10c) {
      score = -50;
    }

    scores[player] = score;
  }

  return { scores, mode: chuan ? 'chuan' : 'normal', who: chuan };
}


function startFirstTrick() {
  centerCards = [];
  currentPlayerIndex = 0;

  let leadPlayer = null;
  for (const player in players) {
    if (players[player].includes('2_of_clubs')) {
      leadPlayer = player;
      break;
    }
  }

  currentTurn = leadPlayer;

  const allPlayers = ['bottom', 'left', 'top', 'right'];
  const leadIndex = allPlayers.indexOf(currentTurn);
  playingOrder = [];
  for (let i = 0; i < 4; i++) {
    playingOrder.push(allPlayers[(leadIndex + i) % 4]);
  }

  currentLeadSuit = null;
  renderHands();
  nextTurn();
}

function startGame() {
  const select = document.getElementById('round-select');
  totalRounds = parseInt(select.value);
  currentRound = 1;
  updateRoundStatus();
  roundScores = [];
  document.getElementById('round-select-wrapper').style.display = 'none';
  dealCards();
  startFirstTrick();
}

window.addEventListener('load', () => {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startBtn.style.display = 'none';
      startGame();
    });
  }
});

function showFinalSummary() {
  let html = "<h2>📊 สรุปคะแนนแต่ละรอบ</h2><table border='1' cellpadding='8'><tr><th>รอบที่</th><th>Bottom</th><th>Left</th><th>Top</th><th>Right</th></tr>";
  const sum = { bottom: 0, left: 0, top: 0, right: 0 };
  roundScores.forEach((r, i) => {
    html += `<tr><td>${i+1}</td><td>${r.bottom}</td><td>${r.left}</td><td>${r.top}</td><td>${r.right}</td></tr>`;
    sum.bottom += r.bottom;
    sum.left += r.left;
    sum.top += r.top;
    sum.right += r.right;
  });
  html += `<tr><td><strong>รวม</strong></td><td><strong>${sum.bottom}</strong></td><td><strong>${sum.left}</strong></td><td><strong>${sum.top}</strong></td><td><strong>${sum.right}</strong></td></tr>`;
  html += "</table>";
  const summaryWindow = window.open("", "Summary", "width=600,height=600");
  summaryWindow.document.write(`<html><head><title>Summary</title></head><body style='font-family:sans-serif;'>${html}
        <br><br><button onclick="window.opener.location.reload(); window.close();" style='padding: 10px 20px; font-size: 16px;'>🔄 เล่นใหม่</button>
        </body></html>`);
}

function updateRoundStatus() {
  const el = document.getElementById('round-status');
  if (el) {
    el.textContent = `เล่นทั้งหมด ${totalRounds} รอบ`;
    el.style.display = 'inline';
  }
}

document.getElementById('score-summary-btn').addEventListener('click', () => {
  showFinalSummary();
});
