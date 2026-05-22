/**
 * Sistema de Input
 * Gerencia inputs de teclado e mouse
 */

export class Input {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.lastMousePosition = { x: 0, y: 0 };
        this.mouseDown = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.lastMousePosition.x = this.mousePosition.x;
            this.lastMousePosition.y = this.mousePosition.y;

            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;

            if (this.mouseDown) {
                this.mouseDelta.x = this.mousePosition.x - this.lastMousePosition.x;
                this.mouseDelta.y = this.mousePosition.y - this.lastMousePosition.y;
            } else {
                this.mouseDelta.x = 0;
                this.mouseDelta.y = 0;
            }
        });

        document.addEventListener('mousedown', () => {
            this.mouseDown = true;
        });

        document.addEventListener('mouseup', () => {
            this.mouseDown = false;
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        });

        // Previne context menu ao clicar
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] === true;
    }

    isKeyDown(code) {
        return this.keys[code] === true;
    }

    getMouseDelta() {
        return { ...this.mouseDelta };
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    isMouseDown() {
        return this.mouseDown;
    }
}

// Singleton global
export const input = new Input();