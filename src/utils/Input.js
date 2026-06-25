/**
 * Input.js
 * Gerencia teclado, mouse e trava o cursor (Pointer Lock) para estilo FPS
 */

class InputManager {
    constructor() {
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.isLocked = false;
        
        // Listeners de teclado
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        // Listeners de mouse
        window.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
        });
    }

    // Chama isso no main.js passando o canvas
    initPointerLock(canvas) {
        canvas.addEventListener('click', () => {
            canvas.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === canvas;
        });
    }

    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }

    getMouseDelta() {
        const delta = { x: this.mouseDelta.x, y: this.mouseDelta.y };
        // Zera o delta depois de ler para não ficar girando infinitamente
        this.mouseDelta.x = 0; 
        this.mouseDelta.y = 0;
        return delta;
    }
}

export const input = new InputManager();