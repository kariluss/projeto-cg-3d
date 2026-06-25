/**
 * Shader
 * Compila e gerencia vertex e fragment shaders GLSL
 */

export class Shader {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.program = null;
        this.uniforms = {};
        this.attributes = {};

        this.compile(vertexSource, fragmentSource);
    }

    compile(vertexSource, fragmentSource) {
        const gl = this.gl;

        // Compilar vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex Shader Error:', gl.getShaderInfoLog(vertexShader));
            throw new Error('Vertex shader compilation failed');
        }

        // Compilar fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment Shader Error:', gl.getShaderInfoLog(fragmentShader));
            throw new Error('Fragment shader compilation failed');
        }

        // Linkar programa
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program Linking Error:', gl.getProgramInfoLog(this.program));
            throw new Error('Shader program linking failed');
        }

        // Limpar shaders
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        this.extractUniforms();
        this.extractAttributes();
    }

    extractUniforms() {
        const gl = this.gl;
        const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(this.program, i);
            this.uniforms[info.name] = {
                location: gl.getUniformLocation(this.program, info.name),
                type: info.type,
                size: info.size
            };
        }
    }

    extractAttributes() {
        const gl = this.gl;
        const count = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);

        for (let i = 0; i < count; i++) {
            const info = gl.getActiveAttrib(this.program, i);
            this.attributes[info.name] = {
                location: gl.getAttribLocation(this.program, info.name),
                type: info.type,
                size: info.size
            };
        }
    }

    use() {
        this.gl.useProgram(this.program);
        return this;
    }

    // Função auxiliar para injetar coordenadas x, y, z (Ex: Luz e Câmera)
    setUniform3f(name, x, y, z) {
        if (this.uniforms[name]) {
            this.gl.uniform3f(this.uniforms[name].location, x, y, z);
        } else {
            console.warn(`Uniform '${name}' not found in shader`);
        }
        return this;
    }

    setUniform(name, ...args) {
        if (!this.uniforms[name]) {
            console.warn(`Uniform '${name}' not found in shader`);
            return this;
        }

        const uniform = this.uniforms[name];
        const gl = this.gl;

        switch (uniform.type) {
            case gl.FLOAT:
                gl.uniform1f(uniform.location, args[0]);
                break;
            case gl.FLOAT_VEC2:
                gl.uniform2f(uniform.location, args[0], args[1]);
                break;
            case gl.FLOAT_VEC3:
                gl.uniform3f(uniform.location, args[0], args[1], args[2]);
                break;
            case gl.FLOAT_VEC4:
                gl.uniform4f(uniform.location, args[0], args[1], args[2], args[3]);
                break;
            case gl.INT:
                gl.uniform1i(uniform.location, args[0]);
                break;
            case gl.INT_VEC2:
                gl.uniform2i(uniform.location, args[0], args[1]);
                break;
            case gl.INT_VEC3:
                gl.uniform3i(uniform.location, args[0], args[1], args[2]);
                break;
            case gl.INT_VEC4:
                gl.uniform4i(uniform.location, args[0], args[1], args[2], args[3]);
                break;
            case gl.BOOL:
                gl.uniform1i(uniform.location, args[0] ? 1 : 0);
                break;
            case gl.FLOAT_MAT2:
                gl.uniformMatrix2fv(uniform.location, false, args[0]);
                break;
            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(uniform.location, false, args[0]);
                break;
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(uniform.location, false, args[0]);
                break;
            case gl.SAMPLER_2D:
                gl.uniform1i(uniform.location, args[0]);
                break;
            case gl.SAMPLER_CUBE:
                gl.uniform1i(uniform.location, args[0]);
                break;
            default:
                console.warn(`Unknown uniform type: ${uniform.type}`);
        }

        return this;
    }

    setUniformArray(name, array) {
        if (!this.uniforms[name]) {
            console.warn(`Uniform '${name}' not found in shader`);
            return this;
        }

        const uniform = this.uniforms[name];
        const gl = this.gl;
        const type = uniform.type;

        if (type === gl.FLOAT_MAT4) {
            gl.uniformMatrix4fv(uniform.location, false, array);
        } else if (type === gl.FLOAT_MAT3) {
            gl.uniformMatrix3fv(uniform.location, false, array);
        } else if (type === gl.FLOAT_MAT2) {
            gl.uniformMatrix2fv(uniform.location, false, array);
        } else {
            // Para arrays de floats ou ints
            const size = array.length;
            if (type === gl.FLOAT || size === 1) {
                gl.uniform1fv(uniform.location, array);
            } else if (size === 2) {
                gl.uniform2fv(uniform.location, array);
            } else if (size === 3) {
                gl.uniform3fv(uniform.location, array);
            } else if (size === 4) {
                gl.uniform4fv(uniform.location, array);
            }
        }

        return this;
    }

    delete() {
        this.gl.deleteProgram(this.program);
    }

    static fromStrings(gl, vertexSrc, fragmentSrc) {
        return new Shader(gl, vertexSrc, fragmentSrc);
    }

    static async fromFiles(gl, vertexPath, fragmentPath) {
        const [vertexSrc, fragmentSrc] = await Promise.all([
            fetch(vertexPath).then(r => r.text()),
            fetch(fragmentPath).then(r => r.text())
        ]);

        return new Shader(gl, vertexSrc, fragmentSrc);
    }
}