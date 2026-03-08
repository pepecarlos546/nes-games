<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Emulador NES - GitHub</title>
    <style>
        /* CONFIGURACIÓN VISUAL RETRO */
        body { background: #1a1a1a; color: #00ff00; font-family: 'Courier New', monospace; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .console { background: #333; padding: 20px; border: 6px solid #444; border-radius: 10px; box-shadow: 0 0 25px rgba(0,0,0,0.8); }
        canvas { background: #000; width: 512px; height: 480px; image-rendering: pixelated; border: 2px solid #555; }
        .ui { margin-bottom: 20px; background: #222; padding: 15px; border: 1px solid #00ff00; border-radius: 5px; }
        select { background: #000; color: #00ff00; border: 1px solid #00ff00; padding: 10px; font-family: monospace; cursor: pointer; }
        .controls-info { margin-top: 15px; font-size: 12px; color: #888; }
    </style>
</head>
<body>

    <h1>NES CLOUD CONSOLE</h1>

    <div class="ui">
        <label>CARGAR JUEGO: </label>
        <select id="game-selector">
            <option>Conectando con GitHub API...</option>
        </select>
    </div>

    <div class="console">
        <canvas id="nes-canvas" width="256" height="240"></canvas>
    </div>

    <div class="controls-info">
        CONTROLES: FLECHAS (Movimiento) | Z (B) | X (A) | ENTER (Start) | SHIFT (Select)
    </div>

    <script src="https://unpkg.com/jsnes/dist/jsnes.min.js"></script>

    <script>
        // 1. CONFIGURACIÓN (EDITA ESTO)
        const USER = 'TU_USUARIO_AQUI'; 
        const REPO = 'TU_REPO_AQUI';
        const FOLDER = 'games';

        const canvas = document.getElementById('nes-canvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(256, 240);
        let loop = null;

        // 2. INICIALIZAR EMULADOR
        const nes = new jsnes.NES({
            onFrame: (buffer) => {
                let i = 0;
                for (let y = 0; y < 240; ++y) {
                    for (let x = 0; x < 256; ++x) {
                        i = y * 256 + x;
                        const color = buffer[i];
                        const index = i * 4;
                        imageData.data[index] = (color >> 16) & 0xff;
                        imageData.data[index + 1] = (color >> 8) & 0xff;
                        imageData.data[index + 2] = color & 0xff;
                        imageData.data[index + 3] = 0xff;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            }
        });

        // 3. OBTENER LISTA DE JUEGOS DESDE LA API
        async function fetchGames() {
            const select = document.getElementById('game-selector');
            try {
                const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${FOLDER}`);
                const files = await res.json();
                
                if(!Array.isArray(files)) throw new Error("No se encontró la carpeta /games");

                select.innerHTML = '<option value="">-- SELECCIONA ROM --</option>';
                files.forEach(f => {
                    if(f.name.toLowerCase().endsWith('.nes')) {
                        const opt = document.createElement('option');
                        opt.value = f.download_url;
                        opt.textContent = f.name.toUpperCase();
                        select.appendChild(opt);
                    }
                });
            } catch (e) {
                select.innerHTML = '<option>Error: Revisa consola (F12)</option>';
                console.error(e);
            }
        }

        // 4. CARGAR Y EJECUTAR ROM
        document.getElementById('game-selector').onchange = async (e) => {
            const url = e.target.value;
            if(!url) return;

            if(loop) clearInterval(loop);

            try {
                const res = await fetch(url);
                const arrayBuffer = await res.arrayBuffer();
                let binary = "";
                const bytes = new Uint8Array(arrayBuffer);
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }

                nes.loadROM(binary);
                loop = setInterval(nes.frame, 1000 / 60);
            } catch (err) {
                alert("Error cargando el archivo .nes");
            }
        };

        // 5. CONTROLES POR TECLADO
        const handleKey = (code, v) => {
            const m = { 38:0, 40:1, 37:2, 39:3, 88:4, 90:5, 16:6, 13:7 };
            if (m[code] !== undefined) v ? nes.buttonDown(1, m[code]) : nes.buttonUp(1, m[code]);
        };
        window.onkeydown = (e) => handleKey(e.keyCode, 1);
        window.onkeyup = (e) => handleKey(e.keyCode, 0);

        fetchGames();
    </script>
</body>
</html>