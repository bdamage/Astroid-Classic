import {Game, GameState} from "../core/Game";
import {Spaceship} from "../entities/Spaceship";
import {Asteroid} from "../entities/Asteroid";
import {Bullet} from "../entities/Bullet";
import {PowerUp} from "../entities/PowerUp";
import {Vector2Utils} from "../utils/Vector2";
import {ParticleSystem} from "../effects/ParticleSystem";
import {FloatingTextManager} from "../effects/FloatingText";
import {WeaponSystem} from "../systems/WeaponSystem";

export class GameManager {
  private game: Game;
  private spaceship: Spaceship | null = null;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private powerUps: PowerUp[] = [];
  private weaponSystem: WeaponSystem = new WeaponSystem();
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
        this.weaponSystem.addPowerUp(powerUp.getType(), config.duration);

        // Add floating text
        this.floatingTextManager.addPowerUpText(powerUp.position, config.name);

        // Create pickup effect
        this.particleSystem.createExplosion(powerUp.position, config.color, 8);

        // Play power-up sound
        this.game.sound.playSound("powerUp", 0.5, 1.0 + Math.random() * 0.3);

        // Screen shake for feedback
        this.game.shake.shake(3, 150);

        // Remove power-up
        this.powerUps.splice(powerUpIndex, 1);
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

    // Render bullets
    this.bullets.forEach((bullet) => bullet.render(ctx));

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
}
