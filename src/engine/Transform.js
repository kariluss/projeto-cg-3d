/**
 * Transform
 * Gerencia posição, rotação e escala de um objeto 3D
 */

import { mat4, vec3, quat } from 'gl-matrix';

export class Transform {
    constructor() {
        this.position = vec3.fromValues(0, 0, 0);
        this.rotation = vec3.fromValues(0, 0, 0); // Rotação em Euler (graus)
        this.scale = vec3.fromValues(1, 1, 1);
        
        this.modelMatrix = mat4.create();
        this.needsUpdate = true;
    }

    setPosition(x, y, z) {
        vec3.set(this.position, x, y, z);
        this.needsUpdate = true;
    }

    setRotation(x, y, z) {
        vec3.set(this.rotation, x, y, z);
        this.needsUpdate = true;
    }

    setScale(x, y, z) {
        vec3.set(this.scale, x, y, z);
        this.needsUpdate = true;
    }

    getModelMatrix() {
        if (this.needsUpdate) {
            mat4.identity(this.modelMatrix);
            
            // 1. Translação
            mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
            
            // 2. Rotação (Convertendo graus para radianos)
            const radX = this.rotation[0] * Math.PI / 180;
            const radY = this.rotation[1] * Math.PI / 180;
            const radZ = this.rotation[2] * Math.PI / 180;
            
            mat4.rotateX(this.modelMatrix, this.modelMatrix, radX);
            mat4.rotateY(this.modelMatrix, this.modelMatrix, radY);
            mat4.rotateZ(this.modelMatrix, this.modelMatrix, radZ);
            
            // 3. Escala
            mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);

            this.needsUpdate = false;
        }
        return this.modelMatrix;
    }
}