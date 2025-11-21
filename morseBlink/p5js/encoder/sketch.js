let morseInput;
let startButton;
let isPlaying = false;
let morseSequence = [];
let currentIndex = 0;
let stateStartTime = 0;
let currentState = "off"; // 'on', 'off', 'done'
let inputText = "";

// UI Elements
let statusDisplay;
let morseDisplay;

// Timing constants (in milliseconds) - matching decoder
const DOT_DURATION = 200;
const DASH_DURATION = 800;
const SYMBOL_GAP_DOT = 200;
const SYMBOL_GAP_DASH = 300;
const LETTER_GAP = 400;
const WORD_GAP = 1000;

// Text to morse code dictionary
const textToMorse = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
  " ": " ",
};

function setup() {
  // Get container and create canvas
  let container = document.getElementById("p5-container");
  let rect = container.getBoundingClientRect();
  createCanvas(rect.width, rect.height);

  // Get UI elements
  morseInput = document.getElementById("morse-input");
  startButton = document.getElementById("start-button");
  statusDisplay = document.getElementById("status-display");
  morseDisplay = document.getElementById("morse-text");

  // Setup button click
  startButton.addEventListener("click", startMorse);
}

function draw() {
  if (isPlaying) {
    playMorseSequence();
  } else {
    background(18); // Very dark gray
  }

  // Update status display
  updateStatus();
}

function updateStatus() {
  let statusText = "";

  if (!isPlaying) {
    statusText = "Ready";
  } else if (currentIndex >= morseSequence.length) {
    statusText = "Complete";
  } else {
    let percent = Math.round((currentIndex / morseSequence.length) * 100);
    let currentItem = morseSequence[currentIndex];
    let type =
      currentItem.type === "signal"
        ? currentItem.symbol === "."
          ? "DOT"
          : "DASH"
        : currentItem.type.toUpperCase().replace(/_/g, " ");
    statusText = `${type} (${currentIndex + 1}/${
      morseSequence.length
    }) ${percent}%`;
  }

  if (statusDisplay.textContent !== statusText) {
    statusDisplay.textContent = statusText;
  }
}

function startMorse() {
  if (isPlaying) {
    // Stop current playback
    isPlaying = false;
    currentIndex = 0;
    startButton.textContent = "Start Flashing";
    morseInput.disabled = false;
    return;
  }

  inputText = morseInput.value.toUpperCase();
  if (inputText.length === 0) {
    alert("Please enter some text!");
    return;
  }

  // Convert text to morse sequence
  morseSequence = textToMorseSequence(inputText);

  if (morseSequence.length === 0) {
    alert("No valid characters to convert!");
    return;
  }

  // Display morse code
  let morseText = "";
  for (let char of inputText) {
    if (char === " ") {
      morseText += " / ";
    } else {
      morseText += (textToMorse[char] || "") + " ";
    }
  }
  morseDisplay.textContent = morseText.trim();

  // Start playing
  isPlaying = true;
  currentIndex = 0;
  currentState = "off";
  stateStartTime = millis();
  startButton.textContent = "Stop Flashing";
  morseInput.disabled = true;
}

function textToMorseSequence(text) {
  let sequence = [];

  for (let i = 0; i < text.length; i++) {
    let char = text[i];

    if (char === " ") {
      // Word gap
      sequence.push({ type: "word_gap", durationMs: WORD_GAP });
      continue;
    }

    let morse = textToMorse[char];
    if (!morse) continue; // Skip unknown characters

    // Add each symbol
    for (let j = 0; j < morse.length; j++) {
      let symbol = morse[j];
      let signalDuration = symbol === "." ? DOT_DURATION : DASH_DURATION;

      sequence.push({
        type: "signal",
        symbol: symbol,
        durationMs: signalDuration,
      });

      // Add symbol gap after each dot/dash (except last in letter)
      if (j < morse.length - 1) {
        let gapDuration = symbol === "." ? SYMBOL_GAP_DOT : SYMBOL_GAP_DASH;
        sequence.push({
          type: "symbol_gap",
          durationMs: gapDuration,
        });
      }
    }

    // Add letter gap after each letter (except last letter before space or end)
    if (i < text.length - 1 && text[i + 1] !== " ") {
      sequence.push({ type: "letter_gap", durationMs: LETTER_GAP });
    }
  }

  return sequence;
}

function playMorseSequence() {
  if (currentIndex >= morseSequence.length) {
    // Finished
    isPlaying = false;
    currentIndex = 0;
    startButton.textContent = "Start Flashing";
    morseInput.disabled = false;
    background(18);
    return;
  }

  let currentItem = morseSequence[currentIndex];
  let elapsed = millis() - stateStartTime;

  if (currentItem.type === "signal") {
    // Flash white for signal
    if (currentState === "off") {
      currentState = "on";
      stateStartTime = millis();
    }

    background(255); // White

    if (elapsed >= currentItem.durationMs) {
      currentState = "off";
      stateStartTime = millis();
      currentIndex++;
    }
  } else {
    // Gap (dark screen)
    background(18);

    if (elapsed >= currentItem.durationMs) {
      stateStartTime = millis();
      currentIndex++;
    }
  }
}

function windowResized() {
  let container = document.getElementById("p5-container");
  if (container) {
    let rect = container.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
  }
}

function keyPressed() {
  if (key === " ") {
    startMorse();
    return false; // Prevent default space behavior
  }

  if (key === "Escape") {
    isPlaying = false;
    currentIndex = 0;
    startButton.textContent = "Start Flashing";
    morseInput.disabled = false;
  }
}
