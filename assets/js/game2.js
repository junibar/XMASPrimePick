document.addEventListener("DOMContentLoaded", () => {
  const boxElems = document.querySelectorAll(".gift-box");
  const roundEl = document.getElementById("g2-round");
  const totalScoreEl = document.getElementById("g2-totalScore");
  const posShuffleLeftEl = document.getElementById("g2-posShuffleLeft");
  const rewardShuffledEl = document.getElementById("g2-rewardShuffled");
  const roundStatusEl = document.getElementById("g2-roundStatus");
  const roundSummaryEl = document.getElementById("g2-roundSummary");
  const finalEl = document.getElementById("g2-final");
  const rewardShuffleBtn = document.getElementById("g2-rewardShuffleBtn");
  const posShuffleBtn = document.getElementById("g2-positionShuffleBtn");

  const REWARD_POOL = ["+1", "+3", "+5", "x2", "MISS"];

  let totalScore = 0;
  let chosenRewards = [];   // 실제로 연 박스의 보상 기록

  let gameState = {
    round: 1,
    boxMapping: {}, // {1: "+1", 2: "MISS", 3:"x2"}
    hasOpenedThisRound: false,
    hasUsedRewardShuffle: false,
    positionShuffleLeft: 3,
    logs: []
  };

  initRound();

  boxElems.forEach(box => {
    box.addEventListener("click", () => {
      const id = parseInt(box.dataset.box, 10);
      onBoxClick(id);
    });
  });

  rewardShuffleBtn.addEventListener("click", () => {
    rewardShuffle();
  });

  posShuffleBtn.addEventListener("click", () => {
    positionShuffle();
  });

  function initRound() {
    const pool = [...REWARD_POOL];
    const selected = [];
    while (selected.length < 3) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }
    shuffle(selected);
    gameState.boxMapping = {
      1: selected[0],
      2: selected[1],
      3: selected[2]
    };
    gameState.hasOpenedThisRound = false;
    gameState.positionShuffleLeft = 3;

    roundEl.textContent = gameState.round.toString();
    posShuffleLeftEl.textContent = gameState.positionShuffleLeft.toString();
    rewardShuffledEl.textContent = gameState.hasUsedRewardShuffle ? "✅" : "❌";

    boxElems.forEach(b => {
      b.classList.remove("opened");
      const label = b.querySelector(".gift-label");
      label.textContent = `BOX ${b.dataset.box}`;
      const outcomeEl = b.querySelector(".gift-outcome");
      if (outcomeEl) outcomeEl.remove();
    });

    roundStatusEl.textContent = `라운드 ${gameState.round}: 박스를 선택하세요.`;
  }

  function onBoxClick(boxId) {
    if (gameState.hasOpenedThisRound) return;
    const outcome = gameState.boxMapping[boxId];

    // 내부 합산용 점수
    applyReward(outcome);
    // 실제로 플레이어가 얻은 박스 보상 기록
    chosenRewards.push(outcome);

    gameState.hasOpenedThisRound = true;

    const selectedBox = [...boxElems].find(b => parseInt(b.dataset.box, 10) === boxId);
    openBoxVisual(selectedBox, outcome);

    // 나머지 박스도 결과 표시
    boxElems.forEach(b => {
      if (b === selectedBox) return;
      const otherOutcome = gameState.boxMapping[parseInt(b.dataset.box, 10)];
      revealOutcome(b, otherOutcome);
    });

    addRoundLog(boxId, outcome, gameState.round);

    totalScoreEl.textContent = totalScore.toString();

    if (gameState.round === 1) {
      roundStatusEl.textContent = `라운드 1 종료! 라운드 2를 시작합니다.`;
      gameState.round = 2;
      setTimeout(() => {
        initRound();
      }, 1000);
    } else {
      roundStatusEl.textContent = `라운드 2 종료! 게임이 끝났습니다.`;
      showFinal();
    }
  }

  function applyReward(r) {
    if (r === "+1") totalScore += 1;
    else if (r === "+3") totalScore += 3;
    else if (r === "+5") totalScore += 5;
    else if (r === "x2") totalScore *= 2;
    // MISS는 변화 없음
  }

  function openBoxVisual(boxEl, outcome) {
    boxEl.classList.add("opened");
    const label = boxEl.querySelector(".gift-label");
    label.textContent = outcome;

    let span = boxEl.querySelector(".gift-outcome");
    if (!span) {
      span = document.createElement("div");
      span.className = "gift-outcome";
      boxEl.appendChild(span);
    }
    span.textContent = `→ ${describeOutcome(outcome)}`;
  }

  function revealOutcome(boxEl, outcome) {
    let span = boxEl.querySelector(".gift-outcome");
    if (!span) {
      span = document.createElement("div");
      span.className = "gift-outcome";
      boxEl.appendChild(span);
    }
    span.textContent = describeOutcome(outcome);
  }

  function describeOutcome(o) {
    if (o === "+1") return "+1점";
    if (o === "+3") return "+3점";
    if (o === "+5") return "+5점";
    if (o === "x2") return "점수 2배";
    if (o === "MISS") return "MISS";
    return o;
  }

  function addRoundLog(boxId, outcome, round) {
    const mapping = gameState.boxMapping;
    const others = [1,2,3].filter(x => x !== boxId)
      .map(x => `BOX ${x}:${describeOutcome(mapping[x])}`)
      .join(", ");

    gameState.logs.push({
      round,
      chosen: `BOX ${boxId}:${describeOutcome(outcome)}`,
      others
    });

    renderRoundSummary();
  }

  function renderRoundSummary() {
    roundSummaryEl.innerHTML = "";
    gameState.logs.forEach(log => {
      const div = document.createElement("div");
      div.innerHTML =
        `<strong>라운드 ${log.round}</strong> - 선택: ${log.chosen} / 다른 박스: ${log.others}`;
      roundSummaryEl.appendChild(div);
    });
  }

  function showFinal() {
    const labels = chosenRewards.map(o => {
      if (o === "+1") return "+1";
      if (o === "+3") return "+3";
      if (o === "+5") return "+5";
      if (o === "x2") return "×2";
      if (o === "MISS") return "MISS";
      return o;
    });
    const display = labels.join("  ");

    finalEl.innerHTML = `
      <strong>게임 최종 결과</strong><br>
      이번 게임에서 연 박스 보상: <strong>${display}</strong><br>
      <small>내부 합산 점수: ${totalScore}점</small>
    `;
  }

  function rewardShuffle() {
    if (gameState.hasUsedRewardShuffle) return;
    if (gameState.hasOpenedThisRound) return;

    gameState.hasUsedRewardShuffle = true;
    rewardShuffledEl.textContent = "✅";

    const currentRound = gameState.round;
    initRound();
    gameState.round = currentRound;
    roundEl.textContent = currentRound.toString();
    roundStatusEl.textContent = `라운드 ${currentRound}: 보상이 새로 섞였습니다.`;
  }

  function positionShuffle() {
    if (gameState.positionShuffleLeft <= 0) return;
    if (gameState.hasOpenedThisRound) return;

    const values = [
      gameState.boxMapping[1],
      gameState.boxMapping[2],
      gameState.boxMapping[3]
    ];
    shuffle(values);
    gameState.boxMapping = {
      1: values[0],
      2: values[1],
      3: values[2]
    };
    gameState.positionShuffleLeft -= 1;
    posShuffleLeftEl.textContent = gameState.positionShuffleLeft.toString();

    roundStatusEl.textContent = `박스 위치가 섞였습니다! 눈으로 잘 따라가 보세요.`;

    // 야바위 애니메이션
    boxElems.forEach(b => {
      b.classList.remove("yabawi");
      void b.offsetWidth; // 애니메이션 재시작을 위한 리플로우
      b.classList.add("yabawi");
      setTimeout(() => {
        b.classList.remove("yabawi");
      }, 700);
    });
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
});
