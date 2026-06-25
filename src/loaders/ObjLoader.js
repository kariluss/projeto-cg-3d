import { Mesh } from '../engine/Mesh.js';

export class ObjLoader {
    static async load(gl, url) {
        const response = await fetch(url);
        const text = await response.text();

        const tempPositions = [];
        const tempTexCoords = [];
        const tempNormals = [];

        const outPositions = [];
        const outTexCoords = [];
        const outNormals = [];
        const outColors = [];

        const lines = text.split('\n');

        for (let line of lines) {
            line = line.trim();
            if (line === '' || line.startsWith('#')) continue;

            const parts = line.split(/\s+/); 
            const type = parts[0];

            if (type === 'v') {
                tempPositions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
            } 
            else if (type === 'vt') {
                tempTexCoords.push([parseFloat(parts[1]), parseFloat(parts[2])]);
            } 
            else if (type === 'vn') {
                tempNormals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
            } 
            else if (type === 'f') {
                // Função interna para processar cada vértice da face
                const parseVertex = (stringData) => {
                    const faceData = stringData.split('/');
                    const posIndex = parseInt(faceData[0]) - 1;
                    const texIndex = faceData[1] ? parseInt(faceData[1]) - 1 : -1;
                    const normIndex = faceData[2] ? parseInt(faceData[2]) - 1 : -1;

                    const pos = tempPositions[posIndex];
                    outPositions.push(pos[0], pos[1], pos[2]);

                    if (texIndex >= 0 && tempTexCoords[texIndex]) {
                        outTexCoords.push(tempTexCoords[texIndex][0], tempTexCoords[texIndex][1]);
                    } else {
                        outTexCoords.push(0, 0); 
                    }

                    if (normIndex >= 0 && tempNormals[normIndex]) {
                        outNormals.push(tempNormals[normIndex][0], tempNormals[normIndex][1], tempNormals[normIndex][2]);
                    } else {
                        outNormals.push(0, 1, 0); 
                    }

                    // COR: Cinza escuro (Cor da lanterna sem textura)
                    outColors.push(0.2, 0.2, 0.22);
                };

                // Verifica se é Triângulo (4 partes: 'f', 'v1', 'v2', 'v3')
                if (parts.length === 4) {
                    parseVertex(parts[1]);
                    parseVertex(parts[2]);
                    parseVertex(parts[3]);
                } 
                // Verifica se é Quad/Quadrado (5 partes: 'f', 'v1', 'v2', 'v3', 'v4')
                else if (parts.length === 5) {
                    // Divide o quadrado em 2 triângulos (v1,v2,v3 e v1,v3,v4)
                    parseVertex(parts[1]); parseVertex(parts[2]); parseVertex(parts[3]);
                    parseVertex(parts[1]); parseVertex(parts[3]); parseVertex(parts[4]);
                }
            }
        }

        const mesh = new Mesh(gl);
        mesh.positions = outPositions;
        mesh.texCoords = outTexCoords;
        mesh.normals = outNormals;
        mesh.colors = outColors;
        mesh.indices = []; 
        
        mesh.setupBuffers();
        return mesh;
    }
}