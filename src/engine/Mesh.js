/**
 * Mesh
 * Representa uma geometria 3D com vértices, normais e índices
 */

export class Mesh {
    constructor(gl) {
        this.gl = gl;
        this.positions = [];
        this.normals = [];
        this.colors = [];
        this.indices = [];

        this.vao = null;
        this.vbo = {};
        this.ebo = null;
        this.vertexCount = 0;
    }

    setupBuffers() {
        const gl = this.gl;

        // Criar VAO (Vertex Array Object)
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // VBO para posições
        this.vbo.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);

        // VBO para normais
        if (this.normals.length > 0) {
            this.vbo.normal = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.normal);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        }

        // VBO para cores
        if (this.colors.length > 0) {
            this.vbo.color = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.color);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
        }

        // EBO para índices
        if (this.indices.length > 0) {
            this.ebo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
            this.vertexCount = this.indices.length;
        } else {
            this.vertexCount = this.positions.length / 3;
        }

        gl.bindVertexArray(null);
    }

    bindForDraw(shader) {
        const gl = this.gl;

        gl.bindVertexArray(this.vao);

        // Ativar atributo de posição
        if (shader.attributes['aPosition']) {
            gl.enableVertexAttribArray(shader.attributes['aPosition'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.position);
            gl.vertexAttribPointer(
                shader.attributes['aPosition'].location,
                3, gl.FLOAT, false, 0, 0
            );
        }

        // Ativar atributo de normal
        if (this.vbo.normal && shader.attributes['aNormal']) {
            gl.enableVertexAttribArray(shader.attributes['aNormal'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.normal);
            gl.vertexAttribPointer(
                shader.attributes['aNormal'].location,
                3, gl.FLOAT, false, 0, 0
            );
        }

        // Ativar atributo de cor
        if (this.vbo.color && shader.attributes['aColor']) {
            gl.enableVertexAttribArray(shader.attributes['aColor'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.color);
            gl.vertexAttribPointer(
                shader.attributes['aColor'].location,
                3, gl.FLOAT, false, 0, 0
            );
        }
    }

    draw(shader) {
        const gl = this.gl;

        this.bindForDraw(shader);

        if (this.ebo) {
            gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
        }
    }

    static createCube(size = 1) {
        const mesh = new Mesh(null); // GL context será setado depois

        const s = size / 2;

        // Posições dos vértices
        mesh.positions = [
            // Front
            -s, -s, s,  s, -s, s,  s, s, s,  -s, s, s,
            // Back
            -s, -s, -s,  -s, s, -s,  s, s, -s,  s, -s, -s,
            // Top
            -s, s, -s,  -s, s, s,  s, s, s,  s, s, -s,
            // Bottom
            -s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, s,
            // Right
            s, -s, -s,  s, s, -s,  s, s, s,  s, -s, s,
            // Left
            -s, -s, -s,  -s, -s, s,  -s, s, s,  -s, s, -s,
        ];

        // Normais
        mesh.normals = [
            // Front
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
            // Back
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
            // Top
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
            // Bottom
            0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
            // Right
            1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
            // Left
            -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
        ];

        // Cores (RGB)
        mesh.colors = [
            // Front (Vermelho)
            1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
            // Back (Verde)
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
            // Top (Azul)
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
            // Bottom (Amarelo)
            1, 1, 0,  1, 1, 0,  1, 1, 0,  1, 1, 0,
            // Right (Magenta)
            1, 0, 1,  1, 0, 1,  1, 0, 1,  1, 0, 1,
            // Left (Cyan)
            0, 1, 1,  0, 1, 1,  0, 1, 1,  0, 1, 1,
        ];

        // Índices
        mesh.indices = [
            0, 1, 2,  0, 2, 3,    // Front
            4, 5, 6,  4, 6, 7,    // Back
            8, 9, 10,  8, 10, 11,  // Top
            12, 13, 14,  12, 14, 15, // Bottom
            16, 17, 18,  16, 18, 19, // Right
            20, 21, 22,  20, 22, 23, // Left
        ];

        return mesh;
    }

    static createPlane(width = 1, height = 1) {
        const mesh = new Mesh(null);

        const w = width / 2;
        const h = height / 2;

        mesh.positions = [
            -w, 0, -h,
            w, 0, -h,
            w, 0, h,
            -w, 0, h,
        ];

        mesh.normals = [
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
        ];

        mesh.colors = [
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
        ];

        mesh.indices = [0, 1, 2, 0, 2, 3];

        return mesh;
    }

    static createSphere(radius = 1, segments = 32, rings = 16) {
        const mesh = new Mesh(null);

        for (let i = 0; i <= rings; i++) {
            const phi = Math.PI * i / rings;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            for (let j = 0; j <= segments; j++) {
                const theta = 2 * Math.PI * j / segments;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                const x = cosTheta * sinPhi;
                const y = cosPhi;
                const z = sinTheta * sinPhi;

                mesh.positions.push(x * radius, y * radius, z * radius);
                mesh.normals.push(x, y, z);
                mesh.colors.push(
                    (x + 1) / 2,
                    (y + 1) / 2,
                    (z + 1) / 2
                );
            }
        }

        for (let i = 0; i < rings; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = a + segments + 1;

                mesh.indices.push(a, b, a + 1);
                mesh.indices.push(b, b + 1, a + 1);
            }
        }

        return mesh;
    }

    delete() {
        const gl = this.gl;

        Object.values(this.vbo).forEach(vbo => {
            if (vbo) gl.deleteBuffer(vbo);
        });

        if (this.ebo) gl.deleteBuffer(this.ebo);
        if (this.vao) gl.deleteVertexArray(this.vao);
    }
}