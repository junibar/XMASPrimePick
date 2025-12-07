document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("g4-grid");
  const flipCountEl = document.getElementById("g4-flipCount");
  const seqEl = document.getElementById("g4-seq");
  const candidatesEl = document.getElementById("g4-candidates");
  const finalEl = document.getElementById("g4-final");
  const calcBtn = document.getElementById("g4-calcBtn");

  const deck = generateDeck();
  shuffle(deck);

  let flipCount = 0;
  const flippedSeq = []; // { type:'right'|'number', value: '스카우터'|1|... }
  let gameEnded = false;
  let chosenResult = null;

  // 5x5 그리드 렌더
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    cell.className = "card-cell";
    cell.dataset.index = i.toString();
    cell.textContent = "?";
    cell.addEventListener("click", () => onCellClick(i, cell));
    gridEl.appendChild(cell);
  }

  calcBtn.addEventListener("click", () => {
    if (!gameEnded) {
      finalEl.textContent = "먼저 7장을 모두 뒤집어 주세요.";
      return;
    }
    computeAndRenderCandidates();
  });

  function onCellClick(index, cellEl) {
    if (gameEnded) return;
    if (flipCount >= 7) return;
    if (cellEl.classList.contains("revealed-right") ||
        cellEl.classList.contains("revealed-number")) return;

    const card = deck[index];
    flipCount++;
    flipCountEl.textContent = flipCount.toString();

    if (card.type === "right") {
      cellEl.classList.add("revealed-right");
      cellEl.textContent = card.value;
    } else {
      cellEl.classList.add("revealed-number");
      cellEl.textContent = card.value.toString();
    }

    flippedSeq.push({ type: card.type, value: card.value });
    renderSequence();

    if (flipCount === 7) {
      gameEnded = true;
      disableRemainingCells();
      finalEl.textContent = "7장을 모두 뒤집었습니다. 가능한 권리를 계산해 보세요.";
    }
  }

  function disableRemainingCells() {
    const cells = gridEl.querySelectorAll(".card-cell");
    cells.forEach(c => {
      if (!c.classList.contains("revealed-right") &&
          !c.classList.contains("revealed-number")) {
        c.classList.add("disabled");
      }
    });
  }

  function renderSequence() {
    seqEl.innerHTML = "";
    flippedSeq.forEach((c, i) => {
      const span = document.createElement("span");
      span.textContent = (i > 0 ? " → " : "") +
        (c.type === "right" ? c.value : c.value.toString());
      seqEl.appendChild(span);
    });
  }

  function computeAndRenderCandidates() {
    const pairs = []; // [ [rightName, number], ... ]
    for (let i = 0; i < flippedSeq.length - 1; i++) {
      const a = flippedSeq[i];
      const b = flippedSeq[i + 1];
      if (a.type === "right" && b.type === "number") {
        pairs.push([a.value, b.value]);
      } else if (a.type === "number" && b.type === "right") {
        pairs.push([b.value, a.value]);
      }
    }

    if (pairs.length === 0) {
      candidatesEl.textContent =
        "인접한 숫자–권리 조합이 없습니다. 이번 게임에서는 권리를 얻을 수 없습니다.";
      return;
    }

    const best = {}; // { "스카우터": 3, ... }
    pairs.forEach(([right, num]) => {
      if (!(right in best) || num > best[right]) {
        best[right] = num;
      }
    });

    const finalCandidates = Object.entries(best).map(([right, num]) => ({
      right,
      num
    }));

    candidatesEl.innerHTML = "";
    finalCandidates.forEach(c => {
      const chip = document.createElement("div");
      chip.className = "candidate-chip";
      chip.textContent = `${c.right} ${c.num}`;
      chip.addEventListener("click", () => {
        chosenResult = c;
        Array.from(candidatesEl.children).forEach(ch => {
          ch.classList.remove("selected");
        });
        chip.classList.add("selected");
        finalEl.innerHTML =
          `<strong>최종 선택 권리</strong><br>${c.right} ${c.num}를(을) 획득했습니다.`;
      });
      candidatesEl.appendChild(chip);
    });

    if (finalCandidates.length === 0) {
      candidatesEl.textContent =
        "후보가 정리되는 과정에서 남은 조합이 없습니다.";
    }
  }

  function generateDeck() {
    const deck = [];
    // 권리 카드: 아이콘 2, 드래프트 3, 자유 3,  트레이드 3, 스카우터 4 (총 15장)
    pushMany(deck, { type: "right", value: "아이콘 드래프트" }, 2);
    pushMany(deck, { type: "right", value: "드래프트" }, 3);
    pushMany(deck, { type: "right", value: "자유 트레이드" }, 3);
    pushMany(deck, { type: "right", value: "트레이드" }, 3);
    pushMany(deck, { type: "right", value: "스카우터" }, 4);

    // 숫자 카드: 1×4, 2×3, 3×2, 4×1 (총 10장)
    pushMany(deck, { type: "number", value: 1 }, 4);
    pushMany(deck, { type: "number", value: 2 }, 3);
    pushMany(deck, { type: "number", value: 3 }, 2);
    pushMany(deck, { type: "number", value: 4 }, 1);

    return deck;
  }

  function pushMany(arr, obj, count) {
    for (let i = 0; i < count; i++) {
      arr.push({ ...obj });
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
});

