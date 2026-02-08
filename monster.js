class Monster {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.vel.setMag(2);
        this.acc = createVector();
        this.maxSpeed = 3;
        this.maxForce = 0.15;
        this.r = 40;
        this.health = 500;
        this.maxHealth = 500;
        this.isDead = false;
        this.shootCooldown = 0;
        this.statRecorded = false;
    }

    update(flockBlue, flockRed, bullets) {
        // Cible l'avion le plus proche (n'importe quelle équipe)
        let target = this.findNearestTarget(flockBlue, flockRed);

        if (target) {
            let force = this.seek(target.pos);
            this.applyForce(force);

            // Tirer sur la cible
            if (this.shootCooldown <= 0 && dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y) < 400) {
                this.shoot(target, bullets);
                this.shootCooldown = 60;
            }
        } else {
            // Mode errance si pas de cible
            let wanderForce = p5.Vector.random2D();
            wanderForce.setMag(0.1);
            this.applyForce(wanderForce);
        }

        // --- DÉGÂTS DE CONTACT ---
        this.checkContactDamage(flockBlue);
        this.checkContactDamage(flockRed);

        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        if (this.shootCooldown > 0) this.shootCooldown--;

        // Edges
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.y > height) this.pos.y = 0;
    }

    checkContactDamage(flock) {
        for (let boid of flock) {
            let d = dist(this.pos.x, this.pos.y, boid.pos.x, boid.pos.y);
            if (d < this.r + boid.r) {
                boid.hit(1); // Dégâts de contact
                if (frameCount % 10 == 0) {
                    explosions.push(new Explosion(boid.pos.x, boid.pos.y, color(255, 100, 0)));
                }
            }
        }
    }

    findNearestTarget(flockBlue, flockRed) {
        let nearest = null;
        let minDist = Infinity;

        for (let boid of flockBlue) {
            let d = dist(this.pos.x, this.pos.y, boid.pos.x, boid.pos.y);
            if (d < minDist) {
                minDist = d;
                nearest = boid;
            }
        }

        for (let boid of flockRed) {
            let d = dist(this.pos.x, this.pos.y, boid.pos.x, boid.pos.y);
            if (d < minDist) {
                minDist = d;
                nearest = boid;
            }
        }

        return nearest;
    }

    seek(targetPos) {
        let desired = p5.Vector.sub(targetPos, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    shoot(target, bullets) {
        let bulletVel = p5.Vector.sub(target.pos, this.pos);
        bulletVel.setMag(10);
        bullets.push(new Bullet(this.pos.x, this.pos.y, bulletVel, 'monster'));
    }

    hit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.isDead = true;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        // Halo d'énergie maléfique
        noStroke();
        for (let i = 4; i > 0; i--) {
            fill(120, 0, 200, 20);
            ellipse(0, 0, this.r * 2 + i * 12 + sin(frameCount * 0.1) * 8);
        }

        // Corps du monstre (forme organique mouvante)
        fill(40, 0, 80);
        stroke(200, 0, 255);
        strokeWeight(3);

        beginShape();
        for (let i = 0; i < 12; i++) {
            let angle = map(i, 0, 12, 0, TWO_PI);
            let noiseVal = noise(i, frameCount * 0.05);
            let r = this.r + map(noiseVal, 0, 1, -10, 20);
            let x = r * cos(angle);
            let y = r * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);

        // Yeux - Plus agressifs
        fill(255);
        noStroke();
        // Oeil gauche
        ellipse(-12, -8, 14, 14);
        fill(255, 0, 0);
        ellipse(-12, -8, 6, 6);
        // Oeil droit
        fill(255);
        ellipse(12, -8, 14, 14);
        fill(255, 0, 0);
        ellipse(12, -8, 6, 6);
        // Oeil central (petit)
        fill(255, 255, 0);
        ellipse(0, -15, 8, 8);

        // Bouche avec "dents"
        stroke(255, 0, 0);
        strokeWeight(2);
        fill(20, 0, 0);
        ellipse(0, 15, 24, 12 + sin(frameCount * 0.2) * 4);

        // Barre de vie
        noStroke();
        fill(80);
        rect(-this.r, -this.r - 25, this.r * 2, 6, 3);
        let hColor = lerpColor(color(255, 0, 0), color(0, 255, 0), this.health / this.maxHealth);
        fill(hColor);
        rect(-this.r, -this.r - 25, (this.health / this.maxHealth) * this.r * 2, 6, 3);

        pop();
    }
}
