const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [7, 24, 25],
    [20, 21, 29],
    [9, 40, 41],
    [12, 35, 37],
    [11, 60, 61],
    [28, 45, 53],
    [33, 56, 65],
    [16, 63, 65],
    [48, 55, 73],
    [13, 84, 85],
    [36, 77, 85]
];

const RANKING_KEY = "pitagorasRankingTop19";

let currentExercise = null;

function secureRandom(max) {
    if (max <= 0) return 0;

    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
    }

    return Math.floor(Math.random() * max);
}

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function getLevel(round) {
    if (round <= 3) return 1;
    if (round <= 6) return 2;
    if (round <= 10) return 3;
    if (round <= 14) return 4;
    return 5;
}

function roundOneDecimal(number) {
    return Math.round(number * 10) / 10;
}

function formatNumber(number) {
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function generateExercise(level) {
    let availableTriples;

    if (level === 1) {
        availableTriples = triples.slice(0, 2);
    } else if (level === 2) {
        availableTriples = triples.slice(0, 4);
    } else if (level === 3) {
        availableTriples = triples.slice(0, 8);
    } else {
        availableTriples = triples;
    }

    let [a, b, c] = availableTriples[secureRandom(availableTriples.length)];

    if (level >= 4 && secureRandom(100) < 35) {
        const scales = [1.5, 2.5, 3.5];
        const scale = scales[secureRandom(scales.length)];

        a = roundOneDecimal(a * scale);
        b = roundOneDecimal(b * scale);
        c = roundOneDecimal(c * scale);
    }

    let unknown = "c";

    if (level >= 3) {
        unknown = shuffle(["a", "b", "c"])[0];
    }

    let correct;
    let text;

    if (unknown === "c") {
        correct = roundOneDecimal(Math.sqrt(a * a + b * b));
        text = `Catetos conocidos: ${formatNumber(a)} y ${formatNumber(b)}. ¿Cuánto mide la hipotenusa?`;
    } else if (unknown === "a") {
        correct = roundOneDecimal(Math.sqrt(c * c - b * b));
        text = `Hipotenusa: ${formatNumber(c)}. Cateto conocido: ${formatNumber(b)}. ¿Cuánto mide el otro cateto?`;
    } else {
        correct = roundOneDecimal(Math.sqrt(c * c - a * a));
        text = `Hipotenusa: ${formatNumber(c)}. Cateto conocido: ${formatNumber(a)}. ¿Cuánto mide el otro cateto?`;
    }

    return {
        a,
        b,
        c,
        unknown,
        correct,
        text,
        options: generateOptions(correct)
    };
}

function generateOptions(correct) {
    const values = new Set();
    values.add(correct);

    while (values.size < 3) {
        let offset = secureRandom(9) - 4;

        if (offset === 0) {
            offset = 2;
        }

        let fake = roundOneDecimal(correct + offset);

        if (fake > 0 && fake !== correct) {
            values.add(fake);
        }
    }

    return shuffle([...values]);
}

function drawGridAndTriangle(exercise) {
    const canvas = document.getElementById("gridCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 500, 500);

    ctx.strokeStyle = "#063f24";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 500; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 500);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(500, i);
        ctx.stroke();
    }

    const maxSide = Math.max(exercise.a, exercise.b, exercise.c);
    const scale = 360 / maxSide;

    const x0 = 70;
    const y0 = 420;

    const x1 = x0 + exercise.a * scale;
    const y1 = y0;

    const x2 = x0;
    const y2 = y0 - exercise.b * scale;

    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#22c55e";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 18px Courier New";

    ctx.fillText(
        exercise.unknown === "a" ? "?" : formatNumber(exercise.a),
        (x0 + x1) / 2,
        y0 + 28
    );

    ctx.fillText(
        exercise.unknown === "b" ? "?" : formatNumber(exercise.b),
        x0 - 45,
        (y0 + y2) / 2
    );

    ctx.fillText(
        exercise.unknown === "c" ? "?" : formatNumber(exercise.c),
        (x1 + x2) / 2 + 12,
        (y1 + y2) / 2
    );

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0 - 28, 28, 28);
}

function renderExercise(exercise, onAnswer) {
    currentExercise = exercise;

    const question = document.getElementById("question");
    const feedback = document.getElementById("feedback");
    const optionsDiv = document.getElementById("options");

    if (!question || !feedback || !optionsDiv) return;

    question.textContent = exercise.text;
    feedback.textContent = "";
    optionsDiv.innerHTML = "";

    exercise.options.forEach(option => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = formatNumber(option);

        button.onclick = () => {
            const isCorrect = Number(option) === Number(exercise.correct);

            document.querySelectorAll("#options button").forEach(btn => {
                btn.disabled = true;

                if (Number(btn.textContent) === Number(exercise.correct)) {
                    btn.classList.add("correct");
                }
            });

            if (!isCorrect) {
                button.classList.add("wrong");
            }

            feedback.textContent = isCorrect
                ? "ACCESO CONCEDIDO: respuesta correcta."
                : `ACCESO DENEGADO: la respuesta correcta era ${formatNumber(exercise.correct)}.`;

            onAnswer(isCorrect);
        };

        optionsDiv.appendChild(button);
    });

    drawGridAndTriangle(exercise);
}

function startAutomaticMode() {
    let round = 1;
    let score = 0;
    let answered = false;

    function loadQuestion() {
        answered = false;

        const level = getLevel(round);
        const exercise = generateExercise(level);

        document.getElementById("round").textContent = round;
        document.getElementById("level").textContent = level;
        document.getElementById("score").textContent = score;

        renderExercise(exercise, isCorrect => {
            if (answered) return;

            answered = true;

            if (isCorrect) {
                score++;
            }

            document.getElementById("score").textContent = score;
        });
    }

    const nextBtn = document.getElementById("nextBtn");

    if (nextBtn) {
        nextBtn.onclick = () => {
            round++;
            loadQuestion();
        };
    }

    loadQuestion();
}

function startModeratorMode() {
    const players = [];
    const questionsPerPlayer = 8;

    let currentPlayerIndex = 0;
    let currentQuestion = 1;
    let answered = false;

    const setup = document.getElementById("setup");
    const game = document.getElementById("game");
    const results = document.getElementById("results");
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const startGameBtn = document.getElementById("startGameBtn");
    const playerNameInput = document.getElementById("playerName");
    const nextBtn = document.getElementById("nextBtn");

    if (!setup || !game || !results) return;

    if (addPlayerBtn) {
        addPlayerBtn.onclick = () => {
            const name = playerNameInput.value.trim();

            if (!name) return;

            players.push({
                name,
                correct: 0,
                wrong: 0,
                points: 0,
                start: 0,
                end: 0
            });

            playerNameInput.value = "";
            renderPlayerList(players);
        };
    }

    if (playerNameInput) {
        playerNameInput.addEventListener("keydown", event => {
            if (event.key === "Enter" && addPlayerBtn) {
                addPlayerBtn.click();
            }
        });
    }

    if (startGameBtn) {
        startGameBtn.onclick = () => {
            if (players.length === 0) {
                alert("Añade al menos un participante.");
                return;
            }

            setup.classList.add("hidden");
            game.classList.remove("hidden");

            players[0].start = Date.now();

            loadModeratorQuestion();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (!answered) {
                alert("Primero hay que responder.");
                return;
            }

            if (currentQuestion < questionsPerPlayer) {
                currentQuestion++;
                loadModeratorQuestion();
            } else {
                players[currentPlayerIndex].end = Date.now();
                currentPlayerIndex++;

                if (currentPlayerIndex >= players.length) {
                    finishModeratorGame();
                } else {
                    currentQuestion = 1;
                    players[currentPlayerIndex].start = Date.now();
                    loadModeratorQuestion();
                }
            }
        };
    }

    function loadModeratorQuestion() {
        answered = false;

        const player = players[currentPlayerIndex];
        const globalRound = currentQuestion + currentPlayerIndex * questionsPerPlayer;
        const level = getLevel(globalRound);
        const exercise = generateExercise(level);
        const currentPlayer = document.getElementById("currentPlayer");

        if (currentPlayer) {
            currentPlayer.textContent =
                `${player.name} — pregunta ${currentQuestion}/${questionsPerPlayer}`;
        }

        renderExercise(exercise, isCorrect => {
            if (answered) return;

            answered = true;

            if (isCorrect) {
                player.correct++;
                player.points += 100 + level * 10;
            } else {
                player.wrong++;
            }
        });
    }

    function finishModeratorGame() {
        game.classList.add("hidden");
        results.classList.remove("hidden");

        const sorted = [...players].sort(comparePlayers);

        sorted.forEach(player => saveHistoricScore(player));

        renderPodium(sorted);
        renderRanking(sorted);
    }
}

function comparePlayers(a, b) {
    if (b.points !== a.points) return b.points - a.points;

    const totalA = a.correct + a.wrong;
    const totalB = b.correct + b.wrong;

    const performanceA = totalA === 0 ? 0 : a.correct / totalA;
    const performanceB = totalB === 0 ? 0 : b.correct / totalB;

    if (performanceB !== performanceA) return performanceB - performanceA;

    return (a.end - a.start) - (b.end - b.start);
}

function renderPlayerList(players) {
    const list = document.getElementById("playerList");
    if (!list) return;

    list.innerHTML = "";

    players.forEach((player, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${player.name}`;
        list.appendChild(li);
    });
}

function renderPodium(players) {
    const podium = document.getElementById("podium");
    if (!podium) return;

    podium.innerHTML = "";

    const medals = ["🥇", "🥈", "🥉"];

    players.slice(0, 3).forEach((player, index) => {
        const card = document.createElement("div");
        card.className = "podium-card";

        card.innerHTML = `
            <h3>${medals[index]} ${index + 1}.º</h3>
            <strong>${player.name}</strong>
            <p>${player.points} puntos</p>
        `;

        podium.appendChild(card);
    });
}

function renderRanking(players) {
    const ranking = document.getElementById("ranking");
    if (!ranking) return;

    ranking.innerHTML = "";

    players.forEach((player, index) => {
        const total = player.correct + player.wrong;
        const performance = total === 0 ? 0 : Math.round((player.correct / total) * 100);
        const seconds = Math.max(0, Math.round((player.end - player.start) / 1000));

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.correct}</td>
            <td>${player.wrong}</td>
            <td>${player.points}</td>
            <td>${performance}%</td>
            <td>${seconds}s</td>
        `;

        ranking.appendChild(row);
    });
}

function saveHistoricScore(player) {
    const ranking = getHistoricRanking();

    const total = player.correct + player.wrong;
    const performance = total === 0 ? 0 : Math.round((player.correct / total) * 100);
    const seconds = Math.max(0, Math.round((player.end - player.start) / 1000));

    ranking.push({
        name: player.name,
        correct: player.correct,
        wrong: player.wrong,
        points: player.points,
        performance,
        seconds,
        date: new Date().toLocaleDateString("es-ES")
    });

    ranking.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.performance !== a.performance) return b.performance - a.performance;
        return a.seconds - b.seconds;
    });

    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, 19)));
}

function getHistoricRanking() {
    try {
        return JSON.parse(localStorage.getItem(RANKING_KEY) || "[]");
    } catch (error) {
        return [];
    }
}

function showRanking() {
    const modal = document.getElementById("rankingModal");
    const tbody = document.getElementById("historicRanking");

    if (!modal || !tbody) return;

    const ranking = getHistoricRanking();

    tbody.innerHTML = "";

    if (ranking.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Todavía no hay puntuaciones registradas.</td>
            </tr>
        `;
    } else {
        ranking.forEach((player, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.points}</td>
                <td>${player.performance}%</td>
                <td>${player.seconds}s</td>
                <td>${player.date}</td>
            `;

            tbody.appendChild(row);
        });
    }

    modal.classList.remove("hidden");
    modal.style.display = "flex";
}

function closeRanking() {
    const modal = document.getElementById("rankingModal");

    if (!modal) return;

    modal.classList.add("hidden");
    modal.style.display = "none";
}

window.closeRanking = closeRanking;
window.showRanking = showRanking;
window.startAutomaticMode = startAutomaticMode;
window.startModeratorMode = startModeratorMode;

document.addEventListener("DOMContentLoaded", () => {
    const rankingButtons = document.querySelectorAll("#rankingBtn, .rankingBtn");

    rankingButtons.forEach(button => {
        button.addEventListener("click", showRanking);
    });

    const modal = document.getElementById("rankingModal");

    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeRanking();
            }
        });
    }
});
