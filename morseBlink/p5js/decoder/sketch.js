let morseInput;
let startButton;
let isPlaying = false;
let morseSequence = [];
let currentIndex = 0;
let stateStartTime = 0;
let currentState = "off"; // 'on', 'off', 'done'
let inputText = "";

// Timing constants (in milliseconds) - matching decoder
const DOT_DURATION = 200;
const DASH_DURATION = 800;
const SYMBOL_GAP_DOT = 200;
const SYMBOL_GAP_DASH = 300;
const LETTER_GAP = 400;
const WORD_GAP = 600;

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
  createCanvas(windowWidth, windowHeight);

  // Create input field
  let inputDiv = createDiv("");
  inputDiv.position(20, 20);
  inputDiv.style("background", "rgba(0,0,0,0.7)");
  inputDiv.style("padding", "20px");
  inputDiv.style("border-radius", "10px");

  createP("Enter text to convert to Morse code:")
    .parent(inputDiv)
    .style("color", "white")
    .style("margin", "0 0 10px 0");

  morseInput = createInput("HELLO WORLD");
  morseInput.parent(inputDiv);
  morseInput.size(300);
  morseInput.style("font-size", "16px");
  morseInput.style("padding", "8px");

  startButton = createButton("Start Flashing");
  startButton.parent(inputDiv);
  startButton.style("margin-left", "10px");
  startButton.style("padding", "8px 16px");
  startButton.style("font-size", "16px");
  startButton.style("cursor", "pointer");
  startButton.mousePressed(startMorse);

  // Info text
  createP("Timings: Dot=200ms, Dash=800ms, Letter Gap=400ms, Word Gap=600ms")
    .parent(inputDiv)
    .style("color", "#aaa")
    .style("margin", "10px 0 0 0")
    .style("font-size", "12px");
}

function draw() {
  if (isPlaying) {
    playMorseSequence();
  } else {
    background(20);
  }

  // Display current status
  if (isPlaying) {
    fill(255);
    textSize(32);
    textAlign(CENTER, BOTTOM);
    text(`Playing: "${inputText}"`, width / 2, height - 100);

    textSize(20);
    text(
      `Progress: ${currentIndex + 1} / ${morseSequence.length}`,
      width / 2,
      height - 60
    );

    // Show current morse code
    if (currentIndex < morseSequence.length) {
      let seq = morseSequence[currentIndex];
      if (seq.type === "signal") {
        text(
          `Current: ${seq.symbol === "." ? "DOT" : "DASH"}`,
          width / 2,
          height - 30
        );
      } else if (seq.type === "letter_gap") {
        text("Current: LETTER GAP", width / 2, height - 30);
      } else if (seq.type === "word_gap") {
        text("Current: WORD GAP", width / 2, height - 30);
      }
    }
  }
}

function startMorse() {
  if (isPlaying) {
    // Stop current playback
    isPlaying = false;
    currentIndex = 0;
    startButton.html("Start Flashing");
    return;
  }

  inputText = morseInput.value().toUpperCase();
  if (inputText.length === 0) return;

  // Convert text to morse sequence
  morseSequence = textToMorseSequence(inputText);

  if (morseSequence.length === 0) {
    alert("No valid characters to convert!");
    return;
  }

  // Start playing
  isPlaying = true;
  currentIndex = 0;
  currentState = "off";
  stateStartTime = millis();
  startButton.html("Stop");
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
    startButton.html("Start Flashing");
    background(20);
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
    // Gap (black screen)
    background(0);

    if (elapsed >= currentItem.durationMs) {
      stateStartTime = millis();
      currentIndex++;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === " ") {
    startMorse();
  }

  if (key === "Escape") {
    isPlaying = false;
    currentIndex = 0;
    startButton.html("Start Flashing");
  }
}
