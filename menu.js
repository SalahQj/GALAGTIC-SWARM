class MainMenu {
    constructor() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: random(width),
                y: random(height),
                size: random(1, 3),
                speed: random(0.5, 2)
            });
        }
    }

    show() {
        background(5, 5, 20);

        // Stars moving
        fill(255);
        noStroke();
        for (let s of this.stars) {
            ellipse(s.x, s.y, s.size);
            s.y += s.speed;
            if (s.y > height) s.y = 0;
        }

        // Title
        push();
        textAlign(CENTER, CENTER);
        textSize(80);
        let glow = sin(frameCount * 0.1) * 20 + 20;
        fill(100, 200, 255, 150 + glow);
        text('GALACTIC SWARM v1.2', width / 2 + 2, height / 4 + 2);
        fill(255);
        text('GALACTIC SWARM v1.2', width / 2, height / 4);

        textSize(24);
        fill(200);
        text('CHOISISSEZ VOTRE ÉQUIPE POUR COMMENCER', width / 2, height / 3 + 30);
        pop();

        // Buttons
        this.drawTeamButton(width / 2 - 200, height / 2, 300, 150, 'ÉQUIPE BLEUE', color(0, 100, 255), 'blue');
        this.drawTeamButton(width / 2 + 200, height / 2, 300, 150, 'ÉQUIPE ROUGE', color(255, 50, 0), 'red');
    }

    drawTeamButton(x, y, w, h, label, col, team) {
        let isHover = mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y - h / 2 && mouseY < y + h / 2;

        push();
        rectMode(CENTER);
        if (isHover) {
            fill(col.levels[0], col.levels[1], col.levels[2], 200);
            stroke(255);
            strokeWeight(4);
            cursor(HAND);
        } else {
            fill(col.levels[0], col.levels[1], col.levels[2], 100);
            stroke(col);
            strokeWeight(2);
        }

        rect(x, y, w, h, 20);

        textAlign(CENTER, CENTER);
        textSize(32);
        fill(255);
        noStroke();
        text(label, x, y);

        textSize(16);
        fill(200);
        text(team === 'blue' ? '(Attaque à gauche)' : '(Attaque à droite)', x, y + 40);
        pop();
    }

    checkClick() {
        // Blue button
        if (mouseX > width / 2 - 350 && mouseX < width / 2 - 50 && mouseY > height / 2 - 75 && mouseY < height / 2 + 75) {
            return 'blue';
        }
        // Red button
        if (mouseX > width / 2 + 50 && mouseX < width / 2 + 350 && mouseY > height / 2 - 75 && mouseY < height / 2 + 75) {
            return 'red';
        }
        return null;
    }
}
