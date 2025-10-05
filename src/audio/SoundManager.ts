export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private masterVolume: number = 0.3;

  constructor() {
    this.initializeAudioContext();
    this.generateSounds();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Handle audio context state changes
      if (this.audioContext.state === "suspended") {
        // Resume on user interaction
        const resumeAudio = () => {
          if (this.audioContext && this.audioContext.state === "suspended") {
            this.audioContext.resume();
          }
          document.removeEventListener("click", resumeAudio);
          document.removeEventListener("keydown", resumeAudio);
        };

        document.addEventListener("click", resumeAudio);
        document.addEventListener("keydown", resumeAudio);
      }
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
      this.isEnabled = false;
    }
  }

  private generateSounds(): void {
    if (!this.audioContext) return;

    // Generate procedural sounds
    this.createShootSound();
    this.createRapidFireSound();
    this.createTripleFireSound();
    this.createPowerUpSound();
    this.createExplosionSound();
    this.createThrustSound();
    this.createSmallExplosionSound();
    this.createGameOverSound();
    this.createLevelUpSound();
  }

  private createShootSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Multi-layered laser sound
      const baseFreq = 1200;
      const sweepFreq = baseFreq - (t * 800); // Frequency sweep down
      const harmonicFreq = sweepFreq * 1.5; // Harmonic
      
      // Sharp attack, quick decay
      const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 50));
      
      // Add some harmonic content for richness
      const fundamental = Math.sin(2 * Math.PI * sweepFreq * t) * 0.7;
      const harmonic = Math.sin(2 * Math.PI * harmonicFreq * t) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 30); // Quick noise burst
      
      data[i] = (fundamental + harmonic + noise) * envelope * 0.4;
    }

    this.sounds.set("shoot", buffer);
  }

  private createRapidFireSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Higher pitched, shorter rapid fire sound
      const baseFreq = 1600;
      const sweepFreq = baseFreq - (t * 400);
      
      // Very quick attack and decay
      const envelope = Math.exp(-t * 25) * (1 - Math.exp(-t * 80));
      
      const fundamental = Math.sin(2 * Math.PI * sweepFreq * t) * 0.8;
      const click = Math.exp(-t * 100) * 0.2; // Sharp click
      
      data[i] = (fundamental + click) * envelope * 0.35;
    }

    this.sounds.set("rapidFire", buffer);
  }

  private createTripleFireSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.12;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Deeper, more powerful sound for triple fire
      const baseFreq = 900;
      const sweepFreq = baseFreq - (t * 300);
      
      const envelope = Math.exp(-t * 12) * (1 - Math.exp(-t * 40));
      
      // Add multiple harmonics for richness
      const fundamental = Math.sin(2 * Math.PI * sweepFreq * t) * 0.6;
      const harmonic2 = Math.sin(2 * Math.PI * sweepFreq * 1.33 * t) * 0.3;
      const harmonic3 = Math.sin(2 * Math.PI * sweepFreq * 2 * t) * 0.1;
      
      data[i] = (fundamental + harmonic2 + harmonic3) * envelope * 0.45;
    }

    this.sounds.set("tripleFire", buffer);
  }

  private createPowerUpSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      
      // Rising tone with sparkle
      const frequency = 300 + (t * 800); // Rising frequency
      const sparkle = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.2; // High freq sparkle
      const envelope = Math.exp(-t * 3) * Math.sin(t * 8); // Modulated envelope
      
      const tone = Math.sin(2 * Math.PI * frequency * t) * 0.8;
      
      data[i] = (tone + sparkle) * envelope * 0.3;
    }

    this.sounds.set("powerUp", buffer);
  }

  private createExplosionSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Noise-based explosion with low-pass filtering
      const noise = Math.random() * 2 - 1;
      const envelope = Math.exp(-t * 3);
      const lowPass = Math.sin(2 * Math.PI * (100 - t * 80) * t);
      data[i] = (noise * 0.5 + lowPass * 0.5) * envelope * 0.4;
    }

    this.sounds.set("explosion", buffer);
  }

  private createSmallExplosionSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      const envelope = Math.exp(-t * 8);
      const tone = Math.sin(2 * Math.PI * (200 - t * 150) * t);
      data[i] = (noise * 0.3 + tone * 0.7) * envelope * 0.3;
    }

    this.sounds.set("smallExplosion", buffer);
  }

  private createThrustSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Low rumbling sound
      const frequency = 60 + Math.sin(t * 20) * 10;
      const noise = (Math.random() * 2 - 1) * 0.3;
      const tone = Math.sin(2 * Math.PI * frequency * t) * 0.7;
      data[i] = (noise + tone) * 0.2;
    }

    this.sounds.set("thrust", buffer);
  }

  private createGameOverSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.0;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Descending tone
      const frequency = 400 * Math.exp(-t * 2);
      const envelope = Math.exp(-t * 1);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    this.sounds.set("gameOver", buffer);
  }

  private createLevelUpSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Ascending triumphant sound
      const frequency = 200 + t * 400;
      const envelope = Math.exp(-t * 2);
      const harmony =
        Math.sin(2 * Math.PI * frequency * t) +
        Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.5;
      data[i] = harmony * envelope * 0.2;
    }

    this.sounds.set("levelUp", buffer);
  }

  public playSound(
    soundName: string,
    volume: number = 1.0,
    pitch: number = 1.0
  ): void {
    if (!this.isEnabled || !this.audioContext || !this.sounds.has(soundName)) {
      return;
    }

    try {
      const buffer = this.sounds.get(soundName)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.playbackRate.value = pitch;
      gainNode.gain.value = volume * this.masterVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      console.warn("Error playing sound:", error);
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }
}
