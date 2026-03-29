const tela = document.getElementById("jogo");
const contexto = tela.getContext("2d");

const tamanhoGrade = 18;
const tamanhoCelula = tela.width / tamanhoGrade;

// Variaveis do jogo todo
let cobrinha, direcao, alimento, pontuacao, recorde, emExecucao, temporizador;
let vidas = 3;
let velocidade = 160;
let exibindoMenu = true;
let nomeDoJogador = "";
let comidasComidas = 0;        
let comidaSeMovendo = false;   
let metaComidas = 7;          

// Fundo do Tabuleiro
const imagemFundo = new Image();
imagemFundo.src = "Fundo_do_tabulero.jpg";

// Tipos diferentes de alimento
const tiposDeAlimento = [
    { cor: "#ef4444", pontos: 10 },
    { cor: "#facc15", pontos: 20 },
    { cor: "#38bdf8", pontos: 30 }
];

// FUNÇÃO DE SOM 
function emitirSom(frequencia, duracao) {
    const contextoAudio = new AudioContext();
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();
    oscilador.frequency.value = frequencia;
    oscilador.connect(ganho);
    ganho.connect(contextoAudio.destination);
    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + duracao / 1000);
}

function somDerrota() {
    const contextoAudio = new AudioContext();
    const oscilador = contextoAudio.createOscillator();
    const ganho = contextoAudio.createGain();

    oscilador.type = "sawtooth"; 
    oscilador.frequency.value = 150; 
    oscilador.connect(ganho);
    ganho.connect(contextoAudio.destination);

    ganho.gain.setValueAtTime(0.5, contextoAudio.currentTime); 
    oscilador.start();
    oscilador.stop(contextoAudio.currentTime + 1); 
}

function desenharContagem(contador) {
    desenharTela(); // mantém fundo, cobrinha e fruta
    contexto.fillStyle = "rgba(0,0,0,0.5)";
    contexto.fillRect(0, 0, tela.width, tela.height);

    contexto.fillStyle = "#ffffff";
    contexto.font = "bold 80px Arial";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText(contador, tela.width / 2, tela.height / 2);
}

function desenharVidas() {
    desenharTela();
    contexto.fillStyle = "red";
    contexto.font = "bold 50px Arial";
    contexto.textAlign = "center";
    contexto.textBaseline = "middle";
    contexto.fillText(`Vidas: ${vidas}`, tela.width / 2, tela.height / 2);
}


// Contagem regressiva antes de começar (ou recomeçar após perder vida)
function iniciarComContagem() {
    emExecucao = false;
    clearTimeout(temporizador);

    let contador = 3;

    const intervalo = setInterval(() => {
        if (contador > 0) {
            desenharContagem(contador); 
            emitirSom(400, 100);
            contador--;
        } else {
            clearInterval(intervalo);
            desenharTela();
            contexto.fillStyle = "#ffffff";
            contexto.font = "bold 60px Arial";
            contexto.textAlign = "center";
            contexto.textBaseline = "middle";
            contexto.fillText("Vai!", tela.width / 2, tela.height / 2);
            emitirSom(800, 150);

            setTimeout(() => {
                iniciarExecucao();
            }, 500);
        }
    }, 1000);
}



// FUNÇÕES DO JOGO 
function iniciarJogo(nome = "") {
    nomeDoJogador = nome || "Jogador";
    cobrinha = [
        { x: 9, y: 9 },
        { x: 8, y: 9 },
        { x: 7, y: 9 }
    ];
    direcao = { x: 1, y: 0 };
    pontuacao = 0;
    velocidade = 160;
    vidas = 3;
    comidasComidas = 0;       
    comidaSeMovendo = false;  

    document.getElementById("nomeJogador").textContent = nomeDoJogador;
    document.getElementById("vidas").textContent = vidas;
    document.getElementById("pontuacao").textContent = pontuacao;

    recorde = localStorage.getItem("recordeCobrinha") || 0;
    document.getElementById("recorde").textContent = recorde;

    gerarAlimento();
    desenharTela();
}

function desenharCelula(x, y, cor) {
    contexto.fillStyle = cor;
    contexto.fillRect(x * tamanhoCelula, y * tamanhoCelula, tamanhoCelula - 1, tamanhoCelula - 1);
}

function gerarAlimento() {
    let novoAlimento;
    do {
        novoAlimento = {
            x: Math.floor(Math.random() * tamanhoGrade),
            y: Math.floor(Math.random() * tamanhoGrade)
        };
    } while (cobrinha.some(parte => parte.x === novoAlimento.x && parte.y === novoAlimento.y));

    novoAlimento.tipo = tiposDeAlimento[Math.floor(Math.random() * tiposDeAlimento.length)];
    alimento = novoAlimento;
}

// movimento automático do alimento
function moverAlimento() {
    if (!comidaSeMovendo) return;

    const direcoes = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    const dir = direcoes[Math.floor(Math.random() * direcoes.length)];
    const novoX = alimento.x + dir.x;
    const novoY = alimento.y + dir.y;

    // Verifica se o novo ponto está dentro dos limites
    const dentroDaTela =
        novoX >= 0 && novoX < tamanhoGrade && novoY >= 0 && novoY < tamanhoGrade;

    // Verifica se a nova posição colide com a cobra
    const colideComCobra = cobrinha.some(parte => parte.x === novoX && parte.y === novoY);

    // Só move se estiver dentro da tela e não colidir com a cobra
    if (dentroDaTela && !colideComCobra) {
        alimento.x = novoX;
        alimento.y = novoY;
    } else {
        // Se não conseguir se mover, tenta gerar uma posição nova aleatória válida
        let novaPosicao;
        let tentativas = 0;
        do {
            novaPosicao = {
                x: Math.floor(Math.random() * tamanhoGrade),
                y: Math.floor(Math.random() * tamanhoGrade)
            };
            tentativas++;
        } while (
            cobrinha.some(parte => parte.x === novaPosicao.x && parte.y === novaPosicao.y) &&
            tentativas < 50
        );
        alimento.x = novaPosicao.x;
        alimento.y = novaPosicao.y;
    }

    // Movimento repete em intervalos (mais rápido conforme pontuação)
    const intervalo = Math.max(1000 - pontuacao * 10, 250);
    setTimeout(moverAlimento, intervalo);
}


function desenharTela() {
    contexto.drawImage(imagemFundo, 0, 0, tela.width, tela.height);
    desenharCelula(alimento.x, alimento.y, alimento.tipo.cor);
    cobrinha.forEach((parte, indice) => {
        const cor = indice === 0 ? "#c52222ff" : "#a31616ff";
        desenharCelula(parte.x, parte.y, cor);
    });
}

function atualizarJogo() {
    const cabeca = {
        x: cobrinha[0].x + direcao.x,
        y: cobrinha[0].y + direcao.y
    };

    // Verifica colisão com paredes
    if (cabeca.x < 0 || cabeca.x >= tamanhoGrade || cabeca.y < 0 || cabeca.y >= tamanhoGrade) {
        perderVida("parede");
        return;
    }

    // Verifica colisão com o próprio corpo
    if (cobrinha.some(parte => parte.x === cabeca.x && parte.y === cabeca.y)) {
        perderVida("corpo");
        return;
    }

    cobrinha.unshift(cabeca);

    // Verifica se comeu o alimento
    if (cabeca.x === alimento.x && cabeca.y === alimento.y) {
        emitirSom(600, 100);
        pontuacao += alimento.tipo.pontos;
        comidasComidas++; // NOVO: soma frutas comidas

        // NOVO: ativa o movimento da comida quando atingir a meta
        if (comidasComidas >= metaComidas && !comidaSeMovendo) {
            comidaSeMovendo = true;
            moverAlimento();
        }

        velocidade = Math.max(60, velocidade - 5);
        gerarAlimento();
    } else {
        cobrinha.pop();
    }

    document.getElementById("pontuacao").textContent = pontuacao;
    desenharTela();

    temporizador = setTimeout(atualizarJogo, velocidade);
}

function perderVida(motivo) {
    emitirSom(200, 300);
    vidas--;
    document.getElementById("vidas").textContent = vidas;

    // Para o jogo imediatamente
    emExecucao = false;
    clearTimeout(temporizador);

    if (vidas > 0) {
        // Reseta a cobrinha e direção
        cobrinha = [
            { x: 9, y: 9 },
            { x: 8, y: 9 },
            { x: 7, y: 9 }
        ];
        direcao = { x: 1, y: 0 };

        // Inicia contagem para reiniciar o jogo
        setTimeout(() => {
            iniciarComContagem();
        }, 500);
    } else {
        encerrarJogo(motivo);
    }
}

function encerrarJogo(motivo) {
    emExecucao = false;
    clearTimeout(temporizador);
    somDerrota();
    document.getElementById("status").textContent = `Fim de jogo — colidiu com a ${motivo}`;

    if (pontuacao > recorde) {
        localStorage.setItem("recordeCobrinha", pontuacao);
    }

    // Salva no primeiro ranking
    salvarNoHistorico(nomeDoJogador, pontuacao);


    // Salva no segundo ranking
    salvarNoRankingExtra(nomeDoJogador, pontuacao);

    atualizarHistorico();
    

    // Mostrar menu novamente para novo jogador
    document.getElementById("menu").style.display = "block";
    exibindoMenu = true;

    // Limpar campo para novo jogador
    document.getElementById("entradaNome").value = "";
    document.getElementById("nomeJogador").textContent = "-";
    document.getElementById("status").textContent = "Aguardando novo jogador...";
}

function salvarNoRankingExtra(nome, pontos) {
    let ranking = JSON.parse(localStorage.getItem("rankingExtra")) || [];

    ranking.push({ nome, pontos });

    // Ordena do maior para o menor
    ranking.sort((a, b) => b.pontos - a.pontos);

    // Mantém apenas os 10 melhores
    ranking = ranking.slice(0, 10);

    // Salva no localStorage
    localStorage.setItem("rankingExtra", JSON.stringify(ranking));

    // Atualiza a exibição
    atualizarRankingExtra();
}

function atualizarRankingExtra() {
    let ranking = JSON.parse(localStorage.getItem("rankingExtra")) || [];
    const lista = document.getElementById("listaRankingExtra");
    lista.innerHTML = "";

    if (ranking.length === 0) {
        lista.innerHTML = "<li>Nenhum ranking salvo.</li>";
        return;
    }

    ranking.forEach((jogador, index) => {
        const item = document.createElement("li");
        item.textContent = `${index + 1}º - ${jogador.nome}: ${jogador.pontos} pontos`;
        lista.appendChild(item);
    });
}

function limparRankingExtra() {
    if (confirm("Deseja realmente apagar o Ranking Extra?")) {
        localStorage.removeItem("rankingExtra");
        atualizarRankingExtra(); // Atualiza a lista na tela
    }
}



// CONTROLES
window.addEventListener("keydown", evento => {
    const tecla = evento.key;

    // Evita que a tela se mova com as setas
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(tecla)) {
        evento.preventDefault();
    }

    // Quando estiver no menu e apertar Enter
    if (exibindoMenu && tecla === "Enter") {
        const entrada = document.getElementById("entradaNome");
        const nome = entrada.value.trim();

        if (!nome) {
            alert("Digite seu nome para jogar.");
            return;
        }

        document.getElementById("menu").style.display = "none";
        exibindoMenu = false;
        iniciarJogo(nome);
        iniciarComContagem();
        return;
    }

    // Movimentação da cobra
    if (tecla === "ArrowUp" && direcao.y === 0) direcao = { x: 0, y: -1 };
    if (tecla === "ArrowDown" && direcao.y === 0) direcao = { x: 0, y: 1 };
    if (tecla === "ArrowLeft" && direcao.x === 0) direcao = { x: -1, y: 0 };
    if (tecla === "ArrowRight" && direcao.x === 0) direcao = { x: 1, y: 0 };
});


function iniciarExecucao() {
    if (!emExecucao) {
        emExecucao = true;
        atualizarJogo();
        document.getElementById("status").textContent = "Em andamento...";
    }
}

function pausarJogo() {
    emExecucao = false;
    clearTimeout(temporizador);
    document.getElementById("status").textContent = "Pausado";
}

function reiniciarJogo() {
    clearTimeout(temporizador);
    iniciarJogo(nomeDoJogador);
    document.getElementById("status").textContent = "Reiniciado";
}

//  HISTÓRICO 
function salvarNoHistorico(nome, pontos) {
    const historico = JSON.parse(localStorage.getItem("historicoCobrinha")) || [];
    historico.push({ nome, pontos });
    localStorage.setItem("historicoCobrinha", JSON.stringify(historico));
}

function atualizarHistorico() {
    const historico = JSON.parse(localStorage.getItem("historicoCobrinha")) || [];
    const lista = document.getElementById("listaHistorico");
    lista.innerHTML = "";

    if (historico.length === 0) {
        lista.innerHTML = "<li>Nenhum histórico salvo.</li>";
        return;
    }

    historico.slice().reverse().forEach(jogador => {
        const item = document.createElement("li");
        item.textContent = `${jogador.nome}: ${jogador.pontos} pontos`;
        lista.appendChild(item);
    });
}

function limparHistorico() {
    if (confirm("Deseja realmente apagar o histórico e zerar o recorde?")) {
        localStorage.removeItem("historicoCobrinha"); // Limpa histórico
        localStorage.removeItem("recordeCobrinha");    // Limpa recorde
        document.getElementById("recorde").textContent = 0; // Atualiza na tela
        atualizarHistorico(); // Atualiza lista
    }
}


// ---------- INICIALIZAÇÃO ----------
iniciarJogo();
desenharTela();
atualizarHistorico();
atualizarRankingExtra();

