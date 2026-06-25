/**
 * Texture.js
 * Gerencia o carregamento de imagens e o envio para a Placa de Vídeo (VRAM)
 */

export class Texture {
    constructor(gl) {
        this.gl = gl;
        // Cria o ID (Handle) da textura na placa de vídeo
        this.textureId = gl.createTexture();
        this.loaded = false;
        
        // Criar um "pixel de espera" branco para a engine não travar 
        // enquanto o navegador faz o download da imagem da parede.
        gl.bindTexture(gl.TEXTURE_2D, this.textureId);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([200, 200, 200, 255]));
    }

    // Carrega a imagem a partir de um arquivo (URL)
    load(url) {
        const gl = this.gl;
        const image = new Image();
        
        // Retorna uma Promise para podermos saber quando a imagem terminou de baixar
        return new Promise((resolve, reject) => {
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, this.textureId);
                
                // Inverte o eixo Y. 
                // HTML/JPG conta o (0,0) do topo para baixo. 
                // O WebGL conta o (0,0) de baixo para cima!
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                
                // Envia os pixels pesados da Imagem para a GPU
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                // Configuração Mágica para não precisar de imagens quadradas "potência de 2" (ex: 512x512)
                if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
                    // Se for perfeita (ex: 1024x1024), cria Mipmaps (borrão de profundidade automático)
                    gl.generateMipmap(gl.TEXTURE_2D);
                } else {
                    // Se for imagem zoada, trava as bordas para não dar erro
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                }

                this.loaded = true;
                resolve(this);
            };

            image.onerror = () => {
                console.error(`Erro ao carregar a textura: ${url}`);
                reject(new Error(`Falha no carregamento: ${url}`));
            };

            image.src = url; // Isso dispara o download
        });
    }

    // Função auxiliar matemática
    isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    // Na hora de desenhar a parede, ativamos o slot da textura
    bind(slot = 0) {
        const gl = this.gl;
        // O WebGL permite até 32 texturas ao mesmo tempo. Ativamos o Slot (0)
        gl.activeTexture(gl.TEXTURE0 + slot);
        gl.bindTexture(gl.TEXTURE_2D, this.textureId);
    }
}