# Asteroids Classic

A modern implementation of the classic 2D Asteroids arcade game built with TypeScript, Vite, and HTML5 Canvas.

## Features

- **Classic Gameplay**: Navigate your spaceship through space, shooting asteroids and avoiding collisions
- **Physics-Based Movement**: Realistic inertia and momentum-based ship controls
- **Progressive Difficulty**: Increasing number of asteroids with each level
- **Immersive Audio**: Procedurally generated sound effects for shooting, explosions, thrust, and game events
- **Screen Shake Effects**: Dynamic camera shake that responds to explosions and impacts
- **Floating Score Text**: Animated score displays that zoom and float when asteroids are destroyed
- **Particle Effects**: Visual explosions, thrust trails, and debris effects
- **Responsive Controls**: Smooth keyboard input handling
- **Game States**: Menu, gameplay, pause, and game over screens
- **Score System**: Points awarded based on asteroid size with visual feedback
- **Lives System**: Multiple lives with temporary invulnerability after respawn

## Controls

- **Arrow Keys** or **WASD**: Move spaceship
  - Up/W: Thrust forward
  - Left/A: Rotate left
  - Right/D: Rotate right
- **Spacebar**: Shoot bullets
- **ESC**: Pause/unpause game
- **Enter/Space**: Start game or continue from menu

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd asteroids-classic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── audio/
│   └── SoundManager.ts  # Procedural sound generation with Web Audio API
├── core/
│   ├── Game.ts          # Main game loop and state management
│   └── GameObject.ts    # Base class for all game entities
├── entities/
│   ├── Spaceship.ts     # Player spaceship with physics
│   ├── Asteroid.ts      # Asteroid entities with splitting behavior
│   └── Bullet.ts        # Projectile entities
├── effects/
│   ├── ParticleSystem.ts # Particle effects for explosions and thrust
│   ├── ScreenShake.ts   # Camera shake effects for impacts
│   └── FloatingText.ts  # Animated score and level text displays
├── managers/
│   └── GameManager.ts   # Coordinates all game entities and systems
├── utils/
│   └── Vector2.ts       # 2D vector mathematics utilities
├── main.ts              # Application entry point
└── style.css            # Global styles
```

## Game Mechanics

### Spaceship
- Thrust-based movement with momentum
- Wraps around screen edges
- Temporary invulnerability after respawn
- Realistic physics with inertia and friction

### Asteroids
- Three sizes: Large, Medium, Small
- Split into smaller pieces when shot
- Irregular, procedurally generated shapes
- Different point values based on size

### Collision Detection
- Circular collision detection for performance
- Handles spaceship-asteroid and bullet-asteroid collisions
- Explosion effects with particle systems

### Scoring
- Large asteroids: 20 points
- Medium asteroids: 50 points
- Small asteroids: 100 points
- Level completion bonus: 1000 × level number

## Technologies Used

- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **HTML5 Canvas**: 2D graphics rendering
- **CSS3**: Styling and layout
- **Modern ES6+**: Latest JavaScript features

## Browser Compatibility

This game uses modern web technologies and is compatible with:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by the original Asteroids arcade game by Atari (1979)
- Built with modern web technologies for educational purposes
- Particle effects inspired by contemporary game development practices