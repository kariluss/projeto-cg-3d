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
        this.texture = null;
        this.doubleSided = false;
    }

    clone() {
        const cloned = new Mesh(this.gl);
        cloned.vao = this.vao;
        cloned.vbo = this.vbo;
        cloned.ebo = this.ebo;
        cloned.vertexCount = this.vertexCount;
        cloned.texture = this.texture;
        cloned.colors = this.colors;
        cloned.transform = null;
        cloned.doubleSided = this.doubleSided;
        return cloned;
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

        // --- A CHAVE LIGA/DESLIGA DA TEXTURA ---
        if (this.texture && this.texture.loaded) {
            this.texture.bind(0);
            shader.setUniform('uSampler', 0); 
            shader.setUniform('uUseTexture', 1); // LIGA A TEXTURA
        } else {
            shader.setUniform('uUseTexture', 0); // DESLIGA A TEXTURA
        }

        if (this.ebo) {
            gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
        }
    }

    // --- GEOMETRIAS ---

    static createCube(gl, size = 1, uvRepeatX = 1.0, uvRepeatY = 1.0) {
        const mesh = new Mesh(gl);
        const s = size / 2;

        mesh.positions = [
            // Front face
            -s, -s,  s,    s, -s,  s,    s,  s,  s,   -s,  s,  s,
            // Back face
            -s, -s, -s,   -s,  s, -s,    s,  s, -s,    s, -s, -s,
            // Top face
            -s,  s, -s,   -s,  s,  s,    s,  s,  s,    s,  s, -s,
            // Bottom face
            -s, -s, -s,    s, -s, -s,    s, -s,  s,   -s, -s,  s,
            // Right face
             s, -s, -s,    s,  s, -s,    s,  s,  s,    s, -s,  s,
            // Left face
            -s, -s, -s,   -s, -s,  s,   -s,  s,  s,   -s,  s, -s,
        ];

        mesh.normals = [
             0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1, // Front
             0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1, // Back
             0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0, // Top
             0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0, // Bottom
             1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0, // Right
            -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0, // Left
        ];

        // --- CORREÇÃO DO UV MAP ---
        // Aplicamos a repetição (uvRepeatX e uvRepeatY).
        // rx = Horizontal, ry = Vertical
        const rx = uvRepeatX;
        const ry = uvRepeatY;
        
        mesh.texCoords = [
            // Front (Parede: Largura X, Altura Y)
            0, 0,   rx, 0,   rx, ry,   0, ry,
            // Back (Parede: Largura X, Altura Y)
            0, 0,   0, ry,   rx, ry,   rx, 0, 
            // Top (Chão/Teto: Largura X, Largura Z) -> usamos rx pros dois lados para ficar quadrado
            0, 0,   0, rx,   rx, rx,   rx, 0, 
            // Bottom
            0, 0,   rx, 0,   rx, rx,   0, rx, 
            // Right (Parede: Profundidade Z, Altura Y) -> assumimos Z = X, então rx
            0, 0,   0, ry,   rx, ry,   rx, 0, 
            // Left
            0, 0,   rx, 0,   rx, ry,   0, ry, 
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
        // [Este código se mantém idêntico ao seu, só não coloquei texCoords nela 
        // porque ela vai ser pintada de amarelo sólido!]
        const mesh = new Mesh(gl);
        
        const bw = baseWidth / 2;
        const bl = baseLength / 2;
        const tw = bw * topScale;
        const tl = bl * topScale;
        const h = height / 2;

        mesh.positions = [
            -tw, h,  tl,   tw, h,  tl,   tw, h, -tl,  -tw, h, -tl,
            -bw, -h,  bl,   bw, -h,  bl,   bw, -h, -bl,  -bw, -h, -bl,
            -bw, -h,  bl,   bw, -h,  bl,   tw, h,  tl,  -tw, h,  tl,
             bw, -h, -bl,  -bw, -h, -bl,  -tw, h, -tl,   tw, h, -tl,
             bw, -h,  bl,   bw, -h, -bl,   tw, h, -tl,   tw, h,  tl,
            -bw, -h, -bl,  -bw, -h,  bl,  -tw, h,  tl,  -tw, h, -tl
        ];

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
            0, 1, 2,  0, 2, 3,       
            4, 6, 5,  4, 7, 6,       
            8, 9, 10,  8, 10, 11,    
            12, 13, 14,  12, 14, 15, 
            16, 17, 18,  16, 18, 19, 
            20, 21, 22,  20, 22, 23  
        ];

        return mesh;
    }

    static createPlane(gl, width = 1, length = 1) {
        const mesh = new Mesh(gl);
        const w = width / 2;
        const l = length / 2;

        mesh.positions = [
            -w, 0,  l,   
             w, 0,  l,   
             w, 0, -l,   
            -w, 0, -l,   
        ];

        mesh.normals = [
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        ];

        mesh.colors = [
            1, 1, 1,  1, 1, 1,  1, 1, 1,  1, 1, 1,
        ];

        // --- NOVO: UV MAPS PRO CHÃO ---
        // Como o chão é gigante, multiplicamos as UVs por 10 para a textura repetir (Tile)!
        mesh.texCoords = [
            0, 0,   10, 0,   10, 10,   0, 10
        ];

        mesh.indices = [0, 1, 2, 0, 2, 3];

        return mesh;
    }

    delete() {
        // (O de sempre)
    }
}