
let peer, conn;
let isHost = false;
let allConnections = [];
let expectedPlayerCount = 2;

function createRoom() {
  isHost = true;
  expectedPlayerCount = parseInt(document.getElementById("player-count").value);
  peer = new Peer();
  peer.on("open", id => {
    document.getElementById("my-id").textContent = "Room ID: " + id;
  });

  peer.on("connection", incoming => {
    allConnections.push(incoming);
    incoming.on("open", () => {
      incoming.send({ type: "connected", index: allConnections.length });
    });
    incoming.on("data", onReceiveData);
    
    if (allConnections.length === expectedPlayerCount - 1) {
      // Enough peers → start game
      playerCount = expectedPlayerCount;
      playerName = "Host";
      startGame();
      // send game state to all peers
      allConnections.forEach((c, i) => {
        c.send({ type: "deal_hand", players, index: i + 1 }); // player 0 = host
      });
    }
  });
}

function connectToPeer(id) {
  isHost = false;
  peer = new Peer();
  peer.on("open", () => {
    conn = peer.connect(id);
    conn.on("open", () => {});
    conn.on("data", onReceiveData);
  });
}

function sendPlayCard(card) {
  if (conn && conn.open) {
    conn.send({ type: "play_card", card });
  } else if (isHost && allConnections.length > 0) {
    allConnections.forEach(c => c.send({ type: "play_card", card }));
  }
}

function onReceiveData(data) {
  if (data.type === "deal_hand") {
    players = data.players;
    playerName = players[data.index].name;
    startGame();
  } else if (data.type === "play_card") {
    const other = players.find(p => p.name !== playerName && !p.playedCard);
    if (other) {
      other.playedCard = data.card;
      renderTable();
      if (players.every(p => p.playedCard)) {
        setTimeout(() => {
          determineTrickWinner();
          renderHands();
        }, 1000);
      }
    }
  }
}
