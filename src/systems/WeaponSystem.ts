import { Bullet } from '../entities/Bullet';
import { PowerUpType } from '../entities/PowerUp';
import type { Vector2 } from '../utils/Vector2';

export interface ActivePowerUp {
  type: PowerUpType;
  timeRemaining: number;
}

export class WeaponSystem {
  private activePowerUps: ActivePowerUp[] = [];
  private lastShotTime: number = 0;
  private baseShotCooldown: number = 250; // Base cooldown in milliseconds

  update(deltaTime: number): void {
    // Update power-up timers
    this.activePowerUps = this.activePowerUps.filter(powerUp => {
      powerUp.timeRemaining -= deltaTime;
      return powerUp.timeRemaining > 0;
    });
  }

  canShoot(): boolean {
    const currentTime = Date.now();
    const cooldown = this.getCurrentShotCooldown();
    return currentTime - this.lastShotTime >= cooldown;
  }

  private getCurrentShotCooldown(): number {
    if (this.hasPowerUp(PowerUpType.RAPID_FIRE)) {
      return this.baseShotCooldown * 0.3; // 70% faster
    }
    return this.baseShotCooldown;
  }

  shoot(position: Vector2, direction: number): Bullet[] {
    if (!this.canShoot()) return [];

    this.lastShotTime = Date.now();
    const bullets: Bullet[] = [];

    if (this.hasPowerUp(PowerUpType.TRIPLE_SHOT)) {
      // Fire three bullets
      bullets.push(new Bullet(position, direction - 0.2)); // Left
      bullets.push(new Bullet(position, direction));       // Center
      bullets.push(new Bullet(position, direction + 0.2)); // Right
    } else if (this.hasPowerUp(PowerUpType.SPREAD_SHOT)) {
      // Fire five bullets in spread pattern
      const spreadAngle = 0.15;
      for (let i = -2; i <= 2; i++) {
        bullets.push(new Bullet(position, direction + (i * spreadAngle)));
      }
    } else {
      // Normal single shot
      bullets.push(new Bullet(position, direction));
    }

    // Apply power shot effect if active
    if (this.hasPowerUp(PowerUpType.POWER_SHOT)) {
      bullets.forEach(bullet => {
        bullet.setPiercing(true);
        bullet.setDamage(2);
      });
    }

    return bullets;
  }

  addPowerUp(type: PowerUpType, duration: number): void {
    // Remove existing power-up of the same type
    this.activePowerUps = this.activePowerUps.filter(powerUp => powerUp.type !== type);
    
    // Add new power-up
    this.activePowerUps.push({
      type,
      timeRemaining: duration
    });
  }

  hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some(powerUp => powerUp.type === type);
  }

  getActivePowerUps(): ActivePowerUp[] {
    return [...this.activePowerUps];
  }

  getSoundForCurrentWeapon(): string {
    if (this.hasPowerUp(PowerUpType.RAPID_FIRE)) {
      return 'rapidFire';
    } else if (this.hasPowerUp(PowerUpType.TRIPLE_SHOT) || this.hasPowerUp(PowerUpType.SPREAD_SHOT)) {
      return 'tripleFire';
    }
    return 'shoot';
  }

  reset(): void {
    this.activePowerUps = [];
    this.lastShotTime = 0;
  }
}