import "./style.css";
import {Game} from "./core/Game";

// Create the canvas element
const canvas = document.createElement("canvas");
canvas.id = "game-canvas";
document.body.appendChild(canvas);

// Initialize and start the game
const game = new Game(canvas);
game.start();

console.log("Asteroids game started!");
