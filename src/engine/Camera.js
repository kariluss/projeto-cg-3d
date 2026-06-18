import { vec3, mat4 } from 'gl-matrix';
import { input } from '../utils/Input.js';

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        
        this.position = vec3.fromValues(0, 1.5, 5); 
        this.up = vec3.fromValues(0, 1, 0);
        this.front = vec3.fromValues(0, 0, -1);

        this.yaw = -90.0; 
        this.pitch = 0.0;

        this.fov = 45.0 * Math.PI / 180.0; 
        this.near = 0.1;
        this.far = 1000.0;

        this.speed = 5.0; 
        this.sensitivity = 0.1; 

        this.viewMatrix = mat4.create();
        this.projMatrix = mat4.create();

        this.walkTime = 0.0; // Para o Head Bobbing
        
        // Para a Colisão
        this.mapLayout = null;
        this.blockSize = 1.0;

        this.updateProjectionMatrix();
        this.updateCameraVectors();
    }

    // Recebe o mapa do main.js
    setCollisionMap(layout, blockSize) {
        this.mapLayout = layout;
        this.blockSize = blockSize;
    }

    // Verifica se a coordenada (x, z) é uma parede
    isWall(x, z) {
        if (!this.mapLayout) return false;

        // Converte as coordenadas do mundo 3D para índices da matriz
        const col = Math.round(x / this.blockSize);
        const row = Math.round(z / this.blockSize);

        // Se tentar sair dos limites do mapa, bloqueia (trata como parede)
        if (row < 0 || row >= this.mapLayout.length || col < 0 || col >= this.mapLayout[0].length) {
            return true;
        }

        // Retorna true se for parede (1)
        return this.mapLayout[row][col] === 1;
    }

    updateCameraVectors() {
        const front = vec3.create();
        front[0] = Math.cos(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        front[1] = Math.sin(this.pitch * Math.PI / 180);
        front[2] = Math.sin(this.yaw * Math.PI / 180) * Math.cos(this.pitch * Math.PI / 180);
        vec3.normalize(this.front, front);
    }

    updateViewMatrix() {
        const target = vec3.create();
        const visualPosition = vec3.clone(this.position);
        
        // Head Bobbing (Sobe e desce a câmera ao andar)
        visualPosition[1] += Math.sin(this.walkTime * 10.0) * 0.05; 

        vec3.add(target, visualPosition, this.front);
        mat4.lookAt(this.viewMatrix, visualPosition, target, this.up);
    }

    updateProjectionMatrix() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        mat4.perspective(this.projMatrix, this.fov, aspect, this.near, this.far);
    }

    update(deltaTime) {
        let currentSpeed = this.speed * deltaTime;
        let isMoving = false;

        if (input.isKeyPressed('shift')) currentSpeed *= 2; 

        const right = vec3.create();
        vec3.cross(right, this.front, this.up);
        vec3.normalize(right, right);

        const flatFront = vec3.fromValues(this.front[0], 0, this.front[2]);
        vec3.normalize(flatFront, flatFront);

        // Vetor final de movimento neste frame
        const move = vec3.create();

        if (input.isKeyPressed('w')) {
            const temp = vec3.create();
            vec3.scale(temp, flatFront, currentSpeed);
            vec3.add(move, move, temp);
            isMoving = true;
        }
        if (input.isKeyPressed('s')) {
            const temp = vec3.create();
            vec3.scale(temp, flatFront, currentSpeed);
            vec3.sub(move, move, temp);
            isMoving = true;
        }
        if (input.isKeyPressed('d')) {
            const temp = vec3.create();
            vec3.scale(temp, right, currentSpeed);
            vec3.add(move, move, temp);
            isMoving = true;
        }
        if (input.isKeyPressed('a')) {
            const temp = vec3.create();
            vec3.scale(temp, right, currentSpeed);
            vec3.sub(move, move, temp);
            isMoving = true;
        }

        // --- SISTEMA DE COLISÃO DESLIZANTE ---
        // Checamos o Eixo X e o Eixo Z separadamente para o jogador "deslizar" na parede
        
        // Eixo X: Posição futura X, posição atual Z
        const nextX = this.position[0] + move[0];
        if (!this.isWall(nextX, this.position[2])) {
            this.position[0] = nextX;
        }

        // Eixo Z: Posição atual X, posição futura Z
        const nextZ = this.position[2] + move[2];
        if (!this.isWall(this.position[0], nextZ)) {
            this.position[2] = nextZ;
        }

        // Head Bobbing Timer
        if (isMoving) {
            this.walkTime += deltaTime;
        } else {
            this.walkTime = 0; 
        }

        // Mouse Look
        const delta = input.getMouseDelta();
        if (delta.x !== 0 || delta.y !== 0) {
            this.yaw += delta.x * this.sensitivity;
            this.pitch -= delta.y * this.sensitivity;

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