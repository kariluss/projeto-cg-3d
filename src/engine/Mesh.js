/**
 * Mesh
 * Representa uma geometria 3D com vértices, normais, cores, índices e coordenadas de textura
 */

export class Mesh {
    constructor(gl) {
        this.gl = gl;
        this.positions = [];
        this.normals = [];
        this.colors = [];
        this.texCoords = [];
        this.indices = [];

        this.vao = null;
        this.vbo = {};
        this.ebo = null;
        this.vertexCount = 0;
        
        this.transform = null; // Para referência futura de posicionamento no mundo
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

        // VBO para texturas (UVs)
        if (this.texCoords.length > 0) {
            this.vbo.texCoord = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.texCoord);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoords), gl.STATIC_DRAW);
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

        // Ativar atributo de textura
        if (this.vbo.texCoord && shader.attributes['aTexCoord']) {
            gl.enableVertexAttribArray(shader.attributes['aTexCoord'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.texCoord);
            gl.vertexAttribPointer(
                shader.attributes['aTexCoord'].location,
                2, gl.FLOAT, false, 0, 0
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

    // --- Geometrias Geradas Programaticamente ---

    static createCube(gl, size = 1) {
        const mesh = new Mesh(gl);
        const s = size / 2;

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

        mesh.colors = [
            // Cor sólida para todas as faces (Cinza claro, pode ser alterado depois)
            0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,
            0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,
            0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,
            0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,
            0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,
            0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,  0.8, 0.8, 0.8,
        ];

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

    // Gerador de Barra de Ouro (Cor Sólida / Forma Geométrica)
    static createGoldBar(gl, baseWidth = 1.0, baseLength = 2.0, height = 0.5, topScale = 0.6) {
        const mesh = new Mesh(gl);
        
        const bw = baseWidth / 2;
        const bl = baseLength / 2;
        const tw = bw * topScale;
        const tl = bl * topScale;
        const h = height / 2;

        mesh.positions = [
            // Topo
            -tw, h, tl,  tw, h, tl,  tw, h, -tl,  -tw, h, -tl,
            // Base
            -bw, -h, bl,  bw, -h, bl,  bw, -h, -bl,  -bw, -h, -bl,
            // Frente
            -bw, -h, bl,  bw, -h, bl,  tw, h, tl,  -tw, h, tl,
            // Trás
            bw, -h, -bl,  -bw, -h, -bl,  -tw, h, -tl,  tw, h, -tl,
            // Direita
            bw, -h, bl,  bw, -h, -bl,  tw, h, -tl,  tw, h, tl,
            // Esquerda
            -bw, -h, -bl,  -bw, -h, bl,  -tw, h, tl,  -tw, h, -tl
        ];

        // Dourado
        const gold = [1.0, 0.843, 0.0]; 
        mesh.colors = [];
        for(let i = 0; i < 24; i++) mesh.colors.push(...gold);

        mesh.normals = Mesh.createCube(gl, 1).normals; // Lembre-se de passar 'gl' pro cubo também

        mesh.indices = [
            0, 1, 2,  0, 2, 3,       // Topo
            4, 5, 6,  4, 6, 7,       // Base
            8, 9, 10,  8, 10, 11,    // Frente
            12, 13, 14,  12, 14, 15, // Trás
            16, 17, 18,  16, 18, 19, // Direita
            20, 21, 22,  20, 22, 23  // Esquerda
        ];

        return mesh;
    }

    static createPlane(gl, width = 1, height = 1) {
        const mesh = new Mesh(gl);
        const w = width / 2;
        const h = height / 2;

        mesh.positions = [
            -w, 0, -h,  w, 0, -h,  w, 0, h,  -w, 0, h,
        ];

        mesh.normals = [
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        ];

        mesh.colors = [
            1, 1, 1,  1, 1, 1,  1, 1, 1,  1, 1, 1,
        ];

        mesh.indices = [0, 1, 2, 0, 2, 3];

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