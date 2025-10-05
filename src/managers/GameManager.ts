import {Game, GameState} from "../core/Game";
import {Spaceship} from "../entities/Spaceship";
import {Asteroid} from "../entities/Asteroid";
import {Bullet} from "../entities/Bullet";
import {PowerUp} from "../entities/PowerUp";
import {Enemy} from "../entities/Enemy";
import {HomingMissile} from "../entities/HomingMissile";
import {Shield} from "../entities/Shield";
import {Vector2Utils} from "../utils/Vector2";
import {ParticleSystem} from "../effects/ParticleSystem";
import {FloatingTextManager} from "../effects/FloatingText";
import {WeaponSystem} from "../systems/WeaponSystem";
import {WaveManager} from "../systems/WaveManager";

export class GameManager {
  private game: Game;
  private spaceship: Spaceship | null = null;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private powerUps: PowerUp[] = [];
  private enemies: Enemy[] = [];
  private homingMissiles: HomingMissile[] = [];
  private shield: Shield | null = null;
  private weaponSystem: WeaponSystem = new WeaponSystem();
  private waveManager: WaveManager = new WaveManager();
  private particleSystem: ParticleSystem = new ParticleSystem();
  private floatingTextManager: FloatingTextManager = new FloatingTextManager();
  private spawnTimer: number = 0;
  private respawnTimer: number = 0;
  private isRespawning: boolean = false;
  private powerUpSpawnTimer: number = 0;

  constructor(game: Game) {
    this.game = game;
  }

  startNewGame(): void {
    this.resetGame();
    this.spawnSpaceship();
    this.spawnInitialAsteroids();
  }

  private resetGame(): void {
    this.spaceship = null;
    this.asteroids = [];
    this.bullets = [];
    this.powerUps = [];
    this.weaponSystem.reset();
    this.particleSystem.clear();
    this.floatingTextManager.clear();
    this.spawnTimer = 0;
    this.respawnTimer = 0;
    this.isRespawning = false;
    this.powerUpSpawnTimer = 0;
  }

  private spawnSpaceship(): void {
    const centerX = this.game.canvasWidth / 2;
    const centerY = this.game.canvasHeight / 2;
    this.spaceship = new Spaceship({x: centerX, y: centerY});
    this.isRespawning = false;
  }

  private spawnInitialAsteroids(): void {
    const numAsteroids = 4 + this.game.level; // More asteroids each level
    const safeZone = {
      x: this.game.canvasWidth / 2,
      y: this.game.canvasHeight / 2,
    };

    for (let i = 0; i < numAsteroids; i++) {
      const asteroid = Asteroid.createRandom(
        this.game.canvasWidth,
        this.game.canvasHeight,
        safeZone
      );
      this.asteroids.push(asteroid);
    }
  }

  update(deltaTime: number): void {
    if (this.game.state !== GameState.PLAYING) return;

    // Handle respawning
    if (this.isRespawning) {
      this.respawnTimer += deltaTime;
      if (this.respawnTimer >= 3000) {
        // 3 second respawn delay
        if (this.canSpawnSafely()) {
          this.spawnSpaceship();
        } else {
          this.respawnTimer = 2500; // Try again soon
        }
      }
    }

    // Update spaceship
    if (this.spaceship) {
      this.handleInput();
      this.spaceship.update(
        deltaTime,
        this.game.canvasWidth,
        this.game.canvasHeight
      );
    }

    // Update weapon system
    this.weaponSystem.update(deltaTime);

    // Update wave manager and spawn enemies
    const waveUpdate = this.waveManager.update(deltaTime);
    waveUpdate.enemiesToSpawn.forEach((enemy) => {
      const newEnemy = new Enemy(enemy.position, enemy.type);
      if (this.spaceship) {
        newEnemy.setTarget(this.spaceship.position);
      }
      this.enemies.push(newEnemy);
    });

    // Update enemies
    this.enemies.forEach((enemy) => {
      if (this.spaceship) {
        enemy.setTarget(this.spaceship.position);
      }
      enemy.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });

    // Update homing missiles
    this.homingMissiles.forEach((missile) => {
      missile.setTargets([...this.asteroids, ...this.enemies]);
      missile.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });

    // Update shield
    if (this.shield && this.spaceship) {
      this.shield.update(
        deltaTime,
        this.game.canvasWidth,
        this.game.canvasHeight
      );
    }

    // Update asteroids
    this.asteroids.forEach((asteroid) => {
      asteroid.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });

    // Update bullets
    this.bullets.forEach((bullet) => {
      bullet.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });

    // Update power-ups
    this.powerUps.forEach((powerUp) => {
      powerUp.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });

    // Update particle system
    this.particleSystem.update(deltaTime);

    // Update floating text
    this.floatingTextManager.update(deltaTime);

    // Remove inactive objects
    this.bullets = this.bullets.filter((bullet) => bullet.active);
    this.asteroids = this.asteroids.filter((asteroid) => asteroid.active);
    this.powerUps = this.powerUps.filter((powerUp) => powerUp.active);
    this.enemies = this.enemies.filter((enemy) => enemy.active);
    this.homingMissiles = this.homingMissiles.filter(
      (missile) => missile.active
    );

    // Remove shield if depleted
    if (this.shield && this.shield.getHealth() <= 0) {
      this.shield = null;
    }

    // Power-up spawning
    this.powerUpSpawnTimer += deltaTime;
    if (this.powerUpSpawnTimer >= 15000) {
      // Spawn power-up every 15 seconds
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }

    // Check collisions
    this.checkCollisions();

    // Check win condition
    if (this.asteroids.length === 0) {
      this.nextLevel();
    }

    // Spawn timer for potential future features
    this.spawnTimer += deltaTime;
  }

  private handleInput(): void {
    if (!this.spaceship) return;

    const input = this.game.input;

    // Thrust
    if (input.isKeyDown("ArrowUp") || input.isKeyDown("KeyW")) {
      this.spaceship.setThrust(1);

      // Add thrust particles
      const thrustPosition = Vector2Utils.add(
        this.spaceship.position,
        Vector2Utils.fromAngle(this.spaceship.rotation + Math.PI, 10)
      );
      this.particleSystem.createThrustParticles(
        thrustPosition,
        this.spaceship.rotation
      );

      // Play thrust sound (quieter and with slight pitch variation)
      this.game.sound.playSound("thrust", 0.3, 0.9 + Math.random() * 0.2);
    }

    // Turn left
    if (input.isKeyDown("ArrowLeft") || input.isKeyDown("KeyA")) {
      this.spaceship.setTurnSpeed(-1);
    }

    // Turn right
    if (input.isKeyDown("ArrowRight") || input.isKeyDown("KeyD")) {
      this.spaceship.setTurnSpeed(1);
    }

    // Shoot
    if (input.isKeyPressed("Space")) {
      this.shoot();
    }

    // Launch homing missile
    if (input.isKeyPressed("KeyX")) {
      this.launchHomingMissile();
    }
  }

  private spawnPowerUp(): void {
    // Random spawn chance to balance gameplay
    if (Math.random() > 0.7) return; // 30% chance to spawn

    // Random power-up type
    const types = [
      "rapidFire",
      "tripleShot",
      "spreadShot",
      "powerShot",
      "shield",
      "hyperspace",
      "slowMotion",
      "homingMissile",
    ] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];

    // Spawn away from player to avoid instant pickup
    const margin = 150;
    const x = Math.random() * (this.game.canvasWidth - margin * 2) + margin;
    const y = Math.random() * (this.game.canvasHeight - margin * 2) + margin;

    // Ensure minimum distance from player
    if (this.spaceship) {
      const dx = x - this.spaceship.position.x;
      const dy = y - this.spaceship.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 200) {
        // Try again with better positioning
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = 250 + Math.random() * 150;
        const newX =
          this.spaceship.position.x + Math.cos(angle) * spawnDistance;
        const newY =
          this.spaceship.position.y + Math.sin(angle) * spawnDistance;

        // Keep within bounds
        const clampedX = Math.max(
          50,
          Math.min(this.game.canvasWidth - 50, newX)
        );
        const clampedY = Math.max(
          50,
          Math.min(this.game.canvasHeight - 50, newY)
        );

        this.powerUps.push(new PowerUp({x: clampedX, y: clampedY}, randomType));
      } else {
        this.powerUps.push(new PowerUp({x, y}, randomType));
      }
    } else {
      this.powerUps.push(new PowerUp({x, y}, randomType));
    }
  }

  private handleSpecialPowerUps(config: any): void {
    if (!this.spaceship) return;

    switch (config.type) {
      case "shield":
        if (!this.shield) {
          this.shield = new Shield(this.spaceship);
          this.game.sound.playSound("shield", 0.5);
          this.particleSystem.createPowerUpEffect(
            this.spaceship.position,
            "#00ffff"
          );
        }
        break;

      case "hyperspace":
        this.performHyperspace();
        break;

      case "slowMotion":
        this.game.sound.playSound("slowMotion", 0.4);
        this.particleSystem.createPowerUpEffect(
          this.spaceship.position,
          "#ffff00"
        );
        break;
    }
  }

  private performHyperspace(): void {
    if (!this.spaceship) return;

    const oldPosition = {...this.spaceship.position};

    // Find safe teleport location
    let attempts = 0;
    let newPosition;

    do {
      newPosition = {
        x: Math.random() * this.game.canvasWidth,
        y: Math.random() * this.game.canvasHeight,
      };
      attempts++;
    } while (attempts < 10 && !this.isPositionSafe(newPosition, 100));

    // Teleport
    this.spaceship.position = newPosition;

    // Create effects
    this.particleSystem.createHyperspaceEffect(oldPosition, newPosition);
    this.game.sound.playSound("hyperspace", 0.6);
    this.game.shake.shake(5, 200);
  }

  private isPositionSafe(position: any, radius: number): boolean {
    // Check against asteroids
    for (const asteroid of this.asteroids) {
      const distance = Vector2Utils.distance(position, asteroid.position);
      if (distance < radius + asteroid.radius) return false;
    }

    // Check against enemies
    for (const enemy of this.enemies) {
      const distance = Vector2Utils.distance(position, enemy.position);
      if (distance < radius + enemy.radius) return false;
    }

    return true;
  }

  private launchHomingMissile(): void {
    if (!this.spaceship || !this.weaponSystem.canLaunchHomingMissile()) return;

    const missile = this.weaponSystem.launchHomingMissile(
      this.spaceship.getFrontPosition(),
      this.spaceship.rotation
    );

    if (missile) {
      this.homingMissiles.push(missile);
      this.game.sound.playSound("homingMissile", 0.5);
      this.game.shake.shake(3, 150);
    }
  }

  private shoot(): void {
    if (!this.spaceship) return;

    const bulletPosition = this.spaceship.getFrontPosition();
    const newBullets = this.weaponSystem.shoot(
      bulletPosition,
      this.spaceship.rotation
    );

    // Add bullets to the game
    this.bullets.push(...newBullets);

    // Play appropriate sound
    const soundName = this.weaponSystem.getSoundForCurrentWeapon();
    this.game.sound.playSound(soundName, 0.4, 0.9 + Math.random() * 0.2);

    // Screen shake
    const shakeIntensity = newBullets.length > 1 ? 2 : 1;
    this.game.shake.shake(shakeIntensity, 50);
  }
  private checkCollisions(): void {
    if (!this.spaceship) return;

    // Spaceship vs Asteroids
    if (this.spaceship.canTakeDamage()) {
      for (const asteroid of this.asteroids) {
        if (this.spaceship.checkCollision(asteroid)) {
          this.spaceshipDestroyed();
          break;
        }
      }
    }

    // Bullets vs Asteroids
    for (
      let bulletIndex = this.bullets.length - 1;
      bulletIndex >= 0;
      bulletIndex--
    ) {
      const bullet = this.bullets[bulletIndex];

      for (
        let asteroidIndex = this.asteroids.length - 1;
        asteroidIndex >= 0;
        asteroidIndex--
      ) {
        const asteroid = this.asteroids[asteroidIndex];

        if (bullet.checkCollision(asteroid)) {
          const score = asteroid.getScore();

          // Add score
          this.game.addScore(score);

          // Add floating score text
          this.floatingTextManager.addScoreText(asteroid.position, score);

          // Create explosion effect
          this.particleSystem.createExplosion(asteroid.position, "#ffffff", 6);
          this.particleSystem.createDebris(asteroid.position, 4);

          // Play explosion sound based on asteroid size
          const size = asteroid.getSize();
          if (size === "large") {
            this.game.sound.playSound("explosion", 0.6, 0.8);
            this.game.shake.shake(8, 300);
          } else if (size === "medium") {
            this.game.sound.playSound("explosion", 0.5, 1.0);
            this.game.shake.shake(5, 200);
          } else {
            this.game.sound.playSound("smallExplosion", 0.4, 1.2);
            this.game.shake.shake(3, 150);
          }

          // Create fragments
          const fragments = asteroid.split();
          this.asteroids.splice(asteroidIndex, 1); // Remove original asteroid
          this.asteroids.push(...fragments); // Add fragments

          // Remove bullet
          this.bullets.splice(bulletIndex, 1);
          break;
        }
      }
    }

    // Spaceship vs PowerUps
    for (
      let powerUpIndex = this.powerUps.length - 1;
      powerUpIndex >= 0;
      powerUpIndex--
    ) {
      const powerUp = this.powerUps[powerUpIndex];

      if (this.spaceship.checkCollision(powerUp)) {
        // Apply power-up effect
        const config = powerUp.getConfig();

        // Handle special power-ups that don't use the weapon system
        if (["shield", "hyperspace", "slowMotion"].includes(config.type)) {
          this.handleSpecialPowerUps(config);
        } else {
          this.weaponSystem.addPowerUp(powerUp.getType(), config.duration);
        }

        // Add floating text
        this.floatingTextManager.addPowerUpText(powerUp.position, config.name);

        // Create pickup effect
        this.particleSystem.createPowerUpEffect(powerUp.position, config.color);

        // Play power-up sound
        this.game.sound.playSound("powerUp", 0.5, 1.0 + Math.random() * 0.3);

        // Screen shake for feedback
        this.game.shake.shake(3, 150);

        // Remove power-up
        this.powerUps.splice(powerUpIndex, 1);
      }
    }

    // Spaceship vs Enemies (with shield check)
    if (this.spaceship.canTakeDamage()) {
      for (const enemy of this.enemies) {
        if (this.spaceship.checkCollision(enemy)) {
          if (this.shield) {
            if (this.shield.takeDamage()) {
              this.shield = null;
              this.particleSystem.createShieldHitEffect(enemy.position);
              this.game.sound.playSound("shield", 0.5);
            }
          } else {
            this.spaceshipDestroyed();
            break;
          }
        }
      }
    }

    // Bullets vs Enemies
    for (
      let bulletIndex = this.bullets.length - 1;
      bulletIndex >= 0;
      bulletIndex--
    ) {
      const bullet = this.bullets[bulletIndex];

      for (
        let enemyIndex = this.enemies.length - 1;
        enemyIndex >= 0;
        enemyIndex--
      ) {
        const enemy = this.enemies[enemyIndex];

        if (bullet.checkCollision(enemy)) {
          if (enemy.takeDamage()) {
            // Enemy destroyed
            this.game.addScore(enemy.getScore());
            this.floatingTextManager.addScoreText(
              enemy.position,
              enemy.getScore()
            );
            this.particleSystem.createEnemyExplosion(
              enemy.position,
              enemy.getType()
            );
            this.game.sound.playSound(
              "explosion",
              0.5,
              1.0 + Math.random() * 0.2
            );
            this.game.shake.shake(5, 200);
            this.waveManager.enemyDestroyed();
            this.enemies.splice(enemyIndex, 1);
          }

          // Remove bullet
          this.bullets.splice(bulletIndex, 1);
          break;
        }
      }
    }

    // Homing Missiles vs Targets
    for (
      let missileIndex = this.homingMissiles.length - 1;
      missileIndex >= 0;
      missileIndex--
    ) {
      const missile = this.homingMissiles[missileIndex];

      // Check vs asteroids
      for (
        let asteroidIndex = this.asteroids.length - 1;
        asteroidIndex >= 0;
        asteroidIndex--
      ) {
        const asteroid = this.asteroids[asteroidIndex];

        if (missile.checkCollision(asteroid)) {
          const score = asteroid.getScore() * 2; // Bonus for homing missile
          this.game.addScore(score);
          this.floatingTextManager.addScoreText(asteroid.position, score);
          this.particleSystem.createExplosion(
            asteroid.position,
            "#ff9900",
            10,
            "bright"
          );

          const fragments = asteroid.split();
          this.asteroids.splice(asteroidIndex, 1);
          this.asteroids.push(...fragments);
          this.homingMissiles.splice(missileIndex, 1);

          this.game.sound.playSound("explosion", 0.6, 0.8);
          this.game.shake.shake(8, 300);
          break;
        }
      }

      // Check vs enemies
      for (
        let enemyIndex = this.enemies.length - 1;
        enemyIndex >= 0;
        enemyIndex--
      ) {
        const enemy = this.enemies[enemyIndex];

        if (missile.checkCollision(enemy)) {
          if (enemy.takeDamage(2)) {
            // Homing missiles do more damage
            const score = enemy.getScore() * 2;
            this.game.addScore(score);
            this.floatingTextManager.addScoreText(enemy.position, score);
            this.particleSystem.createEnemyExplosion(
              enemy.position,
              enemy.getType()
            );
            this.waveManager.enemyDestroyed();
            this.enemies.splice(enemyIndex, 1);
          }

          this.homingMissiles.splice(missileIndex, 1);
          this.game.sound.playSound("explosion", 0.6, 1.2);
          this.game.shake.shake(8, 300);
          break;
        }
      }
    }
  }

  private spaceshipDestroyed(): void {
    if (!this.spaceship) return;

    // Create explosion effect
    this.particleSystem.createExplosion(this.spaceship.position, "#ff6600", 12);
    this.particleSystem.createDebris(this.spaceship.position, 8);

    // Play explosion sound and strong screen shake
    this.game.sound.playSound("explosion", 0.8, 0.7);
    this.game.shake.shake(15, 500);

    this.spaceship.destroy();
    this.spaceship = null;
    this.game.loseLife();

    if (this.game.lives <= 0) {
      // Play game over sound
      this.game.sound.playSound("gameOver", 0.6);
    } else {
      this.isRespawning = true;
      this.respawnTimer = 0;
    }
  }
  private canSpawnSafely(): boolean {
    const centerX = this.game.canvasWidth / 2;
    const centerY = this.game.canvasHeight / 2;
    const safeRadius = 100;

    for (const asteroid of this.asteroids) {
      const distance = Vector2Utils.distance(
        {x: centerX, y: centerY},
        asteroid.position
      );
      if (distance < safeRadius) {
        return false;
      }
    }
    return true;
  }

  private nextLevel(): void {
    this.game.level++;

    // Add level up effects
    const centerX = this.game.canvasWidth / 2;
    const centerY = this.game.canvasHeight / 2;
    const bonus = 1000 * this.game.level;

    this.floatingTextManager.addLevelText(
      {x: centerX, y: centerY - 50},
      this.game.level
    );
    this.floatingTextManager.addBonusText({x: centerX, y: centerY + 50}, bonus);

    // Play level up sound
    this.game.sound.playSound("levelUp", 0.5);

    this.spawnInitialAsteroids();

    // Give player bonus points for completing level
    this.game.addScore(bonus);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render asteroids
    this.asteroids.forEach((asteroid) => asteroid.render(ctx));

    // Render enemies
    this.enemies.forEach((enemy) => enemy.render(ctx));

    // Render bullets
    this.bullets.forEach((bullet) => bullet.render(ctx));

    // Render homing missiles
    this.homingMissiles.forEach((missile) => missile.render(ctx));

    // Render power-ups
    this.powerUps.forEach((powerUp) => powerUp.render(ctx));

    // Render particle effects
    this.particleSystem.render(ctx);

    // Render floating text
    this.floatingTextManager.render(ctx);

    // Render spaceship
    if (this.spaceship) {
      this.spaceship.render(ctx);
    }

    // Render shield
    if (this.shield) {
      this.shield.render(ctx);
    }

    // Render respawn message
    if (this.isRespawning) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      const timeLeft = Math.ceil((3000 - this.respawnTimer) / 1000);
      ctx.fillText(
        `Respawning in ${timeLeft}...`,
        this.game.canvasWidth / 2,
        this.game.canvasHeight / 2
      );
    }
  }

  // Public getter methods for HUD
  public get currentWave(): number {
    return this.waveManager.getCurrentWave();
  }

  public get enemiesRemaining(): number {
    return this.waveManager.getEnemiesRemaining();
  }

  public get currentWeaponSystem(): WeaponSystem {
    return this.weaponSystem;
  }

  public get currentWaveManager(): WaveManager {
    return this.waveManager;
  }

  public get shieldHealth(): number | undefined {
    return this.shield ? this.shield.getHealth() : undefined;
  }

  public get maxShieldHealth(): number | undefined {
    return this.shield ? this.shield.getMaxHealth() : undefined;
  }
}
