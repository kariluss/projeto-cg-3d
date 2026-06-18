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
        
        this.transform = null;
    }

    setupBuffers() {
        const gl = this.gl;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vbo.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);

        if (this.normals.length > 0) {
            this.vbo.normal = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.normal);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
        }

        if (this.colors.length > 0) {
            this.vbo.color = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.color);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
        }

        if (this.texCoords.length > 0) {
            this.vbo.texCoord = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.texCoord);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoords), gl.STATIC_DRAW);
        }

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

        if (shader.attributes['aPosition']) {
            gl.enableVertexAttribArray(shader.attributes['aPosition'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.position);
            gl.vertexAttribPointer(shader.attributes['aPosition'].location, 3, gl.FLOAT, false, 0, 0);
        }
        if (this.vbo.normal && shader.attributes['aNormal']) {
            gl.enableVertexAttribArray(shader.attributes['aNormal'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.normal);
            gl.vertexAttribPointer(shader.attributes['aNormal'].location, 3, gl.FLOAT, false, 0, 0);
        }
        if (this.vbo.color && shader.attributes['aColor']) {
            gl.enableVertexAttribArray(shader.attributes['aColor'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.color);
            gl.vertexAttribPointer(shader.attributes['aColor'].location, 3, gl.FLOAT, false, 0, 0);
        }
        if (this.vbo.texCoord && shader.attributes['aTexCoord']) {
            gl.enableVertexAttribArray(shader.attributes['aTexCoord'].location);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.texCoord);
            gl.vertexAttribPointer(shader.attributes['aTexCoord'].location, 2, gl.FLOAT, false, 0, 0);
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
            -s, -s, s,  s, -s, s,  s, s, s,  -s, s, s, // Front
            -s, -s, -s,  -s, s, -s,  s, s, -s,  s, -s, -s, // Back
            -s, s, -s,  -s, s, s,  s, s, s,  s, s, -s, // Top
            -s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, s, // Bottom
            s, -s, -s,  s, s, -s,  s, s, s,  s, -s, s, // Right
            -s, -s, -s,  -s, -s, s,  -s, s, s,  -s, s, -s, // Left
        ];

        mesh.normals = [
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
            0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
            1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
            -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
        ];

        mesh.colors = [];
        for(let i=0; i<24; i++) mesh.colors.push(0.8, 0.8, 0.8);

        mesh.indices = [
            0, 1, 2,  0, 2, 3,    
            4, 5, 6,  4, 6, 7,    
            8, 9, 10,  8, 10, 11,  
            12, 13, 14,  12, 14, 15, 
            16, 17, 18,  16, 18, 19, 
            20, 21, 22,  20, 22, 23, 
        ];

        return mesh;
    }

    static createGoldBar(gl, baseWidth = 1.0, baseLength = 2.0, height = 0.5, topScale = 0.6) {
        const mesh = new Mesh(gl);
        
        const bw = baseWidth / 2;
        const bl = baseLength / 2;
        const tw = bw * topScale;
        const tl = bl * topScale;
        const h = height / 2;

        mesh.positions = [
            // Topo (Y = h)
            -tw, h,  tl,   tw, h,  tl,   tw, h, -tl,  -tw, h, -tl,
            // Base (Y = -h)
            -bw, -h,  bl,   bw, -h,  bl,   bw, -h, -bl,  -bw, -h, -bl,
            // Frente (+Z)
            -bw, -h,  bl,   bw, -h,  bl,   tw, h,  tl,  -tw, h,  tl,
            // Trás (-Z)
             bw, -h, -bl,  -bw, -h, -bl,  -tw, h, -tl,   tw, h, -tl,
            // Direita (+X)
             bw, -h,  bl,   bw, -h, -bl,   tw, h, -tl,   tw, h,  tl,
            // Esquerda (-X)
            -bw, -h, -bl,  -bw, -h,  bl,  -tw, h,  tl,  -tw, h, -tl
        ];

        // Função mágica de Álgebra Linear que calcula a Normal Exata (Produto Vetorial)
        function calcNormal(p0, p1, p2) {
            const u = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]];
            const v = [p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]];
            const nx = u[1]*v[2] - u[2]*v[1];
            const ny = u[2]*v[0] - u[0]*v[2];
            const nz = u[0]*v[1] - u[1]*v[0];
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            return [nx/len, ny/len, nz/len];
        }

        const topN = [0, 1, 0];
        const botN = [0, -1, 0];
        const frontN = calcNormal([-bw, -h, bl], [bw, -h, bl], [tw, h, tl]);
        const backN = calcNormal([bw, -h, -bl], [-bw, -h, -bl], [-tw, h, -tl]);
        const rightN = calcNormal([bw, -h, bl], [bw, -h, -bl], [tw, h, -tl]);
        const leftN = calcNormal([-bw, -h, -bl], [-bw, -h, bl], [-tw, h, tl]);

        mesh.normals = [
            ...topN, ...topN, ...topN, ...topN,
            ...botN, ...botN, ...botN, ...botN,
            ...frontN, ...frontN, ...frontN, ...frontN,
            ...backN, ...backN, ...backN, ...backN,
            ...rightN, ...rightN, ...rightN, ...rightN,
            ...leftN, ...leftN, ...leftN, ...leftN
        ];

        const gold = [1.0, 0.843, 0.0]; 
        mesh.colors = [];
        for(let i = 0; i < 24; i++) mesh.colors.push(...gold);

        mesh.indices = [
            0, 1, 2,  0, 2, 3,       // Topo
            4, 6, 5,  4, 7, 6,       // Base (Ordem corrigida)
            8, 9, 10,  8, 10, 11,    // Frente
            12, 13, 14,  12, 14, 15, // Trás
            16, 17, 18,  16, 18, 19, // Direita
            20, 21, 22,  20, 22, 23  // Esquerda
        ];

        return mesh;
    }

    static createPlane(gl, width = 1, length = 1) {
        const mesh = new Mesh(gl);
        const w = width / 2;
        const l = length / 2;

        mesh.positions = [
            -w, 0,  l,   // 0: frente-esquerda
             w, 0,  l,   // 1: frente-direita
             w, 0, -l,   // 2: trás-direita
            -w, 0, -l,   // 3: trás-esquerda
        ];

        mesh.normals = [
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        ];

        mesh.colors = [
            1, 1, 1,  1, 1, 1,  1, 1, 1,  1, 1, 1,
        ];

        // Ordem Anti-Horária (CCW) para o WebGL não ignorar a face (Culling)
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