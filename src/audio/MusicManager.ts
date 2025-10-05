export interface MusicTrack {
  name: string;
  url: string;
  volume?: number;
  loop?: boolean;
}

export class MusicManager {
  private tracks: Map<string, HTMLAudioElement> = new Map();
  private currentTrack: HTMLAudioElement | null = null;
  private currentTrackName: string = "";
  private isEnabled: boolean = true;
  private masterVolume: number = 0.3; // Low volume by default
  private fadeInterval: number | null = null;
  private playlist: string[] = [];
  private currentPlaylistIndex: number = 0;
  private isPlayingPlaylist: boolean = false;

  // Define available music tracks
  private readonly musicTracks: MusicTrack[] = [
    {
      name: "cosmic_collision",
      url: "/audio/cosmic_collision.mp3",
      volume: 0.2,
      loop: true,
    },
    {
      name: "space_ambient",
      url: "/audio/space_ambient.mp3",
      volume: 0.3,
      loop: true,
    },
    {
      name: "retro_synth",
      url: "/audio/retro_synth.mp3",
      volume: 0.35,
      loop: true,
    },
    {
      name: "electronic_beats",
      url: "/audio/electronic_beats.mp3",
      volume: 0.4,
      loop: true,
    },
    {
      name: "menu_theme",
      url: "/audio/menu_theme.mp3",
      volume: 0.25,
      loop: true,
    },
  ];

  constructor() {
    this.loadTracks();
    this.setupEventListeners();
  }

  private async loadTracks(): Promise<void> {
    for (const track of this.musicTracks) {
      try {
        const audio = new Audio(track.url);
        audio.preload = "auto";
        audio.loop = track.loop || false;
        audio.volume = (track.volume || 0.3) * this.masterVolume;

        // Handle loading errors gracefully
        audio.addEventListener("error", () => {
          console.warn(`Failed to load music track: ${track.name}`);
        });

        // Handle successful loading
        audio.addEventListener("canplaythrough", () => {
          console.log(`Loaded music track: ${track.name}`);
        });

        this.tracks.set(track.name, audio);
      } catch (error) {
        console.warn(`Error loading track ${track.name}:`, error);
      }
    }
  }

  private setupEventListeners(): void {
    // Handle visibility change to pause/resume music
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseCurrentTrack();
      } else if (this.isEnabled && this.currentTrack) {
        this.resumeCurrentTrack();
      }
    });
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  public isEnabledState(): boolean {
    return this.isEnabled;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  private updateAllVolumes(): void {
    for (const [trackName, audio] of this.tracks) {
      const trackData = this.musicTracks.find((t) => t.name === trackName);
      if (trackData) {
        audio.volume = (trackData.volume || 0.3) * this.masterVolume;
      }
    }
  }

  public playTrack(trackName: string, fadeIn: boolean = true): void {
    if (!this.isEnabled) return;

    const track = this.tracks.get(trackName);
    if (!track) {
      console.warn(`Track not found: ${trackName}`);
      return;
    }

    // Stop current track if playing
    if (this.currentTrack && this.currentTrack !== track) {
      if (fadeIn) {
        this.fadeOut(this.currentTrack, () => {
          this.startTrack(track, trackName, fadeIn);
        });
      } else {
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
        this.startTrack(track, trackName, fadeIn);
      }
    } else {
      this.startTrack(track, trackName, fadeIn);
    }
  }

  private startTrack(
    track: HTMLAudioElement,
    trackName: string,
    fadeIn: boolean
  ): void {
    this.currentTrack = track;
    this.currentTrackName = trackName;

    if (fadeIn) {
      this.fadeIn(track);
    } else {
      track.currentTime = 0;
      track.play().catch((error) => {
        console.warn(`Failed to play track ${trackName}:`, error);
      });
    }
  }

  public stopCurrentTrack(fadeOut: boolean = true): void {
    if (!this.currentTrack) return;

    if (fadeOut) {
      this.fadeOut(this.currentTrack, () => {
        if (this.currentTrack) {
          this.currentTrack.pause();
          this.currentTrack.currentTime = 0;
        }
        this.currentTrack = null;
        this.currentTrackName = "";
      });
    } else {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
      this.currentTrack = null;
      this.currentTrackName = "";
    }
  }

  public pauseCurrentTrack(): void {
    if (this.currentTrack && !this.currentTrack.paused) {
      this.currentTrack.pause();
    }
  }

  public resumeCurrentTrack(): void {
    if (this.currentTrack && this.currentTrack.paused && this.isEnabled) {
      this.currentTrack.play().catch((error) => {
        console.warn("Failed to resume track:", error);
      });
    }
  }

  public stopAll(): void {
    this.tracks.forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
    this.currentTrack = null;
    this.currentTrackName = "";
  }

  private fadeIn(track: HTMLAudioElement, duration: number = 2000): void {
    const trackData = this.musicTracks.find(
      (t) => t.name === this.currentTrackName
    );
    const targetVolume = (trackData?.volume || 0.3) * this.masterVolume;

    track.volume = 0;
    track.currentTime = 0;
    track.play().catch((error) => {
      console.warn("Failed to play track during fade in:", error);
    });

    const fadeStep = targetVolume / (duration / 50);

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    this.fadeInterval = setInterval(() => {
      if (track.volume < targetVolume) {
        track.volume = Math.min(track.volume + fadeStep, targetVolume);
      } else {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, 50);
  }

  private fadeOut(
    track: HTMLAudioElement,
    callback?: () => void,
    duration: number = 1500
  ): void {
    const fadeStep = track.volume / (duration / 50);

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    this.fadeInterval = setInterval(() => {
      if (track.volume > 0) {
        track.volume = Math.max(track.volume - fadeStep, 0);
      } else {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        track.pause();
        if (callback) callback();
      }
    }, 50);
  }

  // Playlist functionality
  public createPlaylist(trackNames: string[]): void {
    this.playlist = trackNames.filter((name) => this.tracks.has(name));
    this.currentPlaylistIndex = 0;
  }

  public playPlaylist(shuffle: boolean = false): void {
    if (this.playlist.length === 0) return;

    if (shuffle) {
      this.shufflePlaylist();
    }

    this.isPlayingPlaylist = true;
    this.playNextInPlaylist();
  }

  public stopPlaylist(): void {
    this.isPlayingPlaylist = false;
    this.stopCurrentTrack();
  }

  private playNextInPlaylist(): void {
    if (!this.isPlayingPlaylist || this.playlist.length === 0) return;

    const trackName = this.playlist[this.currentPlaylistIndex];
    const track = this.tracks.get(trackName);

    if (track) {
      // Set up track end event to play next track
      const onTrackEnd = () => {
        track.removeEventListener("ended", onTrackEnd);
        this.currentPlaylistIndex =
          (this.currentPlaylistIndex + 1) % this.playlist.length;
        setTimeout(() => this.playNextInPlaylist(), 500); // Small delay between tracks
      };

      track.addEventListener("ended", onTrackEnd);
      this.playTrack(trackName, true);
    }
  }

  private shufflePlaylist(): void {
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [
        this.playlist[j],
        this.playlist[i],
      ];
    }
  }

  public getCurrentTrackName(): string {
    return this.currentTrackName;
  }

  public getAvailableTracks(): string[] {
    return this.musicTracks.map((track) => track.name);
  }

  // Music for different game states
  public playMenuMusic(): void {
    this.playTrack("menu_theme");
  }

  public playGameMusic(): void {
    // Create a playlist of game tracks and play randomly
    const gameTracks = [
      "cosmic_collision",
      "space_ambient",
      "retro_synth",
      "electronic_beats",
    ];
    this.createPlaylist(gameTracks);
    this.playPlaylist(true); // Shuffle the playlist
  }

  public playGameOverMusic(): void {
    this.stopCurrentTrack();
    // Could add a specific game over track here
  }
}
