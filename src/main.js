import { WebGLEngine } from './engine/WebGLEngine.js';
import { Mesh } from './engine/Mesh.js';
import { Transform } from './engine/Transform.js';
import { input } from './utils/Input.js';
import { Texture } from './engine/Texture.js';

window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const engine = new WebGLEngine(canvas);
    input.initPointerLock(canvas);
    const gl = engine.getContext();

    // --- 1. O MAPA DO LABIRINTO (1 = Parede, 0 = Caminho) ---
    // like minecraft rs :)
    const mapLayout = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1],
        [1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
    ];

    const blockSize = 2.0;
    const wallHeight = 3.0; // Paredes altas

    engine.camera.setCollisionMap(mapLayout, blockSize);

    const wallTex = new Texture(gl);
    // Substitua pelo caminho do seu arquivo diff_4k reduzido
    wallTex.load('./assets/rock_boulder_cracked_diff_4k.jpg');

    // Lendo a matriz e construindo a caverna
    for (let z = 0; z < mapLayout.length; z++) {
        for (let x = 0; x < mapLayout[z].length; x++) {
            if (mapLayout[z][x] === 1) {
                // Cria um cubo
                const wall = Mesh.createCube(gl, 1.0);

                wall.texture = wallTex;
                
                wall.setupBuffers();
                wall.transform = new Transform();
                
                // Escala para ficar no tamanho do bloco (2x2) e altura certa
                wall.transform.setScale(blockSize, wallHeight, blockSize);
                
                // Posiciona no mundo (Multiplicamos pelo blockSize)
                // Y = wallHeight/2 para a base do cubo encostar no chão
                wall.transform.setPosition(x * blockSize, wallHeight / 2 - 1.0, z * blockSize);
                
                engine.meshes.push(wall);
            }
        }
    }

    // --- 2. POSICIONAR O JOGADOR NO MAPA ---
    // Colocando a câmera no meio de um corredor (índice x=1, z=1)
    engine.camera.position[0] = 1 * blockSize;
    engine.camera.position[1] = 0.5; // Altura dos olhos
    engine.camera.position[2] = 1 * blockSize;

    // --- 3. BARRA DE OURO NO FINAL ---
    const goldBarMesh = Mesh.createGoldBar(gl, 1.0, 2.0, 0.5, 0.6);
    goldBarMesh.setupBuffers(); 
    goldBarMesh.transform = new Transform();
    goldBarMesh.transform.setPosition(3 * blockSize, 0.0, 3 * blockSize); 
    goldBarMesh.transform.setScale(0.3, 0.3, 0.3);
    engine.meshes.push(goldBarMesh);


    // =========================================================================
    // --- 4. CÁLCULO DINÂMICO PARA O CHÃO E TETO ---
    // =========================================================================
    
    // Descobrimos o tamanho real do labirinto baseando-se na matriz
    const mapRows = mapLayout.length;         // Eixo Z (Comprimento)
    const mapCols = mapLayout[0].length;      // Eixo X (Largura)
    
    const worldWidth = mapCols * blockSize;
    const worldLength = mapRows * blockSize;

    // Calculamos o centro do mapa para posicionar o chão e o teto
    const centerX = (worldWidth / 2) - (blockSize / 2);
    const centerZ = (worldLength / 2) - (blockSize / 2);

    // --- O CHÃO DA CAVERNA ---
    const floorTex = new Texture(gl);
    floorTex.load('./assets/rock_boulder_cracked_diff_4k.jpg'); 

    const floorMesh = Mesh.createPlane(gl, worldWidth, worldLength); 
    floorMesh.texture = floorTex; 
    
    // Repete a textura com base no tamanho da sala (Pra não ficar esticada)
    floorMesh.texCoords = [
        0, 0,                            mapCols, 0, 
        mapCols, mapRows,                0, mapRows
    ];

    floorMesh.setupBuffers(); 
    floorMesh.transform = new Transform();
    // Coloca o plano exatamente no centro da sala, cobrindo tudo
    floorMesh.transform.setPosition(centerX, -1.0, centerZ); 
    engine.meshes.push(floorMesh);

    // --- 5. O TETO DA CAVERNA ---
    const ceilingTex = new Texture(gl);
    ceilingTex.load('./assets/rock_boulder_cracked_diff_4k.jpg'); 

    const ceilingMesh = Mesh.createPlane(gl, worldWidth, worldLength);
    ceilingMesh.texture = ceilingTex; 

    // O teto também repete a textura como o chão
    ceilingMesh.texCoords = [
        0, 0,                            mapCols, 0, 
        mapCols, mapRows,                0, mapRows
    ];

    ceilingMesh.setupBuffers();
    ceilingMesh.transform = new Transform();
    // Posição no alto (wallHeight), centro igual ao chão, e rotacionado
    ceilingMesh.transform.setPosition(centerX, wallHeight - 1.0, centerZ); 
    ceilingMesh.transform.setRotation(180, 0, 0); 
    
    engine.meshes.push(ceilingMesh);


    let lastTime = performance.now();

    // --- GAME LOOP ---
    function loop(time) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        const currentRot = goldBarMesh.transform.rotation;
        goldBarMesh.transform.setRotation(currentRot[0], currentRot[1] + 45 * deltaTime, currentRot[2]);

        engine.render(engine.meshes, deltaTime);

        const fpsElement = document.getElementById('fps');
        if (fpsElement && deltaTime > 0) {
            fpsElement.innerText = Math.round(1 / deltaTime);
        }
        
        document.getElementById('drawCalls').innerText = engine.getStats().drawCalls;
        document.getElementById('vertices').innerText = engine.getStats().vertices;
        
        const camPos = engine.camera.getPosition();
        document.getElementById('camPos').innerText = `[${camPos[0].toFixed(1)}, ${camPos[1].toFixed(1)}, ${camPos[2].toFixed(1)}]`;
        document.getElementById('camRot').innerText = `[${engine.camera.pitch.toFixed(1)}, ${engine.camera.yaw.toFixed(1)}]`;

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
};