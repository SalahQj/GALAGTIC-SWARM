class Obstacle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.r = 30; // Rayon de l'obstacle
        this.health = 100; // Points de vie
        this.maxHealth = 100;
        this.destroyed = false;

        // Timer pour explosion automatique (5 secondes = 300 frames à 60fps)
        this.timer = 300;
        this.maxTimer = 300;
        this.explosionRadius = 80; // Rayon des dégâts d'explosion
        this.explosionDamage = 50; // Dégâts infligés
        this.statRecorded = false; // Pour éviter double comptage
    }

    update(flockBlue, flockRed) {
        // Décrémenter le timer
        this.timer--;

        // Si le timer atteint 0, explosion automatique
        if (this.timer <= 0) {
            this.explode(flockBlue, flockRed);
        }
    }

    explode(flockBlue, flockRed) {
        this.destroyed = true;

        // Créer une grosse explosion visuelle
        for (let i = 0; i < 30; i++) {
            explosions.push(new Explosion(this.pos.x, this.pos.y, color(255, 100, 0)));
        }

        // Infliger des dégâts aux vaisseaux proches
        this.damageNearbyBoids(flockBlue);
        this.damageNearbyBoids(flockRed);
    }

    damageNearbyBoids(flock) {
        for (let boid of flock) {
            let d = dist(this.pos.x, this.pos.y, boid.pos.x, boid.pos.y);
            if (d < this.explosionRadius) {
                // Dégâts proportionnels à la distance (plus proche = plus de dégâts)
                let damage = map(d, 0, this.explosionRadius, this.explosionDamage, 10);
                boid.hit(damage);

                // Effet visuel sur le vaisseau touché
                for (let i = 0; i < 5; i++) {
                    explosions.push(new Explosion(boid.pos.x, boid.pos.y, color(255, 150, 0)));
                }
            }
        }
    }

    hit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroyed = true;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        // Couleur qui change selon le timer (rouge quand proche de l'explosion)
        let dangerLevel = map(this.timer, 0, this.maxTimer, 255, 100);
        let pulseSpeed = map(this.timer, 0, this.maxTimer, 20, 5);
        let pulse = sin(frameCount / pulseSpeed) * 20;

        fill(255 - dangerLevel, dangerLevel, 0);
        stroke(255, 200, 0);
        strokeWeight(2);

        // Forme irrégulière pour simuler un astéroïde qui pulse
        beginShape();
        for (let i = 0; i < 8; i++) {
            let angle = (TWO_PI / 8) * i;
            let pulseFactor = 1 + (pulse * (1 - this.timer / this.maxTimer) / this.r);
            let offset = this.r * pulseFactor * random(0.9, 1.1);
            let x = cos(angle) * offset;
            let y = sin(angle) * offset;
            vertex(x, y);
        }
        endShape(CLOSE);

        // Barre de vie
        if (this.health < this.maxHealth) {
            let barWidth = this.r * 2;
            let barHeight = 5;
            fill(255, 0, 0);
            noStroke();
            rect(-barWidth / 2, -this.r - 15, barWidth, barHeight);
            fill(0, 255, 0);
            rect(-barWidth / 2, -this.r - 15, (this.health / this.maxHealth) * barWidth, barHeight);
        }

        // Barre de timer (compte à rebours)
        let timerBarWidth = this.r * 2;
        let timerBarHeight = 4;
        fill(50, 50, 50);
        noStroke();
        rect(-timerBarWidth / 2, this.r + 10, timerBarWidth, timerBarHeight);
        fill(255, 100, 0);
        rect(-timerBarWidth / 2, this.r + 10, (this.timer / this.maxTimer) * timerBarWidth, timerBarHeight);

        // Afficher le temps restant
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(ceil(this.timer / 60) + "s", 0, this.r + 25);

        // Cercle de danger (zone d'explosion) quand proche de l'explosion
        if (this.timer < 120) { // 2 dernières secondes
            noFill();
            stroke(255, 0, 0, 100 + sin(frameCount * 0.2) * 50);
            strokeWeight(2);
            circle(0, 0, this.explosionRadius * 2);
        }

        pop();
    }

    // Vérifier collision avec une balle
    checkBulletCollision(bullet) {
        let d = dist(this.pos.x, this.pos.y, bullet.pos.x, bullet.pos.y);
        return d < this.r + 2; // 2 est le rayon approximatif de la balle
    }
}
