document.addEventListener("DOMContentLoaded", () => {
  // 핀볼 관련 엘리먼트
  const pinballBoardEl = document.getElementById("g6-pinballBoard");
  const startPinballBtn = document.getElementById("g6-startPinball");
  const tiltPinballBtn = document.getElementById("g6-tiltPinball");
  const pinballStatusEl = document.getElementById("g6-pinballStatus");

  // 야바위 관련
  const shellRowEl = document.getElementById("g6-shellRow");
  const shellCups = shellRowEl.querySelectorAll(".shell-cup");
  const startShellBtn = document.getElementById("g6-startShell");
  const extraShuffleBtn = document.getElementById("g6-extraShuffle");
  const shellStatusEl = document.getElementById("g6-shellStatus");

  // 카드 뽑기 관련
  const cardRowEl = document.getElementById("g6-cardRow");
  const cardElems = cardRowEl.querySelectorAll(".draft-card");
  const finalEl = document.getElementById("g6-final");
  const logEl = document.getElementById("g6-log");

  // 게임 단계: "pinball" | "shell" | "cards" | "done"
  let phase = "pinball";

  // 핀볼 상수
  const PINBALL_ROWS = 8;   // 8칸
  const PINBALL_COLS = 10;

  // 핀볼 상태
  let lineTypes = []; // 길이 10, 값: "D" | "G" | "S" | "B"
  let pinballInProgress = false;
  let shakeUsed = false;
  let pinballTargetIndex = null;
  let pinballResultLine = null;
  let ballRow = -1;
  let ballCol = 0;
  let pinballTimer = null;

  // 야바위 상태
  let currentPackArray = []; // 예: ["SS","S","S","A","A"]
  let cupPacks = []; // 실제 컵 안의 순서
  let shellInitialReady = false;
  let initialShuffleDone = false;
  let extraShuffleUsed = false;
  let shellChoiceMade = false;
  let chosenPackTier = null;

  // 카드 상태
  let cards = []; // { tier: number, ovr: number }
  let cardChoiceMade = false;
  let chosenCardIndex = null;

  // 라인 → 팩 구성 (각 컵 아래에 들어갈 팩 타입)
  const PACK_CONFIG_BY_LINE = {
    D: ["SS", "S", "S", "A", "A"],
    G: ["S", "S", "A", "A", "B"],
    S: ["S", "A", "A", "B", "B"],
    B: ["A", "A", "B", "B", "C"],
  };

  // 티어별 오버롤 후보
  const TIER_OVR = {
    1: [89],
    2: [88, 87],
    3: [86, 85, 84],
  };

  // 팩별 티어 규칙 (허용 티어, 가중치, 최소 쿼터)
  const PACK_TIER_RULES = {
    SS: {
      allowed: [1, 2],
      weights: [0.7, 0.3],
      min: { 1: 2 },           // 1티어 최소 2장
    },
    S: {
      allowed: [1, 2, 3],
      weights: [0.5, 0.3, 0.2],
      min: { 1: 1, 2: 1 },     // 1티어 1장, 2티어 1장 이상
    },
    A: {
      allowed: [1, 2, 3],
      weights: [0.3, 0.3, 0.4],
      min: { 2: 1, 3: 1 },     // 2티어 1장, 3티어 1장 이상
    },
    B: {
      allowed: [2, 3],
      weights: [0.5, 0.5],
      min: { 2: 1, 3: 1 },     // 2티어 1장, 3티어 1장 이상
    },
    C: {
      allowed: [2, 3],
      weights: [0.3, 0.7],
      min: { 3: 2 },           // 3티어 최소 2장
    },
  };

  // 라인 라벨
  const LINE_LABEL = {
    D: "다이아",
    G: "골드",
    S: "실버",
    B: "브론즈",
  };

  // ---------- 초기 세팅 ----------
  buildPinballBoard();
  resetShellUI();
  resetCardUI();

  // ---------- 핀볼 보드 생성 ----------

  function buildPinballBoard() {
    pinballBoardEl.innerHTML = "";

    // 위쪽: 공이 이동하는 격자
    const grid = document.createElement("div");
    grid.className = "pinball-grid";
    grid.id = "g6-pinballGrid";

    for (let r = 0; r < PINBALL_ROWS; r++) {
      for (let c = 0; c < PINBALL_COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "pinball-cell";
        cell.dataset.row = r.toString();
        cell.dataset.col = c.toString();
        grid.appendChild(cell);
      }
    }

    // 아래쪽: 10개 슬롯
    const slotsRow = document.createElement("div");
    slotsRow.className = "pinball-slots";

    for (let c = 0; c < PINBALL_COLS; c++) {
      const slot = document.createElement("div");
      slot.className = "pinball-slot";
      slot.dataset.index = c.toString();

      const label = document.createElement("div");
      label.className = "pinball-line-label";
      label.textContent = (c + 1).toString();

      slot.appendChild(label);
      slotsRow.appendChild(slot);
    }

    pinballBoardEl.appendChild(grid);
    pinballBoardEl.appendChild(slotsRow);
  }

  // ---------- 핀볼 로직 ----------

  startPinballBtn.addEventListener("click", () => {
    if (phase !== "pinball") return;
    if (pinballInProgress) return;

    // 라인 타입 랜덤 배치: D1, G2, S3, B4
    const baseLines = ["D", "G","G", "S","S","S", "B","B","B","B"];
    lineTypes = shuffle([...baseLines]);

    // 슬롯 라벨 업데이트
    const slots = pinballBoardEl.querySelectorAll(".pinball-slot");
    slots.forEach((slot, i) => {
      slot.classList.remove("pinball-hit");
      const label = slot.querySelector(".pinball-line-label");
      label.textContent = `${i + 1}`;
      label.dataset.line = lineTypes[i];
      label.className = "pinball-line-label line-" + lineTypes[i];
    });

    // 공 위치 초기화
    clearInterval(pinballTimer);
    const cells = pinballBoardEl.querySelectorAll(".pinball-cell");
    cells.forEach(cell => cell.classList.remove("ball"));

    ballRow = -1;
    ballCol = getRandomInt(0, PINBALL_COLS - 1);

    pinballInProgress = true;
    shakeUsed = false;
    pinballTargetIndex = null;
    pinballResultLine = null;

    pinballStatusEl.textContent =
      "핀볼 진행 중... '흔들기'를 한 번 사용해 라인 배치를 다시 섞을 수 있습니다.";

    phase = "pinball";
    shellInitialReady = false;
    initialShuffleDone = false;
    extraShuffleUsed = false;
    extraShuffleBtn.disabled = true;
    startShellBtn.disabled = true;
    shellStatusEl.textContent = "핀볼이 끝나면 야바위 단계로 넘어갑니다.";
    finalEl.innerHTML =
      "핀볼 → 야바위 → 카드 뽑기 순서로 진행하면, 최종 보상이 여기에 표시됩니다.";
    logEl.innerHTML = "";
    resetShellUI();
    resetCardUI();

    // 공 이동 타이머 (0.28초 간격)
    pinballTimer = setInterval(() => {
      stepPinball();
    }, 280);
  });

  // '흔들기' 버튼: 공의 궤적이 아니라 라인 배치를 다시 섞기
  tiltPinballBtn.addEventListener("click", () => {
    if (!pinballInProgress) return;
    if (shakeUsed) return;
    shakeUsed = true;

    // 라인 타입 배열을 다시 셔플
    lineTypes = shuffle([...lineTypes]);

    const slots = pinballBoardEl.querySelectorAll(".pinball-slot");
    slots.forEach((slot, i) => {
      const label = slot.querySelector(".pinball-line-label");
      label.dataset.line = lineTypes[i];
      label.className = "pinball-line-label line-" + lineTypes[i];
    });

    pinballStatusEl.textContent =
      "흔들기! 라인 배치가 다시 섞였습니다.";
    appendLog("핀볼: '흔들기' 사용 → 라인 배치를 다시 섞음");
  });

  function stepPinball() {
    const cells = pinballBoardEl.querySelectorAll(".pinball-cell");
    cells.forEach(cell => cell.classList.remove("ball"));

    ballRow += 1;

    // 아래까지 도달하면 종료
    if (ballRow >= PINBALL_ROWS) {
      clearInterval(pinballTimer);
      pinballInProgress = false;
      finalizePinballFromBall();
      return;
    }

    // 기본 수평 이동 (좌/우/직진)
    let delta = 0;
    const r = Math.random();
    if (r < 0.33) delta = -1;
    else if (r > 0.66) delta = 1;

    ballCol = clamp(ballCol + delta, 0, PINBALL_COLS - 1);

    const cell = pinballBoardEl.querySelector(
      `.pinball-cell[data-row="${ballRow}"][data-col="${ballCol}"]`
    );
    if (cell) cell.classList.add("ball");
  }

  function finalizePinballFromBall() {
    const slots = pinballBoardEl.querySelectorAll(".pinball-slot");
    slots.forEach(s => s.classList.remove("pinball-hit"));

    pinballTargetIndex = ballCol;
    const slot = pinballBoardEl.querySelector(
      `.pinball-slot[data-index="${pinballTargetIndex}"]`
    );
    if (!slot) return;

    slot.classList.add("pinball-hit");
    const lineType = lineTypes[pinballTargetIndex];
    pinballResultLine = lineType;

    pinballStatusEl.textContent =
      `핀볼 결과: ${LINE_LABEL[lineType]} 라인에 도착했습니다.`;
    appendLog(
      `핀볼 결과 → ${LINE_LABEL[lineType]} 라인 (슬롯 ${pinballTargetIndex + 1}번)`
    );

    phase = "shell";
    setupShellForLine(lineType);
  }

  // ---------- 야바위 로직 ----------

  shellCups.forEach(cup => {
    cup.addEventListener("click", () => {
      if (phase !== "shell") return;
      if (!initialShuffleDone) return; // '야바~위' 전에는 선택 불가
      if (shellChoiceMade) return;
      if (!cupPacks || cupPacks.length !== 5) return;

      const idx = parseInt(cup.dataset.index, 10);
      handleShellChoice(idx);
    });
  });

  // '야바~위' 버튼: 인서트 + 기본 셔플 시작
  startShellBtn.addEventListener("click", () => {
    if (phase !== "shell") return;
    if (!shellInitialReady) return;
    if (initialShuffleDone) return;

    // 먼저 화면에서 팩 텍스트 제거
    shellCups.forEach(cup => {
      const packEl = cup.querySelector(".shell-pack");
      packEl.textContent = "";
    });

    // 카드팩 집어넣는 모션
    animatePackInsert();

    // 약간의 딜레이 후 실제 셔플
    setTimeout(() => {
      animateShellShuffle(true);
      initialShuffleDone = true;
      extraShuffleBtn.disabled = false;
      startShellBtn.disabled = true;

      shellStatusEl.textContent =
        "컵 하나를 선택해서 카드팩을 골라주세요. (추가 셔플 1회 가능)";
    }, 450);
  });

  extraShuffleBtn.addEventListener("click", () => {
    if (phase !== "shell") return;
    if (!initialShuffleDone) return;
    if (extraShuffleUsed) return;
    if (!cupPacks || cupPacks.length !== 5) return;

    extraShuffleUsed = true;
    extraShuffleBtn.disabled = true;
    shellStatusEl.textContent = "추가 셔플을 진행합니다...";
    appendLog("야바위: 추가 셔플 1회 사용");

    cupPacks = shuffle([...cupPacks]);
    animateShellShuffle(false);
  });

  function setupShellForLine(lineType) {
    currentPackArray = PACK_CONFIG_BY_LINE[lineType] || [];
    if (currentPackArray.length !== 5) {
      shellStatusEl.textContent = "야바위 설정에 오류가 있습니다.";
      return;
    }

    // 컵 안에 들어갈 팩 구성 (셔플된 상태로 기억)
    cupPacks = shuffle([...currentPackArray]);

    shellInitialReady = true;
    initialShuffleDone = false;
    extraShuffleUsed = false;
    extraShuffleBtn.disabled = true;
    startShellBtn.disabled = false;
    shellChoiceMade = false;
    chosenPackTier = null;

    resetShellUI();

    // ① 먼저 "어떤 팩들이 들어가는지"를 한 번 보여주기
    shellCups.forEach((cup, idx) => {
      const packEl = cup.querySelector(".shell-pack");
      const tier = cupPacks[idx];
      packEl.textContent = `${tier} 팩`;
    });

    shellStatusEl.textContent =
      `${LINE_LABEL[lineType]} 라인에서 나온 카드팩 구성입니다. ` +
      "'야바~위' 버튼을 눌러 컵 안으로 넣고 섞어주세요.";
  }

  function resetShellUI() {
    shellCups.forEach(cup => {
      cup.classList.remove("shell-open", "shell-dim", "shell-highlight", "inserting");
      const packEl = cup.querySelector(".shell-pack");
      packEl.textContent = "";
    });
  }

  function animatePackInsert() {
    shellCups.forEach((cup, index) => {
      setTimeout(() => {
        cup.classList.add("inserting");
        setTimeout(() => {
          cup.classList.remove("inserting");
        }, 350);
      }, index * 90);
    });
  }

  function animateShellShuffle(initial = false) {
    const swaps = initial ? 5 : 3; // 처음엔 5번, 추가 셔플엔 3번 정도
    let step = 0;

    function doOneSwap() {
      if (step >= swaps) return;

      let i = getRandomInt(0, shellCups.length - 1);
      let j = getRandomInt(0, shellCups.length - 1);
      if (j === i) j = (j + 1) % shellCups.length;

      const cupA = shellCups[i];
      const cupB = shellCups[j];

      const rectA = cupA.getBoundingClientRect();
      const rectB = cupB.getBoundingClientRect();
      const dxA = rectB.left - rectA.left;
      const dxB = rectA.left - rectB.left;

      cupA.style.transition = "transform 0.25s ease";
      cupB.style.transition = "transform 0.25s ease";

      cupA.style.transform = `translateX(${dxA}px)`;
      cupB.style.transform = `translateX(${dxB}px)`;

      setTimeout(() => {
        cupA.style.transition = "";
        cupB.style.transition = "";
        cupA.style.transform = "";
        cupB.style.transform = "";

        step += 1;
        setTimeout(doOneSwap, 80);
      }, 260);
    }

    doOneSwap();
  }

  function handleShellChoice(index) {
    shellChoiceMade = true;
    extraShuffleBtn.disabled = true;

    chosenPackTier = cupPacks[index];
    appendLog(`야바위 선택 → ${index + 1}번 컵에서 ${chosenPackTier} 팩 획득`);

    // 선택 컵 강조 + 팩 표시
    shellCups.forEach((cup, i) => {
      const packEl = cup.querySelector(".shell-pack");
      const tier = cupPacks[i];

      cup.classList.remove("shell-open", "shell-dim", "shell-highlight");

      if (i === index) {
        cup.classList.add("shell-open", "shell-highlight");
        packEl.textContent = `${tier} 팩`;
      } else {
        packEl.textContent = "";
      }
    });

    shellStatusEl.textContent =
      `${index + 1}번 컵에서 ${chosenPackTier} 팩을 획득했습니다!`;

    // 1초 뒤 나머지 컵들도 공개
    setTimeout(() => {
      shellCups.forEach((cup, i) => {
        const packEl = cup.querySelector(".shell-pack");
        const tier = cupPacks[i];
        if (i !== index) {
          cup.classList.add("shell-open", "shell-dim");
          packEl.textContent = `${tier} 팩`;
        }
      });

      // 카드 뽑기 단계로
      phase = "cards";
      setupCardsForPack(chosenPackTier);
    }, 1000);
  }

  // ---------- 카드 뽑기 로직 ----------

  cardElems.forEach(card => {
    card.addEventListener("click", () => {
      if (phase !== "cards") return;
      if (cardChoiceMade) return;
      const idx = parseInt(card.dataset.index, 10);
      handleCardChoice(idx);
    });
  });

  function resetCardUI() {
    cards = [];
    cardChoiceMade = false;
    chosenCardIndex = null;

    cardElems.forEach(card => {
      card.classList.remove("card-revealed", "card-chosen", "card-dim");
      const front = card.querySelector(".card-front");
      const back = card.querySelector(".card-back");
      front.textContent = "";
      back.textContent = "?";
    });
  }

  function setupCardsForPack(packTier) {
    resetCardUI();
    if (!packTier) {
      finalEl.innerHTML =
        "카드팩 정보에 오류가 있습니다. 페이지를 새로고침해 주세요.";
      return;
    }

    // 확률 + 쿼터 기반 티어 생성
    const tierList = generateTierListForPack(packTier, 5);

    cards = tierList.map(tier => {
      const candidates = TIER_OVR[tier] || [];
      const ovr =
        candidates.length > 0
          ? candidates[getRandomInt(0, candidates.length - 1)]
          : 84;
      return { tier, ovr };
    });

    appendLog(`카드 뽑기 → ${packTier} 팩에서 카드 5장이 준비되었습니다.`);
    finalEl.innerHTML =
      `${packTier} 팩에서 나온 5장 중 한 장을 선택해 보상을 확정하세요.`;
  }

  function handleCardChoice(index) {
    if (!cards || cards.length !== 5) return;
    cardChoiceMade = true;
    chosenCardIndex = index;

    // 선택 카드 뒤집기
    cardElems.forEach((card, i) => {
      const front = card.querySelector(".card-front");
      const back = card.querySelector(".card-back");
      const data = cards[i];

      back.textContent = "";
      front.textContent = data.ovr.toString();
      card.classList.add("card-revealed");

      if (i === index) {
        card.classList.add("card-chosen");
      }
    });

    const chosen = cards[index];
    appendLog(
      `카드 선택 → ${index + 1}번 카드에서 OVR ${chosen.ovr} (티어 ${chosen.tier})`
    );

    finalEl.innerHTML =
      `<strong>최종 보상</strong><br>` +
      `핀볼: ${LINE_LABEL[pinballResultLine]} 라인<br>` +
      `야바위: ${chosenPackTier} 팩 획득<br>` +
      `카드 뽑기: <strong>OVR ${chosen.ovr}</strong> (티어 ${chosen.tier})`;

    // 1초 뒤 나머지 카드들도 옅게 표시
    setTimeout(() => {
      cardElems.forEach((card, i) => {
        if (i !== index) {
          card.classList.add("card-dim");
        }
      });
      phase = "done";
    }, 1000);
  }

  // ---------- 팩 → 티어 리스트 생성 (확률 + 최소 쿼터) ----------

  function weightedChoice(tiers, weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < tiers.length; i++) {
      r -= weights[i];
      if (r <= 0) return tiers[i];
    }
    return tiers[tiers.length - 1];
  }

  function generateTierListForPack(packTier, cardCount = 5) {
    const rule = PACK_TIER_RULES[packTier];
    if (!rule) {
      // 안전 장치: 모르는 팩이면 전부 3티어
      const fallback = [];
      for (let i = 0; i < cardCount; i++) fallback.push(3);
      return shuffle(fallback);
    }

    const { allowed, weights, min } = rule;
    const result = [];
    const counts = {};
    let used = 0;

    // 1) 최소 쿼터 먼저 채우기
    if (min) {
      for (const tierStr in min) {
        const tier = parseInt(tierStr, 10);
        const need = min[tierStr];
        for (let i = 0; i < need && used < cardCount; i++) {
          result.push(tier);
          counts[tier] = (counts[tier] || 0) + 1;
          used++;
        }
      }
    }

    // 2) 나머지 슬롯은 확률적으로 채우기
    while (used < cardCount) {
      const tier = weightedChoice(allowed, weights);
      result.push(tier);
      counts[tier] = (counts[tier] || 0) + 1;
      used++;
    }

    // 3) 위치 셔플 (왼쪽/오른쪽 위치까지 랜덤)
    return shuffle(result);
  }

  // ---------- 공용 함수 ----------

  function appendLog(text) {
    const div = document.createElement("div");
    div.className = "log-line";
    div.textContent = text;
    logEl.prepend(div);
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
});
