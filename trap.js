class Trap {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.r = 100; // Rayon du piège
        this.active = true;
        this.duration = 600; // 10 secondes (600 frames à 60fps)
        this.maxDuration = 600;
        this.strength = 0.8; // Force de la barrière
    }

    update() {
        this.duration--;
        if (this.duration <= 0) {
            this.active = false;
        }
    }

    // Applique une force de barrière bidirectionnelle
    confine(boid) {
        let d = dist(this.pos.x, this.pos.y, boid.pos.x, boid.pos.y);

        // Zone de barrière autour du cercle (épaisseur de la "paroi")
        let barrierThickness = 35;
        let innerEdge = this.r - barrierThickness;
        let outerEdge = this.r + barrierThickness;

        // Si le boid est dans la zone de barrière
        if (d > innerEdge && d < outerEdge) {
            // Vecteur du centre vers le boid
            let fromCenter = p5.Vector.sub(boid.pos, this.pos);
            fromCenter.normalize();

            // Si le boid est à l'INTÉRIEUR (d < r), on le repousse vers le centre
            if (d < this.r) {
                let distanceFromInnerEdge = this.r - d;
                let forceMagnitude = map(distanceFromInnerEdge, barrierThickness, 0, 0, this.strength);
                fromCenter.mult(-forceMagnitude); // Force vers le centre (négatif)
                return fromCenter;
            }
            // Si le boid est à l'EXTÉRIEUR (d >= r), on le repousse vers l'extérieur
            else {
                let distanceFromOuterEdge = d - this.r;
                let forceMagnitude = map(distanceFromOuterEdge, 0, barrierThickness, this.strength, 0);
                fromCenter.mult(forceMagnitude); // Force vers l'extérieur (positif)
                return fromCenter;
            }
        }

        return createVector(0, 0);
    }

    // Vérifie si un boid est à l'intérieur du cercle
    contains(boid) {
        let d = dist(this.pos.x, this.pos.y, boid.pos.x, boid.pos.y);
        return d < this.r;
    }

    // Vérifie si une balle touche la barrière
    checkBulletCollision(bullet) {
        let d = dist(this.pos.x, this.pos.y, bullet.pos.x, bullet.pos.y);
        // Si la balle traverse la ligne de la barrière (rayon r)
        // On détruit la balle si elle s'en approche trop
        return abs(d - this.r) < 5;
    }

    show() {
        push();

        // Cercle principal du piège (la barrière)
        noFill();

        // Couleur qui pulse selon le temps restant
        let alpha = map(this.duration, 0, this.maxDuration, 50, 180);
        let pulse = sin(frameCount * 0.1) * 20;

        // Barrière principale (plus épaisse)
        stroke(255, 0, 255, alpha + pulse);
        strokeWeight(6);
        circle(this.pos.x, this.pos.y, this.r * 2);

        // Cercles intérieur et extérieur (zone de barrière)
        stroke(255, 100, 255, alpha * 0.5);
        strokeWeight(2);
        circle(this.pos.x, this.pos.y, (this.r - 35) * 2);
        circle(this.pos.x, this.pos.y, (this.r + 35) * 2);

        // Lignes radiales pour effet de cage qui tournent
        stroke(255, 0, 255, alpha * 0.4);
        strokeWeight(2);
        for (let i = 0; i < 16; i++) {
            let angle = (TWO_PI / 16) * i + frameCount * 0.02;
            let x1 = this.pos.x + cos(angle) * (this.r - 35);
            let y1 = this.pos.y + sin(angle) * (this.r - 35);
            let x2 = this.pos.x + cos(angle) * (this.r + 35);
            let y2 = this.pos.y + sin(angle) * (this.r + 35);
            line(x1, y1, x2, y2);
        }

        // Centre du piège
        fill(255, 0, 255, alpha);
        noStroke();
        circle(this.pos.x, this.pos.y, 10);

        // Barre de durée
        let barWidth = this.r * 1.5;
        let barHeight = 6;
        fill(50, 50, 50);
        noStroke();
        rect(this.pos.x - barWidth / 2, this.pos.y - this.r - 20, barWidth, barHeight);
        fill(255, 0, 255);
        rect(this.pos.x - barWidth / 2, this.pos.y - this.r - 20, (this.duration / this.maxDuration) * barWidth, barHeight);

        // Temps restant
        fill(255, 0, 255);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(ceil(this.duration / 60) + "s", this.pos.x, this.pos.y - this.r - 35);

        // Texte "BARRIER"
        fill(255, 0, 255, alpha);
        textSize(10);
        text("BARRIER", this.pos.x, this.pos.y);

        pop();
    }
}
