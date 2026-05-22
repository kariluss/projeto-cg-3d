/**
 * Camera
 * Câmera 3D com controle de perspectiva e navegação
 */

import { Vec3, Mat4, MathUtils } from '../utils/Math.js';
import { input } from '../utils/Input.js';

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.position = new Vec3(0, 2, 5);
        this.target = new Vec3(0, 0, 0);
        this.up = new Vec3(0, 1, 0);

        // Ângulos de rotação (yaw, pitch)
        this.yaw = -Math.PI / 2;
        this.pitch = 0;

        // Propriedades de câmera
        this.fov = MathUtils.radians(45);
        this.near = 0.1;
        this.far = 1000;

        // Velocidade de movimento
        this.speed = 10; // unidades por segundo
        this.sensitivity = 0.003; // sensibilidade do mouse

        // Matrizes
        this._viewMatrix = Mat4.identity();
        this._projMatrix = Mat4.identity();

        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }

    updateViewMatrix() {
        // Calcular direção baseado em yaw e pitch
        const direction = new Vec3(
            Math.cos(this.pitch) * Math.cos(this.yaw),
            Math.sin(this.pitch),
            Math.cos(this.pitch) * Math.sin(this.yaw)
        );

        // Alvo é a posição + direção
        this.target = this.position.add(direction);

        // Criar matrix lookAt
        this._viewMatrix = Mat4.lookAt(this.position, this.target, this.up);
    }

    updateProjectionMatrix() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this._projMatrix = Mat4.perspective(
            this.fov,
            aspect,
            this.near,
            this.far
        );
    }

    update(deltaTime) {
        const speed = input.isKeyPressed('shift') ? this.speed * 2 : this.speed;

        // Movimento WASD
        const forward = new Vec3(
            Math.cos(this.pitch) * Math.cos(this.yaw),
            0,
            Math.cos(this.pitch) * Math.sin(this.yaw)
        ).normalize();

        const right = forward.cross(this.up).normalize();

        if (input.isKeyPressed('w')) {
            this.position = this.position.add(forward.multiply(speed * deltaTime));
        }
        if (input.isKeyPressed('s')) {
            this.position = this.position.subtract(forward.multiply(speed * deltaTime));
        }
        if (input.isKeyPressed('d')) {
            this.position = this.position.add(right.multiply(speed * deltaTime));
        }
        if (input.isKeyPressed('a')) {
            this.position = this.position.subtract(right.multiply(speed * deltaTime));
        }

        // Movimento vertical (Space / Ctrl)
        if (input.isKeyPressed(' ')) {
            this.position.y += speed * deltaTime;
        }
        if (input.isKeyPressed('control')) {
            this.position.y -= speed * deltaTime;
        }

        // Controle de mouse
        if (input.isMouseDown()) {
            const delta = input.getMouseDelta();
            this.yaw += delta.x * this.sensitivity;
            this.pitch -= delta.y * this.sensitivity;

            // Limitar pitch
            this.pitch = MathUtils.clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
        }

        this.updateViewMatrix();
    }

    getViewMatrix() {
        return this._viewMatrix;
    }

    getProjectionMatrix() {
        return this._projMatrix;
    }

    getPosition() {
        return this.position.clone();
    }

    setPosition(x, y, z) {
        this.position = new Vec3(x, y, z);
        this.updateViewMatrix();
        return this;
    }

    lookAt(target, up = null) {
        this.target = target;
        if (up) this.up = up;
        this._viewMatrix = Mat4.lookAt(this.position, this.target, this.up);
        return this;
    }

    setFieldOfView(degrees) {
        this.fov = MathUtils.radians(degrees);
        this.updateProjectionMatrix();
        return this;
    }

    onWindowResize() {
        this.updateProjectionMatrix();
        return this;
    }
}