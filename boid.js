class Boid extends Vehicle {
    static debug = false;

    constructor(x, y, image, team) {
        super(x, y); // Appel du constructeur de Vehicle

        // --- RESTAURATION DES PARAMÈTRES BOID ORIGINAUX ---
        this.maxSpeed = 5;
        this.maxForce = 0.2;
        this.r = 16;
        // --------------------------------------------------

        // Team: 'blue' or 'red'
        this.team = team || 'blue';
        this.health = 100;
        this.isDead = false;

        // Image handling: Normalisation de la taille (max 35px)
        if (image && image.width > 0) {
            this.image = image;
            const li = this.image.width;
            const hi = this.image.height;
            const ratio = li / hi;

            const maxDim = 35;
            if (li > hi) {
                this.imageL = maxDim;
                this.imageH = maxDim / ratio;
            } else {
                this.imageH = maxDim;
                this.imageL = maxDim * ratio;
            }
        }

        this.perceptionRadius = 50;

        // Poids comportementaux spécifiques au projet
        this.alignWeight = 1.5;
        this.cohesionWeight = 1;
        this.separationWeight = 2;
        this.boundariesWeight = 10;
        this.seekWeight = 2.5;

        // Paramètres boundaries (peuvent écraser ceux de Vehicle)
        this.boundariesX = 0;
        this.boundariesY = 0;
        this.boundariesWidth = width;
        this.boundariesHeight = height;
        this.boundariesDistance = 25;

        // Configuration Wander (Override Reynolds)
        this.distanceCercle = 150;
        this.wanderRadius = 50;
        this.wanderTheta = 0;
        this.displaceRange = 0.1;

        this.behaviorMode = 'flock';
        this.leader = null;
        this.shootCooldown = 0;
        this.evasionRadius = 50;
        this.trail = [];
        this.maxTrailLength = 10;
    }

    // Changement de nom pour respecter Reynold's Model (Architecture Rules)
    applyBehaviors(boids, enemies, bullets, obstacles, traps, monsters) {

        // 1. Flocking classique (amis)
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        // POINT 3: Les Wanderers ignorent l'alignement et la cohésion du groupe
        if (this.behaviorMode === 'wander') {
            alignment.mult(0);
            cohesion.mult(0);
        }

        let boundaries = this.boundaries(this.boundariesX, this.boundariesY, this.boundariesWidth, this.boundariesHeight, this.boundariesDistance);


        // 2. Évitement d'obstacles
        let avoidForce = this.avoid(obstacles);

        // 3. Confinement dans les pièges
        let trapForce = createVector(0, 0);
        if (traps) {
            for (let trap of traps) {
                // Appliquer la force à TOUS les boids proches de la barrière
                let d = dist(this.pos.x, this.pos.y, trap.pos.x, trap.pos.y);
                let barrierRange = trap.r + 35; // Zone d'influence

                if (d < barrierRange) {
                    trapForce.add(trap.confine(this));
                }
            }
        }

        alignment.mult(this.alignWeight);
        cohesion.mult(this.cohesionWeight);
        separation.mult(this.separationWeight);
        boundaries.mult(this.boundariesWeight);
        avoidForce.mult(5); // Poids élevé pour éviter les obstacles
        trapForce.mult(15); // Force TRÈS élevée pour le confinement

        // 4. Fuite devant les monstres et les bombes
        let fearForce = createVector(0, 0);
        let isTerrified = false;

        // Fuite monstres
        if (monsters) {
            for (let monster of monsters) {
                let d = dist(this.pos.x, this.pos.y, monster.pos.x, monster.pos.y);
                if (d < 250) {
                    let flee = this.flee(monster.pos);
                    flee.mult(map(d, 0, 250, 10, 0));
                    fearForce.add(flee);
                    isTerrified = true;
                }
            }
        }

        // Fuite bombes (obstacles sur le point d'exploser)
        if (obstacles) {
            for (let o of obstacles) {
                let d = dist(this.pos.x, this.pos.y, o.pos.x, o.pos.y);
                // On s'inquiète dès que la bombe apparaît (timer < 250)
                // Zone de fuite étendue (rayon explosion + marge de sécurité)
                let dangerZone = o.explosionRadius + 120;
                if (o.timer < 250 && d < dangerZone) {
                    let flee = this.flee(o.pos);
                    // Force TRÈS élevée pour s'échapper, augmente si le timer est bas
                    let timerUrgency = map(o.timer, 0, 250, 3, 1);
                    flee.mult(map(d, 0, dangerZone, 25 * timerUrgency, 0));
                    fearForce.add(flee);
                    isTerrified = true;
                }
            }
        }

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
        this.applyForce(boundaries);
        this.applyForce(avoidForce);
        this.applyForce(trapForce);
        this.applyForce(fearForce);

        // NOUVEAU: Comportements spécifiques selon le mode
        if (this.behaviorMode === 'leaderFollow' && this.leader) {
            let followForce = this.leaderFollow(this.leader);
            this.applyForce(followForce);
        } else if (this.behaviorMode === 'queue' && this.leader) {
            let queueForce = this.queueLeuLeu(this.leader);
            this.applyForce(queueForce.mult(2.0));
        } else if (this.behaviorMode === 'wander') {

            let wanderForce = this.wander();
            this.applyForce(wanderForce);
        } else if (this.behaviorMode === 'focus' && enemies.length > 0) {
            // POINT 4: Mode "Focus Fire" : on s'arrête COMPLÈTEMENT (Point 4 du TP)
            this.vel.mult(0); // Arrêt complet
        }


        // 5. Comportement de combat
        // NOUVEAU: Pas de tirs lors des formations (Leader/Queue) pour focus sur la navigation
        if (this.behaviorMode !== 'leaderFollow' && this.behaviorMode !== 'queue') {
            if (!isTerrified) {
                this.updateCombat(enemies, bullets, monsters);
            } else {
                this.updateCombatSuppressed(enemies, bullets, monsters);
            }
        }




    }

    // Version "paniquée" du combat : on tire si possible mais on ne cherche pas l'affrontement
    updateCombatSuppressed(enemies, bullets, monsters) {
        let nearestEnemy = null;
        let minDist = Infinity;

        let allPotentialTargets = [...enemies];
        if (monsters) allPotentialTargets = allPotentialTargets.concat(monsters);

        for (let target of allPotentialTargets) {
            let d = this.pos.dist(target.pos);
            if (d < minDist && !target.isDead) {
                minDist = d;
                nearestEnemy = target;
            }
        }

        if (nearestEnemy && minDist < 200 && this.shootCooldown <= 0) {
            this.shoot(nearestEnemy, bullets);
            this.shootCooldown = 60;
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
    }

    updateCombat(enemies, bullets, monsters) {
        // Trouver l'ennemi le plus proche
        let nearestEnemy = null;
        let minDist = Infinity;

        for (let enemy of enemies) {
            let d = this.pos.dist(enemy.pos);
            if (d < minDist && !enemy.isDead) { // Vérifier que l'ennemi est vivant !
                minDist = d;
                nearestEnemy = enemy;
            }
        }

        // Vérifier aussi les monstres comme cibles potentielles si pas d'ennemis proches
        if (monsters) {
            for (let monster of monsters) {
                let d = this.pos.dist(monster.pos);
                if (d < minDist && !monster.isDead) {
                    minDist = d;
                    nearestEnemy = monster;
                }
            }
        }

        // Si on a une cible
        if (nearestEnemy) {
            // Si on est assez près, on tire !
            if (minDist < 200 && this.shootCooldown <= 0) {
                this.shoot(nearestEnemy, bullets);
                this.shootCooldown = 40 + random(20); // Cadence de tir aléatoire
            }

            // Si on est trop loin, on chasse (Seek)
            // Mais si on est trop près, on évite (Separation avec l'ennemi pour pas foncer dedans)
            if (minDist > 100) {
                let seekForce = this.seek(nearestEnemy.pos);
                seekForce.mult(this.seekWeight);
                this.applyForce(seekForce);
            } else {
                // Trop près ! On essaie de garder une distance de combat
                let fleeForce = this.flee(nearestEnemy.pos);
                fleeForce.mult(this.seekWeight);
                this.applyForce(fleeForce);
            }
        } else {
            // Pas d'ennemi ? On patrouille (Wander)
            let wanderForce = this.wander();
            wanderForce.mult(0.5);
            this.applyForce(wanderForce);
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
    }

    shoot(target, bullets) {
        // Créer une balle qui part de ma position vers la cible
        let bulletVel = p5.Vector.sub(target.pos, this.pos);
        bulletVel.setMag(15); // Augmentation de la vitesse des balles
        // Petit bruit sur la visée pour faire réaliste
        bulletVel.rotate(random(-0.1, 0.1));

        bullets.push(new Bullet(this.pos.x, this.pos.y, bulletVel, this.team));

        // Track bullet fired for stats
        if (typeof gameStats !== 'undefined' && gameStats) {
            gameStats.recordBulletFired(this.team);
        }
    }

    align(boids) {
        let perceptionRadius = this.perceptionRadius;
        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                steering.add(other.vel);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    separation(boids) {
        let perceptionRadius = this.perceptionRadius;
        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.div(d * d);
                steering.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = 2 * this.perceptionRadius;
        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                steering.add(other.pos);
                total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.pos);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    seek(target) {
        let vitesseSouhaitee = p5.Vector.sub(target, this.pos);
        vitesseSouhaitee.setMag(this.maxSpeed);
        let force = p5.Vector.sub(vitesseSouhaitee, this.vel);
        force.limit(this.maxForce);
        return force;
    }

    flee(target) {
        let force = this.seek(target).mult(-1);
        return force;
    }

    // NOUVEAU: Arrive (freinage à l'approche de la cible)
    arrive(target, distSlowing = 100) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if (d < distSlowing) {
            let speed = map(d, 0, distSlowing, 0, this.maxSpeed);
            desired.setMag(speed);
        } else {
            desired.setMag(this.maxSpeed);
        }
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    // NOUVEAU: Suivi de leader (Point 1 du TP)
    leaderFollow(leader) {
        // 1. Calculer le point derrière le leader
        let tv = leader.vel.copy();
        if (tv.mag() < 0.1) {
            tv = p5.Vector.fromAngle(0);
        }
        tv.mult(-30); // 30 pixels derrière
        let targetPoint = p5.Vector.add(leader.pos, tv);

        // 2. Se rendre au point derrière le leader
        let force = this.arrive(targetPoint, 50);

        // 3. Évitement si devant le leader (Cercle d'évasion VISIBLE)
        if (leader.vel.mag() > 0.1) {
            let ahead = leader.vel.copy().setMag(this.evasionRadius);
            let circleCenter = p5.Vector.add(leader.pos, ahead);

            // POINT 1: Dessiner le cercle d'évasion si on est en mode debug ou pour le TP
            push();
            noFill();
            stroke(255, 100, 100, 100);
            ellipse(circleCenter.x, circleCenter.y, this.evasionRadius * 2);
            pop();

            let d = p5.Vector.dist(this.pos, circleCenter);

            if (d < this.evasionRadius) { // Rayon dynamique du slider
                let fleeForce = this.flee(circleCenter);
                fleeForce.mult(4); // Priorité à l'évasion (Point 1)
                force.add(fleeForce);
            }
        }

        return force;
    }



    // NOUVEAU: Queue leu leu (Point 2 du TP)
    queueLeuLeu(leader) {
        let tv = leader.vel.copy();
        if (tv.mag() < 0.1) tv = p5.Vector.fromAngle(0);
        tv.setMag(40);
        let target = p5.Vector.sub(leader.pos, tv);
        return this.arrive(target, 40);
    }



    wander() {
        let centreCercleDevant = this.vel.copy();
        centreCercleDevant.setMag(this.distanceCercle);
        centreCercleDevant.add(this.pos);

        let wanderAngle = this.vel.heading() + this.wanderTheta;
        let pointSurCercle = createVector(this.wanderRadius * cos(wanderAngle), this.wanderRadius * sin(wanderAngle));
        pointSurCercle.add(centreCercleDevant);

        if (Boid.debug) {
            // Debug drawing... (omitted for clean game view usually, but kep logic)
        }

        let desiredSpeed = p5.Vector.sub(pointSurCercle, this.pos);
        let force = p5.Vector.sub(desiredSpeed, this.vel);
        force.setMag(this.maxForce);

        this.wanderTheta += random(-this.displaceRange, this.displaceRange);
        return force;
    }

    avoid(obstacles) {
        // Calcul d'un vecteur ahead devant le véhicule
        let ahead = this.vel.copy();
        ahead.mult(30); // Regarde 30 frames devant
        let ahead2 = ahead.copy();
        ahead2.mult(0.5); // Point à mi-distance

        // Calcul des coordonnées des points
        let pointAuBoutDeAhead = this.pos.copy().add(ahead);
        let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

        // Détection de l'obstacle le plus proche
        let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

        // Si pas d'obstacle, on renvoie un vecteur nul
        if (obstacleLePlusProche == undefined) {
            return createVector(0, 0);
        }

        // Distance entre les points et l'obstacle
        let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
        let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
        let distance = min(distance1, distance2);

        // Zone d'évitement devant le vaisseau
        let largeurZoneEvitement = this.r / 2;

        // Si collision possible
        if (distance < obstacleLePlusProche.r + largeurZoneEvitement) {
            // Calcul de la force d'évitement
            let force;
            if (distance1 < distance2) {
                force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
            } else {
                force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
            }

            // On limite ce vecteur à maxSpeed
            force.setMag(this.maxSpeed);
            // Force = vitesse désirée - vitesse courante
            force.sub(this.vel);
            // On limite à maxForce
            force.limit(this.maxForce);
            return force;
        } else {
            // Pas de collision possible
            return createVector(0, 0);
        }
    }

    getObstacleLePlusProche(obstacles) {
        let plusPetiteDistance = Infinity;
        let obstacleLePlusProche = undefined;

        for (let o of obstacles) {
            const distance = this.pos.dist(o.pos);
            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                obstacleLePlusProche = o;
            }
        }

        return obstacleLePlusProche;
    }

    boundaries(bx, by, bw, bh, d) {
        let vitesseDesiree = null;
        const xBordGauche = bx + d;
        const xBordDroite = bx + bw - d;
        const yBordHaut = by + d;
        const yBordBas = by + bh - d;

        if (this.pos.x < xBordGauche) {
            vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
        } else if (this.pos.x > xBordDroite) {
            vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
        }
        if (this.pos.y < yBordHaut) {
            vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
        } else if (this.pos.y > yBordBas) {
            vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
        }

        if (vitesseDesiree !== null) {
            vitesseDesiree.setMag(this.maxSpeed);
            // Correction: Boundaries should steer, not just snap velocity
            const force = p5.Vector.sub(vitesseDesiree, this.vel);
            force.limit(this.maxForce);
            return force;
        }
        return createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        // Enregistrer la position pour la traînée (seulement une fois sur deux pour perf)
        if (frameCount % 2 === 0) {
            this.trail.push(this.pos.copy());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        this.pos.add(this.vel);
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.acc.mult(0);
    }

    show() {
        // 0. Traînée (Trail)
        noFill();
        strokeWeight(2);
        for (let i = 0; i < this.trail.length; i++) {
            let p = this.trail[i];
            let alpha = map(i, 0, this.trail.length, 0, 100);
            let c = (this.team === 'blue') ? color(0, 200, 255, alpha) : color(255, 100, 0, alpha);
            stroke(c);
            let nextP = (i < this.trail.length - 1) ? this.trail[i + 1] : this.pos;
            line(p.x, p.y, nextP.x, nextP.y);
        }

        push();
        translate(this.pos.x, this.pos.y);

        // Rotation correcte
        let angle = this.vel.heading();

        // 1. Engine Glow (Propulsion Lumineuse - Restauré)
        push();
        rotate(angle + PI / 2);
        noStroke();
        let glowColor = this.team === 'blue' ? color(0, 180, 255, 100) : color(255, 80, 0, 100);
        for (let i = 2; i > 0; i--) {
            fill(glowColor);
            let w = 6 + i * 3;
            let h = 10 + i * 6 + sin(frameCount * 0.4) * 4;
            ellipse(0, this.r + 2, w, h);
            glowColor.setAlpha(glowColor.levels[3] * 0.4);
        }
        pop();

        // 1. Barre de vie (Toujours utile)
        noStroke();
        fill(40, 40, 40, 180);
        rect(-12, -this.r - 12, 24, 3, 2);
        let hColor = lerpColor(color(255, 50, 50), color(50, 255, 100), this.health / 100);
        fill(hColor);
        rect(-12, -this.r - 12, 24 * (this.health / 100), 3, 2);

        // 2. Rendu de l'avion (Sprites originaux avec rotation spécifique)
        if (this.team === 'blue') {
            rotate(angle); // Sprite bleu horizontal
        } else {
            rotate(angle + PI / 2); // Sprite rouge vertical
        }

        if (this.image) {
            imageMode(CENTER);
            push();
            blendMode(SCREEN); // Supprime les boîtes noires
            image(this.image, 0, 0, this.imageL, this.imageH);
            pop();
        } else {
            // Fallback (V-Shape)
            fill(this.team === 'blue' ? color(0, 100, 255) : color(255, 50, 0));
            stroke(255);
            strokeWeight(2);
            beginShape();
            vertex(0, -this.r);
            vertex(-this.r / 2, this.r);
            vertex(0, this.r / 2);
            vertex(this.r / 2, this.r);
            endShape(CLOSE);
        }

        pop();
    }

    hit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.isDead = true;
        }
    }

    edges() { // Fallback, normalement boundaries gère ça
        if (this.pos.x > width) this.pos.x = 0;
        else if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        else if (this.pos.y < 0) this.pos.y = height;
    }
}
