import { GAME_CONFIG } from '../data/Constants.ts';
import { SaveManager } from '../systems/SaveManager.ts';

export class InputManager {
  private static instance: InputManager;
  private canvas: HTMLCanvasElement | null = null;

  private lastJumpRequestTime = -1;
  private isPointerDown = false;
  private pointerPos = { x: 0, y: 0 };
  private virtualPointerPos = { x: 0, y: 0 };
  private isPointerJustPressed = false;
  private isPointerJustReleased = false;

  private activeKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();

  private gamepadPreviousButtons: boolean[] = [];

  private constructor() {}

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.canvas) return;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!e.repeat) {
          this.triggerJump();
        }
        e.preventDefault();
      }

      if (e.code === 'KeyF') {
        this.toggleFullscreen();
      }

      if (!e.repeat) {
        this.justPressedKeys.add(e.code);
      }
      this.activeKeys.add(e.code);
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
    });

    window.addEventListener('mousedown', (e) => {
      this.updateVirtualCoords(e.clientX, e.clientY);
      this.isPointerDown = true;
      this.isPointerJustPressed = true;
      this.triggerJump();
    });

    window.addEventListener('mouseup', (_e) => {
      if (this.isPointerDown) {
        this.isPointerJustReleased = true;
      }
      this.isPointerDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.updateVirtualCoords(e.clientX, e.clientY);
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.updateVirtualCoords(touch.clientX, touch.clientY);
        this.isPointerDown = true;
        this.isPointerJustPressed = true;
        this.triggerJump();
      }
    }, { passive: true });

    window.addEventListener('touchend', (_e) => {
      if (this.isPointerDown) {
        this.isPointerJustReleased = true;
      }
      this.isPointerDown = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.updateVirtualCoords(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public pollGamepad(): void {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (const gp of gamepads) {
      if (!gp) continue;

      // Button A (0), B (1), RT (7) -> Jump
      const jumpButtons = [gp.buttons[0]?.pressed, gp.buttons[1]?.pressed, gp.buttons[7]?.pressed];
      const isJumpPressed = jumpButtons.some(Boolean);

      if (isJumpPressed && !this.gamepadPreviousButtons[0]) {
        this.triggerJump();
        this.isPointerJustPressed = true;
      }

      // Start/Menu button (9)
      if (gp.buttons[9]?.pressed && !this.gamepadPreviousButtons[9]) {
        this.justPressedKeys.add('Escape');
      }

      // D-Pad Left (14) / Right (15) / LB (4) / RB (5)
      if ((gp.buttons[14]?.pressed || gp.buttons[4]?.pressed) && !this.gamepadPreviousButtons[14]) {
        this.justPressedKeys.add('ArrowLeft');
      }
      if ((gp.buttons[15]?.pressed || gp.buttons[5]?.pressed) && !this.gamepadPreviousButtons[15]) {
        this.justPressedKeys.add('ArrowRight');
      }

      this.gamepadPreviousButtons = gp.buttons.map(b => b.pressed);
      break;
    }
  }

  public vibrate(pattern: number | number[] = 20): void {
    const settings = SaveManager.getInstance().getData().settings;
    if (!settings.vibrationEnabled) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  private updateVirtualCoords(clientX: number, clientY: number): void {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = GAME_CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = GAME_CONFIG.CANVAS_HEIGHT / rect.height;

    this.pointerPos.x = clientX - rect.left;
    this.pointerPos.y = clientY - rect.top;
    this.virtualPointerPos.x = Math.max(0, Math.min(GAME_CONFIG.CANVAS_WIDTH, this.pointerPos.x * scaleX));
    this.virtualPointerPos.y = Math.max(0, Math.min(GAME_CONFIG.CANVAS_HEIGHT, this.pointerPos.y * scaleY));
  }

  public triggerJump(): void {
    this.lastJumpRequestTime = performance.now();
  }

  public hasBufferedJump(): boolean {
    if (this.lastJumpRequestTime < 0) return false;
    const elapsed = performance.now() - this.lastJumpRequestTime;
    return elapsed <= (GAME_CONFIG.INPUT_BUFFER_TIME * 1000);
  }

  public consumeJump(): void {
    this.lastJumpRequestTime = -1;
  }

  public getPointerPos(): { x: number; y: number } {
    return { ...this.virtualPointerPos };
  }

  public isJustClicked(): boolean {
    return this.isPointerJustPressed;
  }

  public isJustReleased(): boolean {
    return this.isPointerJustReleased;
  }

  public isDown(): boolean {
    return this.isPointerDown;
  }

  public isKeyPressed(code: string): boolean {
    return this.activeKeys.has(code);
  }

  public isKeyJustPressed(code: string): boolean {
    return this.justPressedKeys.has(code);
  }

  public endFrame(): void {
    this.isPointerJustPressed = false;
    this.isPointerJustReleased = false;
    this.justPressedKeys.clear();
  }
}
