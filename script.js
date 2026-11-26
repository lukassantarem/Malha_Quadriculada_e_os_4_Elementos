// Estado Global do RPG
let currentHero = 'Nilo';
let unlockedWorlds = [1];
let activeWorld = 0;

// Estado do Mundo 5 gerado dinamicamente
const gameState = {
    m5: {
        r1_mult: 0,
        r1_area: 0,
        r2_perim: 0,
        r2_amp_target: 0, // quantidade de blocos esperados na ampliação
        r2_amp_rows: 0,
        r2_amp_cols: 0,
        r2_amp_state: [],
        r3_red_target: 0, // quantidade de blocos esperados na redução
        r3_red_rows: 0,
        r3_red_cols: 0,
        r3_red_state: [],
        r3_area: 0
    }
};

// Efeitos Sonoros com Web Audio API Nativa
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}

// 1. HISTORINHA / LORE DINÂMICA (Ajustada com imagens de Herói e Vilão)
let introStep = 0;

function getLoreData(step, hero) {
    const heroImg = (hero && hero.toLowerCase() === 'mia') ? 'mia.png' : 'nilo.png';

    const parts = [
        {
            title: "O CHAMADO DA GEOMETRIA",
            text: `Nas terras do Reino dos Elementos, a paz reinava entre Terra, Água, Fogo e Ar. Porém, o temível Sr. Raio, cansado de ser deixado de lado por não ser um elemento principal, decidiu se vingar roubando a harmonia geométrica de todo o reino! O herói ${hero} foi convocado para reestabelecer a ordem.`,
            img: heroImg
        },
        {
            title: "A JORNADA DE " + hero.toUpperCase(),
            text: `Somente dominando contornos, áreas e proporções em escala é que ${hero} conseguirá reconstruir o mapa elemental, superar os desafios de cada mundo e avançar até o covil do vilão!`,
            img: heroImg
        },
        {
            title: "O VILÃO REVELADO",
            text: "O Sr. Raio aguarda no topo do Castelo Trovão! Percorra os 4 reinos elementais, fortaleça seus conhecimentos de geometria espacial e prepare-se para o grande confronto final!",
            img: "sr_raio.png"
        }
    ];

    return parts[step];
}

function mostrarLore() {
    document.getElementById('intro-screen').classList.remove('hidden');
    const data = getLoreData(introStep, currentHero);

    if (data) {
        // Atualiza Título
        const titleEl = document.getElementById('intro-title');
        if (titleEl) titleEl.innerText = data.title;

        // Atualiza Imagem
        const imgEl = document.getElementById('intro-img');
        if (imgEl) {
            imgEl.src = data.img;
            imgEl.alt = data.title;
        }

        // Atualiza Texto (Verifique se o ID no seu HTML é 'lore-text-content' ou 'intro-text')
        const textEl = document.getElementById('lore-text-content') || document.getElementById('intro-text');
        if (textEl) {
            textEl.innerText = data.text;
        }
    }
}

// Banco de Figuras Dinâmicas para o Mundo 2 (Água - Cálculo de Área)
const waterShapes = [
    {
        name: "Coração de Pixel",
        cells: {
            "1-2": "triangle-top-left", "1-3": "blue-fill", "1-4": "blue-fill", "1-5": "triangle-top-right",
            "2-1": "triangle-top-left", "2-2": "blue-fill", "2-3": "blue-fill", "2-4": "blue-fill", "2-5": "blue-fill", "2-6": "triangle-top-right",
            "3-1": "blue-fill", "3-2": "blue-fill", "3-3": "blue-fill", "3-4": "blue-fill", "3-5": "blue-fill", "3-6": "blue-fill",
            "4-2": "triangle-bottom-left", "4-3": "blue-fill", "4-4": "blue-fill", "4-5": "triangle-bottom-right"
        },
        area: 17.0
    },
    {
        name: "Gota de Água Sagrada",
        cells: {
            "1-4": "triangle-top-left", "1-5": "triangle-top-right",
            "2-3": "triangle-top-left", "2-4": "blue-fill", "2-5": "blue-fill", "2-6": "triangle-top-right",
            "3-3": "blue-fill", "3-4": "blue-fill", "3-5": "blue-fill", "3-6": "blue-fill",
            "4-3": "triangle-bottom-left", "4-4": "blue-fill", "4-5": "blue-fill", "4-6": "triangle-bottom-right"
        },
        area: 11.0
    },
    {
        name: "Barco a Vela Real",
        cells: {
            "1-4": "triangle-top-left",
            "2-3": "triangle-top-left", "2-4": "blue-fill",
            "3-2": "triangle-top-left", "3-3": "blue-fill", "3-4": "blue-fill",
            "4-1": "triangle-bottom-left", "4-2": "blue-fill", "4-3": "blue-fill", "4-4": "blue-fill", "4-5": "triangle-bottom-right"
        },
        area: 8.5 // MUDAR DE 8.0 PARA 8.5 
    },
    {
        name: "Âncora Perdida",
        cells: {
            "1-4": "blue-fill", "2-4": "blue-fill", "3-4": "blue-fill",
            "4-2": "blue-fill", "4-3": "blue-fill", "4-4": "blue-fill", "4-5": "blue-fill", "4-6": "blue-fill",
            "3-2": "triangle-top-left", "3-6": "triangle-top-right"
        },
        area: 9.0
    },
    {
        name: "Estrela do Mar Reluzente",
        cells: {
            "3-3": "blue-fill", "3-4": "blue-fill", "4-3": "blue-fill", "4-4": "blue-fill",
            "2-3": "triangle-top-left", "2-4": "triangle-top-right",
            "5-3": "triangle-bottom-left", "5-4": "triangle-bottom-right",
            "3-2": "triangle-top-left", "4-2": "triangle-bottom-left",
            "3-5": "triangle-top-right", "4-5": "triangle-bottom-right"
        },
        area: 8.0
    }
];

// Banco de Figuras para o Mundo 3 (Fogo - Perímetro com escala de 2cm)
const fireShapes = [
    {
        name: "Chama de Fogo",
        coords: [[1,3], [2,2], [2,3], [2,4], [3,1], [3,2], [3,3], [3,4], [3,5], [4,2], [4,3], [4,4]]
    },
    {
        name: "Espada Flamejante",
        coords: [[1,3], [2,3], [3,3], [4,3], [5,2], [5,3], [5,4], [6,3]]
    },
    {
        name: "Escudo do Guardião",
        coords: [[1,2], [1,3], [1,4], [2,1], [2,2], [2,3], [2,4], [2,5], [3,2], [3,3], [3,4], [4,3]]
    },
    {
        name: "Cetro Incandescente",
        coords: [[1,2], [1,3], [1,4], [2,3], [3,3], [4,3], [5,2], [5,3], [5,4]]
    },
    {
        name: "Cruz de Cinzas",
        coords: [[1,3], [2,2], [2,3], [2,4], [3,3], [4,3]]
    }
];

// Banco de Figuras para o Mundo 4 (Ar - Escala 2:1)
const scaleShapes = [
    {
        name: "Quadrado Clássico",
        original: [[1,1], [1,2], [2,1], [2,2]],
        scale: 2
    },
    {
        name: "Retângulo Vertical",
        original: [[1,1], [2,1]],
        scale: 2
    },
    {
        name: "Letra L",
        original: [[1,1], [2,1], [2,2]],
        scale: 2
    },
    {
        name: "Letra T",
        original: [[1,1], [1,2], [1,3], [2,2]],
        scale: 2
    },
    {
        name: "Degrau Mágico",
        original: [[1,1], [1,2], [2,2], [2,3]],
        scale: 2
    }
];

// Dados dos Desafios Atuais
let currentMultChallenge = { L: 0, C: 0, ans: 0 };
let currentAreaChallenge = {};
let currentPerimeterChallenge = { shape: {}, perimeterCm: 0 };
let currentScaleChallenge = { shape: {}, studentGrid: [] };
let lightningChallenges = {};

// Função de Inicialização
window.onload = function() {
    console.log("Malha Quadriculada e os 4 Elementos carregado com sucesso!");
};

function jogarStart() {
    playSound('click');
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('char-screen').classList.remove('hidden');
}

function chooseHero(heroName) {
    playSound('click');
    currentHero = heroName;
    document.getElementById('char-screen').classList.add('hidden');
    
    introStep = 0;
    mostrarLore();
}

function mostrarLore() {
    document.getElementById('intro-screen').classList.remove('hidden');
    const data = getLoreData(introStep, currentHero);

    if (data) {
        document.getElementById('intro-title').innerText = data.title;
        document.getElementById('intro-img').src = data.img;
        document.getElementById('lore-text-content').innerText = data.text;
    }
}

function avancarHistoria() {
    playSound('click');
    introStep++;
    if (introStep < 3) {
        mostrarLore();
    } else {
        document.getElementById('intro-screen').classList.add('hidden');
        document.getElementById('world-screen').classList.remove('hidden');
        document.getElementById('global-back-btn').classList.remove('hidden');
        atualizarMapa();
    }
}

// Atualização e renderização do mapa de pergaminho
function atualizarMapa() {
    for (let i = 1; i <= 5; i++) {
        const node = document.getElementById(`node-${i}`);
        if (unlockedWorlds.includes(i)) {
            node.classList.remove('locked-node');
            node.classList.add('unlocked-node');
            if (i === unlockedWorlds[unlockedWorlds.length - 1]) {
                node.classList.add('pulse-btn');
            } else {
                node.classList.remove('pulse-btn');
            }
        } else {
            node.classList.add('locked-node');
            node.classList.remove('unlocked-node');
            node.classList.remove('pulse-btn');
        }
    }

    for (let i = 1; i <= 4; i++) {
        const track = document.getElementById(`track-${i}-${i+1}`);
        if (track) {
            if (unlockedWorlds.includes(i + 1)) {
                track.classList.remove('line-hidden');
                track.classList.remove('locked-track');
                track.classList.add('unlocked-track');
            } else if (unlockedWorlds.includes(i)) {
                track.classList.remove('line-hidden');
                track.classList.add('locked-track');
            } else {
                track.classList.add('line-hidden');
            }
        }
    }
}

function entrarMundo(worldId) {
    if (!unlockedWorlds.includes(worldId)) return;
    playSound('click');
    
    activeWorld = worldId;
    document.getElementById('world-screen').classList.add('hidden');
    document.getElementById('global-back-btn').classList.add('hidden');

    if (worldId === 1) {
        gerarMundo1();
    } else if (worldId === 2) {
        gerarMundo2();
    } else if (worldId === 3) {
        gerarMundo3();
    } else if (worldId === 4) {
        gerarMundo4();
    } else if (worldId === 5) {
        gerarMundo5();
    }
}

function voltarParaMundos() {
    playSound('click');
    document.getElementById('multiplication-screen').classList.add('hidden');
    document.getElementById('area-screen').classList.add('hidden');
    document.getElementById('perimeter-screen').classList.add('hidden');
    document.getElementById('perimeter-quiz-screen').classList.add('hidden');
    document.getElementById('scale-screen').classList.add('hidden');
    document.getElementById('lightning-screen').classList.add('hidden');

    document.getElementById('world-screen').classList.remove('hidden');
    document.getElementById('global-back-btn').classList.remove('hidden');
    atualizarMapa();
}

// MUNDO 1
function gerarMundo1() {
    document.getElementById('multiplication-screen').classList.remove('hidden');
    document.getElementById('feedback-mult').innerText = "";
    document.getElementById('input-mult').value = "";
    document.getElementById('next-stage-1').classList.add('hidden');

    const L = Math.floor(Math.random() * 4) + 3; 
    const C = Math.floor(Math.random() * 4) + 3; 
    currentMultChallenge = { L, C, ans: L * C };

    const grid = document.getElementById('grid-mult');
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${C}, 56px)`;

    for (let r = 0; r < L; r++) {
        for (let c = 0; c < C; c++) {
            const cell = document.createElement('div');
            cell.className = "cell-f yellow-fill";
            grid.appendChild(cell);
        }
    }
}

function verificarMultiplicacao() {
    const userVal = parseInt(document.getElementById('input-mult').value);
    const feedback = document.getElementById('feedback-mult');

    if (userVal === currentMultChallenge.ans) {
        playSound('correct');
        feedback.style.color = "#2ecc71";
        feedback.innerText = "Correto! Você canalizou a força da Multiplicação!";
        document.getElementById('next-stage-1').classList.remove('hidden');
        if (!unlockedWorlds.includes(2)) unlockedWorlds.push(2);
    } else {
        playSound('wrong');
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Resposta incorreta. Tente novamente contando todas as linhas e colunas!";
    }
}

// MUNDO 2
function gerarMundo2() {
    document.getElementById('area-screen').classList.remove('hidden');
    document.getElementById('feedback-area').innerText = "";
    document.getElementById('input-area').value = "";
    document.getElementById('next-stage-2').classList.add('hidden');

    const randomIdx = Math.floor(Math.random() * waterShapes.length);
    currentAreaChallenge = waterShapes[randomIdx];

    const grid = document.getElementById('grid-area');
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(8, 56px)";

    for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = "cell-f";
            
            const cellKey = `${r}-${c}`;
            if (currentAreaChallenge.cells[cellKey]) {
                cell.className += ` ${currentAreaChallenge.cells[cellKey]}`;
            }
            grid.appendChild(cell);
        }
    }
}

function verificarArea() {
    const userVal = parseFloat(document.getElementById('input-area').value);
    const feedback = document.getElementById('feedback-area');

    if (userVal === currentAreaChallenge.area) {
        playSound('correct');
        feedback.style.color = "#2ecc71";
        feedback.innerText = `Correto! A área da figura "${currentAreaChallenge.name}" é exatamente ${currentAreaChallenge.area} u.a.!`;
        document.getElementById('next-stage-2').classList.remove('hidden');
        if (!unlockedWorlds.includes(3)) unlockedWorlds.push(3);
    } else {
        playSound('wrong');
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Área incorreta! Lembre-se: quadrados valem 1 e triângulos valem 0.5.";
    }
}

// MUNDO 3
function calcularPerimetroProcedural(coords) {
    let exposedEdges = 0;
    const coordSet = new Set(coords.map(c => `${c[0]}-${c[1]}`));

    coords.forEach(([r, c]) => {
        if (!coordSet.has(`${r-1}-${c}`)) exposedEdges++;
        if (!coordSet.has(`${r+1}-${c}`)) exposedEdges++;
        if (!coordSet.has(`${r}-${c-1}`)) exposedEdges++;
        if (!coordSet.has(`${r}-${c+1}`)) exposedEdges++;
    });

    return exposedEdges;
}

function gerarMundo3() {
    document.getElementById('perimeter-screen').classList.remove('hidden');
    document.getElementById('perimeter-quiz-screen').classList.add('hidden');
    document.getElementById('feedback-perimeter').innerText = "";
    document.getElementById('next-stage-3').classList.add('hidden');

    const randomIdx = Math.floor(Math.random() * fireShapes.length);
    const selected = fireShapes[randomIdx];
    
    const edges = calcularPerimetroProcedural(selected.coords);
    currentPerimeterChallenge = {
        shape: selected,
        perimeterCm: edges * 2
    };

    renderizarGradePerimetro('grid-perimeter-display', 56, selected.coords);
}

function renderizarGradePerimetro(elemId, cellSize, coords) {
    const grid = document.getElementById(elemId);
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(8, 56px)";

    const coordSet = new Set(coords.map(c => `${c[0]}-${c[1]}`));

    for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = "cell-f";
            if (coordSet.has(`${r}-${c}`)) {
                cell.className += " painted-base";
            }
            grid.appendChild(cell);
        }
    }
}

function avancarParaQuizPerimetro() {
    playSound('click');
    document.getElementById('perimeter-screen').classList.add('hidden');
    document.getElementById('perimeter-quiz-screen').classList.remove('hidden');

    const miniGrid = document.getElementById('grid-perimeter-mini');
    miniGrid.innerHTML = "";
    miniGrid.style.gridTemplateColumns = "repeat(8, 38px)";

    const coords = currentPerimeterChallenge.shape.coords;
    const coordSet = new Set(coords.map(c => `${c[0]}-${c[1]}`));

    for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = "mini-cell";
            if (coordSet.has(`${r}-${c}`)) {
                cell.className += " painted-base";
            }
            miniGrid.appendChild(cell);
        }
    }

    const correctAns = currentPerimeterChallenge.perimeterCm;
    const alternatives = [
        correctAns,
        correctAns - 4 > 0 ? correctAns - 4 : correctAns + 6,
        correctAns + 4,
        correctAns / 2
    ];

    const uniqueAlts = [...new Set(alternatives)].sort(() => Math.random() - 0.5);

    const container = document.getElementById('alternatives-container');
    container.innerHTML = "";

    uniqueAlts.forEach(alt => {
        const btn = document.createElement('button');
        btn.className = "btn-alt";
        btn.innerText = `${alt} cm`;
        btn.onclick = () => verificarQuizPerimetro(alt);
        container.appendChild(btn);
    });
}

function verificarQuizPerimetro(selectedVal) {
    const feedback = document.getElementById('feedback-perimeter');
    const correctAns = currentPerimeterChallenge.perimeterCm;

    if (selectedVal === correctAns) {
        playSound('correct');
        feedback.style.color = "#2ecc71";
        feedback.innerText = `Correto! Você calculou cada contorno valendo 2cm e obteve ${correctAns} cm!`;
        document.getElementById('next-stage-3').classList.remove('hidden');
        if (!unlockedWorlds.includes(4)) unlockedWorlds.push(4);
    } else {
        playSound('wrong');
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Esse não é o perímetro correto. Analise todas as arestas externas do bloco!";
    }
}

function gerarMundo4() {
    document.getElementById('scale-screen').classList.remove('hidden');
    document.getElementById('feedback-scale').innerText = "";
    document.getElementById('next-stage-4').classList.add('hidden');

    // CORREÇÃO DO BOTÃO SUMIDO
    // Garante que o botão "Verificar Escala" volte a aparecer ao iniciar/reiniciar a fase:
    const verifyBtnContainer = document.querySelector('#scale-screen .controls');
    if (verifyBtnContainer) {
        verifyBtnContainer.classList.remove('hidden');
    }

    // Sorteia uma figura aleatória da sua lista scaleShapes
    const randomIdx = Math.floor(Math.random() * scaleShapes.length);
    const selected = scaleShapes[randomIdx];

    currentScaleChallenge = {
        shape: selected,
        studentGrid: []
    };

    // Renderiza a grade Original (4x4)
    const originalGrid = document.getElementById('grid-scale-original');
    originalGrid.innerHTML = "";
    originalGrid.style.gridTemplateColumns = "repeat(4, 48px)";

    const originalSet = new Set(selected.original.map(c => `${c[0]}-${c[1]}`));

    for (let r = 1; r <= 4; r++) {
        for (let c = 1; c <= 4; c++) {
            const cell = document.createElement('div');
            cell.className = "cell-sc";
            if (originalSet.has(`${r}-${c}`)) {
                cell.className += " painted-base";
            }
            originalGrid.appendChild(cell);
        }
    }

    // Renderiza a grade do Aluno (8x8)
    const studentGrid = document.getElementById('grid-scale-student');
    studentGrid.innerHTML = "";
    studentGrid.style.gridTemplateColumns = "repeat(8, 48px)";

    for (let r = 1; r <= 8; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = "cell-sc clickable";
            cell.id = `stud-${r}-${c}`;
            cell.onclick = () => alternarCelulaEscala(r, c);
            studentGrid.appendChild(cell);
        }
    }
}

function alternarCelulaEscala(r, c) {
    if (typeof playSound === 'function') playSound('click');
    const cell = document.getElementById(`stud-${r}-${c}`);
    const coordKey = `${r}-${c}`;
    const idx = currentScaleChallenge.studentGrid.indexOf(coordKey);

    if (idx === -1) {
        currentScaleChallenge.studentGrid.push(coordKey);
        cell.classList.add('player-filled');
    } else {
        currentScaleChallenge.studentGrid.splice(idx, 1);
        cell.classList.remove('player-filled');
    }
}

function verificarEscala() {
    const feedback = document.getElementById('feedback-scale');
    const selected = currentScaleChallenge.shape;

    if (currentScaleChallenge.studentGrid.length === 0) {
        if (typeof playSound === 'function') playSound('wrong');
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Sua grade está vazia! Desenhe a figura ampliada antes de enviar.";
        return;
    }

    // 1. Mapeia a forma ampliada esperada
    const expectedCoordsSet = new Set();
    selected.original.forEach(([r, c]) => {
        const r1 = 2 * r - 1;
        const r2 = 2 * r;
        const c1 = 2 * c - 1;
        const c2 = 2 * c;

        expectedCoordsSet.add(`${r1}-${c1}`);
        expectedCoordsSet.add(`${r1}-${c2}`);
        expectedCoordsSet.add(`${r2}-${c1}`);
        expectedCoordsSet.add(`${r2}-${c2}`);
    });

    // -LÓGICA DE POSICIONAMENTO LIVRE
    const normalizarCoordenadas = (coordsArray) => {
        let minR = Infinity, minC = Infinity;
        
        const parsed = coordsArray.map(coord => {
            const [r, c] = coord.split('-').map(Number);
            if (r < minR) minR = r;
            if (c < minC) minC = c;
            return { r, c };
        });

        const setNormalizado = new Set();
        parsed.forEach(({ r, c }) => {
            setNormalizado.add(`${r - minR}-${c - minC}`);
        });

        return setNormalizado;
    };

    const expectedNormalized = normalizarCoordenadas(Array.from(expectedCoordsSet));
    const studentNormalized = normalizarCoordenadas(currentScaleChallenge.studentGrid);

    // 2. Compara se o formato e tamanho normalizados são idênticos
    let isCorrect = (studentNormalized.size === expectedNormalized.size);

    if (isCorrect) {
        expectedNormalized.forEach(coord => {
            if (!studentNormalized.has(coord)) isCorrect = false;
        });
    }

    // 3. Feedback e Conclusão
    if (isCorrect) {
        if (typeof playSound === 'function') playSound('correct');
        feedback.style.color = "#2ecc71";
        feedback.innerText = `Correto! Você ampliou a figura em escala 2:1 com precisão!`;
        
        // --- CORREÇÃO DO BOTÃO DE AVANÇAR ---
        // Procura a zona de próximo estágio no Mundo 4
        const nextZone = document.querySelector('#scale-screen .next-stage-zone') || document.getElementById('next-stage-4');
        const verifyBtnContainer = document.querySelector('#scale-screen .controls');

        if (nextZone) {
            nextZone.classList.remove('hidden');
        }
        
        // Esconde o botão azul de "Verificar Escala" para abrir espaço
        if (verifyBtnContainer) {
            verifyBtnContainer.classList.add('hidden');
        }

        if (typeof unlockedWorlds !== 'undefined' && !unlockedWorlds.includes(5)) {
            unlockedWorlds.push(5);
        }
    } else {
        if (typeof playSound === 'function') playSound('wrong');
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Forma incorreta! Verifique se cada 1 quadrado original virou um bloco de 2x2 na malha.";
    }
}

// MUNDO 5
function gerarMundo5() {
    document.getElementById('lightning-screen').classList.remove('hidden');
    document.getElementById('lightning-round-1').classList.remove('hidden');
    document.getElementById('lightning-round-2').classList.add('hidden');
    document.getElementById('feedback-lightning').innerText = "";

    document.getElementById('input-lightning-1').value = "";
    document.getElementById('input-lightning-2').value = "";
    document.getElementById('input-lightning-3').value = "";
    document.getElementById('input-lightning-4').value = "";

    const L1 = Math.floor(Math.random() * 3) + 2; 
    const C1 = Math.floor(Math.random() * 3) + 2; 
    lightningChallenges.q1 = { L: L1, C: C1, ans: L1 * C1 };
    renderizarBossGrid('lightning-grid-1', L1, C1, 'yellow-fill');

    const L2 = Math.floor(Math.random() * 3) + 2; 
    const C2 = Math.floor(Math.random() * 3) + 2; 
    lightningChallenges.q2 = { L: L2, C: C2, ans: L2 * C2 };
    renderizarBossGrid('lightning-grid-2', L2, C2, 'blue-fill');

    const randomWater = waterShapes[Math.floor(Math.random() * waterShapes.length)];
    lightningChallenges.q3 = randomWater;
    renderizarBossGridMetades('lightning-grid-3', randomWater.cells);

    const randomFire = fireShapes[Math.floor(Math.random() * fireShapes.length)];
    const edges = calcularPerimetroProcedural(randomFire.coords);
    lightningChallenges.q4 = {
        shape: randomFire,
        ans: edges
    };
    renderizarBossGridBase('lightning-grid-4', randomFire.coords);
}

function renderizarBossGrid(containerId, L, C, colorClass) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${C}, 32px)`;

    for (let r = 0; r < L; r++) {
        for (let c = 0; c < C; c++) {
            const cell = document.createElement('div');
            cell.className = `lightning-cell ${colorClass}`;
            cell.style.width = "32px";
            cell.style.height = "32px";
            grid.appendChild(cell);
        }
    }
}

function renderizarBossGridMetades(containerId, cells) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(8, 32px)";

    for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = "lightning-cell";
            cell.style.width = "32px";
            cell.style.height = "32px";

            const cellKey = `${r}-${c}`;
            if (cells[cellKey]) {
                cell.className += ` ${cells[cellKey]}`;
            }
            grid.appendChild(cell);
        }
    }
}

function renderizarBossGridBase(containerId, coords) {
    const grid = document.getElementById(containerId);
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = "repeat(8, 32px)";

    const coordSet = new Set(coords.map(c => `${c[0]}-${c[1]}`));

    for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 8; c++) {
            const cell = document.createElement('div');
            cell.className = "lightning-cell";
            cell.style.width = "32px";
            cell.style.height = "32px";
            if (coordSet.has(`${r}-${c}`)) {
                cell.className += " painted-base";
            }
            grid.appendChild(cell);
        }
    }
}

function proximaRodadaFinal() {
    const r1 = parseInt(document.getElementById('input-lightning-1').value);
    const r2 = parseInt(document.getElementById('input-lightning-2').value);
    const feedback = document.getElementById('feedback-lightning');

    if (r1 === lightningChallenges.q1.ans && r2 === lightningChallenges.q2.ans) {
        playSound('correct');
        feedback.style.color = "#2ecc71";
        feedback.innerText = "Excelente! Seus primeiros ataques enfraqueceram o escudo do Sr. Raio! Prepare-se para a Rodada 2!";
        
        document.getElementById('lightning-round-1').classList.add('hidden');
        document.getElementById('lightning-round-2').classList.remove('hidden');
    } else {
        playSound('wrong');
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Ataques falharam! Verifique os cálculos de grade e área da primeira rodada.";
    }
}

// MUNDO 5: CASTELO TROVÃO (SISTEMA COMPLETO)

// Variáveis Globais do Mundo 5
let m5_respostaQ1 = 0;
let m5_respostaQ2 = 0;
let m5_respostaQ3 = 0;
let m5_respostaQ6 = 0;

let m5_desenhoAmp = new Set();
let m5_desenhoRed = new Set();

const M5_ALVO_AMP = 8;
const M5_ALVO_RED = 2;

//FUNÇÃO DE ENTRADA (CHAMADA PELO MAPA DO JOGO)
function gerarMundo5() {
    iniciarMundo5();
}

function m5_init() {
    iniciarMundo5();
}

function setupMundo5() {
    iniciarMundo5();
}

// INICIALIZAÇÃO DA TELA DO BOSS
// Inspecionar o console para ver os desafios sorteados e as respostas corretas.
window.gameState = gameState;

// MUNDO 5: CASTELO TROVÃO (SISTEMA DINÂMICO E SORTEIO DE QUESTÕES)

function iniciarMundo5() {
    const bossScreen = document.getElementById("lightning-screen");
    if (bossScreen) {
        bossScreen.classList.remove("hidden");
        bossScreen.style.display = "block";
    }

    const r1 = document.getElementById("lightning-round-1");
    const r2 = document.getElementById("lightning-round-2");
    const r3 = document.getElementById("lightning-round-3");

    if (r1) { r1.classList.remove("hidden"); r1.style.display = "block"; }
    if (r2) { r2.classList.add("hidden"); r2.style.display = "none"; }
    if (r3) { r3.classList.add("hidden"); r3.style.display = "none"; }

    const fb = document.getElementById("feedback-lightning");
    if (fb) fb.textContent = "";

    ["input-lightning-1", "input-lightning-2", "input-lightning-3", "input-lightning-4"].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
    });

    console.clear();
    console.log("⚡ === CASTELO TROVÃO INICIADO ===");
    setupRodada1();
}

function setupMiniGrid(id, rows, cols, type = "full", halfCount = 0) {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = "";
    el.style.display = "grid";
    el.style.gridTemplateRows = `repeat(${rows}, 28px)`;
    el.style.gridTemplateColumns = `repeat(${cols}, 28px)`;
    
    const total = rows * cols;
    for (let i = 0; i < total; i++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell lightning-cell";

        if (type === "full") {
            cell.classList.add("yellow-block", "cell-filled");
        } else if (type === "half") {
            if (i < total - halfCount) {
                cell.classList.add("water-full", "cell-water");
            } else {
                cell.classList.add("water-half", "cell-half");
            }
        }
        el.appendChild(cell);
    }
}

//RODADA 1: MULTIPLICAÇÃO + ÁREA COM METADES
function setupRodada1() {
    // Q1: Multiplicação
    const multOpts = [
        { r: 2, c: 4, ans: 8, label: "2x4" },
        { r: 3, c: 3, ans: 9, label: "3x3" },
        { r: 3, c: 5, ans: 15, label: "3x5" }
    ];
    const selMult = multOpts[Math.floor(Math.random() * multOpts.length)];
    gameState.m5.r1_mult = selMult.ans;
    setupMiniGrid("lightning-grid-1", selMult.r, selMult.c, "full");

    // Q2: Área com Metades
    const areaOpts1 = [
        { r: 3, c: 3, half: 2, ans: 8.0, label: "3x3 com 2 metades" },
        { r: 2, c: 4, half: 4, ans: 6.0, label: "2x4 com 4 metades" },
        { r: 3, c: 4, half: 2, ans: 11.0, label: "3x4 com 2 metades" }
    ];
    const selArea1 = areaOpts1[Math.floor(Math.random() * areaOpts1.length)];
    gameState.m5.r1_area = selArea1.ans;
    setupMiniGrid("lightning-grid-2", selArea1.r, selArea1.c, "half", selArea1.half);

    console.log("--- RODADA 1 ---");
    console.log("Q1 Multiplicação (" + selMult.label + "):", gameState.m5.r1_mult);
    console.log("Q2 Área com Metades (" + selArea1.label + "):", gameState.m5.r1_area);
}

// RODADA 2: ÁREA COM METADES + PERÍMETRO DINÂMICO
function setupRodada2() {
    // Q3: Área com Metades
    const areaOpts2 = [
        { r: 4, c: 3, half: 2, ans: 11.0, label: "4x3 com 2 metades" },
        { r: 3, c: 4, half: 4, ans: 10.0, label: "3x4 com 4 metades" },
        { r: 4, c: 4, half: 4, ans: 14.0, label: "4x4 com 4 metades" }
    ];
    const selArea2 = areaOpts2[Math.floor(Math.random() * areaOpts2.length)];
    gameState.m5.r2_area = selArea2.ans;
    setupMiniGrid("lightning-grid-3", selArea2.r, selArea2.c, "half", selArea2.half);

    // Q4: Perímetro Dinâmico (Opções de grades com diferentes dimensões)
    const perimOpts = [
        { r: 1, c: 4 },
        { r: 2, c: 3 },
        { r: 2, c: 4 },
        { r: 3, c: 3 } 
    ];
    const selPerim = perimOpts[Math.floor(Math.random() * perimOpts.length)];
    const ladosExternos = 2 * (selPerim.r + selPerim.c);
    const perimetroEmCm = ladosExternos * 2;
    
    gameState.m5.r2_perim = perimetroEmCm;
    setupMiniGrid("lightning-grid-4", selPerim.r, selPerim.c, "full");

    console.log("--- RODADA 2 ---");
    console.log("Q3 Área (" + selArea2.label + "):", gameState.m5.r2_area);
    console.log(`Q4 Perímetro (${selPerim.r}x${selPerim.c} -> ${ladosExternos} lados x 2cm):`, gameState.m5.r2_perim);
}

// --- RODADA 3: AMPLIAÇÃO E REDUÇÃO ----
function setupRodada3() {
    const ampOpts = [
        { 
            modR: 1, modC: 2, 
            drawGridRows: 4, drawGridCols: 6, 
            target: 8, 
            text: "Desenhe o modelo AMPLIADO em 2x (largura e altura dobradas):",
            label: "1x2" 
        },
        { 
            modR: 2, modC: 2, 
            drawGridRows: 4, drawGridCols: 6, 
            target: 1, 
            text: "Desenhe o modelo REDUZIDO pela metade (metade da largura e altura):",
            label: "2x2" 
        }
    ];

    const selAmp = ampOpts[Math.floor(Math.random() * ampOpts.length)];
    gameState.m5.r3_target = selAmp.target;

    const msgInst = document.getElementById("msg-amp-instruction");
    if (msgInst) {
        msgInst.textContent = selAmp.text;
    }

    const labelModel = document.getElementById("label-model-amp");
    if (labelModel) {
        labelModel.textContent = `Modelo (${selAmp.label})`;
    }

    setupMiniGrid("grid-model-amp", selAmp.modR, selAmp.modC, "full");

    const drawAmp = document.getElementById("grid-draw-amp");

    if (drawAmp) {
        drawAmp.innerHTML = "";
        drawAmp.style.display = "grid";
        drawAmp.style.gridTemplateRows = `repeat(${selAmp.drawGridRows}, 34px)`;
        drawAmp.style.gridTemplateColumns = `repeat(${selAmp.drawGridCols}, 34px)`;
        drawAmp.style.gap = "3px";
        drawAmp.style.margin = "0 auto";
    
        const total = selAmp.drawGridRows * selAmp.drawGridCols;
        gameState.m5.r3_state = new Array(total).fill(false);

        for (let i = 0; i < total; i++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell lightning-cell cell-interactive drawable-cell";
            cell.style.width = "34px";
            cell.style.height = "34px";
            
            cell.onclick = () => {
                if (typeof playSound === 'function') playSound('click');
                gameState.m5.r3_state[i] = !gameState.m5.r3_state[i];
                cell.classList.toggle("cell-active");
                cell.classList.toggle("user-painted");
                cell.classList.toggle("yellow-block");
            };
            drawAmp.appendChild(cell);
        }
    }   
}

// Validação das Rodadas 1 e 2
function validarEAvancarRodada(rodada, event) {
    if (event) event.preventDefault();
    const fb = document.getElementById("feedback-lightning");

    if (rodada === 1) {
        const q1 = parseInt(document.getElementById("input-lightning-1")?.value, 10);
        const q2 = parseFloat(document.getElementById("input-lightning-2")?.value);

        const q1Ok = !Number.isNaN(q1) && q1 === gameState.m5.r1_mult;
        const q2Ok = !Number.isNaN(q2) && q2 === gameState.m5.r1_area;

        if (q1Ok && q2Ok) {
            if (typeof playSound === 'function') playSound('correct');
            if (fb) {
                fb.textContent = "Correto! Rodada 1 concluída! Indo para a Rodada 2...";
                fb.className = "feedback-msg feedback-success";
                fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            setTimeout(() => {
                const r1 = document.getElementById("lightning-round-1");
                const r2 = document.getElementById("lightning-round-2");
                if (r1) { r1.classList.add("hidden"); r1.style.display = "none"; }
                if (r2) { r2.classList.remove("hidden"); r2.style.display = "block"; }
                setupRodada2();
                if (fb) {
                    fb.textContent = "";
                    fb.className = "feedback-msg";
                }
            }, 1800);
        } else {
            if (typeof playSound === 'function') playSound('wrong');
            if (fb) {
                const erros = [];
                if (!q1Ok) erros.push("Q1 (Multiplicação)");
                if (!q2Ok) erros.push("Q2 (Área com Metades)");
                fb.textContent = `Revise ${erros.join(" e ")} na Rodada 1!`;
                fb.className = "feedback-msg feedback-error";
                fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    } else if (rodada === 2) {
        const q3 = parseFloat(document.getElementById("input-lightning-3")?.value);
        const q4 = parseInt(document.getElementById("input-lightning-4")?.value, 10);

        const q3Ok = !Number.isNaN(q3) && q3 === gameState.m5.r2_area;
        const q4Ok = !Number.isNaN(q4) && q4 === gameState.m5.r2_perim;

        if (q3Ok && q4Ok) {
            if (typeof playSound === 'function') playSound('correct');
            if (fb) {
                fb.textContent = "Correto! Área e perímetro certos. Rodada 2 concluída!";
                fb.className = "feedback-msg feedback-success";
                fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            setTimeout(() => {
                const r2 = document.getElementById("lightning-round-2");
                const r3 = document.getElementById("lightning-round-3");
                if (r2) { r2.classList.add("hidden"); r2.style.display = "none"; }
                if (r3) { r3.classList.remove("hidden"); r3.style.display = "block"; }
                setupRodada3();
                if (fb) {
                    fb.textContent = "";
                    fb.className = "feedback-msg";
                }
            }, 1800);
        } else {
            if (typeof playSound === 'function') playSound('wrong');
            if (fb) {
                const erros = [];
                if (!q3Ok) erros.push("Q3 (Área)");
                if (!q4Ok) erros.push("Q4 (Perímetro)");
                fb.textContent = `Revise ${erros.join(" e ")} na Rodada 2!`;
                fb.className = "feedback-msg feedback-error";
                fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}

// Validação da Rodada 3
function verificarMundoRaioFinal(event) {
    if (event) event.preventDefault();
    const totalPintado = gameState.m5.r3_state ? gameState.m5.r3_state.filter(v => v).length : 0;
    const fb = document.getElementById("feedback-lightning");
    
    if (totalPintado === gameState.m5.r3_target) {
        if (typeof playSound === 'function') playSound('correct');
        if (fb) {
            fb.textContent = "O MESTRE TROVÃO FOI DERROTADO! PARABÉNS!";
            fb.className = "feedback-msg feedback-success";
        }
        
        // Exibe e força os estilos do botão "VER O DESFECHO 🏆"
        const nextBtn = document.getElementById("next-stage-5");
        if (nextBtn) {
            nextBtn.classList.remove("hidden");
            nextBtn.innerText = "VER O DESFECHO 🏆";
            
            nextBtn.style.setProperty("display", "inline-block", "important");
            nextBtn.style.setProperty("background-color", "#2ecc71", "important");
            nextBtn.style.setProperty("color", "#000000", "important");
            nextBtn.style.setProperty("padding", "10px 10px", "important");
            nextBtn.style.setProperty("font-weight", "bold", "important");
            nextBtn.style.setProperty("border-radius", "6px", "important");
            nextBtn.style.setProperty("margin-top", "15px", "important");
            nextBtn.style.setProperty("cursor", "pointer", "important");

            nextBtn.onclick = function() {
                exibirTelaVitoria();
            };
        }
        
        const ctrl = document.getElementById("lightning-controls-3");
        if (ctrl) ctrl.classList.add("hidden");
    } else {
        if (typeof playSound === 'function') playSound('wrong');
        if (fb) {
            fb.textContent = "DESENHO INCORRETO! Verifique se pintou todos os blocos.";
            fb.className = "feedback-msg feedback-error";
        }
    }
}

// ESTRUTURA E LÓGICA DE NAVEGAÇÃO DO DESFECHO DA HISTÓRIA

const historiaDesfecho = [
    {
        titulo: "1. A Derrota do Senhor Raio",
        imagem: "Sr_Raio_Derrotado.png",
        texto: "Após uma intensa batalha, o Princípe Nilo e a Princesa Mia conseguiram derrotar o Senhor Raio.\nCansado e sem forças, ele caiu diante dos dois. Por um momento, o poderoso vilão permaneceu em silêncio, até finalmente revelar o que sentia:\n\n - Eu só... queria ser reconhecido...\n\nNilo e Mia perceberam que, por trás de toda aquela raiva, havia alguém que se sentia sozinho e excluído."
    },
    {
        titulo: "2. O Arrependimento",
        imagem: "Sr_Raio_Arrependimento.png",
        texto: "O Senhor Raio abaixou a cabeça e refletiu sobre tudo o que havia feito.\n\nMovido pela tristeza e pelo sentimento de exclusão, ele havia roubado os poderes dos outros elementos e colocado todo o reino em perigo.\nEntão, arrependido, reconheceu seu erro:\n\n - Deixei a tristeza e a solidão me cegarem... Eu estava errado."
    },
    {
        titulo: "3. O Reconhecimento",
        imagem: "Reconhecimento.png",
        texto: "Os Guardiões dos Elementos se aproximaram do Senhor Raio.\nEles também reconheceram que haviam cometido um erro. Durante muito tempo, o Raio não havia sido considerado um elemento como os outros, e isso o fez sentir-se excluído.\nEntão, os Guardiões pediram desculpas:\n\n - Nós também erramos. Pedimos desculpas por termos te excluído por tanto tempo. Sempre fez parte de nós.\n\nNaquele momento, o Senhor Raio percebeu que a verdadeira força não estava em ser superior aos outros, mas em fazer parte de algo maior."
    },
    {
        titulo: "4. O Retorno dos Poderes",
        imagem: "A_Harmonia_dos_Elementos.png",
        texto: "Arrependido, o Senhor Raio decidiu desfazer tudo o que havia causado.\nCom suas mãos, ele começou a devolver os poderes aos reinos.\nA energia da Terra, do Fogo, da Água e do Ar voltou a brilhante novamente. Ao mesmo tempo, o poder do Raio também encontrou seu lugar entre os demais.\nPouco a pouco, o equilíbrio do mundo foi restaurado."
    },
    {
        titulo: "5. A Harmonia dos Elementos",
        imagem: "A_Harmonia_dos_Elementos.png",
        texto: "Com os poderes restaurados, os quatro elementos voltaram a coexistir em harmonia. A Terra voltou a florescer, o Fogo recuperou sua força, as Águas voltaram a correr livremente e os Ventos sopraram novamente pelos céus. E, ao lado deles, o Senhor Raio passou a ser reconhecido como um membro importante do reino. Ele não precisava ser um elemento para fazer parte daquela união. Terra, Fogo, Água, Ar e Raio aprenderam que suas diferenças não os separavam. Pelo contrário, juntos, seus poderes tornavam o mundo mais completo. Nilo e Mia haviam descoberto que a verdadeira harmonia não significa que todos precisam ser iguais. Significa aprender a respeitar, aceitar e coexistir com as diferenças."
    },
    {
        titulo: "Obrigado por jogar!",
        imagem: "Tela_Obrigado.png",
        texto: "Você ajudou Nilo e Mia a restaurarem o equilíbrio e a união dos quatro elementos!\n\nNenhum elemento é mais importante que o outro. Juntos, eles mantêm o mundo em harmonia."
    }
];

let indiceDesfechoAtual = 0;

function exibirTelaVitoria() {
    indiceDesfechoAtual = 0;
    
    // Esconde todas as telas ativas
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = "none";
    });
    
    const btnVoltar = document.getElementById('global-back-btn');
    if (btnVoltar) btnVoltar.classList.add('hidden');

    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
        victoryScreen.classList.remove('hidden');
        // Aplica o alinhamento centralizado apenas quando a tela for exibida
        victoryScreen.style.setProperty("display", "flex", "important");
        victoryScreen.style.setProperty("justify-content", "center", "important");
        victoryScreen.style.setProperty("align-items", "center", "important");
    }

    renderizarPassoDesfecho();
}

function renderizarPassoDesfecho() {
    const passo = historiaDesfecho[indiceDesfechoAtual];
    
    document.getElementById('victory-title').innerText = passo.titulo;
    document.getElementById('victory-img').src = passo.imagem;
    
    const textElement = document.getElementById('victory-text-content');
    textElement.innerText = passo.texto;
    textElement.style.whiteSpace = "pre-line";

    const btnAdvance = document.getElementById('btn-victory-advance');

    if (indiceDesfechoAtual === historiaDesfecho.length - 1) {
        btnAdvance.innerText = "JOGAR NOVAMENTE 🔄";
    } else {
        btnAdvance.innerText = "AVANÇAR ➔";
    }
}

function avancarHistoriaVitoria() {
    if (typeof playSound === 'function') playSound('click');
    
    if (indiceDesfechoAtual < historiaDesfecho.length - 1) {
        indiceDesfechoAtual++;
        renderizarPassoDesfecho();
    } else {
        location.reload(); 
    }
}

// MOVIMENTO DO AVATAR DO PERSONAGEM NO MAPA

function moverTokenJogador() {
    const token = document.getElementById('player-map-token');
    if (!token) return;

    token.src = (currentHero && currentHero.toLowerCase() === 'mia') ? 'mia.png' : 'nilo.png';
    token.style.display = 'block';
    token.classList.remove('hidden');

    const ultimoMundoLiberado = unlockedWorlds[unlockedWorlds.length - 1];
    const nodeAlvo = document.getElementById(`node-${ultimoMundoLiberado}`);

    if (nodeAlvo) {
        const offsetLeft = nodeAlvo.offsetLeft;
        const offsetTop = nodeAlvo.offsetTop;

        token.style.left = `${nodeAlvo.offsetLeft}px`;
        token.style.top = `${nodeAlvo.offsetTop}px`;
    }
}

// Atualiza o mapa e move o avatar
const orig_atualizarMapa = window.atualizarMapa;
window.atualizarMapa = function() {
    if (typeof orig_atualizarMapa === 'function') orig_atualizarMapa();
    setTimeout(moverTokenJogador, 100);
};

// GERENCIADOR INTEGRADO DE MÚSICAS EM SEGUNDO PLANO

let currentTrack = "";
let isMuted = false;

// Função auxiliar para tocar a música sem reiniciar se já estiver tocando
function playMusic(filename) {
    const bgAudio = document.getElementById('bg-music');
    if (!bgAudio) return;

    if (currentTrack === filename && !bgAudio.paused) {
        return; // Já está tocando esta música
    }

    currentTrack = filename;
    bgAudio.src = filename;
    bgAudio.loop = true;

    if (!isMuted) {
        bgAudio.play().catch(err => {
            console.log("Aguardando interação do usuário para reproduzir áudio:", err);
        });
    }
}

// Configuração do Botão Mute / Unmute (🔊 / 🔇)
document.addEventListener("DOMContentLoaded", () => {
    const audioBtn = document.getElementById('audio-toggle');
    const bgAudio = document.getElementById('bg-music');

    // Toca a música inicial na Tela de Start
    playMusic('game_start.mp3');

    if (audioBtn && bgAudio) {
        audioBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (isMuted) {
                bgAudio.pause();
                audioBtn.innerText = '🔇';
            } else {
                bgAudio.play().catch(e => console.log(e));
                audioBtn.innerText = '🔊';
            }
        });
    }
});

// GANCHOS DE ÁUDIO NAS TRANSIÇÕES EXISTENTES DO JOGO (COM LÓGICA DO ENREDO)

// 1. Ao Clicar em Jogar na Tela Inicial -> Troca para Música de Seleção
const orig_jogarStart = window.jogarStart;
window.jogarStart = function() {
    if (typeof orig_jogarStart === 'function') orig_jogarStart();
    playMusic('selecao_personagens.mp3');
};

// 2. Ao Entrar nos Mundos (Fases 1 a 4 entram na musica_das_fases; Mundo 5 entra direto na musica_boss)
const orig_entrarMundo = window.entrarMundo;
window.entrarMundo = function(worldId) {
    if (typeof orig_entrarMundo === 'function') orig_entrarMundo(worldId);

    if (worldId >= 1 && worldId <= 4) {
        playMusic('musica_das_fases.mp3');
    } else if (worldId === 5) {
        playMusic('musica_boss.mp3');
    }
};

// 3. Ao Voltar para o Mapa dos Mundos
const orig_voltarParaMundos = window.voltarParaMundos;
window.voltarParaMundos = function() {
    if (typeof orig_voltarParaMundos === 'function') orig_voltarParaMundos();
    playMusic('musica_do_mundo.mp3');
};

// 4. Ao Avançar para a História após a Seleção do Herói
const orig_avancarHistoria = window.avancarHistoria;
window.avancarHistoria = function() {
    if (typeof orig_avancarHistoria === 'function') orig_avancarHistoria();
    if (introStep >= 3) {
        playMusic('musica_do_mundo.mp3');
    }
};

// 5. Início do Desfecho -> O Sr. Raio é derrotado (Partes 1 a 3)
const orig_exibirTelaVitoria = window.exibirTelaVitoria;
window.exibirTelaVitoria = function() {
    if (typeof orig_exibirTelaVitoria === 'function') orig_exibirTelaVitoria();
    playMusic('musica_sr_raio.mp3'); // Música melancólica ao entender a dor do Sr. Raio
};

// 6. Transição das Músicas no Desfecho (Narrativa por etapas)
const orig_renderizarPassoDesfecho = window.renderizarPassoDesfecho;
window.renderizarPassoDesfecho = function() {
    if (typeof orig_renderizarPassoDesfecho === 'function') orig_renderizarPassoDesfecho();
    
    if (typeof indiceDesfechoAtual !== 'undefined') {
        if (indiceDesfechoAtual >= 0 && indiceDesfechoAtual <= 2) {
            playMusic('musica_sr_raio.mp3');
        } else if (indiceDesfechoAtual === 3) {
            playMusic('devolvendo_poderes.mp3');
        } else if (indiceDesfechoAtual >= 4) {
            playMusic('musica_final.mp3');
        }
    }
};