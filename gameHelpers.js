function checkVictoryConditions() {
    let blueAlive = flockBlue.length > 0;
    let redAlive = flockRed.length > 0;

    if (!blueAlive && !redAlive) {
        triggerGameOver('draw');
    } else if (!blueAlive) {
        triggerGameOver('red');
    } else if (!redAlive) {
        triggerGameOver('blue');
    }
}

function triggerGameOver(winner) {
    gameStats.stop(); // Figer le chronomètre
    gameState = 'gameOver';
    gameOverScreen = new GameOverScreen(winner, gameStats);
}

function showGameElements() {
    // Show game elements in background (frozen state)
    for (let b of flockBlue) b.show();
    for (let b of flockRed) b.show();
    for (let bullet of bullets) bullet.show();
    for (let obs of obstacles) obs.show();
    for (let trap of traps) trap.show();
    for (let m of monsters) m.show();
    for (let exp of explosions) {
        exp.update();
        exp.show();
    }
}
