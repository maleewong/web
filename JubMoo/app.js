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

let gameState = {
  qSpadesPlayed: false,
  trickNumber: 0,
  leadPlayer: null,
  scores: { bottom: 0, left: 0, top: 0, right: 0 }
};




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

  // ✅ เช็คว่าลงผิดดอกหรือไม่ (บังคับตาม currentLeadSuit ถ้ามี)
  if (
    currentPlayerIndex !== 0 &&                   // ไม่ใช่คนเริ่ม
    currentLeadSuit &&                            // มีดอกถูก lead
    suit !== currentLeadSuit &&                   // ลงต่างดอก
    players[player].some(c => c.includes(`_of_${currentLeadSuit}`)) // แต่ยังมีไพ่ตามดอกนั้นอยู่
  ) {
    console.error(`❌ ${player} ลงผิดดอก! มี ${currentLeadSuit} แต่ลง ${card}`);
    alert(`❌ ${player.toUpperCase()} ลงผิดกติกา: มีไพ่ดอก ${currentLeadSuit} แต่ลง ${card}`);
    return; // ❗ หยุดไม่ให้ลง
  }

  if (card === 'queen_of_spades') gameState.qSpadesPlayed = true;
  if (currentPlayerIndex === 0) currentLeadSuit = suit;

  const idx = players[player].indexOf(card);
  if (idx > -1) players[player].splice(idx, 1);

  renderHands();

  const img = document.createElement('img');
  img.src = `assets/cards/${card}.png`;
  img.classList.add('card', 'center-card', `center-${player}`);
  img.onerror = () => {
    img.src = 'assets/cards/back.png';
  };

  document.getElementById('center-pile').appendChild(img);

  centerCards.push({ player, card });
  currentPlayerIndex++;
  nextTurn();
}


function botPlay(player) {
  const hand = players[player];
  let playable = getPlayableCards(player, hand);
  const analysis = analyzeHand(hand);
  const isLead = currentPlayerIndex === 0;
  const isLast = currentPlayerIndex === 3;
  const isMiddle = currentPlayerIndex === 1 || currentPlayerIndex === 2;
  const leading = isPlayerLeading(player);

  let selectedCard = isLead
    ? chooseBestLead(playable, analysis, leading)
    : chooseBestFollow(playable, analysis, isLast, isMiddle, leading, player);

  // ✅ แก้ตรงนี้ - fallback ถ้าไม่ได้ return
  if (!selectedCard || !playable.includes(selectedCard)) {
    console.warn(`⚠️ BOT ${player} ไม่สามารถเลือกไพ่ได้! fallback ใช้ไพ่แรก`);
    selectedCard = playable[0];
  }

  playCard(player, selectedCard);
}



function analyzeHand(hand) {
  return {
    hasQSpades: hand.includes('queen_of_spades'),
    hasJDiamond: hand.includes('jack_of_diamonds'),
    has10Clubs: hand.includes('10_of_clubs'),
    hearts: hand.filter(c => c.includes('_of_hearts')),
    highHearts: hand.filter(c => ['queen_of_hearts','king_of_hearts','ace_of_hearts'].includes(c)),
    highSpades: hand.filter(c => ['king_of_spades','ace_of_spades'].includes(c)),
    diamonds: hand.filter(c => c.includes('_of_diamonds')),
    safeHand: hand.every(c => {
      const [rank, suit] = c.split('_of_');
      return !['queen','king','ace'].includes(rank) &&
        !['queen_of_spades','jack_of_diamonds','10_of_clubs'].includes(c);
    })
  };
}

function getPlayableCards(player, hand) {
  if (currentPlayerIndex === 0) return hand;
  const hasLeadSuit = hand.some(card => card.includes(`_of_${currentLeadSuit}`));
  return hasLeadSuit ? hand.filter(c => c.includes(`_of_${currentLeadSuit}`)) : hand;
}

function isPlayerLeading(player) {
  const current = gameState?.scores?.[player] || 0;
  const others = Object.entries(gameState?.scores || {}).filter(([k]) => k !== player).map(([, v]) => v);
  return others.every(o => current >= o);
}

function chooseBestLead(playable, a, leading) {
  const avoid = ['queen_of_spades','queen_of_hearts','king_of_hearts','ace_of_hearts'];
  let safe = playable.filter(c => !avoid.includes(c));

  // 🧠 A: หลีก K♠ / A♠ ถ้า Q♠ ยังไม่ออก และเราไม่มี Q♠
  if (!a.hasQSpades && !gameState.qSpadesPlayed) {
    const dangerousSpades = ['king_of_spades', 'ace_of_spades'];
    const spadesInHand = playable.filter(c => c.includes('_of_spades'));
    const lowSpades = spadesInHand.filter(c =>
      !dangerousSpades.includes(c) && c !== 'queen_of_spades'
    );
    if (lowSpades.length > 0) {
      safe = safe.filter(c => !dangerousSpades.includes(c));
    }
  }

  // 🧠 B: หลีก J♦ ถ้า Q/K/A♦ ยังไม่ออก
  const jDiamondControls = ['queen_of_diamonds', 'king_of_diamonds', 'ace_of_diamonds'];
  const seenCards = centerCards.map(c => c.card).concat(...Object.values(collectedCards).flat());
  const controlsStillHidden = jDiamondControls.filter(c => !seenCards.includes(c));
  if (playable.includes('jack_of_diamonds') && controlsStillHidden.length > 0) {
    safe = safe.filter(c => c !== 'jack_of_diamonds');
  }

  // 🧠 C: หลีก Q/K/A ♥ ถ้าไม่ได้ถือ ♥ ยาว (ไม่ช้วน)
  if (a.hearts.length < 5) {
    const dangerousHearts = ['queen_of_hearts','king_of_hearts','ace_of_hearts'];
    safe = safe.filter(c => !dangerousHearts.includes(c));
  }

  if (safe.length > 0) {
    return safe[Math.floor(Math.random() * safe.length)];
  }

  return playable[Math.floor(Math.random() * playable.length)];
}



function chooseBestFollow(playable, a, isLast, isMiddle, leading, player) {
  const blockJ = ['queen_of_diamonds', 'king_of_diamonds', 'ace_of_diamonds'];
  const hasBlocks = blockJ.some(c => a.diamonds.includes(c));

  const centerSoFar = centerCards.map(c => c.card);
  const centerRanks = centerSoFar.map(c => c.split('_of_')[0]);
  const centerSuits = centerSoFar.map(c => c.split('_of_')[1]);

  // 🧠 แผน 1: ถ้าคนก่อนลง J♦ และเรามีตัวคุม → ลงกินเลย
  if (
    currentLeadSuit === 'diamonds' &&
    centerSoFar.includes('jack_of_diamonds')
  ) {
    const control = playable.find(c => blockJ.includes(c));
    if (control) return control;
  }

  // 🧠 แผน 2: ถ้ามี J♦ และถือ Q/K/A♦ → ทิ้งตัวคุมก่อน
  for (const controlCard of blockJ) {
    if (a.hasJDiamond && a.diamonds.includes(controlCard) && playable.includes(controlCard)) {
      return controlCard;
    }
  }

  // 🧠 แผน 3: ถ้าคนก่อนหน้าออก Q/K/A♦ และเราไม่มี J♦ → อย่าทิ้งตัวคุมซ้ำ
  if (
    centerSoFar.some(c => blockJ.includes(c)) &&
    !centerSoFar.includes('jack_of_diamonds') &&
    !a.hasJDiamond
  ) {
    const avoid = playable.filter(c => blockJ.includes(c));
    if (avoid.length > 0 && avoid.length < playable.length) {
      playable = playable.filter(c => !blockJ.includes(c));
    }
  }

  // 🧠 แผน 4: ถ้าเราถือ J♦ และไม่ใช่คนสุดท้าย → อย่าทิ้ง J ถ้ามีตัวอื่น
  if (
    a.hasJDiamond &&
    !isLast &&
    playable.includes('jack_of_diamonds') &&
    playable.length > 1
  ) {
    playable = playable.filter(c => c !== 'jack_of_diamonds');
  }

  // 🧠 แผน 5: ถ้าเป็นคนสุดท้ายและถือ J♦ → พิจารณาลงเก็บเอง
  if (
    isLast &&
    a.hasJDiamond &&
    playable.includes('jack_of_diamonds')
  ) {
    const blockers = blockJ;
    const othersMayHaveBlock = blockers.some(rank =>
      Object.entries(players).some(([p, h]) =>
        p !== player && h.includes(`${rank}_of_diamonds`)
      )
    );
    if (!othersMayHaveBlock) return 'jack_of_diamonds';
  }

  // 🧠 แผน 6: ถ้าคนก่อนลง K♠ หรือ A♠ และเรามี Q♠ → ทิ้งให้เลย
  if (
    a.hasQSpades &&
    playable.includes('queen_of_spades') &&
    currentLeadSuit === 'spades' &&
    centerRanks.some(r => ['king', 'ace'].includes(r))
  ) {
    return 'queen_of_spades';
  }

  // 🧠 แผน 7: หลีก Q♠ ถ้าคน lead ♠ และเรายังมีใบอื่นใน ♠
  if (
    currentLeadSuit === 'spades' &&
    playable.includes('queen_of_spades') &&
    playable.filter(c => c.includes('_of_spades')).length > 1
  ) {
    playable = playable.filter(c => c !== 'queen_of_spades');
  }

  // 🧠 แผน 8: ถ้า Q♠ ออกแล้ว → ♠ ปลอดภัย
  if (gameState.qSpadesPlayed && currentLeadSuit === 'spades') {
    const spades = playable.filter(c => c.includes('_of_spades'));
    if (spades.length > 0) return spades[0];
  }

  // 🧠 แผน 9: หลีก A♠, K♠ ถ้า Q♠ ยังไม่ออก
  if (!gameState.qSpadesPlayed) {
    playable = playable.filter(c => !['king_of_spades','ace_of_spades'].includes(c));
  }

  // 🧠 แผน 10: มือปลอดภัย + มี 10♣ → ลองกินเอง
  if (a.safeHand && a.has10Clubs && playable.includes('10_of_clubs')) {
    return '10_of_clubs';
  }

  // 🧠 แผน 11: ถ้าคนอื่นถือ ♥ เยอะ → ปั่น
  const othersHoldingRed = Object.entries(players).some(([p, h]) =>
    p !== player && h.filter(c => c.includes('_of_hearts')).length >= 4
  );
  if (othersHoldingRed) {
    const hearts = playable.filter(c => c.includes('_of_hearts'));
    if (hearts.length > 0) return hearts[0];
  }

  // 🧠 แผน 12: ถ้าเรานำคะแนน → หลีกเสี่ยง
  if (leading) {
    const safe = playable.filter(c =>
      !c.includes('_of_hearts') &&
      c !== 'queen_of_spades' &&
      c !== 'jack_of_diamonds'
    );
    if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)];
  }

  // 🧠 แผน 13: ถ้าลำดับกลาง → เลือกไพ่กลาง
  if (isMiddle && playable.length >= 3) {
    const sorted = playable.slice().sort(sortCards);
    return sorted[Math.floor(sorted.length / 2)];
  }

  // 🧠 แผน 14: หลีก ♥ ถ้าเลือกได้
  const nonHearts = playable.filter(c => !c.includes('_of_hearts'));
  if (nonHearts.length > 0) {
    return nonHearts[Math.floor(Math.random() * nonHearts.length)];
  }

  // 🧠 fallback: เลือกจาก playable ทั้งหมด
  return playable[Math.floor(Math.random() * playable.length)];
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

