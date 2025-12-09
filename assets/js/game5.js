document.addEventListener("DOMContentLoaded", () => {
  const trackFillEl = document.getElementById("g5-trackFill");
  const rudolphEl = document.getElementById("g5-rudolph");
  const positionEl = document.getElementById("g5-position");
  const turnEl = document.getElementById("g5-turn");
  const staminaFillEl = document.getElementById("g5-staminaFill");
  const staminaValueEl = document.getElementById("g5-staminaValue");
  const statusEl = document.getElementById("g5-status");
  const logEl = document.getElementById("g5-log");
  const finalEl = document.getElementById("g5-final");
  const choiceButtons = document.querySelectorAll("button.btn-primary[data-choice]");

  const TARGET = 8;
  const MAX_STAMINA = 7;

  // 모드 정의: step/체력 소모/성공 확률/라벨
  const MODES = {
    1: { step: 1, staminaCost: 1, successProb: 0.81,  label: "안전 걸음" },
    2: { step: 2, staminaCost: 2, successProb: 0.63, label: "보통 속도" },
    3: { step: 3, staminaCost: 3, successProb: 0.45, label: "전력 질주" },
  };

  let position = 0;
  let stamina = MAX_STAMINA;
  let turn = 0;
  let isGameOver = false;

  // 초기 UI 반영
  updateTrackUI();
  updateStaminaUI();
  updateBasicUI();

  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (isGameOver) return;
      const choice = parseInt(btn.dataset.choice, 10);
      playTurn(choice);
    });
  });

  function playTurn(choice) {
    const mode = MODES[choice];
    if (!mode) return;

    // 턴 증가
    turn += 1;

    // 성공 여부 판정
    const r = Math.random(); // 0~1
    const isSuccess = r < mode.successProb;

    let resultText = "";

    if (isSuccess) {
      // 성공: step만큼 전진
      position += mode.step;
      if (position > TARGET) position = TARGET;

      statusEl.textContent =
        `성공! (${mode.label}, ${mode.step}칸 전진) → 현재 위치 ${position}/${TARGET}, 체력 ${stamina}/${MAX_STAMINA}`;
      resultText =
        `${turn}턴 - 모드: ${choice} (${mode.label}) → 성공! ` +
        `${mode.step}칸 전진, 위치 ${position}/${TARGET}, 체력 ${stamina}/${MAX_STAMINA}`;
    } else {
      // 실패: 위치 그대로, 체력만 감소
    stamina -= mode.staminaCost;
    if (stamina < 0) stamina = 0; // 음수로 내려가지 않게 보정

      statusEl.textContent =
        `실패... (${mode.label}) 위치는 그대로, 체력만 ${mode.staminaCost} 소모되었습니다. ` +
        `(현재 체력 ${stamina}/${MAX_STAMINA})`;
      resultText =
        `${turn}턴 - 모드: ${choice} (${mode.label}) → 실패, 위치 ${position}/${TARGET}, 체력 ${stamina}/${MAX_STAMINA}`;
    }

    appendLog(resultText);
    updateTrackUI();
    updateStaminaUI();
    updateBasicUI();

    // 종료 조건 체크
    if (position >= TARGET) {
      isGameOver = true;
      const score = computeScore(true);
      statusEl.textContent = "🎉 루돌프가 집에 도착했습니다!";
      showFinal(true, score);
    } else if (stamina <= 0) {
      isGameOver = true;
      const score = computeScore(false);
      statusEl.textContent = "루돌프가 지쳐서 더 이상 갈 수 없습니다...";
      showFinal(false, score);
    }
  }

  function computeScore(success) {
    if (!success) return 0;
    // 점수 = 10 + 2 * 남은 체력 - 턴 수 (0 미만이면 0으로)
    const raw = 10 + 2 * stamina - turn;
    return raw < 0 ? 0 : raw;
  }

  function updateTrackUI() {
    const ratio = position / TARGET; // 0~1
    const percent = Math.max(0, Math.min(1, ratio)) * 100;
    trackFillEl.style.width = `${percent}%`;

    // 루돌프 아이콘 위치
    rudolphEl.style.left = `${percent}%`;
  }

  function updateStaminaUI() {
    const ratio = stamina / MAX_STAMINA;
    const percent = Math.max(0, Math.min(1, ratio)) * 100;
    staminaFillEl.style.width = `${percent}%`;
    staminaValueEl.textContent = stamina.toString();
  }

  function updateBasicUI() {
    positionEl.textContent = position.toString();
    turnEl.textContent = turn.toString();
  }

  function appendLog(text) {
    const div = document.createElement("div");
    div.className = "log-line";
    div.textContent = text;
    logEl.prepend(div);
  }

  function showFinal(success, score) {
    const successText = success
      ? "루돌프가 집에 도착했습니다! 🎉"
      : "루돌프가 끝까지 가지 못했습니다.";

    const detailText = success
      ? `도달 턴 수: ${turn}턴 / 남은 체력: ${stamina}/${MAX_STAMINA}`
      : `최종 위치: ${position}/${TARGET} / 진행 턴 수: ${turn}턴`;

    finalEl.innerHTML = `
      <strong>게임 최종 결과</strong><br>
      ${successText}<br>
      ${detailText}<br>
      최종 점수: <strong>${score}점</strong><br>
      <small>점수 공식 (성공 시): 9 + 2×남은 체력 − 턴 수</small>
    `;
  }
});
