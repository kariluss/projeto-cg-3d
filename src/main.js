import { WebGLEngine } from './engine/WebGLEngine.js';
import { Mesh } from './engine/Mesh.js';
import { Transform } from './engine/Transform.js';
import { input } from './utils/Input.js';
import { Texture } from './engine/Texture.js';
import { ObjLoader } from './loaders/ObjLoader.js';

let engine;
let gl;
let isPlaying = false;

window.onload = () => {
    // 1. Configura a tecla secreta 'H' para o HUD
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'h') {
            const hud = document.getElementById('debug-hud');
            hud.style.display = (hud.style.display === 'none' || hud.style.display === '') ? 'block' : 'none';
        }
    });

    // 2. Configura o Botão Iniciar do Menu
    document.getElementById('start-btn').addEventListener('click', () => {
        // Pega os valores configurados no menu
        const batProb = parseFloat(document.getElementById('batProb').value);
        const skullProb = parseFloat(document.getElementById('skullProb').value);

        // Esconde o menu e mostra a tela de carregamento
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('loading-screen').style.display = 'flex';

        // Inicia o processo de carregamento pesado do WebGL
        startGame(batProb, skullProb);
    });
};

// Função Assíncrona que processa e monta o jogo inteiro
async function startGame(batProbability, skullProbability) {
    const canvas = document.getElementById('gameCanvas');
    engine = new WebGLEngine(canvas);
    
    // Agora o Pointer Lock só funciona durante o jogo
    input.initPointerLock(canvas);
    
    gl = engine.getContext();

    // --- 1. O MAPA DO LABIRINTO ---
    const mapLayout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], 
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 1], 
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1], 
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1], 
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 1], 
        [1, 1, 1, 0, 1, 0, 1, 1, 0, 1], 
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], 
        [1, 0, 1, 1, 1, 1, 1, 0, 1, 1], 
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 1], 
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1], 
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], 
        [1, 0, 1, 1, 1, 0, 1, 1, 0, 1], 
        [1, 0, 1, 0, 0, 0, 0, 1, 0, 1], 
        [1, 0, 1, 0, 1, 1, 1, 1, 0, 1], 
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], 
        [1, 1, 1, 0, 1, 0, 1, 1, 1, 1], 
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 1], 
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 
    ];

    const blockSize = 2.0;
    const wallHeight = 2.5;

    engine.camera.setCollisionMap(mapLayout, blockSize);

    // Carregamento de Texturas Core
    const wallTex = new Texture(gl);
    // Aguardar as texturas pesadas carregarem
    await wallTex.load('./assets/rock_boulder_cracked_diff_256p.jpg');

    // Construindo a caverna
    for (let z = 0; z < mapLayout.length; z++) {
        for (let x = 0; x < mapLayout[z].length; x++) {
            if (mapLayout[z][x] === 1) {
                const wall = Mesh.createCube(gl, 1.0, 1.0, wallHeight / blockSize);
                wall.texture = wallTex;
                wall.setupBuffers();
                wall.transform = new Transform();
                wall.transform.setScale(blockSize, wallHeight, blockSize);
                wall.transform.setPosition(x * blockSize, wallHeight / 2 - 1.0, z * blockSize);
                engine.meshes.push(wall);
            }
        }
    }

    // --- 2. POSICIONAR O JOGADOR ---
    engine.camera.position[0] = 8 * blockSize;
    engine.camera.position[1] = 0.5;
    engine.camera.position[2] = 1 * blockSize;

    // --- 3. BARRA DE OURO ---
    const goldBarMesh = Mesh.createGoldBar(gl, 1.0, 2.0, 0.5, 0.6);
    goldBarMesh.setupBuffers(); 
    goldBarMesh.transform = new Transform();
    goldBarMesh.transform.setPosition(5 * blockSize, -0.2, 18 * blockSize); // Ajustei o Y para ficar no chão
    goldBarMesh.transform.setScale(0.2, 0.2, 0.2);
    engine.meshes.push(goldBarMesh);

    // --- 4. CARREGAR OBJs ---
    // Fazemos os carregamentos em paralelo usando Promise.all para carregar a tela mais rápido!
    let flashlightMesh = null, baseBatMesh = null, baseSkullMesh = null;
    let batTex = null, skullTex = null;

    try {
        const loads = await Promise.all([
            ObjLoader.load(gl, './assets/flashlight.obj'),
            ObjLoader.load(gl, './assets/bat_lowpoly_5.obj'),
            ObjLoader.load(gl, './assets/skull_lowpoly.obj')
        ]);
        
        flashlightMesh = loads[0];
        baseBatMesh = loads[1];
        baseSkullMesh = loads[2];

        // Texturas opcionais (se não encontrar, a promessa lança erro e o catch cuida)
        batTex = new Texture(gl);
        skullTex = new Texture(gl);
        await Promise.all([
            batTex.load('./assets/bat_diffuse.png').catch(()=>null),
            skullTex.load('./assets/skull_diffuse.jpg').catch(()=>null)
        ]);

        // Lanterna
        flashlightMesh.transform = new Transform();
        flashlightMesh.transform.setScale(0.001, 0.001, 0.001);
        engine.meshes.push(flashlightMesh);

        // Morcegos
        baseBatMesh.doubleSided = true;
        if (batTex.loaded) baseBatMesh.texture = batTex;
        
        // Caveiras
        if (skullTex.loaded) baseSkullMesh.texture = skullTex;

        // Distribuição no Mapa
        for (let z = 0; z < mapLayout.length; z++) {
            for (let x = 0; x < mapLayout[z].length; x++) {
                if (mapLayout[z][x] === 0) {
                    
                    // Lógica do Menu: Usa a probabilidade escolhida pelo jogador!
                    if (Math.random() < batProbability) {
                        const bat = baseBatMesh.clone();
                        bat.transform = new Transform();
                        const rx = (Math.random() - 0.5) * (blockSize * 0.5);
                        const rz = (Math.random() - 0.5) * (blockSize * 0.5);
                        bat.transform.setPosition((x * blockSize) + rx, wallHeight - 1.5, (z * blockSize) + rz);
                        bat.transform.setRotation(0, Math.random() * 360, -90);
                        bat.transform.setScale(0.8, 0.8, 0.8); 
                        engine.meshes.push(bat);
                    }

                    if (Math.random() < skullProbability) {
                        const skull = baseSkullMesh.clone();
                        skull.transform = new Transform();
                        const rx = (Math.random() - 0.5) * (blockSize * 0.7);
                        const rz = (Math.random() - 0.5) * (blockSize * 0.7);
                        skull.transform.setPosition((x * blockSize) + rx, -0.9, (z * blockSize) + rz);
                        skull.transform.setRotation(0, Math.random() * 360, 0);
                        skull.transform.setScale(0.015, 0.015, 0.015); 
                        engine.meshes.push(skull);
                    }
                }
            }
        }
    } catch (e) {
        console.warn("Aviso: Falha ao carregar alguns modelos 3D.", e);
    }

    // --- 5. CHÃO E TETO ---
    const mapRows = mapLayout.length;         
    const mapCols = mapLayout[0].length;      
    const worldWidth = mapCols * blockSize;
    const worldLength = mapRows * blockSize;
    const centerX = (worldWidth / 2) - (blockSize / 2);
    const centerZ = (worldLength / 2) - (blockSize / 2);

    const floorMesh = Mesh.createPlane(gl, worldWidth, worldLength); 
    floorMesh.texture = wallTex; // Reutilizando a textura pra economizar memória
    floorMesh.texCoords = [ 0, 0, mapCols, 0, mapCols, mapRows, 0, mapRows ];
    floorMesh.setupBuffers(); 
    floorMesh.transform = new Transform();
    floorMesh.transform.setPosition(centerX, -1.0, centerZ); 
    engine.meshes.push(floorMesh);

    const ceilingMesh = Mesh.createPlane(gl, worldWidth, worldLength);
    ceilingMesh.texture = wallTex; 
    ceilingMesh.texCoords = [ 0, 0, mapCols, 0, mapCols, mapRows, 0, mapRows ];
    ceilingMesh.setupBuffers();
    ceilingMesh.transform = new Transform();
    ceilingMesh.transform.setPosition(centerX, wallHeight - 1.0, centerZ); 
    ceilingMesh.transform.setRotation(180, 0, 0); 
    engine.meshes.push(ceilingMesh);

    // =========================================================================
    // TODOS OS RECURSOS CARREGADOS -> INICIAR O JOGO
    // =========================================================================
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('game-tips').style.display = 'block';
    
    // Faz a dica desaparecer após 8 segundos
    setTimeout(() => { document.getElementById('game-tips').style.display = 'none'; }, 8000);

    // Força o clique no canvas para ativar o mouse lock automaticamente
    canvas.click();
    
    isPlaying = true;
    let lastTime = performance.now();

    // --- GAME LOOP ---
    function loop(time) {
        if (!isPlaying) return;

        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        const currentRot = goldBarMesh.transform.rotation;
        goldBarMesh.transform.setRotation(currentRot[0], currentRot[1] + 45 * deltaTime, currentRot[2]);

        if (flashlightMesh) {
            const camPos = engine.camera.getPosition();
            const camFront = engine.camera.front;

            const worldUp = [0, 1, 0];
            const right = [
                camFront[1]*worldUp[2] - camFront[2]*worldUp[1],
                camFront[2]*worldUp[0] - camFront[0]*worldUp[2],
                camFront[0]*worldUp[1] - camFront[1]*worldUp[0]
            ];
            const rLen = Math.sqrt(right[0]*right[0] + right[1]*right[1] + right[2]*right[2]);
            right[0]/=rLen; right[1]/=rLen; right[2]/=rLen;

            const camUp = [
                right[1]*camFront[2] - right[2]*camFront[1],
                right[2]*camFront[0] - right[0]*camFront[2],
                right[0]*camFront[1] - right[1]*camFront[0]
            ];

            flashlightMesh.transform.setPosition(
                camPos[0] + (right[0] * 0.3) + (camUp[0] * -0.2) + (camFront[0] * 0.5),
                camPos[1] + (right[1] * 0.3) + (camUp[1] * -0.2) + (camFront[1] * 0.5), 
                camPos[2] + (right[2] * 0.3) + (camUp[2] * -0.2) + (camFront[2] * 0.5)
            );

            flashlightMesh.transform.setRotation(
                engine.camera.pitch,
                -engine.camera.yaw, 
                180
            );
        }

        engine.render(engine.meshes, deltaTime);

        // --- Atualização da HUD Debug ---
        const hud = document.getElementById('debug-hud');
        if (hud.style.display !== 'none') {
            if (deltaTime > 0) document.getElementById('fps').innerText = Math.round(1 / deltaTime);
            document.getElementById('drawCalls').innerText = engine.getStats().drawCalls;
            document.getElementById('vertices').innerText = engine.getStats().vertices;
            
            const camPosInfo = engine.camera.getPosition();
            document.getElementById('camPos').innerText = `[${camPosInfo[0].toFixed(1)}, ${camPosInfo[1].toFixed(1)}, ${camPosInfo[2].toFixed(1)}]`;
            document.getElementById('camRot').innerText = `[${engine.camera.pitch.toFixed(1)}, ${engine.camera.yaw.toFixed(1)}]`;
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}