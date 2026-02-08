class GameStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = Date.now();
        this.stopTime = null; // Nouveau: pour figer le temps
        this.blueKills = 0;
        this.redKills = 0;
        this.blueDeaths = 0;
        this.redDeaths = 0;
        this.blueBulletsFired = 0;
        this.redBulletsFired = 0;
        this.blueBulletsHit = 0;
        this.redBulletsHit = 0;
        this.monstersKilled = 0;
        this.bombsExploded = 0;
        this.trapsCreated = 0; // Nouveau: suivi des cercles/pièges
        this.deathsByBombs = 0;
        this.deathsByMonster = 0;
    }

    recordTrap() {
        this.trapsCreated++;
    }

    stop() {
        if (!this.stopTime) {
            this.stopTime = Date.now();
        }
    }

    recordKill(killerTeam) {
        if (killerTeam === 'blue') {
            this.blueKills++;
        } else if (killerTeam === 'red') {
            this.redKills++;
        }
    }

    recordDeath(victimTeam) {
        if (victimTeam === 'blue') {
            this.blueDeaths++;
        } else if (victimTeam === 'red') {
            this.redDeaths++;
        }
    }

    recordBulletFired(team) {
        if (team === 'blue') {
            this.blueBulletsFired++;
        } else if (team === 'red') {
            this.redBulletsFired++;
        }
    }

    recordBulletHit(team) {
        if (team === 'blue') {
            this.blueBulletsHit++;
        } else if (team === 'red') {
            this.redBulletsHit++;
        }
    }

    recordMonsterKilled() {
        this.monstersKilled++;
    }

    recordBombExplosion() {
        this.bombsExploded++;
    }

    recordBombDeath() {
        this.deathsByBombs++;
    }

    recordMonsterDeath() {
        this.deathsByMonster++;
    }

    getAccuracy(team) {
        if (team === 'blue') {
            return this.blueBulletsFired > 0
                ? Math.round((this.blueBulletsHit / this.blueBulletsFired) * 100)
                : 0;
        } else {
            return this.redBulletsFired > 0
                ? Math.round((this.redBulletsHit / this.redBulletsFired) * 100)
                : 0;
        }
    }

    getSurvivalTime() {
        let endTime = this.stopTime || Date.now();
        return Math.floor((endTime - this.startTime) / 1000);
    }

    getFormattedTime() {
        let seconds = this.getSurvivalTime();
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
