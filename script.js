document.addEventListener("DOMContentLoaded", async () => {
  let isGameOver = false;
  let currentTile = 0;
  let currentRow = 0;
  let hidden_word = "";
  let words=[];
  let common_words=[];
  let wordss=new Set();

  try{
    const res=await fetch("./words.json");
    const data=await res.json();
    words=data.words;
    common_words=data.common_words;
    wordss=new Set([...words,...common_words]);
    hidden_word=common_words[Math.floor(Math.random()*common_words.length)];
  }catch(err){
    console.log("failed to load word List",err);
    showMessage("Failed to Load word List",true);
  }

  function initGame() {
    const keyboards = document.querySelectorAll(".key");
    keyboards.forEach((keyboard) => {
      keyboard.addEventListener("click", handleKeyboardClick);
    });

    document.addEventListener("keydown", handleKeyPress);
  }

  function handleKeyboardClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isGameOver) return;

    if (e.target.classList.contains("key")) {
      const key = e.target.dataset.key;

      if (key === "Backspace") {
        deleteLetter();
      } else if (key === "Enter") {
        checkRow();
      } else if (key.length === 1 && /^[A-Z]$/i.test(key)) {
        insertLetterKey(key.toUpperCase());
      }
    }
  }

  function handleKeyPress(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isGameOver) return;

    if (e.key === "Backspace") {
      deleteLetter();
    } else if (e.key === "Enter") {
      checkRow();
    } else if (e.key.length === 1 && /^[A-Z]$/i.test(e.key)) {
      insertLetterKey(e.key.toUpperCase());
    }
  }

  function insertLetterKey(letter) {
    if (currentTile < 5 && currentRow < 6) {
      const tile = document.querySelector(
        `.row:nth-child(${currentRow + 1}) .tile:nth-child(${currentTile + 1})`
      );
      tile.dataset.letter = letter.toUpperCase();
      tile.textContent = letter.toUpperCase();
      currentTile++;
    }
  }

  function deleteLetter() {
    if (currentTile > 0) {
      currentTile--;
      const tile = document.querySelector(
        `.row:nth-child(${currentRow + 1}) .tile:nth-child(${currentTile + 1})`
      );
      tile.textContent = "";
      delete tile.dataset.letter;
    }
  }

  function checkRow() {
    if (currentTile < 5) {
      vibrateRow();
      return;
    }

    let guess = "";
    let hidden = hidden_word.toUpperCase().split("");

    const rowTiles = document.querySelectorAll(
      `.row:nth-child(${currentRow + 1}) .tile`
    );
    rowTiles.forEach((rowTile) => {
      guess += rowTile.dataset.letter;
    });

    if (!wordss.has(guess.toLowerCase())) {
      vibrateRow();
      return;
    }

    let guessArr = guess.toUpperCase().split("");
    let hiddenCopy = [...hidden];
    let status = new Array(5).fill("absent");

    // Pass 1: greens
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === hiddenCopy[i]) {
        status[i] = "correct";
        hiddenCopy[i] = null; // consume letter
      }
    }

    for (let i = 0; i < 5; i++) {
      if (status[i] === "correct") continue;
      let idx = hiddenCopy.indexOf(guessArr[i]);
      if (idx !== -1) {
        status[i] = "present";
        hiddenCopy[idx] = null; // consume once
      }
    }

    rowTiles.forEach((tile, i) => {
      let letter = tile.dataset.letter;
      if (!letter) return;
      setTimeout(() => {
        tile.classList.add("flip");
        setTimeout(() => {
          tile.classList.add(status[i]);
        }, 300);
      }, i * 200);

      updateKeyboardColors(letter, status[i]);
    });

    if (guess.toUpperCase() === hidden_word.toUpperCase()) {
      showMessage("You Win 🎉", true);
      isGameOver = true;
      return;
    }

    if (currentRow >= 5) {
      showMessage(`Game Over! The word was ${hidden_word}`, true);
      isGameOver = true;
      return;
    }

    currentRow++;
    currentTile = 0;
  }

  function updateKeyboardColors(letter, status) {
    const key = document.querySelector(
      `.key[data-key="${letter.toLowerCase()}"]`
    );
    if (!key) return;

    if (status === "correct") {
      key.classList.remove("present","absent");
      key.classList.add("correct");
    } else if (status === "present") {
      if (!key.classList.contains("correct") && !key.classList.contains("present")) {
        key.classList.add("present");
      }
    } else if (status === "absent") {
      if (
        !key.classList.contains("correct") &&
        !key.classList.contains("present") &&
        !key.classList.contains("absent")
      ) {
        key.classList.add("absent");
      }
    }
  }

  function vibrateRow() {
    const row = document.querySelector(`.row:nth-child(${currentRow + 1})`);
    row.classList.add("shake");
    setTimeout(() => {
      row.classList.remove("shake");
    }, 300);
  }

  function showMessage(text, isPersistent = false) {
    let container = document.querySelector(".message-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "message-container";
      document.body.appendChild(container);
    }

    const message = document.createElement("div");
    message.className = "message";
    message.textContent = text;
    container.appendChild(message);

    if (!isPersistent) {
      setTimeout(() => {
        message.remove();
      }, 2000);
    }
  }
  initGame();
});
