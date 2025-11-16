import type {IGameContext} from "../core/GameTypes";
import {GameState} from "../core/GameTypes";
import {Spaceship} from "../entities/Spaceship";
import {Asteroid} from "../entities/Asteroid";
import {Bullet} from "../entities/Bullet";
import {PowerUp} from "../entities/PowerUp";
import {Enemy} from "../entities/Enemy";
import {HomingMissile} from "../entities/HomingMissile";
import {Shield} from "../entities/Shield";
import {Boss, BossType} from "../entities/Boss";
import {BossProjectile} from "../entities/BossProjectile";
import {Vector2Utils} from "../utils/Vector2";
import {ParticleSystem} from "../effects/ParticleSystem";
import {FloatingTextManager} from "../effects/FloatingText";
import {WeaponSystem} from "../systems/WeaponSystem";
import {WaveManager} from "../systems/WaveManager";

export class GameManager {
  private game: IGameContext;
  private spaceship: Spaceship | null = null;
  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private powerUps: PowerUp[] = [];
  private enemies: Enemy[] = [];
  private homingMissiles: HomingMissile[] = [];
  private boss: Boss | null = null;
  private bossProjectiles: BossProjectile[] = [];
  private shield: Shield | null = null;
  private weaponSystem: WeaponSystem = new WeaponSystem();
  private waveManager: WaveManager = new WaveManager();
  private particleSystem: ParticleSystem = new ParticleSystem();
  private floatingTextManager: FloatingTextManager = new FloatingTextManager();
  private spawnTimer: number = 0;
  private respawnTimer: number = 0;
  private isRespawning: boolean = false;
  private powerUpSpawnTimer: number = 0;
  private bossIntroTimer: number = 0;
  private showingBossIntro: boolean = false;
  private infiniteLives: boolean = false;

  constructor(game: IGameContext) {
    this.game = game;
  }

  startNewGame(): void {
    this.resetGame();
    this.spawnSpaceship();
    this.spawnInitialAsteroids();
    this.waveManager.startWave(1); // Start the first enemy wave
  }

  public completeWarpTunnel(): void {
    // Show completion message
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

    // Spawn asteroids for next wave
    this.spawnInitialAsteroids();

    // Give player bonus points for completing level
    this.game.addScore(bonus);
  }

  private resetGame(): void {
    this.spaceship = null;
    this.asteroids = [];
    this.bullets = [];
    this.powerUps = [];
    this.enemies = [];
    this.homingMissiles = [];
    this.boss = null;
    this.bossProjectiles = [];
    this.shield = null;
    this.bossIntroTimer = 0;
    this.showingBossIntro = false;
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
    this.spaceship.makeInvulnerable(); // Add invulnerability period when spawning
    this.isRespawning = false;
  }

  private spawnInitialAsteroids(): void {
    const settings = this.game.difficulty.getCurrentSettings();
    const baseNumAsteroids = 4 + this.game.level; // More asteroids each level
    const numAsteroids = Math.min(
      Math.round(baseNumAsteroids * settings.asteroidSpawnRate),
      settings.maxAsteroidsOnScreen
    );

    const safeZone = {
      x: this.game.canvasWidth / 2,
      y: this.game.canvasHeight / 2,
    };

    for (let i = 0; i < numAsteroids; i++) {
      const asteroid = Asteroid.createRandom(
        this.game.canvasWidth,
        this.game.canvasHeight,
        safeZone,
        settings.asteroidSpeedMultiplier
      );
      this.asteroids.push(asteroid);
    }
  }

  update(deltaTime: number): void {
    if (this.game.state !== GameState.PLAYING) return;

    // Update achievement tracker for combo decay
    this.game.achievements.update(deltaTime, Date.now());

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
    const playerPosition = this.spaceship ? this.spaceship.position : undefined;
    const waveUpdate = this.waveManager.update(
      deltaTime,
      this.game.canvasWidth,
      this.game.canvasHeight,
      playerPosition
    );
    waveUpdate.enemiesToSpawn.forEach((enemy) => {
      const settings = this.game.difficulty.getCurrentSettings();
      const newEnemy = new Enemy(
        enemy.position,
        enemy.type,
        settings.enemySpeedMultiplier
      );
      if (this.spaceship) {
        newEnemy.setTarget(this.spaceship.position);
      }
      this.enemies.push(newEnemy);
    });

    // Check for boss wave
    if (
      this.waveManager.shouldSpawnBoss() &&
      !this.showingBossIntro &&
      !this.boss
    ) {
      this.startBossIntro();
    }

    // Update boss intro
    if (this.showingBossIntro) {
      this.bossIntroTimer += deltaTime;
      if (this.bossIntroTimer >= 3000) {
        // 3 second intro
        this.spawnBoss();
        this.showingBossIntro = false;
        this.bossIntroTimer = 0;
      }
    }

    // Update boss
    if (this.boss) {
      this.boss.update(
        deltaTime,
        this.game.canvasWidth,
        this.game.canvasHeight
      );

      // Boss attacks
      if (this.boss.canAttack()) {
        this.bossAttack();
        this.boss.resetAttackTimer();
      }
    }

    // Update boss projectiles
    this.bossProjectiles.forEach((proj) => {
      proj.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });
    this.bossProjectiles = this.bossProjectiles.filter((proj) => proj.active);

    // Update enemies
    this.enemies.forEach((enemy) => {
      if (this.spaceship) {
        enemy.setTarget(this.spaceship.position);
      }
      enemy.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);
    });

    // Update homing missiles with trail effects
    this.homingMissiles.forEach((missile) => {
      missile.setTargets([...this.asteroids, ...this.enemies]);
      missile.update(deltaTime, this.game.canvasWidth, this.game.canvasHeight);

      // Create missile trail particles
      const angle = Math.atan2(missile.velocity.y, missile.velocity.x);
      this.particleSystem.createMissileTrail(missile.position, angle);
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

      // Magnet effect - attract power-ups to player
      if (this.spaceship && this.weaponSystem.hasPowerUp("magnet")) {
        const dx = this.spaceship.position.x - powerUp.position.x;
        const dy = this.spaceship.position.y - powerUp.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300) {
          // Magnet range
          const pullStrength = 200; // Pixels per second
          const nx = dx / distance;
          const ny = dy / distance;

          powerUp.velocity.x += nx * pullStrength * (deltaTime / 1000);
          powerUp.velocity.y += ny * pullStrength * (deltaTime / 1000);
        }
      }
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

    // Remove shield if depleted or expired
    if (
      this.shield &&
      (this.shield.getHealth() <= 0 || this.shield.isExpired())
    ) {
      this.shield = null;
    }

    // Power-up spawning - difficulty adjusted
    this.powerUpSpawnTimer += deltaTime;
    const settings = this.game.difficulty.getCurrentSettings();
    const spawnInterval = 7000 / settings.powerUpSpawnRate; // Faster spawn on easier difficulties
    if (this.powerUpSpawnTimer >= spawnInterval) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }

    // Check collisions
    this.checkCollisions();

    // Check wave completion
    if (this.enemies.length === 0 && this.waveManager.isWaveComplete()) {
      const bonusScore = this.waveManager.completeWave();
      const currentWave = this.waveManager.getCurrentWave();

      // Show wave completion achievement
      const achievement = this.game.achievements.onWaveCleared(currentWave);
      this.game.achievementUI.showAchievement(achievement);
      this.game.addScore(achievement.points + bonusScore);
    }

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

    // Shoot - continuous firing while holding space
    if (input.isKeyDown("Space")) {
      this.shoot();
    }

    // Launch homing missile
    if (input.isKeyPressed("KeyX")) {
      this.launchHomingMissile();
    }

    // Activate shield manually
    if (input.isKeyPressed("KeyQ")) {
      this.activateShield();
    }

    // Toggle infinite lives cheat (I key)
    if (input.isKeyPressed("KeyI")) {
      this.infiniteLives = !this.infiniteLives;
      const message = this.infiniteLives
        ? "INFINITE LIVES ON"
        : "INFINITE LIVES OFF";
      this.floatingTextManager.addText(
        {x: this.game.canvasWidth / 2, y: this.game.canvasHeight / 2},
        message,
        this.infiniteLives ? "#00ff00" : "#ff0000",
        32
      );
      this.game.sound.playSound("powerUp", 0.5, this.infiniteLives ? 1.5 : 0.7);
    }
  }

  private activateShield(): void {
    if (!this.spaceship || !this.spaceship.active || this.shield) return;

    // Create shield with longer duration for manual activation
    this.shield = new Shield(this.spaceship, 20000); // 20 seconds for manual activation
    this.game.sound.playSound("shield", 0.5);
    this.particleSystem.createPowerUpEffect(this.spaceship.position, "#00ffff");
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
      "nuke",
      "magnet",
      "invincibility",
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

  private spawnPowerUpAt(x: number, y: number): void {
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

    // Spawn at the specified position (like where an asteroid was destroyed)
    this.powerUps.push(new PowerUp({x, y}, randomType));
  }

  private handleSpecialPowerUps(config: any): void {
    if (!this.spaceship) return;

    switch (config.type) {
      case "shield":
        if (!this.shield) {
          this.shield = new Shield(this.spaceship, 15000); // 15 second duration
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

      case "nuke":
        this.activateNuke();
        break;

      case "magnet":
        this.weaponSystem.addPowerUp("magnet", 12000); // Store magnet state in weapon system
        break;

      case "invincibility":
        if (this.spaceship) {
          this.spaceship.makeInvulnerable(8000); // 8 seconds of invincibility
          this.game.sound.playSound("powerUp", 0.7, 1.5);
          this.particleSystem.createPowerUpEffect(
            this.spaceship.position,
            "#ffdd00"
          );
        }
        break;
    }
  }

  private activateNuke(): void {
    // Destroy all asteroids on screen
    const asteroidsDestroyed = this.asteroids.length;

    for (const asteroid of this.asteroids) {
      // Give score for each asteroid
      const baseScore = asteroid.getScore();
      const comboMultiplier = this.game.achievements.getComboMultiplier();
      const score = this.game.difficulty.getScoreValue(
        baseScore * comboMultiplier
      );
      this.game.addScore(score);

      // Create explosion effects
      this.particleSystem.createExplosion(
        asteroid.position,
        "#ff0000",
        12,
        "bright"
      );
    }

    // Clear all asteroids
    this.asteroids = [];

    // Massive screen shake
    this.game.shake.shake(20, 500);

    // Play explosion sound
    this.game.sound.playSound("explosion", 1.0, 0.5);

    // Show achievement
    this.floatingTextManager.addScoreText(
      {x: this.game.canvasWidth / 2, y: this.game.canvasHeight / 2},
      asteroidsDestroyed * 50
    );
  }

  private startBossIntro(): void {
    this.showingBossIntro = true;
    this.bossIntroTimer = 0;
    // Clear enemies to make space for boss
    this.enemies = [];
  }

  private spawnBoss(): void {
    const wave = this.waveManager.getCurrentWave();
    let bossType: BossType;

    // Cycle through boss types
    if (wave % 15 === 0) {
      bossType = BossType.FORTRESS;
    } else if (wave % 10 === 0) {
      bossType = BossType.SWARM_COMMANDER;
    } else {
      bossType = BossType.MOTHERSHIP;
    }

    const centerX = this.game.canvasWidth / 2;
    const centerY = this.game.canvasHeight / 2;

    this.boss = new Boss({x: centerX, y: centerY}, bossType);
    this.waveManager.markBossSpawned();

    // Sound and effects
    this.game.sound.playSound("levelUp", 0.8, 0.7);
    this.game.shake.shake(15, 600);
    this.particleSystem.createExplosion(
      {x: centerX, y: centerY},
      "#ff00ff",
      30,
      "bright"
    );
  }

  private bossAttack(): void {
    if (!this.boss) return;

    const patterns = this.boss.getAttackPattern();
    const color =
      this.boss.getType() === BossType.MOTHERSHIP
        ? "#ff00ff"
        : this.boss.getType() === BossType.FORTRESS
        ? "#00ffff"
        : "#ffff00";

    patterns.forEach((direction) => {
      const projectile = new BossProjectile(
        {x: this.boss!.position.x, y: this.boss!.position.y},
        direction,
        color
      );
      this.bossProjectiles.push(projectile);
    });

    this.game.sound.playSound("shoot", 0.3, 0.6);
  }

  private bossDefeated(): void {
    if (!this.boss) return;

    const wave = this.waveManager.getCurrentWave();
    const bossScore = 5000 * Math.floor(wave / 5);

    // Award score
    this.game.addScore(bossScore);

    // Epic explosion with multiple effects
    this.particleSystem.createExplosion(
      this.boss.position,
      "#ff00ff",
      50,
      "massive"
    );
    this.particleSystem.createExplosion(
      this.boss.position,
      "#00ffff",
      40,
      "bright"
    );
    this.particleSystem.createDebris(this.boss.position, 20);
    this.particleSystem.createShockwave(this.boss.position, "#ff00ff", 60);
    this.particleSystem.createShockwave(this.boss.position, "#00ffff", 80);
    this.particleSystem.createComboBurst(this.boss.position, 50);

    // Screen effects with freeze frame
    this.game.time.freeze(200, 0.05); // Dramatic freeze for boss defeat
    this.game.shake.shake(25, 800);
    this.game.sound.playSound("explosion", 1.0, 0.5);

    // Show floating score
    this.floatingTextManager.addScoreText(this.boss.position, bossScore);

    // Spawn multiple power-ups as rewards
    const powerUpCount = 2 + Math.floor(wave / 10);
    for (let i = 0; i < powerUpCount; i++) {
      const angle = (Math.PI * 2 * i) / powerUpCount;
      const distance = 100;
      const x = this.boss.position.x + Math.cos(angle) * distance;
      const y = this.boss.position.y + Math.sin(angle) * distance;
      this.spawnPowerUpAt(x, y);
    }

    // Clear boss
    this.boss = null;
    this.bossProjectiles = [];
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

    // Only process if bullets were actually fired (not on cooldown)
    if (newBullets.length > 0) {
      // Add bullets to the game
      this.bullets.push(...newBullets);

      // Play appropriate sound
      const soundName = this.weaponSystem.getSoundForCurrentWeapon();
      this.game.sound.playSound(soundName, 0.4, 0.9 + Math.random() * 0.2);

      // Screen shake
      const shakeIntensity = newBullets.length > 1 ? 2 : 1;
      this.game.shake.shake(shakeIntensity, 50);
    }
  }
  private checkCollisions(): void {
    if (!this.spaceship || !this.spaceship.active) return;

    try {
      // Spaceship vs Asteroids
      if (this.spaceship.canTakeDamage()) {
        for (const asteroid of this.asteroids) {
          if (this.spaceship.checkCollision(asteroid)) {
            this.spaceshipDestroyed();
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error in spaceship collision detection:", error);
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
          const baseScore = asteroid.getScore();
          const comboMultiplier = this.game.achievements.getComboMultiplier();
          const score = this.game.difficulty.getScoreValue(
            baseScore * comboMultiplier
          );

          // Add score
          this.game.addScore(score);

          // Check for achievements on kill
          const achievement = this.game.achievements.onKill(Date.now());
          if (achievement) {
            this.game.achievementUI.showAchievement(achievement);
            this.game.addScore(achievement.points);

            // Play combo milestone sound for combo achievements
            if (achievement.type === "combo") {
              this.game.sound.playSound("comboMilestone", 0.6, 1.0);
            }
          }

          // Show combo multiplier and play sound if active
          if (comboMultiplier > 1) {
            this.game.achievementUI.showComboMultiplier(comboMultiplier);
            // Play combo increase sound with pitch variation based on combo level
            const comboCount = this.game.achievements.getComboCount();
            const pitch = 1.0 + comboCount * 0.05;
            this.game.sound.playSound(
              "comboIncrease",
              0.4,
              Math.min(pitch, 2.0)
            );

            // Show combo text for milestones (every 5 kills)
            if (comboCount % 5 === 0 && comboCount >= 5) {
              this.floatingTextManager.addComboText(
                asteroid.position,
                comboCount
              );
            }

            // Show multiplier text
            if (comboMultiplier >= 2) {
              this.floatingTextManager.addMultiplierText(
                asteroid.position,
                comboMultiplier
              );
            }

            // Freeze frame effect for high combos (20+)
            if (comboCount >= 20 && comboCount % 5 === 0) {
              const freezeDuration = Math.min(50 + comboCount * 2, 150);
              this.game.time.freeze(freezeDuration, 0.1);
            }

            // Screen shake scales with combo level
            const shakeIntensity = Math.min(2 + comboCount * 0.2, 10);
            const shakeDuration = Math.min(100 + comboCount * 5, 300);
            this.game.shake.shake(shakeIntensity, shakeDuration);
          }

          // Show kill streak counter if applicable
          const killStreak = this.game.achievements.getCurrentKillStreak();
          if (killStreak >= 3) {
            this.game.achievementUI.showKillStreakCounter(
              killStreak,
              asteroid.position.x,
              asteroid.position.y
            );
          }

          // Add floating score text
          this.floatingTextManager.addScoreText(asteroid.position, score);

          // Create explosion effect with enhanced visuals
          this.particleSystem.createExplosion(asteroid.position, "#ffffff", 6);
          this.particleSystem.createDebris(asteroid.position, 4);
          this.particleSystem.createSparks(
            asteroid.position,
            Math.atan2(bullet.velocity.y, bullet.velocity.x),
            3
          );

          // Add combo burst for high combos
          const comboCount = this.game.achievements.getComboCount();
          if (comboCount >= 10) {
            this.particleSystem.createComboBurst(asteroid.position, comboCount);
          }

          // Play explosion sound based on asteroid size
          const size = asteroid.getSize();
          if (size === "large") {
            this.game.sound.playSound("explosion", 0.6, 0.8);
            this.game.shake.shake(8, 300);
            this.particleSystem.createShockwave(
              asteroid.position,
              "#ffffff",
              25
            );
          } else if (size === "medium") {
            this.game.sound.playSound("explosion", 0.5, 1.0);
            this.game.shake.shake(5, 200);
            this.particleSystem.createShockwave(
              asteroid.position,
              "#ffffff",
              15
            );
          } else {
            this.game.sound.playSound("smallExplosion", 0.4, 1.2);
            this.game.shake.shake(3, 150);
          }

          // Create fragments
          const settings = this.game.difficulty.getCurrentSettings();
          const fragments = asteroid.split(settings.asteroidSpeedMultiplier);
          this.asteroids.splice(asteroidIndex, 1); // Remove original asteroid
          this.asteroids.push(...fragments); // Add fragments

          // Chance to spawn power-up when asteroid is destroyed (difficulty adjusted)
          if (this.game.difficulty.shouldSpawnPowerUp(0.15)) {
            this.spawnPowerUpAt(asteroid.position.x, asteroid.position.y);
          }

          // Remove bullet
          this.bullets.splice(bulletIndex, 1);
          break;
        }
      }
    }

    // Spaceship vs PowerUps
    if (this.spaceship && this.spaceship.active) {
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
          if (
            [
              "shield",
              "hyperspace",
              "slowMotion",
              "nuke",
              "magnet",
              "invincibility",
            ].includes(config.type)
          ) {
            this.handleSpecialPowerUps(config);
          } else {
            this.weaponSystem.addPowerUp(powerUp.getType(), config.duration);
          }

          // Add floating text
          this.floatingTextManager.addPowerUpText(
            powerUp.position,
            config.name
          );

          // Create pickup effect
          this.particleSystem.createPowerUpEffect(
            powerUp.position,
            config.color
          );

          // Enhanced effects based on power-up type
          switch (config.type) {
            case "nuke":
              this.game.shake.shake(15, 400);
              this.game.sound.playSound("powerUp", 0.8, 0.7);
              break;
            case "invincibility":
              this.game.shake.shake(6, 200);
              this.game.sound.playSound("powerUp", 0.6, 1.5);
              this.particleSystem.createExplosion(
                powerUp.position,
                config.color,
                20,
                "bright"
              );
              break;
            case "magnet":
              this.game.shake.shake(4, 180);
              this.game.sound.playSound("powerUp", 0.5, 1.2);
              break;
            default:
              this.game.shake.shake(3, 150);
              this.game.sound.playSound(
                "powerUp",
                0.5,
                1.0 + Math.random() * 0.3
              );
          }

          // Check for power-up achievements
          const achievement = this.game.achievements.onPowerUpCollected();
          if (achievement) {
            this.game.achievementUI.showAchievement(achievement);
            this.game.addScore(achievement.points);
          }

          // Remove power-up
          this.powerUps.splice(powerUpIndex, 1);
        }
      }
    }

    // Spaceship vs Enemies (with shield check)
    if (
      this.spaceship &&
      this.spaceship.active &&
      this.spaceship.canTakeDamage()
    ) {
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
            const baseScore = enemy.getScore();
            const comboMultiplier = this.game.achievements.getComboMultiplier();
            const score = this.game.difficulty.getScoreValue(
              baseScore * comboMultiplier
            );
            this.game.addScore(score);

            // Check for achievements on enemy kill
            const achievement = this.game.achievements.onKill(Date.now());
            if (achievement) {
              this.game.achievementUI.showAchievement(achievement);
              this.game.addScore(achievement.points);

              // Play combo milestone sound for combo achievements
              if (achievement.type === "combo") {
                this.game.sound.playSound("comboMilestone", 0.6, 1.0);
              }
            }

            // Show combo multiplier and play sound if active
            if (comboMultiplier > 1) {
              this.game.achievementUI.showComboMultiplier(comboMultiplier);
              // Play combo increase sound with pitch variation based on combo level
              const comboCount = this.game.achievements.getComboCount();
              const pitch = 1.0 + comboCount * 0.05;
              this.game.sound.playSound(
                "comboIncrease",
                0.4,
                Math.min(pitch, 2.0)
              );

              // Screen shake scales with combo level
              const shakeIntensity = Math.min(2 + comboCount * 0.2, 10);
              const shakeDuration = Math.min(100 + comboCount * 5, 300);
              this.game.shake.shake(shakeIntensity, shakeDuration);
            }

            // Show kill streak counter if applicable
            const killStreak = this.game.achievements.getCurrentKillStreak();
            if (killStreak >= 3) {
              this.game.achievementUI.showKillStreakCounter(
                killStreak,
                enemy.position.x,
                enemy.position.y
              );
            }

            this.floatingTextManager.addScoreText(
              enemy.position,
              enemy.getScore()
            );
            this.particleSystem.createEnemyExplosion(
              enemy.position,
              enemy.getType()
            );

            // Add combo burst for high combos
            const comboCount = this.game.achievements.getComboCount();
            if (comboCount >= 10) {
              this.particleSystem.createComboBurst(enemy.position, comboCount);
            }

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

    // Boss Collisions
    if (this.boss && this.boss.active) {
      // Bullets vs Boss
      for (
        let bulletIndex = this.bullets.length - 1;
        bulletIndex >= 0;
        bulletIndex--
      ) {
        const bullet = this.bullets[bulletIndex];
        // Check boss still exists before collision check
        if (!this.boss || !this.boss.active) break;

        if (bullet && bullet.active && bullet.checkCollision(this.boss)) {
          const defeated = this.boss.takeDamage(10);
          this.bullets.splice(bulletIndex, 1);

          if (defeated) {
            this.bossDefeated();
            break; // Exit loop after boss is defeated
          } else {
            // Boss hit but not defeated
            this.particleSystem.createExplosion(
              bullet.position,
              "#ff00ff",
              8,
              "bright"
            );
            this.particleSystem.createSparks(
              bullet.position,
              Math.atan2(bullet.velocity.y, bullet.velocity.x),
              5
            );
            this.floatingTextManager.addDamageText(bullet.position, 10);

            // Show critical text occasionally (20% chance)
            if (Math.random() < 0.2) {
              this.floatingTextManager.addCriticalText(bullet.position, true);
            }

            this.game.sound.playSound("hit", 0.4, 1.2);
            this.game.shake.shake(4, 150);
          }
        }
      }

      // Boss vs Spaceship
      if (
        this.boss &&
        this.boss.active &&
        this.spaceship &&
        this.spaceship.active &&
        this.spaceship.canTakeDamage()
      ) {
        if (this.spaceship.checkCollision(this.boss)) {
          this.spaceshipDestroyed();
        }
      }
    }

    // Boss Projectiles vs Spaceship
    if (
      this.spaceship &&
      this.spaceship.active &&
      this.spaceship.canTakeDamage()
    ) {
      for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
        const projectile = this.bossProjectiles[i];
        if (projectile && projectile.active) {
          // Check spaceship still exists before collision check
          if (
            this.spaceship &&
            this.spaceship.active &&
            this.spaceship.checkCollision(projectile)
          ) {
            this.spaceshipDestroyed();
            this.bossProjectiles.splice(i, 1);
            break; // Exit loop after spaceship destruction
          }
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
      if (!missile || !missile.active) continue;

      // Check vs asteroids
      for (
        let asteroidIndex = this.asteroids.length - 1;
        asteroidIndex >= 0;
        asteroidIndex--
      ) {
        const asteroid = this.asteroids[asteroidIndex];
        if (!asteroid || !asteroid.active) continue;

        if (missile.checkCollision(asteroid)) {
          const baseScore = asteroid.getScore() * 2; // Bonus for homing missile
          const comboMultiplier = this.game.achievements.getComboMultiplier();
          const score = this.game.difficulty.getScoreValue(
            baseScore * comboMultiplier
          );
          this.game.addScore(score);
          this.floatingTextManager.addScoreText(asteroid.position, score);
          this.particleSystem.createExplosion(
            asteroid.position,
            "#ff9900",
            10,
            "bright"
          );

          const settings = this.game.difficulty.getCurrentSettings();
          const fragments = asteroid.split(settings.asteroidSpeedMultiplier);
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
        if (!enemy || !enemy.active) continue;

        if (missile.checkCollision(enemy)) {
          if (enemy.takeDamage(2)) {
            // Homing missiles do more damage
            const baseScore = enemy.getScore() * 2;
            const comboMultiplier = this.game.achievements.getComboMultiplier();
            const score = this.game.difficulty.getScoreValue(
              baseScore * comboMultiplier
            );
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
    if (!this.spaceship || !this.spaceship.active) return; // Prevent double destruction

    try {
      // Mark spaceship as inactive to prevent double destruction
      this.spaceship.active = false;

      // Create explosion effect
      this.particleSystem.createExplosion(
        this.spaceship.position,
        "#ff6600",
        12
      );
      this.particleSystem.createDebris(this.spaceship.position, 8);

      // Play explosion sound and strong screen shake
      this.game.sound.playSound("explosion", 0.8, 0.7);
      this.game.shake.shake(15, 500);

      this.spaceship.destroy();
      this.spaceship = null;

      // Reset shield on death
      this.shield = null;

      // Lose a life (unless infinite lives cheat is active)
      if (!this.infiniteLives) {
        this.game.loseLife();
      }

      // Reset achievement streaks on death
      this.game.achievements.resetStreaks();

      if (this.game.lives <= 0 && !this.infiniteLives) {
        // Play game over sound
        this.game.sound.playSound("gameOver", 0.6);
      } else {
        this.isRespawning = true;
        this.respawnTimer = 0;
      }
    } catch (error) {
      console.error("Error in spaceshipDestroyed:", error);
      // Ensure cleanup even if there's an error
      if (this.spaceship) {
        this.spaceship.destroy();
        this.spaceship = null;
      }
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

    // Check if this is a warp tunnel level (every 3rd level)
    if (this.game.level % 3 === 0) {
      // Enter warp tunnel bonus stage
      this.game.enterWarpTunnel();
      return;
    }

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

    // Render boss
    if (this.boss) {
      this.boss.render(ctx);
    }

    // Render boss projectiles
    this.bossProjectiles.forEach((projectile) => projectile.render(ctx));

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

    // Render boss intro warning
    if (this.showingBossIntro) {
      const alpha =
        Math.sin((this.bossIntroTimer / 3000) * Math.PI * 4) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "⚠ WARNING: BOSS INCOMING ⚠",
        this.game.canvasWidth / 2,
        this.game.canvasHeight / 2
      );
      ctx.restore();
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
