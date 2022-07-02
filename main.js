import './style.css'

const BG_COLOR = '#231f20';
const SNAKE_COLOR = '#c2c2c2';
const FOOD_COLOR = '#e66916';

const socket = io('https://snakey-friends.herokuapp.com/');

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.querySelector('#gameScreen');
const initialScreen = document.querySelector('#initialScreen');
const newGameBtn = document.querySelector('#newGameBtn');
const joinGameBtn = document.querySelector('#joinGameBtn');
const gameCodeInput = document.querySelector('#gameCodeInput');
const gameCodeDisplay = document.querySelector('#gameCodeDisplay');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

function newGame() {
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
  initialScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function keydown(e) {
  socket.emit('keydown', e.keyCode)
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;
  console.log(size)

  ctx.fillStyle = FOOD_COLOR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOR);
  paintPlayer(state.players[1], size, 'red');
}

function paintPlayer(playerState, size, color) {
  const snake = playerState.snake;

  ctx.fillStyle = color;
  snake.forEach(cell => {
  ctx.fillRect(cell.x * size, cell.y * size, size, size);
  })
}

// paintGame(gameState);

function handleInit(number) {
  playerNumber = number;
}

function handleGameCode(gameCode) {
gameCodeDisplay.innerText = gameCode;
}

function handleGameState(gameState) {
  if(!gameActive) return;
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if(!gameActive) return;
  data = JSON.parse(data);
  if(data.winner === playerNumber) alert('You Win!')
  else alert('You lose.')

  gameActive = false;
}

function handleUnknownGame() {
  reset();
  alert('Unknown Game Code')
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress')
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  gameCodeDisplay.innerText = '';
  initialScreen.classList.remove('hidden');
  gameScreen.classList.add('hidden')
}