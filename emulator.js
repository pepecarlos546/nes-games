// CONFIGURACIÓN - ¡CAMBIA ESTO!
const GITHUB_USER = 'pepecarlos546'; 
const REPO_NAME = 'nes-games';
const GAMES_FOLDER = 'games';

const canvas = document.getElementById('nes-canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.createImageData(256, 240);
let emulatorInterval = null;

// 1. Inicializar el emulador JSNES
const nes = new jsnes.NES({
    onFrame: (buffer) => {
        let i = 0;
        for (let y = 0; y < 240; ++y) {
            for (let x = 0; x < 256; ++x) {
                i = y * 256 + x;
                const color = buffer[i];
                const index = i * 4;
                imageData.data[index]     = (color >> 16) & 0xff;
                imageData.data[index + 1] = (color >> 8) & 0xff;
                imageData.data[index + 2] = color & 0xff;
                imageData.data[index + 3] = 0xff;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
});

// 2. Cargar lista de juegos desde la API de GitHub
async function loadGamesList() {
    const select = document.getElementById('game-selector');
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${GAMES_FOLDER}`;

    try {
        const response = await fetch(apiUrl);
        const files = await response.json();

        select.innerHTML = '<option value="">-- Elige un desafío --</option>';

        files.forEach(file => {
            if (file.name.toLowerCase().endsWith('.nes')) {
                const option = document.createElement('option');
                option.value = file.download_url;
                option.textContent = file.name.replace('.nes', '').replace(/_/g, ' ');
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error API:", error);
        select.innerHTML = '<option value="">Error al conectar con GitHub</option>';
    }
}

// 3. Manejar la selección y carga del juego
document.getElementById('game-selector').addEventListener('change', async (e) => {
    const url = e.target.value;
    if (!url) return;

    if (emulatorInterval) clearInterval(emulatorInterval);

    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        nes.loadROM(binary);
        emulatorInterval = setInterval(() => nes.frame(), 16.67); // Aprox 60fps
    } catch (err) {
        alert("No se pudo cargar la ROM");
    }
});

// 4. Mapeo de controles
const keyboard = (keyCode, value) => {
    const map = {
        38: jsnes.Controller.BUTTON_UP,
        40: jsnes.Controller.BUTTON_DOWN,
        37: jsnes.Controller.BUTTON_LEFT,
        39: jsnes.Controller.BUTTON_RIGHT,
        88: jsnes.Controller.BUTTON_A,
        90: jsnes.Controller.BUTTON_B,
        13: jsnes.Controller.BUTTON_START,
        16: jsnes.Controller.BUTTON_SELECT
    };
    if (map[keyCode] !== undefined) {
        if (value === 1) nes.buttonDown(1, map[keyCode]);
        else nes.buttonUp(1, map[keyCode]);
    }
};

window.addEventListener("keydown", (e) => keyboard(e.keyCode, 1));
window.addEventListener("keyup", (e) => keyboard(e.keyCode, 0));

// Iniciar proceso
loadGamesList();