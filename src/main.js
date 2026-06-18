import { WebGLEngine } from './engine/WebGLEngine.js';
import { Mesh } from './engine/Mesh.js';
import { Transform } from './engine/Transform.js';
import { input } from './utils/Input.js';

window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const engine = new WebGLEngine(canvas);
    
    // Inicia a trava do mouse ao clicar na tela
    input.initPointerLock(canvas);

    const gl = engine.getContext();

    // --- 1. CRIANDO A BARRA DE OURO ---
    const goldBarMesh = Mesh.createGoldBar(gl, 1.0, 2.0, 0.5, 0.6);
    goldBarMesh.setupBuffers(); 
    goldBarMesh.transform = new Transform();
    goldBarMesh.transform.setPosition(0, -0.5, -3); // Na frente da câmera
    engine.meshes.push(goldBarMesh);

    // --- 2. CRIANDO O CHÃO DA CAVERNA ---
    const floorMesh = Mesh.createPlane(gl, 40, 40); // Um chão bem grande (40x40)
    
    // Pintando o chão de marrom/cinza escuro (estilo terra) antes de mandar pra GPU
    const groundColor = [0.3, 0.25, 0.2];
    floorMesh.colors = [];
    for(let i = 0; i < 4; i++) { // Um plano tem 4 vértices
        floorMesh.colors.push(...groundColor);
    }
    
    floorMesh.setupBuffers(); // Envia pra Placa de Vídeo
    floorMesh.transform = new Transform();
    floorMesh.transform.setPosition(0, -1.0, 0); // Coloca embaixo do pé do jogador
    engine.meshes.push(floorMesh);

    let lastTime = performance.now();

    // --- GAME LOOP ---
    function loop(time) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        // Animação: Faz a barra de ouro ficar girando sozinha
        const currentRot = goldBarMesh.transform.rotation;
        goldBarMesh.transform.setRotation(currentRot[0], currentRot[1] + 45 * deltaTime, currentRot[2]);

        // Renderiza tudo (aqui a câmera é atualizada também)
        engine.render(engine.meshes, deltaTime);

        // --- ATUALIZAÇÃO DA INTERFACE (HUD) ---
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