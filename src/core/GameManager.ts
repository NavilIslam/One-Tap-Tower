import { GAME_CONFIG } from '../data/Constants.ts';
import { GameState } from './GameState.ts';
import { EventBus, Events } from './EventBus.ts';
import { InputManager } from './InputManager.ts';
import { CameraController } from './CameraController.ts';
import { Player } from '../entities/Player.ts';
import { ParticleManager } from '../entities/Particle.ts';
import { TowerGenerator } from '../systems/TowerGenerator.ts';
import { BiomeManager } from '../systems/BiomeManager.ts';
import { ScoreManager } from '../systems/ScoreManager.ts';
import { CoinManager } from '../systems/CoinManager.ts';
import { PowerUpManager } from '../systems/PowerUpManager.ts';
import { SaveManager } from '../systems/SaveManager.ts';
import { AudioManager } from '../systems/AudioManager.ts';
import { AnalyticsManager } from '../systems/AnalyticsManager.ts';
import { UIManager } from '../ui/UIManager.ts';

export class GameManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private state: GameState = GameState.LOADING;

  private player: Player;
  private camera: CameraController;
  private particles: ParticleManager;
  private ui: UIManager;

  private lastTime = 0;
  private fps = 60;
  private frameCount = 0;
  private fpsTimer = 0;

  // Brief freeze-frame on big impacts, and a quick white flash on big wins.
  private hitStopTimer = 0;
  private flashAlpha = 0;
  private flashDecay = 2.2;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Failed to obtain 2D rendering context');
    this.ctx = context;

    this.camera = new CameraController();
    this.particles = new ParticleManager();
    this.ui = new UIManager();

    const save = SaveManager.getInstance().getData();
    this.player = new Player(save.selectedCharacter);

    this.setupEventListeners();
    this.setupResizeHandler();
    this.initLoadingSequence();
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    bus.on(Events.PLAYER_JUMP, (pos) => {
      AudioManager.getInstance().playJump();
      InputManager.getInstance().vibrate(12);
      this.particles.emitJumpDust(pos.x, pos.y, this.player.charDef.primaryColor);
    });

    bus.on(Events.PLAYER_DOUBLE_JUMP, (pos) => {
      AudioManager.getInstance().playDoubleJump();
      InputManager.getInstance().vibrate(18);
      this.particles.emitJumpDust(pos.x, pos.y, '#00ff88');
      this.particles.emitFloatingText(pos.x, pos.y - 15, 'DOUBLE JUMP!', '#00ff88');
    });

    bus.on(Events.PLAYER_WALL_JUMP, (data) => {
      AudioManager.getInstance().playWallJump();
      InputManager.getInstance().vibrate(15);
      this.particles.emitWallJumpKick(data.x, data.y, data.wallSide, this.player.charDef.primaryColor);
      this.particles.emitFloatingText(data.x, data.y - 20, 'WALL JUMP!', '#00f0ff');
    });

    bus.on(Events.PLAYER_LAND, (data) => {
      AudioManager.getInstance().playLand(data.impactRatio ?? 0);
      this.particles.emitJumpDust(data.x, data.y, '#ffffff');
      if (data.impactRatio > 0.55) {
        InputManager.getInstance().vibrate(20);
        // Hard landings kick up extra dust and a touch of camera punch.
        this.particles.emitJumpDust(data.x, data.y, '#ffffff');
        this.camera.addTrauma(0.12 * data.impactRatio);
      }
    });

    bus.on(Events.PLAYER_WALL_BOUNCE, (pos) => {
      AudioManager.getInstance().playWallBounce();
      this.particles.emitJumpDust(pos.x, pos.y, this.player.charDef.primaryColor);
    });

    bus.on(Events.PLAYER_DEATH, (data) => {
      this.camera.addTrauma(0.65);
      this.triggerHitStop(0.09);
      AudioManager.getInstance().playDeath();
      InputManager.getInstance().vibrate([40, 30, 80]);
      this.particles.emitDeathShatter(data.x, data.y, data.charDef.primaryColor);
      this.handlePlayerDeath();
    });

    bus.on(Events.SHIELD_BROKEN, (pos) => {
      this.camera.addTrauma(0.4);
      this.triggerHitStop(0.05);
      AudioManager.getInstance().playShieldBreak();
      InputManager.getInstance().vibrate(35);
      this.particles.emitDeathShatter(pos.x, pos.y, '#00d2ff');
      this.particles.emitFloatingText(pos.x, pos.y - 20, 'SHIELD BROKEN!', '#00d2ff');
    });

    bus.on(Events.MILESTONE_REACHED, (data) => {
      AudioManager.getInstance().playMilestone();
      InputManager.getInstance().vibrate([25, 20, 35]);
      this.particles.emitMilestoneConfetti(GAME_CONFIG.CANVAS_WIDTH / 2, this.player.y - 80);
      this.triggerFlash(data.isBoss ? 0.4 : 0.22);
      this.camera.addTrauma(data.isBoss ? 0.3 : 0.15);

      const coins = CoinManager.getInstance().rewardMilestoneCoins(data.isBoss);
      const label = data.isBoss ? `★ BOSS CLEARED! (+${coins} 🪙) ★` : `★ FLOOR ${data.floor} REACHED! (+${coins} 🪙) ★`;
      this.ui.hud.showMilestoneBanner(label);
    });

    bus.on(Events.NEW_RECORD, (_data) => {
      AudioManager.getInstance().playNewRecord();
      InputManager.getInstance().vibrate([30, 20, 30, 20, 50]);
      this.particles.emitMilestoneConfetti(GAME_CONFIG.CANVAS_WIDTH / 2, this.player.y - 100);
      this.triggerFlash(0.3);
      this.ui.hud.showRecordBanner();
    });

    bus.on(Events.COIN_COLLECTED, () => {
      InputManager.getInstance().vibrate(8);
    });

    bus.on(Events.BIOME_CHANGED, (biome) => {
      const musicMode = biome.id >= 5 ? 'insane' : (biome.id >= 3 ? 'high' : 'normal');
      AudioManager.getInstance().setMusicIntensity(musicMode, biome.musicBpm);
      this.ui.hud.showMilestoneBanner(`⚡ BIOME: ${biome.name} ⚡`);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GameState.PLAYING) {
        this.pauseGame();
      }
    });
  }

  private setupResizeHandler(): void {
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const targetAspect = GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.CANVAS_HEIGHT;
      const windowAspect = w / h;

      let renderW: number;
      let renderH: number;

      if (windowAspect > targetAspect) {
        renderH = h;
        renderW = h * targetAspect;
      } else {
        renderW = w;
        renderH = w / targetAspect;
      }

      this.canvas.style.width = `${renderW}px`;
      this.canvas.style.height = `${renderH}px`;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const pixelW = Math.round(renderW * dpr);
      const pixelH = Math.round(renderH * dpr);

      this.canvas.width = pixelW;
      this.canvas.height = pixelH;
      this.ctx.resetTransform();
      this.ctx.scale(pixelW / GAME_CONFIG.CANVAS_WIDTH, pixelH / GAME_CONFIG.CANVAS_HEIGHT);
      this.ctx.imageSmoothingEnabled = true;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private initLoadingSequence(): void {
    const loaderFill = document.getElementById('loader-fill');
    const loadingScreen = document.getElementById('loading-screen');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (loaderFill) loaderFill.style.width = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        document.fonts.ready.then(() => {
          setTimeout(() => {
            if (loadingScreen) loadingScreen.classList.add('hidden');
            this.setState(GameState.MAIN_MENU);
          }, 150);
        });
      }
    }, 80);
  }

  public setState(newState: GameState): void {
    this.state = newState;

    if (newState === GameState.PLAYING) {
      const biome = BiomeManager.getInstance().getCurrentBiome();
      const musicMode = biome.id >= 5 ? 'insane' : (biome.id >= 3 ? 'high' : 'normal');
      AudioManager.getInstance().startMusic(musicMode);
    } else if (newState === GameState.MAIN_MENU) {
      AudioManager.getInstance().startMusic('normal');
      const save = SaveManager.getInstance().getData();
      this.player.setCharacter(save.selectedCharacter);
    }

    EventBus.getInstance().emit(Events.STATE_CHANGE, newState);
  }

  public startNewRun(): void {
    const save = SaveManager.getInstance().getData();
    this.player.setCharacter(save.selectedCharacter);

    this.camera.reset(0);
    this.particles.clear();
    ScoreManager.getInstance().reset();
    CoinManager.getInstance().reset();
    PowerUpManager.getInstance().reset();
    BiomeManager.getInstance().updateForFloor(1);

    TowerGenerator.getInstance().reset(Math.random);

    const groundFloor = TowerGenerator.getInstance().getFloorByNumber(0);
    const groundPlat = groundFloor?.platforms[0] || null;

    if (groundPlat) {
      this.player.reset(240, groundPlat.y - this.player.size);
      this.player.currentPlatform = groundPlat;
      this.player.isGrounded = true;
    } else {
      this.player.reset(240, 688);
    }

    this.setState(GameState.PLAYING);
    AnalyticsManager.getInstance().logEvent('game_started');
  }

  public pauseGame(): void {
    if (this.state === GameState.PLAYING) {
      this.setState(GameState.PAUSED);
    }
  }

  public resumeGame(): void {
    if (this.state === GameState.PAUSED) {
      this.setState(GameState.PLAYING);
    }
  }

  private handlePlayerDeath(): void {
    const scoreMgr = ScoreManager.getInstance();
    const coinMgr = CoinManager.getInstance();

    const { isNewFloorRecord } = SaveManager.getInstance().recordRun(
      scoreMgr.highestFloorThisRun,
      scoreMgr.score,
      scoreMgr.maxComboThisRun
    );

    setTimeout(() => {
      this.setState(GameState.GAME_OVER);
    }, 650);

    AnalyticsManager.getInstance().logEvent('game_over', {
      floor: scoreMgr.highestFloorThisRun,
      coins: coinMgr.coinsThisRun,
      isNewRecord: isNewFloorRecord
    });
  }

  public start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  /** Briefly slow the world to near-stop for a punchy freeze-frame on big impacts. */
  private triggerHitStop(duration: number): void {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  private triggerFlash(amount: number): void {
    this.flashAlpha = Math.min(1, Math.max(this.flashAlpha, amount));
  }

  private loop(currentTime: number): void {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const cappedDt = Math.min(rawDt, 0.05);

    let dt = cappedDt;
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - cappedDt);
      dt = cappedDt * 0.06;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - this.flashDecay * cappedDt);
    }

    this.frameCount++;
    this.fpsTimer += cappedDt;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.handleInput();
    this.update(dt);
    this.render();

    InputManager.getInstance().endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  private handleInput(): void {
    const input = InputManager.getInstance();
    input.pollGamepad();

    // Global keyboard shortcuts
    if (input.isKeyJustPressed('KeyM')) {
      const s = SaveManager.getInstance().getData().settings;
      SaveManager.getInstance().updateSettings({ soundEnabled: !s.soundEnabled, musicEnabled: !s.musicEnabled });
      AudioManager.getInstance().updateVolumes();
    }

    if (input.isKeyJustPressed('Escape') || input.isKeyJustPressed('KeyP')) {
      if (this.state === GameState.PLAYING) {
        AudioManager.getInstance().playUiClick();
        this.pauseGame();
        return;
      } else if (this.state === GameState.PAUSED) {
        AudioManager.getInstance().playUiClick();
        this.resumeGame();
        return;
      } else if (this.state !== GameState.MAIN_MENU) {
        AudioManager.getInstance().playUiClick();
        this.setState(GameState.MAIN_MENU);
        return;
      }
    }

    if (input.isKeyJustPressed('Enter')) {
      if (this.state === GameState.MAIN_MENU) {
        AudioManager.getInstance().playUiClick();
        this.startNewRun();
        return;
      } else if (this.state === GameState.GAME_OVER) {
        AudioManager.getInstance().playUiClick();
        this.startNewRun();
        return;
      } else if (this.state === GameState.SHOP) {
        AudioManager.getInstance().playUiClick();
        this.ui.shop.handleAction();
        return;
      }
    }

    if (this.state === GameState.SHOP) {
      if (input.isKeyJustPressed('ArrowLeft') || input.isKeyJustPressed('KeyA')) {
        AudioManager.getInstance().playUiClick();
        this.ui.shop.prevCharacter();
      } else if (input.isKeyJustPressed('ArrowRight') || input.isKeyJustPressed('KeyD')) {
        AudioManager.getInstance().playUiClick();
        this.ui.shop.nextCharacter();
      }
    }

    if (input.isJustClicked()) {
      const p = input.getPointerPos();

      if (this.state === GameState.MAIN_MENU) {
        if (this.ui.hitTest(p.x, p.y, this.ui.mainMenu.playButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.startNewRun();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.mainMenu.shopButtonRect) || this.ui.hitTest(p.x, p.y, this.ui.mainMenu.characterCardRect)) {
          AudioManager.getInstance().playUiClick();
          this.setState(GameState.SHOP);
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.mainMenu.settingsButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.setState(GameState.SETTINGS);
          return;
        }
      } else if (this.state === GameState.PLAYING) {
        if (this.ui.hitTest(p.x, p.y, this.ui.hud.pauseButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.pauseGame();
          return;
        }
      } else if (this.state === GameState.PAUSED) {
        if (this.ui.hitTest(p.x, p.y, this.ui.pause.resumeButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.resumeGame();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.pause.restartButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.startNewRun();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.pause.soundToggleRect)) {
          this.ui.pause.toggleSound();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.pause.musicToggleRect)) {
          this.ui.pause.toggleMusic();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.pause.homeButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.setState(GameState.MAIN_MENU);
          return;
        }
      } else if (this.state === GameState.SHOP) {
        if (this.ui.hitTest(p.x, p.y, this.ui.shop.backButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.setState(GameState.MAIN_MENU);
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.shop.prevButtonRect)) {
          this.ui.shop.prevCharacter();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.shop.nextButtonRect)) {
          this.ui.shop.nextCharacter();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.shop.actionButtonRect)) {
          this.ui.shop.handleAction();
          return;
        }
      } else if (this.state === GameState.SETTINGS) {
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.backButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.setState(GameState.MAIN_MENU);
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.soundToggleRect)) {
          this.ui.settings.toggleSound();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.musicToggleRect)) {
          this.ui.settings.toggleMusic();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.vibrationToggleRect)) {
          this.ui.settings.toggleVibration();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.qualityToggleRect)) {
          this.ui.settings.toggleQuality();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.fpsToggleRect)) {
          this.ui.settings.toggleFps();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.settings.resetDataButtonRect)) {
          this.ui.settings.handleReset();
          return;
        }
      } else if (this.state === GameState.GAME_OVER) {
        if (this.ui.hitTest(p.x, p.y, this.ui.gameOver.restartButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.startNewRun();
          return;
        }
        if (this.ui.hitTest(p.x, p.y, this.ui.gameOver.homeButtonRect)) {
          AudioManager.getInstance().playUiClick();
          this.setState(GameState.MAIN_MENU);
          return;
        }
      }
    }

    if (this.state === GameState.PLAYING && !this.player.isDead) {
      if (input.hasBufferedJump()) {
        if (this.player.jump()) {
          input.consumeJump();
        }
      }
    }
  }

  private update(dt: number): void {
    this.ui.update(dt, this.state);
    BiomeManager.getInstance().update(dt, this.camera.y);

    if (this.state !== GameState.PLAYING) {
      this.particles.update(dt);
      return;
    }

    const powerUps = PowerUpManager.getInstance();
    powerUps.update(dt, this.player);

    const worldDt = powerUps.isSlowMoActive() ? dt * GAME_CONFIG.SLOW_MO_SCALE : dt;

    this.player.update(dt, powerUps.isSpeedBoostActive());

    if (this.player.trailTimer > 0.04) {
      this.player.trailTimer = 0;
      this.particles.emitTrail(
        this.player.x + this.player.size / 2,
        this.player.y + this.player.size / 2,
        this.player.charDef.primaryColor,
        this.player.charDef.trailType
      );
    }

    this.camera.update(this.player.y, dt);
    TowerGenerator.getInstance().update(this.camera.y);
    this.particles.update(dt);
    ScoreManager.getInstance().update(dt);

    this.checkCollisions(worldDt);

    const cameraBounds = this.camera.getVisibleBounds();
    if (this.player.y > cameraBounds.bottom + 20 && !this.player.isDead) {
      this.player.triggerDeath();
    }
  }

  private checkCollisions(worldDt: number): void {
    const floors = TowerGenerator.getInstance().getActiveFloors();
    const px = this.player.x;
    const py = this.player.y;
    const psize = this.player.size;
    const pvy = this.player.vy;

    const magnetActive = PowerUpManager.getInstance().isMagnetActive();
    const magnetRadius = GAME_CONFIG.MAGNET_RADIUS + this.player.charDef.magnetBonus;
    const magnetTarget = { x: px + psize / 2, y: py + psize / 2 };

    floors.forEach(floor => {
      floor.platforms.forEach(plat => {
        plat.update(worldDt);

        if (!plat.isDestroyed && pvy >= 0 && !this.player.isGrounded) {
          const playerBottom = py + psize;
          const playerPrevBottom = playerBottom - pvy * 0.05;

          if (
            px + psize - 6 > plat.x &&
            px + 6 < plat.x + plat.width &&
            playerBottom >= plat.y &&
            playerPrevBottom <= plat.y + 20
          ) {
            this.player.landOnPlatform(plat);

            ScoreManager.getInstance().registerFloorReached(floor.floorNumber);
            BiomeManager.getInstance().updateForFloor(floor.floorNumber);

            if (plat.isRiskPlatform) {
              if (plat.riskTag === 'RISK') {
                CoinManager.getInstance().rewardRiskFloorCoins();
                this.particles.emitMilestoneConfetti(plat.x + plat.width / 2, plat.y - 20);
                this.ui.hud.showMilestoneBanner('🔥 RISK REWARD: +25 🪙! 🔥');
              }
              plat.isRiskPlatform = false;
            }
          }
        }
      });

      floor.hazards.forEach(hazard => {
        hazard.update(worldDt);
        if (!this.player.isDead && hazard.checkCollision(px, py, psize)) {
          this.player.triggerDeath();
        }
      });

      floor.enemies.forEach(enemy => {
        enemy.update(worldDt);
        if (!this.player.isDead && enemy.checkCollision(px, py, psize)) {
          this.player.triggerDeath();
        }
      });

      floor.coins.forEach(coin => {
        coin.update(worldDt, magnetActive ? magnetTarget : null, magnetRadius);
        if (coin.checkCollision(px, py, psize)) {
          coin.collected = true;
          coin.active = false;
          const combo = ScoreManager.getInstance().incrementCombo();
          const earned = CoinManager.getInstance().collectCoin(coin.value, this.player);
          AudioManager.getInstance().playCoin(combo - 1);
          this.particles.emitCoinCollect(coin.x, coin.y, coin.baseColor);
          this.particles.emitFloatingText(coin.x, coin.y - 10, `+${earned}`, '#ffe600');
        }
      });

      floor.powerUps.forEach(pu => {
        pu.update(worldDt);
        if (pu.checkCollision(px, py, psize)) {
          pu.collected = true;
          pu.active = false;
          PowerUpManager.getInstance().activate(pu.type, this.player);
          AudioManager.getInstance().playPowerUp();
          this.particles.emitCoinCollect(pu.x, pu.y, pu.getColor());
          this.particles.emitFloatingText(pu.x, pu.y - 15, pu.type.toUpperCase().replace('_', ' '), pu.getColor());
        }
      });
    });
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = true;

    const biome = BiomeManager.getInstance();

    biome.renderBackground(ctx);

    // Only render gameplay entities (tower floors, hazards, player) during active gameplay states
    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
      this.camera.applyTransform(ctx);

      const floors = TowerGenerator.getInstance().getActiveFloors();
      floors.forEach(floor => {
        floor.platforms.forEach(plat => plat.render(ctx));
        floor.hazards.forEach(h => h.render(ctx));
        floor.enemies.forEach(e => e.render(ctx));
        floor.coins.forEach(c => c.render(ctx));
        floor.powerUps.forEach(pu => pu.render(ctx));
      });

      this.player.render(ctx);

      this.particles.render(ctx);

      this.camera.restoreTransform(ctx);
    } else {
      this.particles.render(ctx);
    }

    biome.renderWalls(ctx, this.camera.y);

    this.ui.render(ctx, this.state, ScoreManager.getInstance().currentFloor);

    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      ctx.restore();
    }

    if (SaveManager.getInstance().getData().settings.showFps) {
      ctx.save();
      ctx.font = `9px ${GAME_CONFIG.PIXEL_FONT}`;
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'left';
      ctx.fillText(`FPS:${this.fps}`, 12, GAME_CONFIG.CANVAS_HEIGHT - 12);
      ctx.restore();
    }
  }
}
