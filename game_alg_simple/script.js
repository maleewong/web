const questionBank = [
  { equation: "x + 5 = 12", answer: "7" },
  { equation: "2x = 10", answer: "5" },
  { equation: "x/3 = 4", answer: "12" },
  { equation: "3x + 2 = 11", answer: "3" },
  { equation: "5x - 7 = 18", answer: "5" },
  { equation: "x^2 = 25", answer: "5 or -5" },
  { equation: "x + 6 = 10", answer: "4" },
  { equation: "x - 2 = 1", answer: "3" },
  { equation: "4x = 16", answer: "4" },
  { equation: "2x - 1 = 7", answer: "4" },
  { equation: "x + 9 = 15", answer: "6" },
  { equation: "7x = 21", answer: "3" },
  { equation: "x - 3 = 5", answer: "8" },
  { equation: "6x = 36", answer: "6" },
  { equation: "x/2 = 9", answer: "18" },
  { equation: "x - 10 = 0", answer: "10" },
  { equation: "x + 4 = 7", answer: "3" },
  { equation: "9x = 81", answer: "9" },
  { equation: "x^2 = 36", answer: "6 or -6" },
  { equation: "x/4 = 5", answer: "20" },
  { equation: "10x = 100", answer: "10" },
  { equation: "x - 6 = 3", answer: "9" },
  { equation: "2x + 4 = 10", answer: "3" },
  { equation: "x - 8 = 0", answer: "8" },
  { equation: "x + 7 = 13", answer: "6" },
  { equation: "4x = 32", answer: "8" },
  { equation: "3x = 15", answer: "5" },
  { equation: "x - 5 = 2", answer: "7" },
  { equation: "x + 11 = 20", answer: "9" },
  { equation: "x^2 = 49", answer: "7 or -7" }
];


let pairs = [];
let flippedCards = [];
let score = 0;
let timeLeft = 60;
let mistakes = 0;
let timerInterval;

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function initGame() {
  const gameBoard = document.getElementById("game-board");
  gameBoard.innerHTML = "";
  resetGameStats();

  const selected = shuffle(questionBank).slice(0, 6);
  pairs = selected;
  const cards = [...selected.map(p => p.equation), ...selected.map(p => p.answer)];
  shuffle(cards);

  cards.forEach(card => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.textContent = card;
    cardElement.addEventListener("click", () => flipCard(cardElement, card));
    gameBoard.appendChild(cardElement);
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 60;
  document.getElementById("time").textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function endGame() {
  showEmoji(`⏰ Time's up! Final score: ${score}`);
  stopGame();
}

function stopGame() {
  clearInterval(timerInterval);
  document.getElementById("game-board").innerHTML = "";
}

function resetGameStats() {
  score = 0;
  mistakes = 0;
  updateScore();
  updateMistakes();
}

function flipCard(cardElement, value) {
  if (
    flippedCards.length < 2 &&
    !cardElement.classList.contains("matched") &&
    !cardElement.classList.contains("flipped")
  ) {
    cardElement.classList.add("flipped");
    cardElement.style.backgroundColor = "#ffeaa7";
    flippedCards.push({ element: cardElement, value });

    if (flippedCards.length === 2) {
      setTimeout(checkMatch, 800);
    }
  }
}

function checkMatch() {
  const [firstCard, secondCard] = flippedCards;
  if (isMatch(firstCard.value, secondCard.value)) {
    firstCard.element.classList.add("matched");
    secondCard.element.classList.add("matched");
    showEmoji("🎉 Correct!");
    score += 10;
    updateScore();
    if (score >= 60) {
      clearInterval(timerInterval);
      showEmoji("🏆 You win!");
      stopGame();
    }
  } else {
    mistakes++;
    updateMistakes();
    showEmoji("😅 Oops!");
    firstCard.element.style.backgroundColor = "#fff";
    secondCard.element.style.backgroundColor = "#fff";
    firstCard.element.classList.remove("flipped");
    secondCard.element.classList.remove("flipped");
    if (mistakes >= 2) {
      clearInterval(timerInterval);
      showEmoji("💥 Too many mistakes!");
      stopGame();
    }
  }
  flippedCards = [];
}

function isMatch(value1, value2) {
  return pairs.some(pair =>
    (pair.equation === value1 && pair.answer === value2) ||
    (pair.equation === value2 && pair.answer === value1)
  );
}

function updateScore() {
  document.getElementById("score").textContent = score;
}

function updateMistakes() {
  document.getElementById("mistakes").textContent = mistakes;
}

function showEmoji(message) {
  const emojiDisplay = document.createElement("div");
  emojiDisplay.textContent = message;
  emojiDisplay.style.position = "fixed";
  emojiDisplay.style.top = "30%";
  emojiDisplay.style.left = "50%";
  emojiDisplay.style.transform = "translate(-50%, -50%)";
  emojiDisplay.style.fontSize = "36px";
  emojiDisplay.style.background = "#ffffffdd";
  emojiDisplay.style.padding = "15px 30px";
  emojiDisplay.style.borderRadius = "20px";
  emojiDisplay.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  emojiDisplay.style.zIndex = "999";
  document.body.appendChild(emojiDisplay);
  setTimeout(() => {
    document.body.removeChild(emojiDisplay);
  }, 1500);
}

document.getElementById("start-button").addEventListener("click", () => {
  initGame();
});

