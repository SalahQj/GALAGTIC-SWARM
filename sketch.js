// Galactic Swarm - Live Demo: https://salahqj.itch.io/galagtic-swarm
let flockBlue = [];
let flockRed = [];

// === CONSTANTES DU JEU ===
let GAME_SPEED_LIMIT = 6;
// ==========================


let bullets = [];
let explosions = [];
let obstacles = [];
let traps = [];
let monsters = [];
let stars = []; // Array for starfield

// Sliders UI
let sliderSeparation, sliderCohesion, sliderAlignment, sliderWander, sliderEvasion;
let mouseLeaderBlue, mouseLeaderRed;


let blueShipImg, redShipImg; // Removed bgImg
let scoreBlue = 0;
let scoreRed = 0;

// Game State
let gameState = 'menu'; // 'menu', 'playing' or 'gameOver'
let gameStats;
let gameOverScreen;
let mainMenu;
let playerTeam = null;




function preload() {
    // Load images from Base64 strings (defined in assets_embedded.js)
    if (typeof blueShipData !== 'undefined') {
        console.log("Loading Blue Ship Data...");
        blueShipImg = loadImage(blueShipData);
    } else {
        console.error("blueShipData is UNDEFINED");
    }

    if (typeof redShipData !== 'undefined') {
        console.log("Loading Red Ship Data...");
        redShipImg = loadImage(redShipData);
    } else {
        console.error("redShipData is UNDEFINED");
    }
}

function setup() {
    console.log("Game Initialization - Version 1.7 (Stable AI)");
    createCanvas(windowWidth, windowHeight);



    mainMenu = new MainMenu();

    // NOUVEAU: Sliders créés une seule fois au setup
    createSliders();

    initGame();
}

function initGame() {
    // Reset game stats
    gameStats = new GameStats();
    gameOverScreen = null;

    // Clear arrays
    flockBlue = [];
    flockRed = [];
    bullets = [];
    explosions = [];
    obstacles = [];
    traps = [];
    monsters = [];
    scoreBlue = 0;
    scoreRed = 0;

    // Create Starfield
    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            alpha: random(100, 255)
        });
    }

    // Spawn Blue Team (Flock Formation)
    for (let i = 0; i < 20; i++) {
        let b = new Boid(random(100, 300), random(height / 2 - 100, height / 2 + 100), blueShipImg, 'blue');
        flockBlue.push(b);
    }

    // Spawn Red Team (Swarm Formation)
    for (let i = 0; i < 20; i++) {
        let b = new Boid(random(width - 300, width - 100), random(height / 2 - 100, height / 2 + 100), redShipImg, 'red');
        flockRed.push(b);
    }

    // NOUVEAU: Création des leaders invisibles qui suivent la souris
    mouseLeaderBlue = new Boid(mouseX, mouseY, undefined, 'blue');
    mouseLeaderBlue.maxSpeed = 8;
    mouseLeaderRed = new Boid(mouseX, mouseY, undefined, 'red');
    mouseLeaderRed.maxSpeed = 8;

    // Update UI
    updateUI();
}

function draw() {
    if (gameState === 'menu') {
        if (mainMenu) {
            mainMenu.show();
        }
        // Hide UI panel in menu
        let ui = document.getElementById('ui');
        if (ui) ui.style.display = 'none';
        return;
    }

    // Show UI panel only in playing mode
    let ui = document.getElementById('ui');
    if (ui) {
        ui.style.display = (gameState === 'playing') ? 'block' : 'none';
    }

    background(10, 10, 30); // Dark blue space background

    // Draw Stars
    noStroke();
    for (let star of stars) {
        fill(255, 255, 255, star.alpha);
        ellipse(star.x, star.y, star.size);
        // Twinkle effect
        if (random() < 0.05) star.alpha = random(100, 255);
    }

    if (gameState === 'playing') {
        playGame();
        checkVictoryConditions();
    } else if (gameState === 'gameOver') {

        // Hide UI panel in gameOver
        let ui = document.getElementById('ui');
        if (ui) ui.style.display = 'none';

        // Continue showing game elements in background
        showGameElements();
        // Show game over screen
        if (gameOverScreen) {
            gameOverScreen.update();
            gameOverScreen.show();
        }
    }
}

function playGame() {
    // Game Logic

    // 1. Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];

        // POINT 4: Les balles cherchent le monstre le plus proche (comportement seek)
        let target = (monsters.length > 0) ? monsters[0] : null;
        b.update(target);
        b.show();

        if (b.toDelete) {
            bullets.splice(i, 1);
            continue;
        }

        // Collision detection
        let targets = b.team === 'blue' ? flockRed : flockBlue;
        for (let target of targets) {
            if (b.checkCollision(target)) {
                target.hit(10); // 10 dégâts
                gameStats.recordBulletHit(b.team);
                explosions.push(new Explosion(b.pos.x, b.pos.y, b.team === 'blue' ? 'cyan' : 'orange'));

                if (target.isDead) {
                    explosions.push(new Explosion(target.pos.x, target.pos.y, target.team === 'blue' ? 'blue' : 'red'));
                    updateScore(b.team);
                    gameStats.recordKill(b.team);
                    gameStats.recordDeath(target.team);
                }
                break; // Une balle ne touche qu'un vaisseau
            }
        }

        // Collision avec les monstres
        if (b.team !== 'monster') {
            for (let monster of monsters) {
                if (b.checkCollision(monster)) {
                    monster.hit(10); // 10 dégâts par balle
                    gameStats.recordBulletHit(b.team);
                    explosions.push(new Explosion(b.pos.x, b.pos.y, b.team === 'blue' ? 'cyan' : 'orange'));
                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Collision avec les pièges (barrières)
        if (bullets[i]) {
            for (let trap of traps) {
                if (trap.checkBulletCollision(bullets[i])) { // Correction variable: b -> bullets[i]
                    explosions.push(new Explosion(bullets[i].pos.x, bullets[i].pos.y, color(255, 0, 255)));
                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Collision avec les obstacles (bombes)
        if (bullets[i]) {
            for (let obs of obstacles) {
                if (obs.checkBulletCollision(bullets[i])) {
                    obs.hit(10);
                    gameStats.recordBulletHit(bullets[i].team);
                    explosions.push(new Explosion(bullets[i].pos.x, bullets[i].pos.y, color(255, 100, 0)));
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    // 2. Update Blue Flock
    for (let i = flockBlue.length - 1; i >= 0; i--) {
        let b = flockBlue[i];
        if (b.isDead) {
            flockBlue.splice(i, 1);
            continue;
        }
        b.applyBehaviors(flockBlue, flockRed, bullets, obstacles, traps, monsters);
        b.update();
        b.edges(); // Ou boundaries
        b.show();
    }

    // 3. Update Red Flock
    for (let i = flockRed.length - 1; i >= 0; i--) {
        let b = flockRed[i];
        if (b.isDead) {
            flockRed.splice(i, 1);
            continue;
        }
        b.applyBehaviors(flockRed, flockBlue, bullets, obstacles, traps, monsters);
        b.update();
        b.edges();
        b.show();
    }

    // 4. Update and show obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];

        // Update timer
        obs.update(flockBlue, flockRed);

        if (obs.destroyed) {
            // Si détruit par tir, infliger aussi des dégâts d'explosion
            if (obs.health <= 0) {
                obs.damageNearbyBoids(flockBlue);
                obs.damageNearbyBoids(flockRed);
                // Grosse explosion
                for (let j = 0; j < 30; j++) {
                    explosions.push(new Explosion(obs.pos.x, obs.pos.y, color(255, 100, 0)));
                }
            }
            gameStats.recordBombExplosion();
            obstacles.splice(i, 1);
        } else {
            obs.show();
        }
    }

    // 5. Update and show traps
    for (let i = traps.length - 1; i >= 0; i--) {
        traps[i].update();
        if (!traps[i].active) {
            traps.splice(i, 1);
        } else {
            traps[i].show();
        }
    }

    // 5.5 Update and show monsters
    for (let i = monsters.length - 1; i >= 0; i--) {
        let m = monsters[i];
        m.update(flockBlue, flockRed, bullets);
        if (m.isDead) {
            // Grosse explosion pour le monstre
            for (let j = 0; j < 50; j++) {
                explosions.push(new Explosion(m.pos.x, m.pos.y, color(255, 0, 255)));
            }
            if (!m.statRecorded) {
                gameStats.recordMonsterKilled();
                m.statRecorded = true;
            }
            monsters.splice(i, 1);

            // Si c'était le dernier monstre, les boids reprennent leur formation globale
            if (monsters.length === 0) {
                flockBlue.concat(flockRed).forEach(b => {
                    if (b.behaviorMode === 'focus') {
                        b.behaviorMode = currentGroupMode;
                        // Rétablir le leader si nécessaire
                        if (currentGroupMode !== 'flock') {
                            updateGroupLeaders();
                        }
                    }
                });
                console.log("Cible détruite, reprise du mode :", currentGroupMode);
            }

        } else {
            m.show();
        }
    }

    // 6. Update Explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        explosions[i].show();
        if (explosions[i].finished()) {
            explosions.splice(i, 1);
        }
    }

    // NOUVEAU: Update Mouse Leaders (Arrive on mouse)
    let mousePos = createVector(mouseX, mouseY);
    let prevMousePos = createVector(pmouseX, pmouseY);
    let mouseVel = p5.Vector.sub(mousePos, prevMousePos);

    mouseLeaderBlue.pos.set(mouseX, mouseY);
    mouseLeaderBlue.vel.set(mouseVel);
    mouseLeaderRed.pos.set(mouseX, mouseY);
    mouseLeaderRed.vel.set(mouseVel);

    // Affichage discret du leader souris
    fill(255, 150);
    noStroke();
    circle(mouseX, mouseY, 8);
    textSize(10);
    text("LEADER", mouseX + 10, mouseY);

    // NOUVEAU: Appliquer les poids des sliders à tous les boids
    updateBoidWeights();

    // NOUVEAU: Mettre à jour les leaders pour la file indienne
    updateGroupLeaders();

    updateUI();
}

function updateScore(team) {
    if (team === 'blue') scoreBlue++;
    else scoreRed++;
}

function updateUI() {
    let blueCountEl = document.getElementById('blueCount');
    let redCountEl = document.getElementById('redCount');

    if (blueCountEl) blueCountEl.innerText = flockBlue.length + " (Kills: " + scoreBlue + ")";
    if (redCountEl) redCountEl.innerText = flockRed.length + " (Kills: " + scoreRed + ")";
    if (blueCountEl) blueCountEl.style.color = "cyan";
    if (redCountEl) redCountEl.style.color = "orange";

    // Instructions UI (sous le panneau de score à gauche)
    push();
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);

    // Titre des commandes
    textSize(20);
    fill(200, 255, 200);
    text("🎮 COMMANDES :", 20, 150);

    // Liste des touches
    textSize(14);
    fill(255);
    let y = 185;
    let dy = 22;
    text("⌨️ [A] : Poser une Bombe 💣", 20, y); y += dy;
    text("⌨️ [B] : Poser un Piège ⭕", 20, y); y += dy;
    text("⌨️ [C] : Monstre + Focus Fire 👾", 20, y); y += dy;
    text("⌨️ [I] : Mode Queue Leu Leu 🐍", 20, y); y += dy;
    text("⌨️ [L] : Mode Suivi Leader 👤", 20, y); y += dy;
    text("⌨️ [W] : Ajouter un Wanderer 🎲", 20, y); y += dy;
    text("⌨️ [F] : Mode Autonome (Flocking) 🛸", 20, y); y += dy;
    text("⌨️ [M] : Revenir au Menu 🏠", 20, y); y += dy;

    text("🖱️ [CLIC] : Ajouter un avion ✈️", 20, y + 5);

    pop();
}


// NOUVEAU: Mode de groupe global
let currentGroupMode = 'flock';

function mousePressed() {
    // Menu Team Selection
    if (gameState === 'menu' && mainMenu) {
        let selected = mainMenu.checkClick();
        if (selected) {
            playerTeam = selected;
            initGame(); // Initialize the game for this run
            gameState = 'playing';
            console.log("Team selected:", playerTeam);
        }
        return;
    }

    // Check if game over screen replay button was clicked
    if (gameState === 'gameOver' && gameOverScreen && gameOverScreen.checkReplayClick()) {
        gameState = 'menu'; // Return to menu for team selection
        return;
    }

    // normal game click behavior
    if (gameState === 'playing') {
        // POINT 4: Apparition d'un ennemi au Shift+Clic
        if (keyIsPressed && keyCode === SHIFT) {
            let m = new Monster(mouseX, mouseY);
            monsters.push(m);
            // Tous les vaisseaux passent en mode 'focus' (Points 4 du TP)
            flockBlue.concat(flockRed).forEach(b => {
                b.behaviorMode = 'focus';
            });
            console.log("ENNEMI CRÉÉ (Point 4) + Arrêt collectif à:", mouseX, mouseY);
            return;
        }

        console.log("Mouse clicked at:", mouseX, mouseY);

        // RETOUR VERSION FINALE: Ajouter un boid au clic
        let team = (mouseX < width / 2) ? 'blue' : 'red';
        let img = (team === 'blue') ? blueShipImg : redShipImg;
        let b = new Boid(mouseX, mouseY, img, team);

        // Appliquer le mode actuel
        b.behaviorMode = currentGroupMode;
        if (currentGroupMode !== 'flock') {
            b.leader = (team === 'blue') ? mouseLeaderBlue : mouseLeaderRed;
        }

        if (team === 'blue') flockBlue.push(b);
        else flockRed.push(b);

        // NOUVEAU: Mettre à jour la chaîne
        updateGroupLeaders();
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
    // Appuyer sur 'A' pour créer un obstacle à la position de la souris
    if (key === 'a' || key === 'A') {
        obstacles.push(new Obstacle(mouseX, mouseY));
        console.log("Obstacle créé à:", mouseX, mouseY);
    }

    // Appuyer sur 'B' pour créer un piège à la position de la souris
    if (key === 'b' || key === 'B') {
        traps.push(new Trap(mouseX, mouseY));
        gameStats.recordTrap();
        console.log("Piège créé à:", mouseX, mouseY);
    }

    // Appuyer sur 'C' pour créer un monstre à la position de la souris + FOCUS FIRE
    if (key === 'c' || key === 'C') {
        let m = new Monster(mouseX, mouseY);
        monsters.push(m);

        // Tous les vaisseaux passent en mode 'focus' (Point 4 du TP)
        flockBlue.concat(flockRed).forEach(b => {
            b.behaviorMode = 'focus';
        });

        console.log("Monstre créé + Focus Fire à:", mouseX, mouseY);
    }





    // Appuyer sur 'W' pour ajouter un wanderer (Point 3 du TP)
    if (key === 'w' || key === 'W') {
        let team = (mouseX < width / 2) ? 'blue' : 'red';
        let b = new Boid(mouseX, mouseY, (team === 'blue' ? blueShipImg : redShipImg), team);
        b.behaviorMode = 'wander';
        if (team === 'blue') flockBlue.push(b);
        else flockRed.push(b);
        console.log("Wanderer ajouté à:", mouseX, mouseY);
    }

    // Appuyer sur 'M' pour revenir au menu
    if (key === 'm' || key === 'M') {
        gameState = 'menu';
    }


    // NOUVEAU: Changement de mode de groupe
    if (key === 'i' || key === 'I') {
        console.log("Mode: Queue Leu Leu (File indienne)");
        currentGroupMode = 'queue';
        updateGroupLeaders(); // Reconstruire la chaîne immédiatement
    }
    if (key === 'l' || key === 'L') {
        console.log("Mode: Leader Follow");
        currentGroupMode = 'leaderFollow';
        flockBlue.forEach(b => { b.behaviorMode = 'leaderFollow'; b.leader = mouseLeaderBlue; });
        flockRed.forEach(b => { b.behaviorMode = 'leaderFollow'; b.leader = mouseLeaderRed; });
    }
    if (key === 'f' || key === 'F') { // Retour au flocking standard
        console.log("Mode: Flocking (Autonome)");
        currentGroupMode = 'flock';
        flockBlue.forEach(b => {
            b.behaviorMode = 'flock';
            b.leader = null; // Libérer le leader
        });
        flockRed.forEach(b => {
            b.behaviorMode = 'flock';
            b.leader = null;
        });
    }
}



// NOUVEAU: Helpers pour les sliders
function createSliders() {
    let x = width - 200;
    let y = height - 150; // Ajusté pour 4 sliders

    sliderSeparation = createP('Séparation').position(x, y);
    sliderSeparation.style('color', 'white');
    sliderSeparation = createSlider(0, 10, 2, 0.1).position(x, y + 20);

    sliderCohesion = createP('Cohésion').position(x, y + 30);
    sliderCohesion.style('color', 'white');
    sliderCohesion = createSlider(0, 10, 1, 0.1).position(x, y + 50);

    sliderAlignment = createP('Alignement').position(x, y + 60);
    sliderAlignment.style('color', 'white');
    sliderAlignment = createSlider(0, 10, 1.5, 0.1).position(x, y + 80);

    // POINT 1: Slider pour l'évasion du leader
    sliderEvasion = createP('Cercle Évasion').position(x, y + 90);
    sliderEvasion.style('color', 'white');
    sliderEvasion = createSlider(20, 150, 50, 5).position(x, y + 110);
}


function updateBoidWeights() {
    // Sécurité: vérifier que les sliders existent
    if (!sliderSeparation || !sliderCohesion || !sliderAlignment) return;

    let s = sliderSeparation.value();

    let c = sliderCohesion.value();
    let a = sliderAlignment.value();
    let e = sliderEvasion.value(); // Valeur du cercle d'évasion (Point 1)

    flockBlue.concat(flockRed).forEach(b => {
        b.separationWeight = s;
        b.cohesionWeight = c;
        b.alignWeight = a;
        b.evasionRadius = e; // On passe le rayon au boid
    });
}


// NOUVEAU: Gestion dynamique des leaders pour la file indienne (TP Point 2)
function updateGroupLeaders() {
    // Équipe Bleue
    for (let i = 0; i < flockBlue.length; i++) {
        let b = flockBlue[i];
        if (b.behaviorMode === 'wander') continue; // POINT 3: Ne pas toucher aux wanderers

        if (currentGroupMode === 'queue') {
            b.behaviorMode = 'queue';
            b.leader = (i === 0) ? mouseLeaderBlue : flockBlue[i - 1];
        } else if (currentGroupMode === 'leaderFollow') {
            b.behaviorMode = 'leaderFollow';
            b.leader = mouseLeaderBlue;
        } else {
            b.behaviorMode = 'flock';
            b.leader = null;
        }
    }

    // Équipe Rouge
    for (let i = 0; i < flockRed.length; i++) {
        let b = flockRed[i];
        if (b.behaviorMode === 'wander') continue; // POINT 3: Ne pas toucher aux wanderers

        if (currentGroupMode === 'queue') {
            b.behaviorMode = 'queue';
            b.leader = (i === 0) ? mouseLeaderRed : flockRed[i - 1];
        } else if (currentGroupMode === 'leaderFollow') {
            b.behaviorMode = 'leaderFollow';
            b.leader = mouseLeaderRed;
        } else {
            b.behaviorMode = 'flock';
            b.leader = null;
        }
    }
}





