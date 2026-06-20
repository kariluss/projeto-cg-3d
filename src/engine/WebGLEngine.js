import { Shader } from './Shader.js';
import { Camera } from './Camera.js';

export class WebGLEngine {
    constructor(canvas) {
        this.canvas = canvas;
        
        this.clearColor = [0.02, 0.02, 0.05, 1.0];
        
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
        uniform vec3 uFlashlightPos; 
        uniform vec3 uFront;

        uniform sampler2D uSampler;
        uniform int uUseTexture;

        out vec4 FragColor;

        void main() {
            vec3 norm = normalize(vNormal);
            vec3 viewDir = normalize(uViewPos - vFragPos);

            // CORREÇÃO: O baseColor é vColor por padrão. 
            // Se tiver textura, ele muda para a cor do pixel.
            vec3 baseColor = vColor;
            if (uUseTexture == 1) {
                baseColor = texture(uSampler, vTexCoord).rgb;
            }

            // AGORA TROCAMOS vColor POR baseColor AQUI NAS CONTAS:
            vec3 ambient = vec3(0.04, 0.04, 0.06) * baseColor;

            float distToBody = length(uViewPos - vFragPos);
            float attenGlow = 1.0 / (1.0 + 0.6 * distToBody + 0.4 * (distToBody * distToBody));
            vec3 glowColor = vec3(0.3, 0.3, 0.3); 
            // baseColor aqui
            vec3 proximityGlow = glowColor * baseColor * attenGlow;

            vec3 lightDir = normalize(uFlashlightPos - vFragPos);
            float distToFlashlight = length(uFlashlightPos - vFragPos);
            
            float theta = dot(normalize(-lightDir), normalize(uFront));
            float cutOff = cos(radians(15.0)); 
            float outerCutOff = cos(radians(24.0)); 
            float epsilon = cutOff - outerCutOff;
            float intensity = clamp((theta - outerCutOff) / epsilon, 0.0, 1.0);

            float attenSpot = 1.0 / (1.0 + 0.045 * distToFlashlight + 0.0075 * (distToFlashlight * distToFlashlight));
            float diffSpot = max(dot(norm, lightDir), 0.0);
            
            vec3 flashColor = vec3(1.0, 0.85, 0.6) * 1.8; 
            // baseColor aqui
            vec3 diffuseSpot = diffSpot * flashColor * baseColor * intensity * attenSpot;

            vec3 reflectDir = reflect(-lightDir, norm);  
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            vec3 specularSpot = spec * flashColor * 0.4 * intensity * attenSpot;

            vec3 result = ambient + proximityGlow + diffuseSpot + specularSpot;
            FragColor = vec4(result, 1.0);
        }
        `;

        this.shader = Shader.fromStrings(this.gl, vertexShader, fragmentShader);
    }

    render(meshes, deltaTime) {
        this.camera.update(deltaTime);
        this.clear();
        this.stats.drawCalls = 0;
        this.stats.vertices = 0;

        this.shader.use();

        const viewMatrix = this.camera.getViewMatrix();
        const projMatrix = this.camera.getProjectionMatrix();

        this.shader.setUniformArray('uView', viewMatrix);
        this.shader.setUniformArray('uProjection', projMatrix);

        // --- CÁLCULO DA POSIÇÃO DA MÃO (LANTERNA) ---
        const camPos = this.camera.getPosition(); 
        const camFront = this.camera.front; 
        
        // Vamos calcular o vetor "Direita" e "Baixo" da câmera
        const right = [0, 0, 0];
        // Importando a matemática nativa só pra essa continha rápida
        const up = [0, 1, 0];
        // Cross product (Frente x Cima = Direita)
        right[0] = camFront[1]*up[2] - camFront[2]*up[1];
        right[1] = camFront[2]*up[0] - camFront[0]*up[2];
        right[2] = camFront[0]*up[1] - camFront[1]*up[0];
        
        // Normaliza o Right
        const rLen = Math.sqrt(right[0]*right[0] + right[1]*right[1] + right[2]*right[2]);
        right[0]/=rLen; right[1]/=rLen; right[2]/=rLen;

        // Posição da Lanterna: Camera + (0.5 pra direita) + (-0.3 pra baixo)
        const flashPos = [
            camPos[0] + (right[0] * 0.4),
            camPos[1] - 0.3,
            camPos[2] + (right[2] * 0.4)
        ];

        if (this.shader.setUniform3f) {
            this.shader.setUniform3f('uViewPos', camPos[0], camPos[1], camPos[2]);
            this.shader.setUniform3f('uFlashlightPos', flashPos[0], flashPos[1], flashPos[2]);
            this.shader.setUniform3f('uFront', camFront[0], camFront[1], camFront[2]);
        }

        for (const mesh of meshes) {
            if (mesh.transform) {
                const modelMatrix = mesh.transform.getModelMatrix();
                this.shader.setUniformArray('uModel', modelMatrix);
            }
            mesh.draw(this.shader);
            this.stats.drawCalls++;
            this.stats.vertices += mesh.vertexCount;
        }
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
        
        if(this.camera.onWindowResize) {
            this.camera.onWindowResize();
        }
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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