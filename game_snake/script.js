




const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const boardSize = 18;
let snake = [202, 201, 200];
let direction = 1;
let food = 0;
let score = 0;
let interval = null;
let quizInterval = null;
let quizTimer = null;
let quizActive = false;
let quizOptions = [];

function setDirection(key) {
  const dirMap = {
    ArrowUp: -boardSize,
    ArrowDown: boardSize,
    ArrowLeft: -1,
    ArrowRight: 1
  };
  if (dirMap[key] !== undefined) {
    direction = dirMap[key];
  }
}

for (let i = 0; i < boardSize * boardSize; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  board.appendChild(cell);
}

const cells = document.querySelectorAll(".cell");
document.addEventListener("keydown", e => setDirection(e.key));

function spawnFood() {
  do {
    food = Math.floor(Math.random() * (boardSize * boardSize));
  } while (snake.includes(food));
  cells[food].classList.add("food");
}

function spawnQuiz() {
  if (quizActive) return;
  quizActive = true;

  const q = quizBank[Math.floor(Math.random() * quizBank.length)];
  document.getElementById("quiz-question").textContent = q.question;
  quizOptions = [];

  const positions = [];
  while (positions.length < q.options.length) {
    let pos = Math.floor(Math.random() * (boardSize * boardSize));
    if (!snake.includes(pos) && pos !== food && !positions.includes(pos)) {
      positions.push(pos);
    }
  }

  for (let i = 0; i < q.options.length; i++) {
    const cell = cells[positions[i]];
    cell.textContent = q.options[i];
    cell.classList.add("quiz-option");
    quizOptions.push({ index: positions[i], value: q.options[i], correct: q.answer });
  }

  quizTimer = setTimeout(() => {
    if (quizActive) clearQuiz();
  }, 10000);
}

function clearQuiz() {
  quizOptions.forEach(opt => {
    const cell = cells[opt.index];
    cell.textContent = "";
    cell.classList.remove("quiz-option");
  });
  quizOptions = [];
  quizActive = false;
  document.getElementById("quiz-question").textContent = "Waiting for quiz...";
  if (quizTimer) {
    clearTimeout(quizTimer);
    quizTimer = null;
  }
}

function move() {
  const head = snake[0] + direction;
  const nextCol = head % boardSize;
  const curCol = snake[0] % boardSize;

  if (
    head < 0 ||
    head >= boardSize * boardSize ||
    (direction === 1 && curCol === boardSize - 1) ||
    (direction === -1 && curCol === 0) ||
    snake.includes(head)
  ) {
    clearInterval(interval);
    clearInterval(quizInterval);
    alert("Game Over! Final Score: " + score);
    return;
  }

  snake.unshift(head);

  if (quizActive) {
    let selected = quizOptions.find(q => q.index === head);
    if (selected) {
      if (selected.value === selected.correct) {
        score += 3;
        scoreDisplay.textContent = `Score: ${score}`;
      }
      clearQuiz();
    }
  }

  if (head === food) {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    cells[food].classList.remove("food");
    spawnFood();
  } else {
    const tail = snake.pop();
    cells[tail].classList.remove("snake");
  }

  cells[head].classList.add("snake");
}

function startGame() {
  snake.forEach(i => cells[i].classList.add("snake"));
  spawnFood();
  interval = setInterval(move, 300); // slowed down by 10%
  quizInterval = setInterval(() => {
    if (!quizActive) spawnQuiz();
  }, 30000);
}

startGame();

const quizBank = [
  { question: "2x = 6", options: ["2", "3", "4", "5"], answer: "3" },
  { question: "x + 4 = 7", options: ["2", "3", "4", "5"], answer: "3" },
  { question: "x/2 = 5", options: ["2", "5", "10", "12"], answer: "10" },
  { question: "3x = 9", options: ["1", "2", "3", "4"], answer: "3" },
  { question: "x + 3 = 6", options: ["1", "2", "3", "4"], answer: "3" },
  { question: "x = 2 + 3", options: ["2", "3", "4", "5"], answer: "5" },
  { question: "5 = x - 2", options: ["6", "7", "3", "4"], answer: "7" },
  { question: "10 = 2x", options: ["4", "5", "6", "7"], answer: "5" },
  { question: "x - 5 = 0", options: ["5", "4", "3", "2"], answer: "5" },
  { question: "7 + x = 10", options: ["2", "3", "4", "5"], answer: "3" },
  { question: "x = 8 / 2", options: ["2", "3", "4", "5"], answer: "4" },
  { question: "x + 1 = 3", options: ["2", "1", "3", "0"], answer: "2" },
  { question: "4 = x + 1", options: ["1", "2", "3", "4"], answer: "3" },
  { question: "x = 10 - 3", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "2 + x = 9", options: ["6", "7", "8", "9"], answer: "7" },
  { question: "x - 4 = 2", options: ["5", "6", "7", "8"], answer: "6" },
  { question: "12 = 3x", options: ["2", "4", "6", "8"], answer: "4" },
  { question: "x / 3 = 4", options: ["10", "11", "12", "13"], answer: "12" },
  { question: "6x = 18", options: ["2", "3", "4", "5"], answer: "3" },
  { question: "5x = 25", options: ["4", "5", "6", "7"], answer: "5" }
];
