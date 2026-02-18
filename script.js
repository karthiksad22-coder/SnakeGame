/* 🔊 AUDIO SYSTEM */

const eatSound = new Audio("sounds/snakeeatapple.mp3");
const goldSound = new Audio("sounds/5pointsapple.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");
const bgMusic = new Audio("sounds/backgroundmusic.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.4;

let audioStarted = false;

function startAudio(){
  if(!audioStarted){
    bgMusic.play().catch(()=>{});
    audioStarted = true;
  }
}

document.addEventListener("pointerdown", startAudio);
document.addEventListener("keydown", startAudio);

/* ================= ORIGINAL GAME CODE ================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const popup = document.getElementById("gameOverPopup");
const finalScoreEl = document.getElementById("finalScore");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");

const SPEED = 140;
const RADIUS = 10;

let snake = [];
let dir = {x:1,y:0};
let food;
let score = 0;

/* 🏆 LOAD BEST SCORE */

function loadBestScore(){

  let stored = localStorage.getItem("bestScore");

  if(stored === null){
    localStorage.setItem("bestScore", 0);
    return 0;
  }

  let value = parseInt(stored);

  if(isNaN(value) || value < 0 || value > 500){
    value = 0;
    localStorage.setItem("bestScore", 0);
  }

  return value;
}

let bestScore = loadBestScore();
bestScoreEl.textContent = bestScore;

let running = true;
let paused = false;
let lastTime = 0;

/* ⏸ PAUSE BUTTON */

const pauseBtn = document.getElementById("pauseBtn");

pauseBtn?.addEventListener("click", () => {

  paused = !paused;

  if(paused){
    pauseBtn.textContent = "▶";
    bgMusic.pause();
  }else{
    pauseBtn.textContent = "⏸";

    if(audioStarted && !bgMusic.muted){
      bgMusic.play().catch(()=>{});
    }

    lastTime = performance.now();
  }

});

/* 🎮 INIT */

function init(){

  snake = [
    {x:160,y:200},
    {x:150,y:200},
    {x:140,y:200}
  ];

  dir = {x:1,y:0};
  score = 0;
  running = true;
  paused = false;

  if(pauseBtn) pauseBtn.textContent = "⏸";

  scoreEl.textContent = score;

  spawnFood();
}

/* 🍎 FOOD */

function spawnFood(){

  const isGolden = Math.random() < 0.15;

  food = {
    x: Math.random()*(canvas.width-40)+20,
    y: Math.random()*(canvas.height-40)+20,
    golden: isGolden,
    radius: isGolden ? 12 : 9
  };
}

/* 🎮 CONTROLS */

window.setDir = function(x,y){

  if((x === -dir.x && x !== 0) || (y === -dir.y && y !== 0)) return;

  dir = {x,y};
};

document.addEventListener("keydown", e=>{
  if(e.key==="ArrowUp") setDir(0,-1);
  if(e.key==="ArrowDown") setDir(0,1);
  if(e.key==="ArrowLeft") setDir(-1,0);
  if(e.key==="ArrowRight") setDir(1,0);
});

/* 🔄 UPDATE */

function update(delta){

  const move = SPEED * delta;

  const newHead = {
    x: snake[0].x + dir.x * move,
    y: snake[0].y + dir.y * move
  };

  if(
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x > canvas.width ||
    newHead.y > canvas.height
  ){
    gameOver();
    return;
  }

  for(let i = 8; i < snake.length; i++){

    const dx = newHead.x - snake[i].x;
    const dy = newHead.y - snake[i].y;

    if(Math.sqrt(dx*dx + dy*dy) < RADIUS){
      gameOver();
      return;
    }
  }

  snake.unshift(newHead);

  const dx = newHead.x - food.x;
  const dy = newHead.y - food.y;

  if(Math.sqrt(dx*dx + dy*dy) < RADIUS + food.radius){

    if(food.golden){
      goldSound.currentTime = 0;
      goldSound.play();
    }else{
      eatSound.currentTime = 0;
      eatSound.play();
    }

    score += food.golden ? 5 : 1;
    scoreEl.textContent = score;

    if(score > bestScore){
      bestScore = score;
      bestScoreEl.textContent = bestScore;
      localStorage.setItem("bestScore", bestScore);
    }

    snake.push({...snake[snake.length-1]});
    spawnFood();

  }else{
    snake.pop();
  }
}

/* 🐍 DRAW SNAKE */

function drawSnake(){
  for(let i = snake.length - 1; i >= 0; i--){
    const s = snake[i];
    const grad = ctx.createRadialGradient(
      s.x - 3, s.y - 3, 2,
      s.x, s.y, RADIUS
    );
    grad.addColorStop(0,"#00fff0");
    grad.addColorStop(1,"#003a3a");

    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(s.x, s.y, RADIUS, 0, Math.PI*2);
    ctx.fill();
  }
  drawEyes();
}

/* 👀 EYES */

function drawEyes(){

  const head = snake[0];
  const angle = Math.atan2(dir.y, dir.x);

  const forward = RADIUS * 0.6;
  const side = RADIUS * 0.45;
  const eyeSize = RADIUS * 0.25;

  function eye(sideDir){

    const ex =
      head.x +
      Math.cos(angle) * forward +
      Math.cos(angle + Math.PI/2 * sideDir) * side;

    const ey =
      head.y +
      Math.sin(angle) * forward +
      Math.sin(angle + Math.PI/2 * sideDir) * side;

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(ex, ey, eyeSize, 0, Math.PI*2);
    ctx.fill();
  }

  eye(1);
  eye(-1);
}

/* 🍎 DRAW FOOD */

function drawFood(){

  const glow = ctx.createRadialGradient(
    food.x, food.y, 2,
    food.x, food.y, food.radius
  );

  if(food.golden){
    glow.addColorStop(0,"#fff066");
    glow.addColorStop(1,"#ffae00");
  }else{
    glow.addColorStop(0,"#ff004c");
    glow.addColorStop(1,"#3a000f");
  }

  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(food.x, food.y, food.radius, 0, Math.PI*2);
  ctx.fill();
}

/* 🚨 DANGER WALL GLOW */

function drawDangerWalls(){

  const head = snake[0];
  const trigger = 80;

  ctx.lineWidth = 6;

  function laser(alpha){
    ctx.shadowBlur = 25;
    ctx.shadowColor = `rgba(255,0,0,${alpha})`;
    ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
  }

  if(dir.x > 0){
    const d = canvas.width - head.x;
    if(d < trigger){
      laser(1 - d/trigger);
      ctx.beginPath();
      ctx.moveTo(canvas.width-2,0);
      ctx.lineTo(canvas.width-2,canvas.height);
      ctx.stroke();
    }
  }

  if(dir.x < 0){
    const d = head.x;
    if(d < trigger){
      laser(1 - d/trigger);
      ctx.beginPath();
      ctx.moveTo(2,0);
      ctx.lineTo(2,canvas.height);
      ctx.stroke();
    }
  }

  if(dir.y < 0){
    const d = head.y;
    if(d < trigger){
      laser(1 - d/trigger);
      ctx.beginPath();
      ctx.moveTo(0,2);
      ctx.lineTo(canvas.width,2);
      ctx.stroke();
    }
  }

  if(dir.y > 0){
    const d = canvas.height - head.y;
    if(d < trigger){
      laser(1 - d/trigger);
      ctx.beginPath();
      ctx.moveTo(0,canvas.height-2);
      ctx.lineTo(canvas.width,canvas.height-2);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
}

/* ⭐ STARS */

let stars = Array.from({length:80},()=>([
  Math.random()*canvas.width,
  Math.random()*canvas.height
]));

function drawStars(){
  ctx.fillStyle="white";
  stars.forEach(s=>ctx.fillRect(s[0],s[1],1,1));
}

/* 💀 GAME OVER */

function gameOver(){
  running = false;
  gameOverSound.currentTime = 0;
  gameOverSound.play();
  finalScoreEl.textContent = "Score: " + score;
  popup.classList.remove("hidden");
}

/* 🔁 RESTART */

window.restartGame = function(){
  popup.classList.add("hidden");
  init();
};

/* 🎨 DRAW */

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawStars();
  drawFood();
  drawSnake();
  drawDangerWalls();
}

/* ⏱️ LOOP */

function loop(time){
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  if(running && !paused) update(delta);

  draw();
  requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);

/* ⚙️ SETTINGS AUDIO CONTROL — ADDED */

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

const musicSlider = document.getElementById("musicVolume");
const sfxSlider = document.getElementById("sfxVolume");

const musicMuteBtn = document.getElementById("musicMute");
const sfxMuteBtn = document.getElementById("sfxMute");

settingsBtn?.addEventListener("click", ()=>{
  settingsPanel.classList.toggle("hidden");
});

musicSlider?.addEventListener("input", e=>{
  bgMusic.volume = e.target.value;
});

sfxSlider?.addEventListener("input", e=>{
  [eatSound, goldSound, gameOverSound].forEach(s=>{
    s.volume = e.target.value;
  });
});

musicMuteBtn?.addEventListener("click", ()=>{
  bgMusic.muted = !bgMusic.muted;
});

sfxMuteBtn?.addEventListener("click", ()=>{
  const muted = eatSound.muted;
  [eatSound, goldSound, gameOverSound].forEach(s=>{
    s.muted = !muted;
  });
});
