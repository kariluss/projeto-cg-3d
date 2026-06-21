import { WebGLEngine } from './engine/WebGLEngine.js';
import { Mesh } from './engine/Mesh.js';
import { Transform } from './engine/Transform.js';
import { input } from './utils/Input.js';
import { Texture } from './engine/Texture.js';
import { ObjLoader } from './loaders/ObjLoader.js';

window.onload = async () => {
    const canvas = document.getElementById('gameCanvas');
    const engine = new WebGLEngine(canvas);
    input.initPointerLock(canvas);
    const gl = engine.getContext();

    // --- 1. O MAPA DO LABIRINTO (1 = Parede, 0 = Caminho) ---
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
    
    wallTex.load('./assets/rock_boulder_cracked_diff_1k.jpg');

    // Lendo a matriz e construindo a caverna
    for (let z = 0; z < mapLayout.length; z++) {
        for (let x = 0; x < mapLayout[z].length; x++) {
            if (mapLayout[z][x] === 1) {
                // Cria um cubo
                const wall = Mesh.createCube(gl, 1.0, 1.0, wallHeight / blockSize);

                wall.texture = wallTex;
                
                wall.setupBuffers();
                wall.transform = new Transform();
                
                // Escala para ficar no tamanho do bloco (2x2) e altura certa
                wall.transform.setScale(blockSize, wallHeight, blockSize);
                
                // Posiciona no mundo
                wall.transform.setPosition(x * blockSize, wallHeight / 2 - 1.0, z * blockSize);
                
                engine.meshes.push(wall);
            }
        }
    }

    // --- 2. POSICIONAR O JOGADOR NO MAPA ---
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


    // --- 4. CARREGAR A LANTERNA (.OBJ) ---
    let flashlightMesh = null;
    try {
        flashlightMesh = await ObjLoader.load(gl, './assets/flashlight.obj');
        flashlightMesh.transform = new Transform();
        
        // Escala inicial
        flashlightMesh.transform.setScale(0.001, 0.001, 0.001);

        engine.meshes.push(flashlightMesh);
        console.log("Lanterna carregada com sucesso!");
    } catch (e) {
        console.error("Não foi possível carregar a lanterna. Verifique o caminho ./assets/flashlight.obj", e);
    }


    // =========================================================================
    // --- 5. CÁLCULO DINÂMICO PARA O CHÃO E TETO ---
    // =========================================================================
    const mapRows = mapLayout.length;         
    const mapCols = mapLayout[0].length;      
    const worldWidth = mapCols * blockSize;
    const worldLength = mapRows * blockSize;

    const centerX = (worldWidth / 2) - (blockSize / 2);
    const centerZ = (worldLength / 2) - (blockSize / 2);

    // --- O CHÃO DA CAVERNA ---
    const floorTex = new Texture(gl);
    floorTex.load('./assets/rock_boulder_cracked_diff_1k.jpg'); 

    const floorMesh = Mesh.createPlane(gl, worldWidth, worldLength); 
    floorMesh.texture = floorTex; 
    
    floorMesh.texCoords = [
        0, 0,                            mapCols, 0, 
        mapCols, mapRows,                0, mapRows
    ];

    floorMesh.setupBuffers(); 
    floorMesh.transform = new Transform();
    floorMesh.transform.setPosition(centerX, -1.0, centerZ); 
    engine.meshes.push(floorMesh);

    // --- O TETO DA CAVERNA ---
    const ceilingTex = new Texture(gl);
    ceilingTex.load('./assets/rock_boulder_cracked_diff_1k.jpg'); 

    const ceilingMesh = Mesh.createPlane(gl, worldWidth, worldLength);
    ceilingMesh.texture = ceilingTex; 

    ceilingMesh.texCoords = [
        0, 0,                            mapCols, 0, 
        mapCols, mapRows,                0, mapRows
    ];

    ceilingMesh.setupBuffers();
    ceilingMesh.transform = new Transform();
    ceilingMesh.transform.setPosition(centerX, wallHeight - 1.0, centerZ); 
    ceilingMesh.transform.setRotation(180, 0, 0); 
    
    engine.meshes.push(ceilingMesh);


    let lastTime = performance.now();

    // --- GAME LOOP ---
    function loop(time) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        // Girar barra de ouro
        const currentRot = goldBarMesh.transform.rotation;
        goldBarMesh.transform.setRotation(currentRot[0], currentRot[1] + 45 * deltaTime, currentRot[2]);


        // --- Fixação da lanterna na visão do player ---
        if (flashlightMesh) {
            const camPos = engine.camera.getPosition();
            const camFront = engine.camera.front;

            // 1. Calcular Direita (Right Local)
            const worldUp = [0, 1, 0];
            const right = [
                camFront[1]*worldUp[2] - camFront[2]*worldUp[1],
                camFront[2]*worldUp[0] - camFront[0]*worldUp[2],
                camFront[0]*worldUp[1] - camFront[1]*worldUp[0]
            ];
            const rLen = Math.sqrt(right[0]*right[0] + right[1]*right[1] + right[2]*right[2]);
            right[0]/=rLen; right[1]/=rLen; right[2]/=rLen;

            // 2. Calcular "Cima" da Câmera (Up Local)
            // Isso evita que a lanterna saia da tela quando você olha pro teto ou chão
            const camUp = [
                right[1]*camFront[2] - right[2]*camFront[1],
                right[2]*camFront[0] - right[0]*camFront[2],
                right[0]*camFront[1] - right[1]*camFront[0]
            ];

            // 3. Posicionar (Ex: 0.3 pra direita, -0.2 pra baixo, 0.5 pra frente)
            flashlightMesh.transform.setPosition(
                camPos[0] + (right[0] * 0.3) + (camUp[0] * -0.2) + (camFront[0] * 0.5),
                camPos[1] + (right[1] * 0.3) + (camUp[1] * -0.2) + (camFront[1] * 0.5), 
                camPos[2] + (right[2] * 0.3) + (camUp[2] * -0.2) + (camFront[2] * 0.5)
            );

            // 4. Rotação
            flashlightMesh.transform.setRotation(
                engine.camera.pitch,
                -engine.camera.yaw, 
                180
            );
        }
        // ----------------------------------------------
        // ----------------------------------------------


        engine.render(engine.meshes, deltaTime);

        // --- ATUALIZAÇÃO DA HUD (HTML) ---
        const fpsElement = document.getElementById('fps');
        if (fpsElement && deltaTime > 0) {
            fpsElement.innerText = Math.round(1 / deltaTime);
        }
        
        document.getElementById('drawCalls').innerText = engine.getStats().drawCalls;
        document.getElementById('vertices').innerText = engine.getStats().vertices;
        
        const camPosInfo = engine.camera.getPosition();
        document.getElementById('camPos').innerText = `[${camPosInfo[0].toFixed(1)}, ${camPosInfo[1].toFixed(1)}, ${camPosInfo[2].toFixed(1)}]`;
        document.getElementById('camRot').innerText = `[${engine.camera.pitch.toFixed(1)}, ${engine.camera.yaw.toFixed(1)}]`;

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
};