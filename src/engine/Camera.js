/**
 * Camera.js
 * Câmera em Primeira Pessoa (FPS)
 */

import { vec3, mat4 } from 'gl-matrix';
import { input } from '../utils/Input.js';

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Posição inicial
        this.position = vec3.fromValues(0, 1.5, 5); // 1.5 de altura (altura dos olhos)
        this.up = vec3.fromValues(0, 1, 0);
        this.front = vec3.fromValues(0, 0, -1);

        // Ângulos de rotação (yaw, pitch)
        this.yaw = -90.0; // Começa olhando para o eixo -Z
        this.pitch = 0.0;

        // Propriedades
        this.fov = 45.0 * Math.PI / 180.0; // Converte para radianos
        this.near = 0.1;
        this.far = 1000.0;

        this.speed = 5.0; // Unidades por segundo
        this.sensitivity = 0.1; // Sensibilidade do mouse

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();

        this.updateProjectionMatrix();
        this.updateCameraVectors();
    }

    updateCameraVectors() {
        // Calcula a nova direção baseada no Yaw e Pitch
        const front = vec3.create();
        front[0] = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        front[1] = Math.sin(this.pitch * Math.PI / 180);
        front[2] = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        
        vec3.normalize(this.front, front);
    }

    updateViewMatrix() {
        const target = vec3.create();
        vec3.add(target, this.position, this.front);
        mat4.lookAt(this.viewMatrix, this.position, target, this.up);
    }

    updateProjectionMatrix() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        mat4.perspective(this.projMatrix, this.fov, aspect, this.near, this.far);
    }

    update(deltaTime) {
        let currentSpeed = this.speed * deltaTime;
        if (input.isKeyPressed('shift')) currentSpeed *= 2; // Correr

        // Vetor Right (Direita) para andar de lado (Strafe)
        const right = vec3.create();
        vec3.cross(right, this.front, this.up);
        vec3.normalize(right, right);

        // Movimento WASD
        if (input.isKeyPressed('w')) {
            const move = vec3.create();
            vec3.scale(move, this.front, currentSpeed);
            vec3.add(this.position, this.position, move);
        }
        if (input.isKeyPressed('s')) {
            const move = vec3.create();
            vec3.scale(move, this.front, currentSpeed);
            vec3.sub(this.position, this.position, move);
        }
        if (input.isKeyPressed('d')) {
            const move = vec3.create();
            vec3.scale(move, right, currentSpeed);
            vec3.add(this.position, this.position, move);
        }
        if (input.isKeyPressed('a')) {
            const move = vec3.create();
            vec3.scale(move, right, currentSpeed);
            vec3.sub(this.position, this.position, move);
        }

        // Movimento vertical (Voar/Descer - Útil pra debugar)
        if (input.isKeyPressed(' ')) this.position[1] += currentSpeed;
        if (input.isKeyPressed('control')) this.position[1] -= currentSpeed;

        // Controle de mouse (Olhar)
        const delta = input.getMouseDelta();
        if (delta.x !== 0 || delta.y !== 0) {
            this.yaw += delta.x * this.sensitivity;
            this.pitch -= delta.y * this.sensitivity;

            // Limitar o pitch (não quebrar o pescoço)
            if (this.pitch > 89.0) this.pitch = 89.0;
            if (this.pitch < -89.0) this.pitch = -89.0;

            this.updateCameraVectors();
        }

        this.updateViewMatrix();
    }

    getViewMatrix() { return this.viewMatrix; }
    getProjectionMatrix() { return this.projMatrix; }
    getPosition() { return [this.position[0], this.position[1], this.position[2]]; }
    
    onWindowResize() { this.updateProjectionMatrix(); }
}