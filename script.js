// FORCA DOS POEMAS - Game Logic
(() => {
    "use strict";
   

    if (!window.POEMS || !window.POEMS.length) {
        console.error("POEMS não encontrado. Verifique se poems.js está carregado antes de script.js.");
        return;
    }

    const POEMS = window.POEMS;
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÇ".split("");
    const LS_KEY = "forca_poemas_leaderboard_v1";
    const ATTEMPTS_BY_LEVEL = { easy: 8, medium: 6, hard: 5 };
    const SCORE_BASE = { easy: 50, medium: 100, hard: 200 };

    const BODY_PARTS = [
        '<circle cx="180" cy="68" r="18" />',
        '<line x1="180" y1="86" x2="180" y2="160" />',
        '<line x1="180" y1="105" x2="150" y2="135" />',
        '<line x1="180" y1="105" x2="210" y2="135" />',
        '<line x1="180" y1="160" x2="155" y2="200" />',
        '<line x1="180" y1="160" x2="205" y2="200" />',
    ];

    const state = {
        difficulty: "medium",
        poem: null,
        guessedLetters: new Set(),
        wrongLetters: new Set(),
        status: "playing",
        scores: [],
        lastSavedPoemId: null,
        gameId: 0
    };
    
    let modalTimer = null;

    // ---------- HELPERS ----------
    function stripAccents(str) {
        return str.split("").map((ch) => {
            if (ch.toUpperCase() === "Ç") return ch;
            return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }).join("");
    }

    function isLetter(ch) {
        return /[A-ZÇ]/.test(ch.toUpperCase());
    }

    function getMaxAttempts() {
        return ATTEMPTS_BY_LEVEL[state.difficulty];
    }

    function pickRandomPoem() {
        const pool = POEMS.filter((p) => p.difficulty === state.difficulty);
        let candidates = pool;
        if (state.poem && pool.length > 1) {
            candidates = pool.filter((p) => p.id !== state.poem.id);
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function uniqueLettersOf(poem) {
        const set = new Set();
        const norm = stripAccents(poem.title).toUpperCase();
        for (const ch of norm) {
            if (isLetter(ch)) set.add(ch);
        }
        return set;
    }

    function computeScore() {
        const base = SCORE_BASE[state.difficulty];
        const remaining = getMaxAttempts() - state.wrongLetters.size;
        return base + remaining * 10;
    }

    // ---------- LEADERBOARD ----------
    function loadScores() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            state.scores = raw ? JSON.parse(raw) : [];
        } catch {
            state.scores = [];
        }
    }

    function saveScores() {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(state.scores));
        } catch {}
    }

    function addScore(playerName) {
        const entry = {
            player_name: playerName,
            score: computeScore(),
            difficulty: state.difficulty,
            poem_title: state.poem.title,
            timestamp: new Date().toISOString(),
        };
        state.scores.push(entry);
        state.scores.sort((a, b) => b.score - a.score);
        state.scores = state.scores.slice(0, 20);
        saveScores();
        renderLeaderboard();
    }

    // ---------- RENDER ----------
    function renderHangman() {
        const parts = Math.min(state.wrongLetters.size, 6);
        document.getElementById("bodyParts").innerHTML = BODY_PARTS.slice(0, parts).join("");
    }

    function renderStats() {
        const max = getMaxAttempts();
        const wrong = state.wrongLetters.size;
        document.getElementById("attemptsRemaining").textContent = Math.max(0, max - wrong);
        document.getElementById("attemptsTotal").textContent = max;
        document.getElementById("wrongCount").textContent = wrong;
    }

    function renderWord() {
        const container = document.getElementById("wordDisplay");
        container.innerHTML = "";
        if (!state.poem) return;

        const title = state.poem.title;
        const normalized = stripAccents(title).toUpperCase();

        for (let i = 0; i < title.length; i++) {
            const ch = title[i];
            const normCh = normalized[i];
            const div = document.createElement("div");

            if (ch === " ") {
                div.className = "letter letter--space";
            } else if (!isLetter(normCh)) {
                div.className = "letter letter--punct letter--revealed";
                div.innerHTML = `<span>${ch}</span>`;
            } else {
                const revealed = state.guessedLetters.has(normCh);
                const lost = state.status === "lost";
                div.className = "letter";
                if (revealed) {
                    div.classList.add("letter--revealed");
                    div.innerHTML = `<span>${ch}</span>`;
                } else if (lost) {
                    div.classList.add("letter--revealed");
                    div.innerHTML = `<span style="color:#D32F2F">${ch}</span>`;
                }
            }
            div.setAttribute("data-testid", `word-letter-${i}`);
            container.appendChild(div);
        }
    }

    function renderHint() {
        if (!state.poem) return;
        document.getElementById("hintAuthor").textContent = state.poem.author;
        document.getElementById("hintExcerpt").textContent = `"${state.poem.excerpt}"`;
    }

    function renderKeyboard() {
        const kb = document.getElementById("keyboard");
        kb.innerHTML = "";
        const titleLetters = state.poem ? uniqueLettersOf(state.poem) : new Set();

        ALPHABET.forEach((letter) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = letter;
            btn.className = "key";
            btn.dataset.letter = letter;
            btn.setAttribute("data-testid", `keyboard-button-${letter}`);
            btn.setAttribute("aria-label", `Letra ${letter}`);

            const used = state.guessedLetters.has(letter) || state.wrongLetters.has(letter);

            if (used) {
                btn.classList.add(titleLetters.has(letter) ? "key--correct" : "key--wrong");
                btn.disabled = true;
            }

            if (state.status !== "playing") btn.disabled = true;

            btn.addEventListener("click", () => onGuess(letter));
            kb.appendChild(btn);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function renderLeaderboard() {
        const list = document.getElementById("leaderboardList");
        const empty = document.getElementById("leaderboardEmpty");
        list.innerHTML = "";

        if (state.scores.length === 0) {
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        state.scores.slice(0, 10).forEach((s, idx) => {
            const li = document.createElement("li");
            li.className = "leaderboard__entry";
            li.setAttribute("data-testid", `leaderboard-entry-${idx}`);
            const diffLabel = s.difficulty === "easy" ? "Fácil" : s.difficulty === "medium" ? "Médio" : "Difícil";
            li.innerHTML = `
                <div class="leaderboard__entry-left">
                    <span class="leaderboard__rank">${String(idx + 1).padStart(2, "0")}</span>
                    <span class="leaderboard__name">${escapeHtml(s.player_name)}</span>
                    <span class="leaderboard__diff">${diffLabel}</span>
                </div>
                <span class="leaderboard__score">${s.score}</span>
            `;
            list.appendChild(li);
        });
    }

    function renderAll() {
        renderHangman();
        renderStats();
        renderWord();
        renderHint();
        renderKeyboard();
    }

    // ---------- GAME LOGIC ----------
   function startNewGame() {
    alert("Novo poema clicado");

    if (modalTimer) {
        clearTimeout(modalTimer);
        modalTimer = null;
    }

    hideModal();

    state.poem = pickRandomPoem();
    state.guessedLetters = new Set();
    state.wrongLetters = new Set();
    state.status = "playing";
    state.lastSavedPoemId = null;

    renderAll();
}

    function onGuess(letter) {
    if (state.status !== "playing") return;
    if (state.guessedLetters.has(letter) || state.wrongLetters.has(letter)) return;

    const titleLetters = uniqueLettersOf(state.poem);

    if (titleLetters.has(letter)) {
        state.guessedLetters.add(letter);
    } else {
        state.wrongLetters.add(letter);
    }

    renderAll();
    checkWinLose();
}

function checkWinLose() {
    const gameIdAtual = state.gameId;
    const titleLetters = uniqueLettersOf(state.poem);
    const allFound = [...titleLetters].every((ch) => state.guessedLetters.has(ch));

    if (allFound) {
        state.status = "won";
        renderKeyboard();

        modalTimer = setTimeout(() => {
            if (state.gameId === gameIdAtual && state.status === "won") {
                showModal(true);
            }
        }, 500);

        return;
    }

    if (state.wrongLetters.size >= getMaxAttempts()) {
        state.status = "lost";
        renderKeyboard();
        renderWord();

        modalTimer = setTimeout(() => {
            if (state.gameId === gameIdAtual && state.status === "lost") {
                showModal(false);
            }
        }, 600);
    }
}

    // ---------- MODAL ----------
    function showModal(won) {
        const modal = document.getElementById("modal");
        modal.hidden = false;

        document.getElementById("modalResult").textContent = won ? "Vitória" : "Derrota";
        document.getElementById("modalTitle").textContent = won ? "Letras encontradas." : "A forca venceu.";
        document.getElementById("modalPoemTitle").textContent = state.poem.title;
        document.getElementById("modalPoemAuthor").textContent = state.poem.author;
        document.getElementById("modalExcerpt").textContent = `"${state.poem.excerpt}"`;

        const scoreRow = document.getElementById("modalScoreRow");
        const saveRow = document.getElementById("modalSaveRow");
        const savedMsg = document.getElementById("modalSavedMsg");

        if (won) {
            scoreRow.style.display = "flex";
            saveRow.style.display = "flex";
            savedMsg.hidden = true;
            document.getElementById("modalScore").textContent = computeScore();
            document.getElementById("modalNameInput").value = "";
            document.getElementById("modalNameInput").focus();
        } else {
            scoreRow.style.display = "none";
            saveRow.style.display = "none";
            savedMsg.hidden = true;
        }
    }

    function hideModal() {
        document.getElementById("modal").hidden = true;
    }

    function onSaveScore() {
        const input = document.getElementById("modalNameInput");
        const name = (input.value || "").trim() || "Anônimo";
        if (state.lastSavedPoemId === state.poem.id) return;
        state.lastSavedPoemId = state.poem.id;
        addScore(name);
        document.getElementById("modalSaveRow").style.display = "none";
        document.getElementById("modalSavedMsg").hidden = false;
    }

    // ---------- DIFFICULTY ----------
    function onDifficultyChange(level) {
        if (level === state.difficulty) return;
        state.difficulty = level;
        document.querySelectorAll(".difficulty__btn").forEach((btn) =>
            btn.classList.toggle("is-active", btn.dataset.level === level)
        );
        startNewGame();
        
    }

    // ---------- KEYBOARD ----------
    function onKeyDown(e) {
        if (!document.getElementById("modal").hidden) {
            if (e.key === "Enter" && document.activeElement?.id === "modalNameInput") {
                onSaveScore();
            }
            return;
        }
        const key = e.key.toUpperCase();
        const normalized = stripAccents(key);
        if (/^[A-ZÇ]$/.test(normalized)) {
            onGuess(normalized);
        }
    }

    // ---------- INIT ----------
    function init() {
        loadScores();
        renderLeaderboard();

        document.querySelectorAll(".difficulty__btn").forEach((btn) => {
            btn.addEventListener("click", () => onDifficultyChange(btn.dataset.level));
        });

        document.getElementById("restartBtn").addEventListener("click", startNewGame);
        document.getElementById("modalCloseBtn").addEventListener("click", startNewGame);
        document.getElementById("modalPlayAgainBtn").addEventListener("click", startNewGame);
        document.getElementById("modalSaveBtn").addEventListener("click", onSaveScore);

        window.addEventListener("keydown", onKeyDown);

        startNewGame();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
        document.getElementById("restartBtn").addEventListener("click", () => {
    location.reload();
});
    }
})();

