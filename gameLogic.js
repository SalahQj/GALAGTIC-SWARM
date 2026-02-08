// Victory conditions and game element rendering functions

function checkVictoryConditions() {
    let blueAlive = flockBlue.length > 0;
    let redAlive = flockRed.length > 0;

    if (!blueAlive && !redAlive) {
        // Match nul
        triggerGameOver('draw');
    } else if (!blueAlive) {
        // Rouge gagne
        triggerGameOver('red');
    } else if (!redAlive) {
        // Bleu gagne
        triggerGameOver('blue');
    }
}

function triggerGameOver(winner) {
    gameState = 'gameOver';
    gameOverScreen = new GameOverScreen(winner, gameStats);
}

function showGameElements() {
    // Continue showing game elements in background (frozen state)

    // Boids
    for (let b of flockBlue) {
        b.show();
    }
    for (let b of flockRed) {
        b.show();
    }

    // Bullets
    for (let bullet of bullets) {
        bullet.show();
    }

    // Obstacles
    for (let obs of obstacles) {
        obs.show();
    }

    // Traps
    for (let trap of traps) {
        trap.show();
    }

    // Monsters
    for (let m of monsters) {
        m.show();
    }

    // Explosions
    for (let exp of explosions) {
        exp.update();
        exp.show();
    }
}

function mousePressed() {
    // Check if game over screen replay button was clicked
    if (gameState === 'gameOver' && gameOverScreen && gameOverScreen.checkReplayClick()) {
        initGame();
        return;
    }

    // Normal game click behavior
    if (gameState === 'playing') {
        console.log("Mouse clicked at:", mouseX, mouseY);
        // Add reinforcements on click
        let team = (mouseX < width / 2) ? 'blue' : 'red';
        let img = (team === 'blue') ? blueShipImg : redShipImg;
        let b = new Boid(mouseX, mouseY, img, team);
        if (team === 'blue') flockBlue.push(b);
        else flockRed.push(b);
    }
}
