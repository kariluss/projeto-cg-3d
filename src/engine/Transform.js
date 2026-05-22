/**
 * Transform
 * Gerencia posição, rotação e escala de um objeto 3D
 */

import { Vec3, Mat4 } from '../utils/Math.js';

export class Transform {
    constructor() {
        this.position = new Vec3(0, 0, 0);
        this.rotation = new Vec3(0, 0, 0); // em radianos
        this.scale = new Vec3(1, 1, 1);

        this._modelMatrix = Mat4.identity();
        this._isDirty = true;
    }

    setPosition(x, y, z) {
        this.position = new Vec3(x, y, z);
        this._isDirty = true;
        return this;
    }

    translate(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
        this._isDirty = true;
        return this;
    }

    setRotation(x, y, z) {
        this.rotation = new Vec3(x, y, z);
        this._isDirty = true;
        return this;
    }

    rotate(x, y, z) {
        this.rotation.x += x;
        this.rotation.y += y;
        this.rotation.z += z;
        this._isDirty = true;
        return this;
    }

    setScale(x, y, z) {
        this.scale = new Vec3(x, y, z);
        this._isDirty = true;
        return this;
    }

    getModelMatrix() {
        if (!this._isDirty) return this._modelMatrix;

        // Recalcula a matriz model: Scale -> Rotate -> Translate
        this._modelMatrix = Mat4.identity();

        // Aplicar translação
        this._modelMatrix = this._modelMatrix.translate(
            this.position.x,
            this.position.y,
            this.position.z
        );

        // Aplicar rotação (ordem: Z, Y, X)
        this._modelMatrix = this._modelMatrix.rotateZ(this.rotation.z);
        this._modelMatrix = this._modelMatrix.rotateY(this.rotation.y);
        this._modelMatrix = this._modelMatrix.rotateX(this.rotation.x);

        // Aplicar escala
        this._modelMatrix = this._modelMatrix.scale(
            this.scale.x,
            this.scale.y,
            this.scale.z
        );

        this._isDirty = false;
        return this._modelMatrix;
    }

    clone() {
        const t = new Transform();
        t.position = this.position.clone();
        t.rotation = this.rotation.clone();
        t.scale = this.scale.clone();
        return t;
    }
}