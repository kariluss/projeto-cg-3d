/**
 * WebGLEngine
 * Motor WebGL que gerencia contexto, renderização e estado gráfico
 */

import { Shader } from './Shader.js';
import { Camera } from './Camera.js';

export class WebGLEngine {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Fundo escuro criado PRIMEIRO
        this.clearColor = [0.02, 0.02, 0.05, 1.0];
        
        // Só agora inicializamos o WebGL
        this.gl = this.initWebGL(); 
        this.camera = new Camera(canvas);

        this.shader = null;
        this.meshes = [];

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

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Agora this.clearColor existe e o spread vai funcionar perfeitamente!
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
        in vec2 aTexCoord;

        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;

        out vec3 vNormal;
        out vec3 vColor;
        out vec3 vFragPos;
        out vec2 vTexCoord;

        void main() {
            vFragPos = vec3(uModel * vec4(aPosition, 1.0));
            vNormal = mat3(transpose(inverse(uModel))) * aNormal;
            vColor = aColor;
            vTexCoord = aTexCoord;
            
            gl_Position = uProjection * uView * vec4(vFragPos, 1.0);
        }
        `;

        const fragmentShader = `#version 300 es
        precision highp float;

        in vec3 vNormal;
        in vec3 vColor;
        in vec3 vFragPos;
        in vec2 vTexCoord;

        uniform vec3 uViewPos;  
        uniform vec3 uLightPos; 

        out vec4 FragColor;

        void main() {
            // 1. Ambiente
            float ambientStrength = 0.15;
            vec3 ambient = ambientStrength * vColor;
            
            // 2. Difusa
            vec3 norm = normalize(vNormal);
            vec3 lightDir = normalize(uLightPos - vFragPos);
            float diff = max(dot(norm, lightDir), 0.0);
            
            // Cor da luz (Laranja forte)
            vec3 lightColor = vec3(1.0, 0.9, 0.7) * 2.0; 
            vec3 diffuse = diff * lightColor * vColor;
            
            // 3. Especular
            float specularStrength = 0.6;
            vec3 viewDir = normalize(uViewPos - vFragPos);
            vec3 reflectDir = reflect(-lightDir, norm);  
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            vec3 specular = specularStrength * spec * lightColor;
            
            // 4. Atenuação (Usando lightDist ao invés de distance para evitar erro GLSL)
            float lightDist = length(uLightPos - vFragPos);
            float atten = 1.0 / (1.0 + 0.045 * lightDist + 0.0075 * (lightDist * lightDist));
            
            ambient  *= atten;
            diffuse  *= atten;
            specular *= atten;

            vec3 result = ambient + diffuse + specular;
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
        
        // Assegure-se que a sua classe Camera tenha esse método implementado!
        if(this.camera.onWindowResize) {
            this.camera.onWindowResize();
        }
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

        // Passar matrizes de Visão e Projeção
        const viewMatrix = this.camera.getViewMatrix();
        const projMatrix = this.camera.getProjectionMatrix();

        // IMPORTANTE: Sua classe Shader.js precisa ter o método 'setUniformMatrix4fv' ou equivalente.
        // Assumindo que setUniformArray faz isso:
        this.shader.setUniformArray('uView', viewMatrix);
        this.shader.setUniformArray('uProjection', projMatrix);

        // Atualizar Variáveis de Iluminação Dinâmica (O Segredo do Requisito de Luz)
        // Estamos amarrando a fonte de luz à posição atual da câmera (Lanterna do Jogador)
        const camPos = this.camera.getPosition ? this.camera.getPosition() : [0, 0, 0]; 
        
        // Precisamos verificar se sua Shader.js tem setUniform3f, caso não, ajuste para a chamada correta
        if (this.shader.setUniform3f) {
            this.shader.setUniform3f('uViewPos', camPos[0], camPos[1], camPos[2]);
            this.shader.setUniform3f('uLightPos', camPos[0], camPos[1], camPos[2]);
        }

        // Renderizar cada mesh
        for (const mesh of meshes) {
            // Passar matriz model (Transformações do objeto: Posição, Rotação, Escala)
            if (mesh.transform) {
                const modelMatrix = mesh.transform.getModelMatrix();
                this.shader.setUniformArray('uModel', modelMatrix);
            }

            // Desenhar chamando os buffers armazenados no Mesh
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