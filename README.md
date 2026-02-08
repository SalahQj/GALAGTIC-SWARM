# 🛸 Galactic Swarm - Rapport de Projet
**Réalisé par :** Qejiou Salah-eddine
**Année Universitaire :** 2025-2026
**Cours :** IA - Agents Autonomes (EMSI Casablanca)

---

## 1. � Introduction

### Présentation générale
**Galactic Swarm** est une simulation de combat spatial et de comportements de groupe développée en JavaScript avec la bibliothèque **p5.js** 🎨. Le projet met en scène deux flottes d'avions (Bleue et Rouge) évoluant dans un environnement dynamique parsemé d'obstacles, de pièges et de menaces extraterrestres.

### 🎯 Objectif principal
Ce projet a été conçu dans le cadre du module **"IA pour le jeu vidéo"** pour démontrer l'implémentation pratique des **Steering Behaviors** (comportements de direction) théorisés par **Craig Reynolds**. L'enjeu est de simuler des mouvements organiques où chaque avion prend des décisions locales pour aboutir à un comportement de groupe cohérent et complexe (nuée/swarm).

### Contexte de réalisation
Le développement s'est concentré sur une architecture **orientée objet (POO)** rigoureuse, permettant une gestion fluide de dizaines d'agents autonomes interagissant simultanément par des forces vectorielles.

---

## 🕹️ 2. Description détaillée du Jeu

### Principe & Gameplay
Le joueur supervise une arène spatiale infinie. Il peut influencer le comportement des flottes en temps réel et intervenir pour protéger ses unités.

*   **👥 Formations de Groupe** : Les avions peuvent voler en nuée autonome, en file indienne, ou suivre un leader spécifique.
*   **⚔️ Combat** : Les boids détectent et tirent automatiquement sur les membres de l'équipe adverse ou sur les monstres envahisseurs.
*   **🛡️ Gestion du Terrain** : Le joueur peut poser des **Bombes (Touche A)** ou des **Pièges de confinement (Touche B)** pour influencer la trajectoire des agents.

### ✨ Fonctionnalités Avancées (Stage & Modes)
Le projet propose plusieurs modes opératoires déclenchables par touches :
*   **🐍 Mode Queue Leu Leu (I)** : Les avions se lient les uns aux autres pour former une chaîne cinématique fluide.
*   **� Mode Leader Follow (L)** : La flotte s'organise autour de la souris du joueur, tout en respectant un **cercle d'évasion** pour ne pas percuter le leader.
*   **🎲 Mode Wander (W)** : Ajout d'agents totalement indépendants qui errent au hasard et rebondissent sur les bords de l'écran.
*   **👾 Combat de Boss (C)** : Apparition d'un monstre géant déclenchant le mode **Focus Fire** (tous les avions s'arrêtent pour l'attaquer).

---

## �️ 3. Architecture Technique

### Technologies
*   **Javascript (ES6+ classes)** : Utilisation intensive de l'héritage.
*   **p5.js (Canvas API)** : Moteur graphique et gestion mathématique des vecteurs.

### 🏗️ Structure du Code (Règles Reynolds)
L'architecture respecte strictement les principes de Craig Reynolds :

1.  **Vehicle.js (Classe Mère)** :
    *   Implémente la physique newtonienne : `Position`, `Vitesse`, `Accélération`.
    *   Fait office de "moteur de mouvement" universel.
2.  **Boid.js (Classe Fille)** :
    *   Hérite de `Vehicle`.
    *   Spécialise la méthode `applyBehaviors()` pour combiner les poids des forces (Séparation, Cohésion, Alignement).
3.  **🧠 Intelligence Artificielle (Steering Behaviors)** :
    *   **Seek / Flee** : Poursuite et fuite des cibles/menaces.
    *   **Arrive** : Arrivée douce sur cible pour éviter les oscillations.
    *   **Wander** : Errance basée sur une projection de cercle.
    *   **Homing Projectiles** : Les balles sont des agents autonomes utilisant `seek()` vers leur cible.

---

## 📊 4. Analyse et Critique

### ⚠️ Difficultés rencontrées
*   **Orientation des Sprites** : Les images originales (PNG) n'ayant pas toutes la même orientation, il a fallu coder des fonctions de rotation conditionnelle (`angle + PI/2`) pour que les avions rouges ne volent pas de travers en formation.
*   **Performance (O(N²))** : La gestion des collisions entre boids, balles et obstacles ralentissait le jeu. Nous avons optimisé les boucles de rendu et limité le nombre d'explosions simultanées.
*   **Héritage** : Faire cohabiter les propriétés personnalisées des Boids (comme la barre de vie et les sprites) avec les propriétés standard de la classe `Vehicle` a nécessité une refactorisation précise du constructeur.

### ✅ Réussites
*   **Fluidité visuelle** : L'utilisation du `blendMode(SCREEN)` et des effets d'**Engine Glow** donne un aspect premium au projet.
*   **Modularité** : Grâce à l'héritage, ajouter un nouvel avion ou un nouveau comportement est extrêmement rapide.
*   **Game Feel** : Les transitions entre les modes (flocking vers combat) sont naturelles et réactives.

### 🤖 Utilisation de l'IA Générative
L'IA a été utilisée pour :
*   **Refactoring** : Adaptation du code pour l'héritage de la classe `Vehicle`.
*   **Assets** : Génération et optimisation des sprites de vaisseaux spatiaux.
*   **Documentation** : Aide à la structuration de ce rapport académique.

---

## 🏁 5. Conclusion
Ce projet valide la maîtrise des concepts d'IA appliqués aux agents autonomes. Galactic Swarm n'est pas qu'un simple rendu technique ; c'est une démonstration de la complexité émergente où des règles simples (Séparation, Alignement, Cohésion) créent un univers vivant et dynamique.

🔮 **Pistes futures** : Ajout d'un système d'expérience (Level up des boids) et sauvegarde des statistiques de combat via LocalStorage.
