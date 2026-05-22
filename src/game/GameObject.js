/**
 * GameObject
 * Entidade base para todos os objetos do jogo
 */

import { Transform } from '../engine/Transform.js';

export class GameObject {
    constructor(name = 'GameObject', mesh = null) {
        this.name = name;
        this.mesh = mesh;
        this.transform = new Transform();
        this.active = true;
        this.components = [];
    }

    update(deltaTime) {
        // Update dos componentes
        for (const component of this.components) {
            if (component.update) {
                component.update(deltaTime);
            }
        }
    }

    draw(shader) {
        if (!this.active || !this.mesh) return;
        this.mesh.draw(shader);
    }

    addComponent(component) {
        this.components.push(component);
        component.gameObject = this;
        if (component.onAdd) {
            component.onAdd();
        }
        return this;
    }

    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
            if (component.onRemove) {
                component.onRemove();
            }
        }
        return this;
    }

    getComponent(type) {
        return this.components.find(c => c instanceof type);
    }

    setActive(active) {
        this.active = active;
        return this;
    }

    isActive() {
        return this.active;
    }

    clone() {
        const clone = new GameObject(this.name, this.mesh);
        clone.transform = this.transform.clone();
        return clone;
    }
}

/**
 * Componente base para adicionar funcionalidades aos GameObjects
 */
export class Component {
    constructor() {
        this.gameObject = null;
        this.enabled = true;
    }

    update(deltaTime) {}
    onAdd() {}
    onRemove() {}

    setEnabled(enabled) {
        this.enabled = enabled;
        return this;
    }

    isEnabled() {
        return this.enabled;
    }
}