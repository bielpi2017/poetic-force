const POEMS = [
  {
    title: "MORTE E VIDA SEVERINA",
    author: "João Cabral de Melo Neto",
    hint: "O Cão Sem Plumas · Tecendo a Manhã · A Educação pela Pedra",
    verse: "— Somos muitos Severinos\niguais em tudo na vida:\nna mesma cabeça grande\nque a custo é que se equilibra..."
  },
  {
    title: "CANÇÃO DO EXILIO",
    author: "Gonçalves Dias",
    hint: "I-Juca Pirama · Os Timbiras · Marabá",
    verse: "Minha terra tem palmeiras\nonde canta o sabiá;\nas aves que aqui gorjeiam\nnão gorjeiam como lá."
  },
  {
    title: "O NAVIO NEGREIRO",
    author: "Castro Alves",
    hint: "Vozes d'África · Espumas Flutuantes · Gonzaga",
    verse: "Existe um povo que a bandeira empresta\npara cobrir tanta infâmia e cobardia!\ne deixa-a transformar-se nessa festa\nem manto impuro de bacante fria!"
  },
  {
    title: "JOSE",
    author: "Carlos Drummond de Andrade",
    hint: "No Meio do Caminho · A Rosa do Povo · Sentimento do Mundo",
    verse: "E agora, José?\nA festa acabou,\na luz apagou,\no povo sumiu..."
  },
  {
    title: "AUTOPSICOGRAFIA",
    author: "Fernando Pessoa",
    hint: "Mensagem · Tabacaria · Ode Marítima",
    verse: "O poeta é um fingidor.\nFinge tão completamente\nque chega a fingir que é dor\na dor que deveras sente."
  },
  {
    title: "SONETO DE FIDELIDADE",
    author: "Vinicius de Moraes",
    hint: "A Rosa de Hiroshima · Receita de Mulher · Para Viver um Grande Amor",
    verse: "De tudo ao meu amor serei atento\nAntes, e com tal zelo, e sempre, e tanto\nQue mesmo em face do maior encanto\nDele se encante mais meu pensamento."
  },
  {
    title: "THE ROAD NOT TAKEN",
    author: "Robert Frost",
    hint: "Stopping by Woods on a Snowy Evening · Mending Wall · Fire and Ice",
    verse: "Two roads diverged in a wood, and I—\nI took the one less traveled by,\nand that has made all the difference."
  },
  {
    title: "IF",
    author: "Rudyard Kipling",
    hint: "Gunga Din · Mandalay · The Ballad of East and West",
    verse: "If you can keep your head when all about you\nAre losing theirs and blaming it on you...\nYou'll be a Man, my son!"
  },
  {
    title: "LIBERTAD",
    author: "Pablo Neruda",
    hint: "Vinte Poemas de Amor · Canto Geral · Odes Elementais",
    verse: "Puedo escribir los versos más tristes esta noche.\nEscribo: la noche está estrellada,\ny tiritan, azules, los astros, a lo lejos."
  },
  {
    title: "A ROSA DE HIROSHIMA",
    author: "Vinicius de Moraes",
    hint: "Soneto de Fidelidade · Receita de Mulher · Soneto do Amor Total",
    verse: "Pensem nas crianças\nmudas telepáticas\nPensem nas meninas\ncegas inexatas\nPensem nas mulheres\nrotas alteradas..."
  },
  {
    title: "NO MEIO DO CAMINHO",
    author: "Carlos Drummond de Andrade",
    hint: "José · A Rosa do Povo · Poema de Sete Faces",
    verse: "No meio do caminho tinha uma pedra\ntinha uma pedra no meio do caminho\ntinha uma pedra\nno meio do caminho tinha uma pedra."
  },
  {
    title: "O OPERARIO EM CONSTRUCAO",
    author: "Vinicius de Moraes",
    hint: "A Rosa de Hiroshima · Soneto de Fidelidade · Garota de Ipanema",
    verse: "Era ele que erguia casas\nonde antes só havia chão.\nComo um pássaro sem asas\nele subia com as mãos."
  },
  {
    title: "NASCE UM POEMA",
    author: "Adélia Prado",
    hint: "Bagagem · Terra de Santa Cruz · O Coração Disparado",
    verse: "Não sou de ninguém\nnem a ninguém pertencerei.\nMinha alma sou eu mesma\ne meu corpo é a minha história."
  },
  {
    title: "O CORVO",
    author: "Edgar Allan Poe",
    hint: "Annabel Lee · Eldorado · The Bells",
    verse: "Once upon a midnight dreary, while I pondered, weak and weary,\nOver many a quaint and curious volume of forgotten lore—"
  },
  {
    title: "TABACARIA",
    author: "Fernando Pessoa",
    hint: "Autopsicografia · Mensagem · Ode Marítima",
    verse: "Não sou nada.\nNunca serei nada.\nNão posso querer ser nada.\nÀ parte isso, tenho em mim todos os sonhos do mundo."
  },
];

const PARTS = ['h-head', 'h-body', 'h-larm', 'h-rarm', 'h-lleg', 'h-rleg'];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

let current, guessed, errors, over, round = 0;

function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function newGame() {
  current = POEMS[Math.floor(Math.random() * POEMS.length)];
  guessed = new Set();
  errors = 0;
  over = false;
  round++;

  document.getElementById('round-label').textContent = 'rodada ' + round;
  document.getElementById('info-author').textContent = current.author;
  document.getElementById('info-hint').textContent = current.hint;
  document.getElementById('status-bar').className = 'status-bar';
  document.getElementById('status-bar').innerHTML = '';
  document.getElementById('poem-full').className = 'poem-full';
  document.getElementById('poem-full').textContent = '';

  PARTS.forEach(id => document.getElementById(id).setAttribute('visibility', 'hidden'));
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('filled'));

  renderWord();
  renderKeys();
}

function renderWord() {
  const row = document.getElementById('word-row');
  row.innerHTML = '';
  const title = norm(current.title);

  for (let i = 0; i < title.length; i++) {
    const ch = title[i];

    if (ch === ' ') {
      const sp = document.createElement('div');
      sp.style.cssText = 'width:16px';
      row.appendChild(sp);
      continue;
    }

    const cell = document.createElement('div');
    cell.className = 'char-cell';

    const letter = document.createElement('div');
    letter.className = 'char-letter';
    if (guessed.has(ch)) {
      letter.textContent = ch;
      letter.classList.add('reveal');
    }

    const line = document.createElement('div');
    line.className = 'char-line' + (guessed.has(ch) ? ' lit' : '');

    cell.appendChild(letter);
    cell.appendChild(line);
    row.appendChild(cell);
  }
}

function renderKeys() {
  const kb = document.getElementById('keyboard');
  kb.innerHTML = '';
  const letters = norm(current.title).replace(/ /g, '');

  ALPHA.split('').forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.textContent = ch;

    if (guessed.has(ch)) {
      btn.disabled = true;
      btn.classList.add(letters.includes(ch) ? 'hit' : 'miss');
    }

    btn.addEventListener('click', () => guess(ch));
    kb.appendChild(btn);
  });
}

function guess(ch) {
  if (over || guessed.has(ch)) return;
  guessed.add(ch);

  const letters = norm(current.title).replace(/ /g, '');

  if (!letters.includes(ch)) {
    errors++;
    document.getElementById(PARTS[errors - 1]).setAttribute('visibility', 'visible');
    document.querySelectorAll('.dot')[errors - 1].classList.add('filled');
  }

  renderWord();
  renderKeys();
  checkEnd(letters);
}

function checkEnd(letters) {
  const unique = [...new Set(letters.split(''))];
  const won = unique.every(c => guessed.has(c));
  const lost = errors >= 6;
  const bar = document.getElementById('status-bar');

  if (won) {
    over = true;
    bar.className = 'status-bar win';
    bar.innerHTML = '✦ Você acertou! <span class="reveal-title">' + current.title + '</span>';
    showVerse();
  } else if (lost) {
    over = true;
    bar.className = 'status-bar lose';
    bar.innerHTML = '✦ Fim de jogo — era: <span class="reveal-title">' + current.title + '</span>';
    [...norm(current.title)].forEach(c => { if (c !== ' ') guessed.add(c); });
    renderWord();
    showVerse();
  }
}

function showVerse() {
  const el = document.getElementById('poem-full');
  el.textContent = current.verse;
  el.classList.add('show');
}

function revealHint() {
  if (!over) {
    errors = Math.min(errors + 1, 6);
    document.getElementById(PARTS[errors - 1]).setAttribute('visibility', 'visible');
    document.querySelectorAll('.dot')[errors - 1].classList.add('filled');
    renderKeys();
    checkEnd(norm(current.title).replace(/ /g, ''));
  }
  showVerse();
}

document.addEventListener('keydown', e => {
  const ch = e.key.toUpperCase();
  if (ALPHA.includes(ch) && !over) guess(ch);
});

newGame();
