class Explosion {
    constructor(x, y, color) {
        this.pos = createVector(x, y);
        this.particles = [];
        this.color = color;

        // Créer 20 particules
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(this.pos.x, this.pos.y, this.color));
        }
    }

    update() {
        for (let p of this.particles) {
            p.update();
        }
        // Supprimer particules mortes
        this.particles = this.particles.filter(p => !p.finished());
    }

    show() {
        for (let p of this.particles) {
            p.show();
        }
    }

    finished() {
        return this.particles.length === 0;
    }
}

class Particle {
    constructor(x, y, col) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(1, 5));
        this.alpha = 255;
        this.color = col;
    }

    update() {
        this.pos.add(this.vel);
        this.alpha -= 10; // Fade out rapid
    }

    finished() {
        return this.alpha < 0;
    }

    show() {
        noStroke();
        fill(imgValues(this.color, this.alpha));
        ellipse(this.pos.x, this.pos.y, 4);
    }
}

function imgValues(col, alpha) {
    // Helper pour gérer string color + alpha
    let c = color(col);
    return color(red(c), green(c), blue(c), alpha);
}
