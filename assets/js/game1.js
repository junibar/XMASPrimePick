document.addEventListener("DOMContentLoaded", () => {
  const goalButtons = document.querySelectorAll(".goal-cell");
  const statusEl = document.getElementById("g1-status");
  const scoreEl = document.getElementById("g1-score");
  const totalShotsEl = document.getElementById("g1-totalShots");
  const totalGoalsEl = document.getElementById("g1-totalGoals");
  const maxComboEl = document.getElementById("g1-maxCombo");
  const logEl = document.getElementById("g1-log");
  const finalEl = document.getElementById("g1-final");

  let score = 0;
  let totalShots = 0;
  let totalGoals = 0;
  let isGameOver = false;

  // 콤보: 같은 종류 골(N/S) 연속일 때
  let streakType = null; // 'N' | 'S' | null
  let streakLen = 0;
  let maxCombo = 0;

  goalButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (isGameOver) return;
      shoot(parseInt(btn.dataset.slot, 10));
    });
  });

  function shoot(choice) {
    // 4칸 중: 일반골 2칸, 슈퍼골 1칸, 실패 1칸
    const types = ["N", "N", "S", "X"];
    shuffle(types);

    const resultType = types[choice - 1]; // 1~4 → 0~3

    // UI 초기화
    goalButtons.forEach((btn, idx) => {
      btn.classList.remove("goal-hit", "super-hit", "miss-hit");
      btn.textContent = (idx + 1).toString();
    });

    totalShots++;

    if (resultType === "X") {
      // 실패 → 게임 종료
      isGameOver = true;
      streakType = null;
      streakLen = 0;

      markCells(types);
      statusEl.textContent = "❌ 슛이 빗나갔습니다! 게임 종료.";
      appendLog(`실패! (${choice}번 구역 선택)`);

      updateStatsUI();
      showFinalResult(types, choice, "실패");
      return;
    }

    // 성공: N(1점) 또는 S(3점)
    const baseScore = resultType === "N" ? 1 : 3;
    let thisComboBonus = 0;

    // 콤보 판정: 같은 종류면 +1, 아니면 리셋
    if (streakType === resultType) {
      streakLen += 1;
    } else {
      streakType = resultType;
      streakLen = 1;
    }

    // 같은 종류 2연속 이상이면 보너스 +1 (고정)
    if (streakLen >= 2) {
      thisComboBonus = 1;
    }

    if (streakLen > maxCombo) maxCombo = streakLen;

    const shotScore = baseScore + thisComboBonus;
    score += shotScore;
    totalGoals++;

    markCells(types, choice, resultType);
    statusEl.textContent =
      (resultType === "S" ? "⭐ 슈퍼골! " : "✅ 골! ") +
      `이번 슛 점수: ${shotScore} (기본 ${baseScore}, 콤보 ${thisComboBonus})`;

    appendLog(
      `${totalShots}번째 슛 - 선택: ${choice}번 / 결과: ${
        resultType === "S" ? "슈퍼골" : "골"
      } / 획득: ${shotScore}점`
    );
    updateStatsUI();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function markCells(types, chosenIndex = null) {
    goalButtons.forEach((btn, i) => {
      const t = types[i];
      if (chosenIndex !== null && chosenIndex - 1 === i) {
        if (t === "S") {
          btn.classList.add("super-hit");
          btn.textContent = `★${i + 1}`;
        } else if (t === "N") {
          btn.classList.add("goal-hit");
          btn.textContent = `G${i + 1}`;
        } else {
          btn.classList.add("miss-hit");
          btn.textContent = `X${i + 1}`;
        }
      } else {
        if (t === "S") btn.textContent = `S`;
        else if (t === "N") btn.textContent = `G`;
        else btn.textContent = `X`;
      }
    });
  }

  function updateStatsUI() {
    scoreEl.textContent = score;
    totalShotsEl.textContent = totalShots;
    totalGoalsEl.textContent = totalGoals;
    maxComboEl.textContent = maxCombo;
  }

  function appendLog(text) {
    const div = document.createElement("div");
    div.className = "log-line";
    div.textContent = text;
    logEl.prepend(div);
  }

  function showFinalResult(types, lastChoice, lastLabel) {
    finalEl.style.display = "block";
    finalEl.innerHTML = `
      <strong>게임 종료 결과</strong><br>
      총 슛 횟수: ${totalShots}회 / 성공: ${totalGoals}회<br>
      최종 점수: <strong>${score}점</strong><br>
      최대 콤보: ${maxCombo}연속<br>
      마지막 슛: ${lastChoice}번 → ${lastLabel}<br>
      <small>현재 골대 배치 (S=슈퍼골, G=골, X=실패): ${types.join(", ")}</small>
    `;
  }
});
