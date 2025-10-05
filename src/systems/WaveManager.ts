import {EnemyType} from "../entities/Enemy";
import type {Vector2} from "../utils/Vector2";

export interface WaveConfig {
  waveNumber: number;
  enemies: Array<{
    type: EnemyType;
    count: number;
    spawnDelay: number; // milliseconds between spawning each enemy
  }>;
  totalEnemies: number;
  bonusScore: number;
}

export class WaveManager {
  private currentWave: number = 0;
  private enemiesRemaining: number = 0;
  private isWaveActive: boolean = false;
  private spawnTimer: number = 0;
  private currentSpawnGroup: number = 0;
  private enemiesSpawnedInGroup: number = 0;
  private currentWaveConfig: WaveConfig | null = null;

  constructor() {
    this.generateWaveConfig(1);
  }

  update(deltaTime: number): {
    enemiesToSpawn: Array<{type: EnemyType; position: Vector2}>;
    waveComplete: boolean;
    newWave: boolean;
  } {
    const result = {
      enemiesToSpawn: [] as Array<{type: EnemyType; position: Vector2}>,
      waveComplete: false,
      newWave: false,
    };

    if (!this.isWaveActive || !this.currentWaveConfig) {
      return result;
    }

    this.spawnTimer += deltaTime;

    // Check if we should spawn the next enemy
    const currentGroup = this.currentWaveConfig.enemies[this.currentSpawnGroup];
    if (currentGroup && this.enemiesSpawnedInGroup < currentGroup.count) {
      if (this.spawnTimer >= currentGroup.spawnDelay) {
        // Spawn enemy at random edge position
        const position = this.getRandomSpawnPosition();
        result.enemiesToSpawn.push({
          type: currentGroup.type,
          position,
        });

        this.enemiesSpawnedInGroup++;
        this.spawnTimer = 0;

        // Move to next group if current group is complete
        if (this.enemiesSpawnedInGroup >= currentGroup.count) {
          this.currentSpawnGroup++;
          this.enemiesSpawnedInGroup = 0;

          // If all groups are spawned, wave spawning is complete
          if (this.currentSpawnGroup >= this.currentWaveConfig.enemies.length) {
            // Wave spawning complete, but wave isn't complete until all enemies are defeated
          }
        }
      }
    }

    return result;
  }

  private getRandomSpawnPosition(): Vector2 {
    const margin = 50;
    const canvasWidth = 800; // This should be passed in or made configurable
    const canvasHeight = 600;

    // Spawn from random edge
    const edge = Math.floor(Math.random() * 4);

    switch (edge) {
      case 0: // Top
        return {x: Math.random() * canvasWidth, y: -margin};
      case 1: // Right
        return {x: canvasWidth + margin, y: Math.random() * canvasHeight};
      case 2: // Bottom
        return {x: Math.random() * canvasWidth, y: canvasHeight + margin};
      case 3: // Left
        return {x: -margin, y: Math.random() * canvasHeight};
      default:
        return {x: canvasWidth / 2, y: -margin};
    }
  }

  startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.generateWaveConfig(waveNumber);
    this.isWaveActive = true;
    this.spawnTimer = 0;
    this.currentSpawnGroup = 0;
    this.enemiesSpawnedInGroup = 0;
  }

  private generateWaveConfig(waveNumber: number): void {
    const config: WaveConfig = {
      waveNumber,
      enemies: [],
      totalEnemies: 0,
      bonusScore: waveNumber * 500,
    };

    // Progressive difficulty scaling
    const baseEnemies = Math.min(3 + waveNumber, 15); // Cap at 15 enemies
    let enemiesLeft = baseEnemies;

    // Wave 1-3: Mostly scouts
    if (waveNumber <= 3) {
      const scouts = Math.ceil(enemiesLeft * 0.8);
      const fighters = enemiesLeft - scouts;

      if (scouts > 0) {
        config.enemies.push({
          type: EnemyType.SCOUT,
          count: scouts,
          spawnDelay: 800,
        });
      }

      if (fighters > 0) {
        config.enemies.push({
          type: EnemyType.FIGHTER,
          count: fighters,
          spawnDelay: 1200,
        });
      }
    }
    // Wave 4-7: Mix of scouts and fighters
    else if (waveNumber <= 7) {
      const scouts = Math.ceil(enemiesLeft * 0.5);
      const fighters = Math.ceil(enemiesLeft * 0.4);
      const bombers = Math.max(1, enemiesLeft - scouts - fighters);

      if (scouts > 0) {
        config.enemies.push({
          type: EnemyType.SCOUT,
          count: scouts,
          spawnDelay: 600,
        });
      }

      if (fighters > 0) {
        config.enemies.push({
          type: EnemyType.FIGHTER,
          count: fighters,
          spawnDelay: 1000,
        });
      }

      if (bombers > 0) {
        config.enemies.push({
          type: EnemyType.BOMBER,
          count: bombers,
          spawnDelay: 1500,
        });
      }
    }
    // Wave 8+: Varied composition with more bombers
    else {
      const scouts = Math.ceil(enemiesLeft * 0.3);
      const fighters = Math.ceil(enemiesLeft * 0.4);
      const bombers = enemiesLeft - scouts - fighters;

      if (scouts > 0) {
        config.enemies.push({
          type: EnemyType.SCOUT,
          count: scouts,
          spawnDelay: 500,
        });
      }

      if (fighters > 0) {
        config.enemies.push({
          type: EnemyType.FIGHTER,
          count: fighters,
          spawnDelay: 800,
        });
      }

      if (bombers > 0) {
        config.enemies.push({
          type: EnemyType.BOMBER,
          count: bombers,
          spawnDelay: 1200,
        });
      }
    }

    config.totalEnemies = config.enemies.reduce(
      (sum, group) => sum + group.count,
      0
    );
    this.enemiesRemaining = config.totalEnemies;
    this.currentWaveConfig = config;
  }

  enemyDestroyed(): void {
    this.enemiesRemaining--;
  }

  isWaveComplete(): boolean {
    return (
      this.isWaveActive &&
      this.enemiesRemaining <= 0 &&
      this.currentSpawnGroup >= (this.currentWaveConfig?.enemies.length ?? 0)
    );
  }

  completeWave(): number {
    this.isWaveActive = false;
    const bonusScore = this.currentWaveConfig?.bonusScore ?? 0;

    // Prepare for next wave
    const nextWave = this.currentWave + 1;
    setTimeout(() => {
      this.startWave(nextWave);
    }, 3000); // 3 second delay between waves

    return bonusScore;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getEnemiesRemaining(): number {
    return this.enemiesRemaining;
  }

  isActive(): boolean {
    return this.isWaveActive;
  }

  getTotalEnemiesInWave(): number {
    return this.currentWaveConfig?.totalEnemies ?? 0;
  }

  getWaveProgress(): number {
    const total = this.getTotalEnemiesInWave();
    if (total === 0) return 1;
    return (total - this.enemiesRemaining) / total;
  }
}
