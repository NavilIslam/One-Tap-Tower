import { GameManager } from './core/GameManager.ts';
import { InputManager } from './core/InputManager.ts';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Failed to locate #game-canvas');
    return;
  }

  InputManager.getInstance().init(canvas);
  const game = new GameManager(canvas);
  game.start();

  // Register PWA Service Worker for offline support & mobile installation
  if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost') && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
});
