const gameContainer = document.getElementById('gameContainer');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOver = document.getElementById('gameOver');
const base = document.getElementById('base');
const healthBar = document.getElementById('health');
const scoreDisplay = document.getElementById('score');
const creditsDisplay = document.getElementById('credits');
const waveDisplay = document.getElementById('wave');
const waveProgress = document.getElementById('wave-progress');
const waveTimerDisplay = document.getElementById('wave-timer');
const finalScore = document.getElementById('finalScore');
const restartButton = document.getElementById('restart');

const shootSound = document.getElementById('shootSound');
const hitSound = document.getElementById('hitSound');
const explosionSound = document.getElementById('explosionSound');
const gameOverSound = document.getElementById('gameOverSound');

let score = 0;
let credits = 100;
let wave = 1;
let health = 100;
let gameActive = false;
let turrets = [];
let enemies = [];
let enemiesInWave = 0;
let waveTimeLeft = 10;
let shakeTimeout;

function startGame() {
    console.log('Game starting...');
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    gameActive = true;
    score = 0;
    credits = 100;
    wave = 1;
    health = 100;
    waveTimeLeft = 10;
    scoreDisplay.textContent = score;
    creditsDisplay.textContent = credits;
    waveDisplay.textContent = wave;
    waveProgress.textContent = '0%';
    waveTimerDisplay.textContent = `${waveTimeLeft}s`;
    healthBar.style.width = `${health}%`;
    enemies = [];
    turrets = [];
    spawnEnemies();
    updateWaveTimer();
    spawnResourceDrone();
    gameLoop();
    console.log('Game started successfully');
}

document.addEventListener('keydown', startGame, { once: true });
startScreen.addEventListener('touchstart', startGame, { once: true });

function placeTurret(e) {
    if (!gameActive || credits < 50) return;
    const rect = gameScreen.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    if (x > 75) {
        const turret = document.createElement('img');
        turret.src = 'img/turret-droid.png';
        turret.classList.add('turret');
        turret.style.left = `${x - 45}px`; /* Adjusted for larger turret size */
        turret.style.top = `${y - 45}px`; /* Adjusted for larger turret size */
        turret.level = 1;
        gameScreen.appendChild(turret);
        turrets.push({ element: turret, x: x - 45, y: y - 45, level: 1 });
        credits -= 50;
        creditsDisplay.textContent = credits;
        shootSound.play();
    }
}

gameScreen.addEventListener('click', placeTurret);
gameScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    placeTurret(e);
});

let lastTouchTime = 0;
gameScreen.addEventListener('dblclick', (e) => {
    if (!gameActive) return;
    const rect = gameScreen.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const turret = turrets.find(t => Math.abs(t.x - (x - 45)) < 45 && Math.abs(t.y - (y - 45)) < 45); /* Adjusted for larger size */
    if (turret && credits >= 50 * turret.level && turret.level < 3) {
        credits -= 50 * turret.level;
        creditsDisplay.textContent = credits;
        turret.level++;
        turret.element.style.filter = `brightness(${1 + 0.3 * turret.level})`;
        shootSound.play();
    }
});

gameScreen.addEventListener('touchstart', (e) => {
    const currentTime = new Date().getTime();
    if (currentTime - lastTouchTime < 300) {
        const rect = gameScreen.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        const turret = turrets.find(t => Math.abs(t.x - (x - 45)) < 45 && Math.abs(t.y - (y - 45)) < 45); /* Adjusted for larger size */
        if (turret && credits >= 50 * turret.level && turret.level < 3) {
            credits -= 50 * turret.level;
            creditsDisplay.textContent = credits;
            turret.level++;
            turret.element.style.filter = `brightness(${1 + 0.3 * turret.level})`;
            shootSound.play();
        }
    }
    lastTouchTime = currentTime;
});

function spawnEnemies() {
    if (!gameActive) return;
    console.log(`Spawning wave ${wave} with ${wave * 2} enemies`);
    enemiesInWave = wave * 2;
    waveProgress.textContent = '0%';
    waveTimeLeft = 10;
    waveTimerDisplay.textContent = `${waveTimeLeft}s`;
    for (let i = 0; i < enemiesInWave; i++) {
        setTimeout(() => {
            if (!gameActive) return;
            const enemy = document.createElement('img');
            enemy.src = 'img/enemy-drone.png';
            enemy.classList.add('enemy');
            enemy.style.top = `${Math.random() * (gameScreen.clientHeight - 72)}px`; /* Adjusted for larger size */
            gameScreen.appendChild(enemy);
            enemies.push({ element: enemy, x: gameScreen.clientWidth, y: parseFloat(enemy.style.top) });
            enemy.addEventListener('animationend', () => {
                if (enemy.parentNode) {
                    enemy.remove();
                    enemies = enemies.filter(e => e.element !== enemy);
                    health -= 10;
                    healthBar.style.width = `${health}%`;
                    hitSound.play();
                    shakeScreen();
                    if (health <= 0) endGame();
                    updateWaveProgress();
                }
            });
        }, Math.random() * 2000);
    }
    if (wave % 3 === 0) spawnBoss();
    wave++;
    waveDisplay.textContent = wave;
}

function spawnBoss() {
    const boss = document.createElement('img');
    boss.src = 'img/galactic-overlord.png';
    boss.classList.add('enemy', 'boss');
    boss.style.top = `${Math.random() * (gameScreen.clientHeight - 144)}px`; /* Adjusted for larger size */
    boss.hp = 3;
    gameScreen.appendChild(boss);
    enemies.push({ element: boss, x: gameScreen.clientWidth, y: parseFloat(boss.style.top), isBoss: true });
    boss.addEventListener('animationend', () => {
        if (boss.parentNode) {
            boss.remove();
            health -= 30;
            healthBar.style.width = `${health}%`;
            hitSound.play();
            shakeScreen();
            if (health <= 0) endGame();
        }
    });
}

function spawnResourceDrone() {
    if (!gameActive) return;
    const drone = document.createElement('img');
    drone.src = 'img/resource-drone.png';
    drone.classList.add('resource-drone');
    drone.style.top = `${Math.random() * (gameScreen.clientHeight - 72)}px`; /* Adjusted for larger size */
    gameScreen.appendChild(drone);
    drone.addEventListener('click', () => {
        credits += 50;
        creditsDisplay.textContent = credits;
        drone.remove();
    });
    drone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        credits += 50;
        creditsDisplay.textContent = credits;
        drone.remove();
    });
    drone.addEventListener('animationend', () => drone.remove());
    setTimeout(spawnResourceDrone, 15000);
}

function gameLoop() {
    if (!gameActive) return;
    console.log('Game loop running...');
    updateTurrets();
    updateEnemies();
    requestAnimationFrame(gameLoop);
}

function updateTurrets() {
    turrets.forEach(turret => {
        enemies.forEach(enemy => {
            const dx = enemy.x - turret.x;
            const dy = enemy.y - turret.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const range = 240 * (1 + 0.5 * (turret.level - 1)); /* Increased from 200 */
            if (distance < range && !turret.cooldown) {
                shootLaser(turret, enemy);
                turret.cooldown = true;
                setTimeout(() => turret.cooldown = false, 500 / turret.level);
            }
        });
    });
}

function shootLaser(turret, enemy) {
    const laser = document.createElement('div');
    laser.classList.add('laser');
    laser.style.left = `${turret.x + 45}px`; /* Adjusted for larger turret size */
    laser.style.top = `${turret.y + 45}px`; /* Adjusted for larger turret size */
    const angle = Math.atan2(enemy.y - turret.y, enemy.x - turret.x);
    laser.style.width = `${Math.sqrt((enemy.x - turret.x) ** 2 + (enemy.y - turret.y) ** 2)}px`;
    laser.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;
    laser.style.opacity = '1';
    gameScreen.appendChild(laser);
    setTimeout(() => laser.style.opacity = '0', 100);
    setTimeout(() => laser.remove(), 200);
    shootSound.play();

    if (enemy.element.parentNode) {
        if (enemy.isBoss) {
            enemy.hp--;
            hitSound.play();
            if (enemy.hp <= 0) {
                score += 100;
                explosionSound.play();
                createExplosion(enemy.x, enemy.y);
                enemy.element.remove();
                enemies = enemies.filter(e => e.element !== enemy.element);
                shakeScreen();
            }
        } else {
            score += 20;
            credits += 10;
            hitSound.play();
            explosionSound.play();
            createExplosion(enemy.x, enemy.y);
            enemy.element.remove();
            enemies = enemies.filter(e => e.element !== enemy.element);
        }
        scoreDisplay.textContent = score;
        creditsDisplay.textContent = credits;
        updateWaveProgress();
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.classList.add('explosion');
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.transform = `translate(${Math.random() * 36 - 18}px, ${Math.random() * 36 - 18}px)`; /* Increased from 30-15 */
        gameScreen.appendChild(particle);
        setTimeout(() => particle.remove(), 400);
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.x -= 2 + (wave - 1) * 0.5;
        enemy.element.style.left = `${enemy.x}px`;
    });
}

function updateWaveProgress() {
    const remaining = enemies.length;
    const progress = ((enemiesInWave - remaining) / enemiesInWave * 100).toFixed(0);
    waveProgress.textContent = `${progress}%`;
}

function updateWaveTimer() {
    if (!gameActive) return;
    console.log(`Wave timer: ${waveTimeLeft}s`);
    waveTimerDisplay.textContent = `${waveTimeLeft}s`;
    waveTimeLeft--;
    if (waveTimeLeft < 0) {
        spawnEnemies();
        waveTimeLeft = 10;
    }
    setTimeout(updateWaveTimer, 1000);
}

function shakeScreen() {
    if (shakeTimeout) clearTimeout(shakeTimeout);
    gameContainer.style.animation = 'shake 0.5s';
    shakeTimeout = setTimeout(() => {
        gameContainer.style.animation = '';
    }, 500);
}

function endGame() {
    gameActive = false;
    gameScreen.style.display = 'none';
    gameOver.style.display = 'flex';
    finalScore.textContent = score;
    gameOverSound.play();
    turrets = [];
    enemies = [];
    document.querySelectorAll('.turret, .enemy, .laser, .explosion, .resource-drone').forEach(el => el.remove());
}

restartButton.addEventListener('click', () => {
    gameOver.style.display = 'none';
    startGame();
});