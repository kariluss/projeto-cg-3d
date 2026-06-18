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

        this.walkTime = 0.0; 
        
        // --- SISTEMA DE COLISÃO ---
        this.mapLayout = null;
        this.blockSize = 1.0;
        this.radius = 0.4; // O "tamanho" da barriga do jogador (Threshold)

        this.updateProjectionMatrix();
        this.updateCameraVectors();
    }

    setCollisionMap(layout, blockSize) {
        this.mapLayout = layout;
        this.blockSize = blockSize;
    }

    // Verifica se um ponto exato é parede
    isWall(x, z) {
        if (!this.mapLayout) return false;

        const col = Math.round(x / this.blockSize);
        const row = Math.round(z / this.blockSize);

        if (row < 0 || row >= this.mapLayout.length || col < 0 || col >= this.mapLayout[0].length) {
            return true;
        }

        return this.mapLayout[row][col] === 1;
    }

    // Verifica se a Hitbox (Raio) do jogador está batendo na parede
    checkCollision(x, z) {
        const r = this.radius;
        // Checamos os 4 cantos ao redor do jogador
        return this.isWall(x - r, z - r) ||
               this.isWall(x + r, z - r) ||
               this.isWall(x - r, z + r) ||
               this.isWall(x + r, z + r);
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
        if (input.isKeyPressed('shift')) currentSpeed *= 2;

        const right = vec3.create();
        vec3.cross(right, this.front, this.up);
        vec3.normalize(right, right);

        const flatFront = vec3.fromValues(this.front[0], 0, this.front[2]);
        vec3.normalize(flatFront, flatFront);

        // Variáveis para somar a intenção de movimento
        let moveDirFront = 0;
        let moveDirRight = 0;

        if (input.isKeyPressed('w')) moveDirFront += 1;
        if (input.isKeyPressed('s')) moveDirFront -= 1;
        if (input.isKeyPressed('d')) moveDirRight += 1;
        if (input.isKeyPressed('a')) moveDirRight -= 1;

        let isMoving = (moveDirFront !== 0 || moveDirRight !== 0);
        const move = vec3.create();

        if (isMoving) {
            // "Penalidade" de andar de lado (Strafe é 60% da velocidade)
            moveDirRight *= 0.6; 

            // Junta os dois movimentos
            const tempFront = vec3.create();
            const tempRight = vec3.create();
            vec3.scale(tempFront, flatFront, moveDirFront);
            vec3.scale(tempRight, right, moveDirRight);
            
            vec3.add(move, tempFront, tempRight);

            // NORMALIZAÇÃO: Evita que a diagonal seja mais rápida que andar reto
            vec3.normalize(move, move);
            vec3.scale(move, move, currentSpeed);
        }

        // --- SISTEMA DE COLISÃO DESLIZANTE COM RAIO ---
        // (O resto do código continua igual...)
        const nextX = this.position[0] + move[0];
        if (!this.checkCollision(nextX, this.position[2])) {
            this.position[0] = nextX;
        }

        const nextZ = this.position[2] + move[2];
        if (!this.checkCollision(this.position[0], nextZ)) {
            this.position[2] = nextZ;
        }

        // Head Bobbing Timer
        if (isMoving) {
            this.walkTime += deltaTime;
        } else {
            this.walkTime = 0; 
        }

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