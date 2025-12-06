document.addEventListener("DOMContentLoaded", () => {
  const goalButtons = document.querySelectorAll(".goal-cell");
  const statusEl = document.getElementById("g1-status");
  const scoreEl = document.getElementById("g1-score");
  const totalShotsEl = document.getElementById("g1-totalShots");
  const totalGoalsEl = document.getElementById("g1-totalGoals");
  const maxComboEl = document.getElementById("g1-maxCombo"); // 콤보는 0으로만 유지
  const logEl = document.getElementById("g1-log");
  const finalEl = document.getElementById("g1-final");

  let score = 0;
  let totalShots = 0;
  let totalGoals = 0;
  let isGameOver = false;
  let isAnimating = false; // 결과 표시 중 추가 클릭 방지

  // 콤보는 사용하지 않으므로 항상 0
  maxComboEl.textContent = "0";

  goalButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (isGameOver || isAnimating) return;
      shoot(parseInt(btn.dataset.slot, 10));
    });
  });

  function shoot(choice) {
    // 6칸 구성: X, X, N, N, N, S
    const types = ["X", "X", "N", "N", "N", "S"];
    shuffle(types);

    const idx = choice - 1;
    const resultType = types[idx];

    totalShots++;

    let gained = 0;
    if (resultType === "N") {
      gained = 1;
      score += gained;
      totalGoals++;
      statusEl.textContent = `✅ 골! 이번 슛 점수: 1점`;
    } else if (resultType === "S") {
      gained = 3;
      score += gained;
      totalGoals++;
      statusEl.textContent = `⭐ 스페셜 골! 이번 슛 점수: 3점`;
    } else {
      // 실패
      isGameOver = true;
      statusEl.textContent = `❌ 실패! 게임 종료.`;
    }

    appendLog(
      `${totalShots}번째 슛 - 선택: ${choice}번 / 결과: ${
        resultType === "N" ? "골(1점)"
        : resultType === "S" ? "스페셜 골(3점)"
        : "실패"
      } / 누적 점수: ${score}점`
    );

    updateStatsUI();

    // 연출: 모든 칸 결과 표시 후, 0.8초 뒤 비선택 칸만 번호로 복귀
    revealAndReset(types, idx);

    if (isGameOver) {
      showFinalResult(types, choice, resultType === "X" ? "실패" :
        (resultType === "S" ? "스페셜 골" : "골"));
    }
  }

  function revealAndReset(types, chosenIndex) {
    isAnimating = true;

    goalButtons.forEach((btn, i) => {
      btn.classList.remove("goal-hit", "super-hit", "miss-hit");
      const t = types[i];

      if (i === chosenIndex) {
        // 선택한 칸: 색 + 아이콘
        if (t === "S") {
          btn.classList.add("super-hit");
          btn.textContent = "★★★";
        } else if (t === "N") {
          btn.classList.add("goal-hit");
          btn.textContent = "★";
        } else {
          btn.classList.add("miss-hit");
          btn.textContent = "×";
        }
      } else {
        // 선택하지 않은 칸: 흰색 글씨로 결과만
        btn.style.color = "#ffffff";
        if (t === "S") btn.textContent = "★★★";
        else if (t === "N") btn.textContent = "★";
        else btn.textContent = "×";
      }
    });

  // 0.8초 후 모든 칸을 다시 1~6으로 복귀
setTimeout(() => {
  goalButtons.forEach((btn, i) => {
    btn.classList.remove("goal-hit", "super-hit", "miss-hit");
    btn.textContent = (i + 1).toString();
    btn.style.color = ""; // 원래 색상으로 돌려둠
  });
  isAnimating = false;
}, 800);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function updateStatsUI() {
    scoreEl.textContent = score;
    totalShotsEl.textContent = totalShots;
    totalGoalsEl.textContent = totalGoals;
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
      마지막 슛: ${lastChoice}번 → ${lastLabel}<br>
      <small>마지막 턴 골대 배치 (S=스페셜 골, N=일반 골, X=실패): ${types.join(", ")}</small>
    `;
  }
});
