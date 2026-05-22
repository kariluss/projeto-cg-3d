/**
 * Scene
 * Gerencia a cena com GameObjects
 */

import { GameObject } from './GameObject.js';
import { Mesh } from '../engine/Mesh.js';

export class Scene {
    constructor(engine) {
        this.engine = engine;
        this.gameObjects = [];
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
        return gameObject;
    }

    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }
        return this;
    }

    getGameObject(name) {
        return this.gameObjects.find(go => go.name === name);
    }

    /**
     * Cria um GameObject com um cubo
     */
    createCube(options = {}) {
        const mesh = Mesh.createCube(options.size || 1);
        mesh.gl = this.engine.getContext();
        mesh.setupBuffers();

        const gameObject = new GameObject(options.name || 'Cube', mesh);

        if (options.position) {
            gameObject.transform.setPosition(...options.position);
        }

        if (options.rotation) {
            gameObject.transform.setRotation(...options.rotation);
        }

        if (options.scale) {
            gameObject.transform.setScale(...options.scale);
        }

        return this.addGameObject(gameObject);
    }

    /**
     * Cria um GameObject com um plano
     */
    createPlane(options = {}) {
        const mesh = Mesh.createPlane(options.width || 1, options.height || 1);
        mesh.gl = this.engine.getContext();
        mesh.setupBuffers();

        const gameObject = new GameObject(options.name || 'Plane', mesh);

        if (options.position) {
            gameObject.transform.setPosition(...options.position);
        }

        if (options.rotation) {
            gameObject.transform.setRotation(...options.rotation);
        }

        if (options.scale) {
            gameObject.transform.setScale(...options.scale);
        }

        return this.addGameObject(gameObject);
    }

    /**
     * Cria um GameObject com uma esfera
     */
    createSphere(options = {}) {
        const mesh = Mesh.createSphere(
            options.radius || 1,
            options.segments || 32,
            options.rings || 16
        );
        mesh.gl = this.engine.getContext();
        mesh.setupBuffers();

        const gameObject = new GameObject(options.name || 'Sphere', mesh);

        if (options.position) {
            gameObject.transform.setPosition(...options.position);
        }

        if (options.rotation) {
            gameObject.transform.setRotation(...options.rotation);
        }

        if (options.scale) {
            gameObject.transform.setScale(...options.scale);
        }

        return this.addGameObject(gameObject);
    }

    update(deltaTime) {
        for (const gameObject of this.gameObjects) {
            if (gameObject.isActive()) {
                gameObject.update(deltaTime);
            }
        }
    }

    render(shader) {
        for (const gameObject of this.gameObjects) {
            if (gameObject.isActive()) {
                gameObject.draw(shader);
            }
        }
    }

    clear() {
        this.gameObjects = [];
    }
}