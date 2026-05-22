import { Game } from './src/game/Game.js';

// Inicializa o jogo
const game = new Game();
game.run();

// Adicionar um cubo à cena
const cube = game.scene.createCube({
  position: [0, 0, -5],
  scale: [1, 1, 1],
  color: [1, 0, 0]
});