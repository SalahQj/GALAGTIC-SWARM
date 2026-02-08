class Bullet {
    constructor(x, y, vel, team) {
        this.pos = createVector(x, y);
        this.vel = vel.copy();
        this.team = team;
        this.r = 4;
        this.toDelete = false;
        this.lifetime = 100; // Frames avant disparition auto
    }

    update(target) {
        // POINT 4: Les balles peuvent être des mini véhicules avec comportement SEEK (guidage)
        if (target && !target.isDead) {
            let desired = p5.Vector.sub(target.pos, this.pos);
            desired.setMag(15); // Vitesse des balles guidées
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(0.5); // Capacité de virage limitée
            this.vel.add(steer);
        }

        this.pos.add(this.vel);
        this.lifetime--;
        if (this.lifetime < 0) {
            this.toDelete = true;
        }

        // Bordures
        if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
            this.toDelete = true;
        }
    }

    show() {
        push();
        stroke(this.team === 'blue' ? 'cyan' : 'orange');
        strokeWeight(2);
        fill(this.team === 'blue' ? 'white' : 'yellow');

        // Effet de trait lumineux
        line(this.pos.x, this.pos.y, this.pos.x - this.vel.x, this.pos.y - this.vel.y);

        pop();
    }

    checkCollision(target) {
        let d = this.pos.dist(target.pos);
        if (d < target.r + this.r) {
            this.toDelete = true;
            return true;
        }
        return false;
    }
}
