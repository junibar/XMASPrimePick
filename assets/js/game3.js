document.addEventListener("DOMContentLoaded", () => {
  const playerInputEl = document.getElementById("g3-playerInput");
  const spinCountEl = document.getElementById("g3-spinCount");
  const applyBtn = document.getElementById("g3-applySettings");
  const statusEl = document.getElementById("g3-status");
  const boardEl = document.getElementById("g3-board");
  const leverBtn = document.getElementById("g3-leverBtn");
  const remainingEl = document.getElementById("g3-remaining");
  const finalEl = document.getElementById("g3-final");

  let players = [];
  let counts = [];
  let totalSpins = 0;
  let remainingSpins = 0;
  let leverEnabled = false;
  let gameFinished = false;

  applyBtn.addEventListener("click", () => {
    const raw = playerInputEl.value
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (raw.length === 0) {
      statusEl.textContent = "최소 1명 이상의 선수를 입력하세요.";
      return;
    }
    if (raw.length > 5) {
      statusEl.textContent = "최대 5명까지만 가능합니다.";
      return;
    }

    const n = parseInt(spinCountEl.value, 10);
    if (Number.isNaN(n) || n < 1 || n > 15) {
      statusEl.textContent = "코인은 1~15 사이의 숫자여야 합니다.";
      return;
    }

    players = raw;
    counts = new Array(players.length).fill(0);
    totalSpins = n;
    remainingSpins = n;
    leverEnabled = true;
    gameFinished = false;

    remainingEl.textContent = remainingSpins.toString();
    statusEl.textContent =
      `설정 완료! 선수 ${players.length}명, 회전 ${totalSpins}회. 레버를 당겨주세요.`;

    buildBoard();
    updateLeverUI();
    renderPlayerResults();
  });

  leverBtn.addEventListener("click", () => {
    if (!leverEnabled || remainingSpins <= 0 || gameFinished) return;
    performSpin();
  });

  function performSpin() {
    const idx = Math.floor(Math.random() * players.length);
    const playerName = players[idx];

    dropBall(idx);

    counts[idx] += 1;
    remainingSpins -= 1;
    remainingEl.textContent = remainingSpins.toString();

    renderPlayerResults();

    if (remainingSpins === 0) {
      leverEnabled = false;
      gameFinished = true;
      updateLeverUI();
      statusEl.textContent = "모든 회전이 끝났습니다. 실시간 결과 패널을 확인하세요.";
    } else {
      updateLeverUI();
      statusEl.textContent = `이번 회전: ${playerName}`;
    }
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    players.forEach((name, idx) => {
      const col = document.createElement("div");
      col.className = "pachinko-column";
      col.dataset.index = idx.toString();

      const balls = document.createElement("div");
      balls.className = "pachinko-balls";

      const label = document.createElement("div");
      label.className = "pachinko-column-label";
      label.textContent = name;

      col.appendChild(balls);
      col.appendChild(label);
      boardEl.appendChild(col);
    });
  }

  function dropBall(playerIndex) {
    const col = boardEl.querySelector(
      `.pachinko-column[data-index="${playerIndex}"]`
    );
    if (!col) return;

    const ballsContainer = col.querySelector(".pachinko-balls");
    const ball = document.createElement("div");
    ball.className = "pachinko-ball";
    ball.textContent = "★";

    ball.style.transform = "translateY(-20px) scale(0.5)";
    ball.style.opacity = "0";

    ballsContainer.appendChild(ball);

    requestAnimationFrame(() => {
      ball.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
      ball.style.transform = "translateY(0) scale(1)";
      ball.style.opacity = "1";
    });
  }

  function updateLeverUI() {
    if (leverEnabled && !gameFinished) {
      leverBtn.classList.remove("disabled");
    } else {
      leverBtn.classList.add("disabled");
    }
  }

  // 실시간 선수 결과 카드 렌더링
  function renderPlayerResults() {
    finalEl.innerHTML = "";
    players.forEach((name, idx) => {
      const count = counts[idx];
      const card = document.createElement("div");
      card.className = "player-card";

      const nameSpan = document.createElement("span");
      nameSpan.className = "name";
      nameSpan.textContent = name;

      const countSpan = document.createElement("span");
      countSpan.className = "count";
      countSpan.textContent = ` (${count}회)`;

      let bonusText = "";
      if (count === 0) {
        // 표시 없음
      } else if (count === 1) {
        nameSpan.classList.add("player-1hit"); // 보라색
        bonusText = " +1";
      } else if (count === 2) {
        nameSpan.classList.add("player-2hit"); // 민트색
        bonusText = " +2";
       } else if (count === 3) {
        nameSpan.classList.add("player-3hit"); // 민트색
        bonusText = " +3";
      } else if (count >= 4) {
        nameSpan.classList.add("player-4hit"); // 금색
        bonusText = " +4";
        const star = document.createElement("span");
        star.className = "star-badge";
        star.textContent = "⭐";
        nameSpan.appendChild(star);
      }

      const bonusSpan = document.createElement("span");
      bonusSpan.textContent = bonusText;

      card.appendChild(nameSpan);
      card.appendChild(countSpan);
      card.appendChild(bonusSpan);
      finalEl.appendChild(card);
    });
  }
});

