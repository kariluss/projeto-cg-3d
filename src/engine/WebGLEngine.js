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

        // Variaveis de Iluminação (Posição do Player e Direção do Olhar)
        uniform vec3 uViewPos;  
        uniform vec3 uFront;    

        out vec4 FragColor;

        void main() {
            // 1. Ambiente (Global)
            vec3 ambient = vec3(0.05, 0.05, 0.08) * vColor;
            
            vec3 norm = normalize(vNormal);
            vec3 lightDir = normalize(uViewPos - vFragPos); 
            vec3 viewDir = normalize(uViewPos - vFragPos);
            float dist = length(uViewPos - vFragPos);

            // 2. Pontual (Glow do Player)
            float attenPoint = 1.0 / (1.0 + 0.14 * dist + 0.07 * (dist * dist));
            float diffPoint = max(dot(norm, lightDir), 0.0);
            vec3 glowColor = vec3(0.3, 0.3, 0.3); 
            vec3 diffusePoint = diffPoint * glowColor * vColor * attenPoint;

            // 3. Spotlight (Lanterna)
            float theta = dot(normalize(-lightDir), normalize(uFront));
            float cutOff = cos(radians(12.5));
            float outerCutOff = cos(radians(17.5));
            float epsilon = cutOff - outerCutOff;
            float intensity = clamp((theta - outerCutOff) / epsilon, 0.0, 1.0);

            float attenSpot = 1.0 / (1.0 + 0.045 * dist + 0.0075 * (dist * dist));
            float diffSpot = max(dot(norm, lightDir), 0.0);
            vec3 flashColor = vec3(1.0, 0.9, 0.7) * 2.0; 
            
            vec3 diffuseSpot = diffSpot * flashColor * vColor * intensity * attenSpot;

            vec3 reflectDir = reflect(-lightDir, norm);  
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            vec3 specularSpot = spec * flashColor * 0.6 * intensity * attenSpot;

            vec3 result = ambient + diffusePoint + diffuseSpot + specularSpot;
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
        
        if(this.camera.onWindowResize) {
            this.camera.onWindowResize();
        }
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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

        const camPos = this.camera.getPosition ? this.camera.getPosition() : [0, 0, 0]; 
        const camFront = this.camera.front; 
        
        if (this.shader.setUniform3f) {
            this.shader.setUniform3f('uViewPos', camPos[0], camPos[1], camPos[2]);
            this.shader.setUniform3f('uFront', camFront[0], camFront[1], camFront[2]);
            // REPARE QUE AQUI NÃO TEM MAIS O uLightPos! 
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