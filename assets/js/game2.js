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
  const startScoreEl = document.getElementById("g2-startScore"); // 시작 점수 입력 (없으면 null)

  const REWARD_POOL = ["+1", "+3", "+5", "x2", "MISS"];

  let baseScore = 0;          // 시작 점수
  let totalScore = 0;
  let chosenRewards = [];     // 실제로 연 박스의 보상 기록

  let gameState = {
    round: 1,
    boxMapping: {},           // {1: "+1", 2:"MISS", 3:"x2"}
    hasOpenedThisRound: false,
    hasUsedRewardShuffle: false,
    positionShuffleLeft: 3,
    logs: []
  };

  // 초기 라운드 세팅
  initRound();

  // 박스 클릭
  boxElems.forEach(box => {
    box.addEventListener("click", () => {
      const id = parseInt(box.dataset.box, 10);
      onBoxClick(id);
    });
  });

  // 보상 셔플 (새 보상 구성)
  rewardShuffleBtn.addEventListener("click", () => {
    rewardShuffle();
  });

  // 위치 셔플 (야바위)
  posShuffleBtn.addEventListener("click", () => {
    positionShuffle();
  });

  // ----------------- 라운드 초기화 -----------------
  function initRound() {
    // 보상 3개 랜덤 선택
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

    // 박스 비주얼 리셋
    boxElems.forEach(b => {
      b.classList.remove("opened");
      const label = b.querySelector(".gift-label");
      label.classList.remove("dimmed");
      label.textContent = `BOX ${b.dataset.box}`;
      const outcomeEl = b.querySelector(".gift-outcome");
      if (outcomeEl) outcomeEl.remove();
    });

    roundStatusEl.textContent = `라운드 ${gameState.round}: 박스를 선택하세요.`;
  }

  // ----------------- 박스 클릭 처리 -----------------
  function onBoxClick(boxId) {
    if (gameState.hasOpenedThisRound) return;

    // 게임 전체에서 첫 박스를 여는 순간 시작 점수 적용
    if (gameState.round === 1 && chosenRewards.length === 0 && startScoreEl) {
      const raw = parseInt(startScoreEl.value, 10);
      baseScore = Number.isNaN(raw) ? 0 : raw;
      totalScore = baseScore;
      totalScoreEl.textContent = totalScore.toString();
    }

    const outcome = gameState.boxMapping[boxId];

    // 점수 적용
    applyReward(outcome);
    chosenRewards.push(outcome);
    gameState.hasOpenedThisRound = true;

    const selectedBox = [...boxElems].find(
      b => parseInt(b.dataset.box, 10) === boxId
    );
    openBoxVisual(selectedBox, outcome);

    // 나머지 박스도 결과만 공개 (이름 없이, 옅은 글씨)
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

  // ----------------- 점수 계산 -----------------
  function applyReward(r) {
    if (r === "+1") totalScore += 1;
    else if (r === "+3") totalScore += 3;
    else if (r === "+5") totalScore += 5;
    else if (r === "x2") totalScore *= 2;
    // MISS는 변화 없음
  }

  // ----------------- 박스 비주얼 -----------------

  // 선택한 박스: 중앙에 결과만, 진한 텍스트
  function openBoxVisual(boxEl, outcome) {
    boxEl.classList.add("opened");
    const label = boxEl.querySelector(".gift-label");
    label.classList.remove("dimmed");
    label.textContent = outcome; // 예: +3, x2, MISS

    // 예전 흰 글씨 안내 제거
    const extra = boxEl.querySelector(".gift-outcome");
    if (extra) extra.remove();
  }

  // 선택하지 않은 박스: 결과만, 옅은 텍스트
  function revealOutcome(boxEl, outcome) {
    const label = boxEl.querySelector(".gift-label");
    label.textContent = describeOutcome(outcome); // 예: +3점, 점수 2배, MISS
    label.classList.add("dimmed");

    const extra = boxEl.querySelector(".gift-outcome");
    if (extra) extra.remove();
  }

  function describeOutcome(o) {
    if (o === "+1") return "+1점";
    if (o === "+3") return "+3점";
    if (o === "+5") return "+5점";
    if (o === "x2") return "점수 2배";
    if (o === "MISS") return "MISS";
    return o;
  }

  // ----------------- 로그 / 최종 결과 -----------------
  function addRoundLog(boxId, outcome, round) {
    const mapping = gameState.boxMapping;
    const others = [1, 2, 3]
      .filter(x => x !== boxId)
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
      초기 점수: ${baseScore}점<br>
      박스 보상 적용 후 최종 점수: <strong>${totalScore}점</strong><br>
      이번 게임에서 연 박스 보상: <strong>${display}</strong>
     `;
  }

  // ----------------- 보상 셔플 (새 보상 구성 + 파도타기) -----------------
  function rewardShuffle() {
    if (gameState.hasUsedRewardShuffle) return;
    if (gameState.hasOpenedThisRound) return;

    gameState.hasUsedRewardShuffle = true;
    rewardShuffledEl.textContent = "✅";

    const currentRound = gameState.round;

    // 보상 3개 다시 뽑기
    initRound();
    gameState.round = currentRound;
    roundEl.textContent = currentRound.toString();
    roundStatusEl.textContent = `라운드 ${currentRound}: 보상이 새로 섞였습니다.`;

    // 파도타기 애니메이션
    animateRewardWave();
  }

  // ----------------- 위치 셔플 (야바위) -----------------
  function positionShuffle() {
    if (gameState.positionShuffleLeft <= 0) return;
    if (gameState.hasOpenedThisRound) return;

    // 실제 보상 매핑 먼저 섞기
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

    // 야바위형 실제 이동 애니메이션
    animateGiftShuffle(3);
  }

  // ----------------- 애니메이션 -----------------

  // 보상 셔플 시: 왼쪽 → 오른쪽 파도타기
  function animateRewardWave() {
    const boxes = Array.from(boxElems);
    boxes.forEach((box, idx) => {
      setTimeout(() => {
        box.classList.add("reward-wave");
        setTimeout(() => {
          box.classList.remove("reward-wave");
        }, 260);
      }, idx * 120);
    });
  }

  // 위치 셔플 시: 두 박스씩 실제로 교차 이동
  function animateGiftShuffle(swaps = 3, doneCallback) {
    const boxes = Array.from(boxElems);
    let step = 0;

    function doOneSwap() {
      if (step >= swaps) {
        if (typeof doneCallback === "function") doneCallback();
        return;
      }

      let i = getRandomInt(0, boxes.length - 1);
      let j = getRandomInt(0, boxes.length - 1);
      if (j === i) j = (j + 1) % boxes.length;

      const boxA = boxes[i];
      const boxB = boxes[j];

      const rectA = boxA.getBoundingClientRect();
      const rectB = boxB.getBoundingClientRect();
      const dxA = rectB.left - rectA.left;
      const dxB = rectA.left - rectB.left;

      boxA.style.transition = "transform 0.25s ease";
      boxB.style.transition = "transform 0.25s ease";

      boxA.style.transform = `translate(${dxA}px, -6px)`;
      boxB.style.transform = `translate(${dxB}px, -6px)`;

      setTimeout(() => {
        boxA.style.transition = "";
        boxB.style.transition = "";
        boxA.style.transform = "";
        boxB.style.transform = "";

        step += 1;
        setTimeout(doOneSwap, 80);
      }, 260);
    }

    doOneSwap();
  }

  // ----------------- 유틸 함수 -----------------
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
});
