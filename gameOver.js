class GameOverScreen {
    constructor(winner, stats) {
        this.winner = winner; // 'blue', 'red', 'draw'
        this.stats = stats;
        this.alpha = 0;
        this.particles = [];
        this.animationProgress = 0;
        this.showReplayButton = false;
        this.cardsY = height + 100;
        this.cardsTargetY = height / 2 + 50;

        // Créer des particules de célébration/défaite
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: random(width),
                y: random(height),
                vx: random(-1, 1),
                vy: random(0.5, 2),
                size: random(2, 5),
                color: this.winner === 'blue' ? color(0, 150, 255, 150) :
                    this.winner === 'red' ? color(255, 100, 0, 150) :
                        color(200, 200, 200, 100)
            });
        }
    }

    update() {
        if (this.alpha < 220) this.alpha += 4;
        if (this.animationProgress < 1) this.animationProgress += 0.012;
        this.cardsY = lerp(this.cardsY, this.cardsTargetY, 0.05);

        for (let p of this.particles) {
            p.y += p.vy;
            p.x += p.vx;
            if (p.y > height) p.y = -10;
            if (p.x > width) p.x = 0;
            if (p.x < 0) p.x = width;
        }

        if (this.animationProgress > 0.85 && !this.showReplayButton) {
            this.showReplayButton = true;
        }
    }

    show() {
        push();
        fill(5, 5, 15, this.alpha);
        noStroke();
        rect(0, 0, width, height);
        pop();

        for (let p of this.particles) {
            push();
            fill(p.color);
            noStroke();
            ellipse(p.x, p.y, p.size);
            pop();
        }

        if (this.alpha < 80) return;

        this.drawTitle();

        if (this.animationProgress > 0.4) {
            this.drawStatsCards();
        }

        if (this.showReplayButton) {
            this.drawReplayButton();
        }
    }

    drawTitle() {
        push();
        textAlign(CENTER, CENTER);
        let isVictory = (this.winner === playerTeam);
        let titleText = isVictory ? 'FÉLICITATIONS !' : (this.winner === 'draw' ? 'MATCH TERMINÉ' : 'DOMMAGE...');
        let subtitle = isVictory ? "Votre équipe a sécurisé le secteur." : (this.winner === 'draw' ? "Aucun survivant dans la zone." : "La zone est tombée aux mains de l'ennemi.");

        textSize(80 * min(1, this.animationProgress * 1.8));
        let titleColor = isVictory ? color(0, 255, 150) : (this.winner === 'draw' ? color(255) : color(255, 50, 50));

        fill(0, 150);
        text(titleText, width / 2 + 5, height / 6 + 5);
        fill(titleColor);
        stroke(0);
        strokeWeight(4);
        text(titleText, width / 2, height / 6);

        noStroke();
        fill(200, 200, 200, this.alpha);
        textSize(24);
        text(subtitle, width / 2, height / 6 + 75);
        pop();
    }

    drawStatsCards() {
        let cardW = 320;
        let cardH = 340; // Légèrement plus haut
        let spacing = 60;
        this.drawCard(width / 2 - cardW - spacing, this.cardsY, cardW, cardH, 'BLUE TEAM', color(0, 100, 255), 'blue');
        this.drawGlobalCard(width / 2, this.cardsY, 300, cardH);
        this.drawCard(width / 2 + cardW + spacing, this.cardsY, cardW, cardH, 'RED TEAM', color(255, 50, 0), 'red');
    }

    drawCard(x, y, w, h, title, themeColor, team) {
        push();
        rectMode(CENTER);
        fill(20, 20, 35, 200);
        stroke(themeColor.levels[0], themeColor.levels[1], themeColor.levels[2], 120);
        strokeWeight(2);
        rect(x, y, w, h, 15);

        fill(themeColor.levels[0], themeColor.levels[1], themeColor.levels[2], 40);
        noStroke();
        rect(x, y - h / 2 + 30, w, 60, 15, 15, 0, 0);

        textAlign(CENTER, CENTER);
        fill(themeColor);
        strokeWeight(1);
        stroke(0);
        textSize(22);
        text(title, x, y - h / 2 + 30);

        noStroke();
        fill(255);
        textAlign(LEFT, CENTER);
        textSize(18);
        let startY = y - 40;
        let kills = team === 'blue' ? this.stats.blueKills : this.stats.redKills;
        let deaths = team === 'blue' ? this.stats.blueDeaths : this.stats.redDeaths;
        let accuracy = this.stats.getAccuracy(team);

        text(`🎯 Kills : ${kills}`, x - w / 2 + 30, startY);
        text(`💀 Pertes : ${deaths}`, x - w / 2 + 30, startY + 45);
        text(`📈 Précision : ${accuracy}%`, x - w / 2 + 30, startY + 90);

        if (this.winner !== 'draw') {
            fill(this.winner === team ? color(0, 255, 100) : color(255, 50, 50));
            textSize(18);
            textAlign(CENTER, CENTER);
            text(this.winner === team ? "★ VICTOIRE ★" : "ÉCHEC", x, y + h / 2 - 35);
        }
        pop();
    }

    drawGlobalCard(x, y, w, h) {
        push();
        rectMode(CENTER);
        fill(30, 30, 45, 220);
        stroke(255, 200, 0, 150);
        strokeWeight(2);
        rect(x, y, w, h, 15);

        fill(255, 200, 0, 30);
        noStroke();
        rect(x, y - h / 2 + 30, w, 60, 15, 15, 0, 0);

        textAlign(CENTER, CENTER);
        fill(255, 200, 0);
        textSize(22);
        text('MISSION LOG', x, y - h / 2 + 30);

        noStroke();
        fill(255);
        textSize(18);
        text(`DUREE D'OPÉRATION`, x, y - 50);
        textSize(42);
        fill(255, 255, 100);
        text(this.stats.getFormattedTime(), x, y);

        textAlign(LEFT, CENTER);
        textSize(16);
        fill(220);
        text(`👾 Monstres éliminés : ${this.stats.monstersKilled}`, x - w / 2 + 30, y + 60);
        text(`💣 Bombes activées   : ${this.stats.bombsExploded}`, x - w / 2 + 30, y + 85);
        text(`⭕ Cercles déployés  : ${this.stats.trapsCreated}`, x - w / 2 + 30, y + 110);
        pop();
    }

    drawReplayButton() {
        let btnX = width / 2;
        let btnY = height - 80;
        let btnW = 260;
        let btnH = 55;
        let isHover = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;
        push();
        rectMode(CENTER);
        fill(isHover ? color(100, 255, 150) : color(50, 200, 100));
        stroke(255, isHover ? 255 : 150);
        strokeWeight(isHover ? 3 : 1);
        rect(btnX, btnY, isHover ? btnW + 10 : btnW, btnH, 30);
        textAlign(CENTER, CENTER);
        fill(0);
        noStroke();
        textSize(22);
        text('NOUVELLE MISSION', btnX, btnY);
        pop();
    }

    checkReplayClick() {
        if (!this.showReplayButton) return false;
        let btnX = width / 2;
        let btnY = height - 80;
        let btnW = 260;
        let btnH = 55;
        return mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;
    }
}
