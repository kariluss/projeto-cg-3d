import { WebGLEngine } from './engine/WebGLEngine.js';
import { Mesh } from './engine/Mesh.js';
import { Transform } from './engine/Transform.js';
import { input } from './utils/Input.js';

window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const engine = new WebGLEngine(canvas);
    input.initPointerLock(canvas);
    const gl = engine.getContext();

    // --- 1. O MAPA DO LABIRINTO (1 = Parede, 0 = Caminho) ---
    // Pense que cada bloco tem tamanho 2x2.
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

    // Lendo a matriz e construindo a caverna
    for (let z = 0; z < mapLayout.length; z++) {
        for (let x = 0; x < mapLayout[z].length; x++) {
            if (mapLayout[z][x] === 1) {
                // Cria um cubo
                const wall = Mesh.createCube(gl, 1.0);
                
                // Pinta a parede de cinza bem escuro
                wall.colors = [];
                for(let i=0; i<36; i++) wall.colors.push(0.4, 0.4, 0.45);
                
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
    
    // ADICIONE ESTA LINHA:
    goldBarMesh.transform.setScale(0.3, 0.3, 0.3); // Deixa ela com 30% do tamanho original
    
    engine.meshes.push(goldBarMesh);

    // --- 4. O CHÃO GIGANTE ---
    const floorMesh = Mesh.createPlane(gl, 50, 50); 
    floorMesh.setupBuffers(); 
    floorMesh.transform = new Transform();
    floorMesh.transform.setPosition(0, -1.0, 0); 
    engine.meshes.push(floorMesh);

    let lastTime = performance.now();

    // --- GAME LOOP ---
    function loop(time) {
        // [AQUI FICA O RESTO DO SEU CÓDIGO DA FUNÇÃO LOOP QUE JÁ ESTAVA FUNCIONANDO]
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