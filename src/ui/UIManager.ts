import { GameState } from '../core/GameState.ts';
import { HUD } from './HUD.ts';
import { MainMenuView } from './MainMenuView.ts';
import { ShopView } from './ShopView.ts';
import { SettingsView } from './SettingsView.ts';
import { GameOverView } from './GameOverView.ts';
import { PauseView } from './PauseView.ts';
import { TutorialOverlay } from './TutorialOverlay.ts';

export class UIManager {
  public hud: HUD;
  public mainMenu: MainMenuView;
  public shop: ShopView;
  public settings: SettingsView;
  public gameOver: GameOverView;
  public pause: PauseView;
  public tutorial: TutorialOverlay;

  constructor() {
    this.hud = new HUD();
    this.mainMenu = new MainMenuView();
    this.shop = new ShopView();
    this.settings = new SettingsView();
    this.gameOver = new GameOverView();
    this.pause = new PauseView();
    this.tutorial = new TutorialOverlay();
  }

  public update(dt: number, state: GameState): void {
    switch (state) {
      case GameState.MAIN_MENU:
        this.mainMenu.update(dt);
        break;
      case GameState.PLAYING:
        this.hud.update(dt);
        this.tutorial.update(dt);
        break;
      case GameState.SHOP:
        this.shop.update(dt);
        break;
      case GameState.GAME_OVER:
        this.gameOver.update(dt);
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D, state: GameState, currentFloor: number): void {
    switch (state) {
      case GameState.MAIN_MENU:
        this.mainMenu.render(ctx);
        break;

      case GameState.PLAYING:
        this.hud.render(ctx, currentFloor);
        this.tutorial.render(ctx, currentFloor);
        break;

      case GameState.PAUSED:
        this.hud.render(ctx, currentFloor);
        this.pause.render(ctx);
        break;

      case GameState.SHOP:
        this.shop.render(ctx);
        break;

      case GameState.SETTINGS:
        this.settings.render(ctx);
        break;

      case GameState.GAME_OVER:
        this.gameOver.render(ctx);
        break;
    }
  }

  public hitTest(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }
}
