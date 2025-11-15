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
    this.createHomingMissileSound();
    this.createShieldSound();
    this.createHyperspaceSound();
    this.createSlowMotionSound();
    this.createComboIncreaseSound();
    this.createComboMilestoneSound();
    this.createComboBreakSound();
  }

  private createShootSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25; // Extended for more satisfying sound
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Ultra-modern sci-fi laser with complex modulation
      const baseFreq = 1800; // Very high starting frequency for cutting laser feel
      const sweepFreq = baseFreq - Math.pow(t, 0.8) * 1200; // Non-linear frequency sweep
      const harmonicFreq = sweepFreq * 1.618; // Golden ratio harmonic
      const subHarmonic = sweepFreq * 0.382; // Golden ratio sub-harmonic

      // Complex envelope with punch and sustain
      const attack = Math.min(1, Math.pow(t * 50, 0.3)); // Shaped attack
      const decay = Math.exp(-t * 6) * (1 + Math.sin(t * 30) * 0.1); // Decay with micro-tremolo
      const envelope = attack * decay;

      // Multi-layer synthesis for rich laser sound
      const fundamental = Math.sin(2 * Math.PI * sweepFreq * t) * 0.65;
      const harmonic = Math.sin(2 * Math.PI * harmonicFreq * t) * 0.3;
      const subHarm = Math.sin(2 * Math.PI * subHarmonic * t) * 0.2;

      // Electric spark texture
      const sparkEnv = Math.exp(-t * 30) * Math.pow(Math.random(), 3);
      const spark = (Math.random() * 2 - 1) * sparkEnv * 0.12;

      // Frequency modulation for sci-fi character
      const fm = Math.sin(2 * Math.PI * 8 * t) * 20; // FM sweep
      const fmTone = Math.sin(2 * Math.PI * (sweepFreq + fm) * t) * 0.15;

      // Stereo-width simulation and phase effects
      const phase = Math.sin(t * 25) * 0.08;

      data[i] =
        (fundamental + harmonic + subHarm + spark + fmTone + phase) *
        envelope *
        0.45;
    }

    this.sounds.set("shoot", buffer);
  }

  private createRapidFireSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1; // Slightly longer for more punch
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Higher pitched, more aggressive rapid fire sound
      const baseFreq = 2000; // Higher starting frequency
      const sweepFreq = baseFreq - Math.pow(t, 0.6) * 800; // Non-linear sweep for punch

      // Snappy attack with controlled decay
      const envelope = Math.exp(-t * 30) * (1 - Math.exp(-t * 120));

      // Multi-layered rapid fire synthesis
      const fundamental = Math.sin(2 * Math.PI * sweepFreq * t) * 0.7;
      const harmonic = Math.sin(2 * Math.PI * sweepFreq * 1.4 * t) * 0.3;

      // Sharp digital click for modern feel
      const digitalClick =
        Math.exp(-t * 150) * Math.sign(Math.sin(2 * Math.PI * 50 * t)) * 0.2;

      // High-frequency sizzle
      const sizzle = (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.15;

      // Slight FM for character
      const fm = Math.sin(2 * Math.PI * 12 * t) * 15;
      const fmTone = Math.sin(2 * Math.PI * (sweepFreq + fm) * t) * 0.2;

      data[i] =
        (fundamental + harmonic + digitalClick + sizzle + fmTone) *
        envelope *
        0.4;
    }

    this.sounds.set("rapidFire", buffer);
  }

  private createTripleFireSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15; // Longer for more impressive sound
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Deeper, more powerful sound for triple fire with complex modulation
      const baseFreq = 1100; // Lower for more power
      const sweepFreq = baseFreq - Math.pow(t, 0.7) * 450; // Non-linear sweep

      const envelope = Math.exp(-t * 15) * (1 - Math.exp(-t * 50));

      // Multi-harmonic synthesis for rich, powerful sound
      const fundamental = Math.sin(2 * Math.PI * sweepFreq * t) * 0.65;
      const harmonic2 = Math.sin(2 * Math.PI * sweepFreq * 1.5 * t) * 0.35;
      const harmonic3 = Math.sin(2 * Math.PI * sweepFreq * 2.2 * t) * 0.2;
      const subHarmonic = Math.sin(2 * Math.PI * sweepFreq * 0.6 * t) * 0.25;

      // Powerful low-end for impact
      const bass =
        Math.sin(2 * Math.PI * (sweepFreq * 0.4) * t) * 0.3 * Math.exp(-t * 10);

      // Distortion for aggressive character
      const preDistortion = fundamental + harmonic2 + subHarmonic;
      const distorted =
        Math.sign(preDistortion) *
        Math.pow(Math.abs(preDistortion), 0.75) *
        0.15;

      // Electric crackle for energy
      const crackle = (Math.random() * 2 - 1) * Math.exp(-t * 25) * 0.12;

      // FM modulation for sci-fi character
      const fm = Math.sin(2 * Math.PI * 8 * t) * 25;
      const fmTone = Math.sin(2 * Math.PI * (sweepFreq + fm) * t) * 0.2;

      data[i] =
        (fundamental +
          harmonic2 +
          harmonic3 +
          subHarmonic +
          bass +
          distorted +
          crackle +
          fmTone) *
        envelope *
        0.5;
    }

    this.sounds.set("tripleFire", buffer);
  }

  private createPowerUpSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6; // Longer for more celebration
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Multi-phase envelope for celebratory progression
      const phase1 = Math.exp(-Math.pow(t - 0.1, 2) * 50) * 0.8; // Initial chime
      const phase2 = Math.exp(-Math.pow(t - 0.25, 2) * 30) * 0.6; // Second harmonic
      const phase3 = Math.exp(-Math.pow(t - 0.4, 2) * 20) * 0.4; // Final sparkle
      const envelope = Math.max(phase1, phase2, phase3);

      // Magical chord progression (major triad arpeggiation)
      const fundamental = 523; // C5
      const third = 659; // E5
      const fifth = 784; // G5
      const octave = 1047; // C6

      // Ascending magical chimes
      let currentFreq = fundamental;
      if (t > 0.15) currentFreq = third;
      if (t > 0.3) currentFreq = fifth;
      if (t > 0.45) currentFreq = octave;

      // Main chime tone with harmonics
      const chime = Math.sin(2 * Math.PI * currentFreq * t) * 0.6;
      const harmonic2 = Math.sin(2 * Math.PI * currentFreq * 2 * t) * 0.25;
      const harmonic3 = Math.sin(2 * Math.PI * currentFreq * 3 * t) * 0.15;

      // Sparkling high-frequency content
      const sparkleFreq = 2000 + Math.sin(t * 30) * 500;
      const sparkle =
        Math.sin(2 * Math.PI * sparkleFreq * t) * Math.exp(-t * 8) * 0.3;

      // Bell-like resonance
      const bellEnv = Math.exp(-t * 4) * Math.sin(t * 12) * 0.1;
      const bell = Math.sin(2 * Math.PI * (currentFreq * 1.2) * t) * bellEnv;

      // Chorus effect for richness
      const chorus1 = Math.sin(2 * Math.PI * (currentFreq + 3) * t) * 0.15;
      const chorus2 = Math.sin(2 * Math.PI * (currentFreq - 2) * t) * 0.12;

      // Gentle tremolo for organic feel
      const tremolo = 1 + Math.sin(t * 8) * 0.1;

      data[i] =
        (chime + harmonic2 + harmonic3 + sparkle + bell + chorus1 + chorus2) *
        envelope *
        tremolo *
        0.5;
    }

    this.sounds.set("powerUp", buffer);
  }

  private createExplosionSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8; // Longer for more dramatic impact
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Complex multi-stage explosion envelope
      const initialBlast = Math.exp(-t * 25) * (1 - Math.exp(-t * 100)); // Initial punch
      const rumble = Math.exp(-t * 3) * Math.sin(t * 8) * 0.5; // Rolling rumble
      const envelope = initialBlast + Math.abs(rumble);

      // Multi-layered explosion components

      // Deep impact boom (sub-bass)
      const subBass =
        Math.sin(2 * Math.PI * (40 + Math.sin(t * 12) * 15) * t) * 0.4;

      // Mid-range explosion crackle
      const midRange = Math.sin(2 * Math.PI * (120 - t * 80) * t) * 0.3;

      // High-frequency debris and sparks
      const debris = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.35;

      // Filtered white noise for explosive texture
      const noise = (Math.random() * 2 - 1) * 0.6;
      const filteredNoise = noise * Math.exp(-t * 6);

      // Harmonic distortion for impact
      const distortion =
        Math.sign(subBass + midRange) *
        Math.pow(Math.abs(subBass + midRange), 0.7) *
        0.2;

      // Doppler-like effect for realism
      const doppler =
        Math.sin(2 * Math.PI * (80 + t * 30) * t) * Math.exp(-t * 10) * 0.25;

      // Combine all explosion elements
      data[i] =
        (subBass + midRange + debris + filteredNoise + distortion + doppler) *
        envelope *
        0.55;
    }

    this.sounds.set("explosion", buffer);
  }

  private createSmallExplosionSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.35; // Longer for more satisfying pop
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Sharp attack with quick decay for small explosion
      const attack = Math.min(1, t * 80);
      const decay = Math.exp(-t * 15);
      const envelope = attack * decay;

      // High-frequency pop with harmonics
      const popFreq = 800 - t * 400; // Quick frequency drop
      const pop = Math.sin(2 * Math.PI * popFreq * t) * 0.7;

      // Harmonic content for richness
      const harmonic2 = Math.sin(2 * Math.PI * popFreq * 2 * t) * 0.3;
      const harmonic3 = Math.sin(2 * Math.PI * popFreq * 3 * t) * 0.15;

      // Crispy high-frequency content
      const crackle = (Math.random() * 2 - 1) * Math.exp(-t * 20) * 0.4;

      // Slight click for punch
      const click = Math.exp(-t * 50) * Math.sin(2 * Math.PI * 200 * t) * 0.3;

      // Add subtle FM for character
      const fm = Math.sin(2 * Math.PI * 15 * t) * 10;
      const fmTone = Math.sin(2 * Math.PI * (popFreq + fm) * t) * 0.2;

      data[i] =
        (pop + harmonic2 + harmonic3 + crackle + click + fmTone) *
        envelope *
        0.45;
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
    const duration = 1.5; // Longer for dramatic effect
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Dramatic descending progression with multiple stages
      const envelope = Math.exp(-t * 1.2) * (1 + Math.sin(t * 6) * 0.1); // Tremolo for drama

      // Deep, ominous bass progression
      const bassFreq = 80 * Math.exp(-t * 1.5) + 40; // Descends to very low frequency
      const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.6;

      // Mid-range harmonic dissonance
      const midFreq = 220 * Math.exp(-t * 2);
      const mid = Math.sin(2 * Math.PI * midFreq * t) * 0.4;

      // High-frequency "defeat" bell
      const bellFreq = 400 * Math.exp(-t * 3);
      const bell = Math.sin(2 * Math.PI * bellFreq * t) * 0.3;

      // Distortion for dramatic impact
      const combined = bass + mid + bell;
      const distorted =
        Math.sign(combined) * Math.pow(Math.abs(combined), 0.8) * 0.2;

      // Dark reverb simulation
      const reverb =
        Math.sin(2 * Math.PI * (bassFreq * 0.5) * (t + 0.1)) *
        0.15 *
        Math.exp(-t * 0.8);

      // Optional dark noise for atmosphere
      const atmosphereNoise = (Math.random() * 2 - 1) * 0.05 * envelope;

      data[i] =
        (bass + mid + bell + distorted + reverb + atmosphereNoise) *
        envelope *
        0.4;
    }

    this.sounds.set("gameOver", buffer);
  }

  private createLevelUpSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 1.2; // Longer for triumphant celebration
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Victory fanfare progression
      const envelope = Math.exp(-t * 1.5) * (1 + Math.sin(t * 4) * 0.15); // Triumphant tremolo

      // Heroic ascending chord progression
      let baseFreq = 262; // C4
      if (t > 0.3) baseFreq = 330; // E4
      if (t > 0.6) baseFreq = 392; // G4
      if (t > 0.9) baseFreq = 523; // C5 (octave)

      // Rich harmonic content for fanfare feeling
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t) * 0.6;
      const third = Math.sin(2 * Math.PI * baseFreq * 1.25 * t) * 0.4; // Major third
      const fifth = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.35; // Perfect fifth
      const octave = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.25; // Octave

      // Trumpet-like brass harmonics
      const brass2 = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.15;
      const brass3 = Math.sin(2 * Math.PI * baseFreq * 4 * t) * 0.1;

      // Sparkle and shimmer for magic feel
      const sparkleFreq = 1500 + Math.sin(t * 25) * 300;
      const sparkle =
        Math.sin(2 * Math.PI * sparkleFreq * t) * Math.exp(-t * 6) * 0.2;

      // Bell-like sustain for richness
      const bellSustain =
        Math.sin(2 * Math.PI * baseFreq * 1.618 * t) * Math.exp(-t * 3) * 0.2;

      // Slight chorus for width
      const chorus1 = Math.sin(2 * Math.PI * (baseFreq + 2) * t) * 0.1;
      const chorus2 = Math.sin(2 * Math.PI * (baseFreq - 1.5) * t) * 0.08;

      data[i] =
        (fundamental +
          third +
          fifth +
          octave +
          brass2 +
          brass3 +
          sparkle +
          bellSustain +
          chorus1 +
          chorus2) *
        envelope *
        0.35;
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

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }

  private createHomingMissileSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Warbling, seeking missile sound
      const baseFreq = 200 + Math.sin(t * 15) * 100; // Oscillating frequency
      const sweepFreq = baseFreq + t * 300; // Rising pitch

      const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 20));
      const warble = Math.sin(2 * Math.PI * sweepFreq * t);
      const modulation = Math.sin(2 * Math.PI * t * 8) * 0.3; // Warbling effect

      data[i] = warble * (1 + modulation) * envelope * 0.3;
    }

    this.sounds.set("homingMissile", buffer);
  }

  private createShieldSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Shimmering shield activation sound
      const freq1 = 600 + Math.sin(t * 30) * 100;
      const freq2 = 800 + Math.cos(t * 20) * 80;

      const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 15));
      const shimmer1 = Math.sin(2 * Math.PI * freq1 * t);
      const shimmer2 = Math.sin(2 * Math.PI * freq2 * t);

      data[i] = (shimmer1 + shimmer2 * 0.7) * envelope * 0.25;
    }

    this.sounds.set("shield", buffer);
  }

  private createHyperspaceSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.8;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Swooshing hyperspace jump sound
      const sweepFreq = 1500 * Math.exp(-t * 4) + 200; // Rapid frequency drop
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 2); // Fading noise

      const envelope = Math.exp(-t * 2.5);
      const sweep = Math.sin(2 * Math.PI * sweepFreq * t);

      data[i] = (sweep * 0.6 + noise * 0.4) * envelope * 0.4;
    }

    this.sounds.set("hyperspace", buffer);
  }

  private createSlowMotionSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Deep, time-slowing effect
      const baseFreq = 80 - t * 30; // Deep descending tone
      const modFreq = 3; // Slow modulation

      const envelope = 1 - Math.exp(-t * 8); // Slow attack
      const tone = Math.sin(2 * Math.PI * baseFreq * t);
      const modulation = Math.sin(2 * Math.PI * modFreq * t) * 0.2;

      data[i] = tone * (1 + modulation) * envelope * 0.3;
    }

    this.sounds.set("slowMotion", buffer);
  }

  private createComboIncreaseSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Rising pitch chime (200-600Hz)
      const freq = 200 + (t / duration) * 400;
      const envelope = Math.exp(-t * 10); // Fast decay

      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }

    this.sounds.set("comboIncrease", buffer);
  }

  private createComboMilestoneSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Triumphant burst with harmonics
      const baseFreq = 440;
      const tone1 = Math.sin(2 * Math.PI * baseFreq * t);
      const tone2 = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.5;
      const tone3 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.3;

      const envelope = Math.exp(-t * 5);

      data[i] = (tone1 + tone2 + tone3) * envelope * 0.3;
    }

    this.sounds.set("comboMilestone", buffer);
  }

  private createComboBreakSound(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Descending "deflate" sound (600-100Hz)
      const freq = 600 - (t / duration) * 500;
      const envelope = 1 - t / duration; // Linear fade

      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25;
    }

    this.sounds.set("comboBreak", buffer);
  }
}
