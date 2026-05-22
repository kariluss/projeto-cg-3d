/**
 * WebGLEngine
 * Motor WebGL que gerencia contexto, renderização e estado gráfico
 */

import { Shader } from './Shader.js';
import { Camera } from './Camera.js';
import { Mat4 } from '../utils/Math.js';

export class WebGLEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this.initWebGL();
        this.camera = new Camera(canvas);

        this.shader = null;
        this.meshes = [];

        this.clearColor = [0.05, 0.05, 0.1, 1.0];
        this.stats = {
            drawCalls: 0,
            vertices: 0,
            fps: 0,
            frameTime: 0
        };

        this.setupDefaultShader();
        this.setupEventListeners();
    }

    initWebGL() {
        const gl = this.canvas.getContext('webgl2', {
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: false
        });

        if (!gl) {
            throw new Error('WebGL 2.0 não é suportado neste navegador');
        }

        // Configurar viewport e contexto
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(...this.clearColor);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        return gl;
    }

    setupDefaultShader() {
        const vertexShader = `#version 300 es
        precision highp float;

        in vec3 aPosition;
        in vec3 aNormal;
        in vec3 aColor;

        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;

        out vec3 vNormal;
        out vec3 vColor;
        out vec3 vFragPos;

        void main() {
            vFragPos = vec3(uModel * vec4(aPosition, 1.0));
            vNormal = mat3(transpose(inverse(uModel))) * aNormal;
            vColor = aColor;
            gl_Position = uProjection * uView * vec4(vFragPos, 1.0);
        }
        `;

        const fragmentShader = `#version 300 es
        precision highp float;

        in vec3 vNormal;
        in vec3 vColor;
        in vec3 vFragPos;

        out vec4 FragColor;

        void main() {
            // Iluminação básica (Phong)
            vec3 norm = normalize(vNormal);
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            
            // Ambient
            float ambientStrength = 0.3;
            vec3 ambient = ambientStrength * vColor;
            
            // Diffuse
            float diff = max(dot(norm, lightDir), 0.0);
            vec3 diffuse = diff * vColor;
            
            // Resultado
            vec3 result = ambient + diffuse;
            FragColor = vec4(result, 1.0);
        }
        `;

        this.shader = Shader.fromStrings(this.gl, vertexShader, fragmentShader);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        this.gl.viewport(0, 0, width, height);
        this.camera.onWindowResize();
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    render(meshes, deltaTime) {
        // Atualizar câmera
        this.camera.update(deltaTime);

        // Limpar a tela
        this.clear();

        // Reset stats
        this.stats.drawCalls = 0;
        this.stats.vertices = 0;

        // Usar shader
        this.shader.use();

        // Passar matrizes para o shader
        const viewMatrix = this.camera.getViewMatrix();
        const projMatrix = this.camera.getProjectionMatrix();

        this.shader.setUniformArray('uView', viewMatrix);
        this.shader.setUniformArray('uProjection', projMatrix);

        // Renderizar cada mesh
        for (const mesh of meshes) {
            // Passar matriz model
            const modelMatrix = mesh.transform.getModelMatrix();
            this.shader.setUniformArray('uModel', modelMatrix);

            // Desenhar
            mesh.draw(this.shader);

            this.stats.drawCalls++;
            this.stats.vertices += mesh.vertexCount;
        }
    }

    setShader(shader) {
        this.shader = shader;
        return this;
    }

    setClearColor(r, g, b, a = 1.0) {
        this.clearColor = [r, g, b, a];
        this.gl.clearColor(r, g, b, a);
        return this;
    }

    getContext() {
        return this.gl;
    }

    getStats() {
        return { ...this.stats };
    }

    destroy() {
        if (this.shader) this.shader.delete();
    }
}