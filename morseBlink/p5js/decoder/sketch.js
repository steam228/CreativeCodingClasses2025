let capture;
let trackX, trackY;
let trackRadius = 30;
let brightnessHistory = [];
let isLightOn = false;
let lastStateChange = 0;
let currentMessage = "";
let decodedText = "";
let threshold = 100;
let thresholdSlider;
let autoCalibrate = true;
let onBrightness = [];
let offBrightness = [];
let calibrationSamples = 0;
let maxCalibrationSamples = 50;
let avgBrightness = 0; // Track brightness value across frames

// UI Elements
let statusDisplay, morseOutput, textOutput;

// Timing constants (in milliseconds)
const DOT_DURATION = 200;
const DASH_DURATION = 800;
const SYMBOL_GAP_DOT = 200; // gap after a dot
const SYMBOL_GAP_DASH = 300; // gap after a dash
const LETTER_GAP = 400; // gap between letters
const WORD_GAP = 1000; // gap between words

// Morse code dictionary
const morseCode = {
  ".-": "A",
  "-...": "B",
  "-.-.": "C",
  "-..": "D",
  ".": "E",
  "..-.": "F",
  "--.": "G",
  "....": "H",
  "..": "I",
  ".---": "J",
  "-.-": "K",
  ".-..": "L",
  "--": "M",
  "-.": "N",
  "---": "O",
  ".--.": "P",
  "--.-": "Q",
  ".-.": "R",
  "...": "S",
  "-": "T",
  "..-": "U",
  "...-": "V",
  ".--": "W",
  "-..-": "X",
  "-.--": "Y",
  "--..": "Z",
  "-----": "0",
  ".----": "1",
  "..---": "2",
  "...--": "3",
  "....-": "4",
  ".....": "5",
  "-....": "6",
  "--...": "7",
  "---..": "8",
  "----.": "9",
};

function setup() {
  // Get container and create canvas
  let container = document.getElementById("p5-container");
  let rect = container.getBoundingClientRect();
  let canvas = createCanvas(rect.width, rect.height);
  canvas.parent("p5-container");

  // Get UI elements
  statusDisplay = document.getElementById("status");
  morseOutput = document.getElementById("morse-output");
  textOutput = document.getElementById("text-output");
  thresholdSlider = document.getElementById("threshold");

  // Setup video capture with mirroring
  capture = createCapture(VIDEO);
  capture.hide();
  capture.elt.style.transform = "scaleX(-1)"; // Mirror the video

  trackX = width / 2;
  trackY = height / 2;

  // Setup threshold slider event listener
  thresholdSlider.addEventListener("input", (e) => {
    threshold = parseFloat(e.target.value);
    document.getElementById("threshold-value").textContent =
      Math.floor(threshold);
  });

  // Setup auto-calibrate checkbox
  let autoCalCheckbox = document.getElementById("auto-calibrate");
  autoCalCheckbox.addEventListener("change", (e) => {
    autoCalibrate = e.target.checked;
    if (autoCalibrate) {
      // Reset calibration data
      onBrightness = [];
      offBrightness = [];
      calibrationSamples = 0;
    }
  });
}

function draw() {
  background(0);

  // Calculate video scaling once for use throughout draw
  let videoAspect = capture.width / capture.height;
  let canvasAspect = width / height;
  let displayWidth, displayHeight, offsetX, offsetY;

  if (videoAspect > canvasAspect) {
    // Video is wider, fit to height
    displayHeight = height;
    displayWidth = height * videoAspect;
    offsetX = (width - displayWidth) / 2;
    offsetY = 0;
  } else {
    // Video is taller, fit to width
    displayWidth = width;
    displayHeight = width / videoAspect;
    offsetX = 0;
    offsetY = (height - displayHeight) / 2;
  }

  // Mirror the display horizontally
  push();
  translate(offsetX + displayWidth / 2, offsetY + displayHeight / 2);
  scale(-1, 1); // Mirror horizontally
  image(
    capture,
    -displayWidth / 2,
    -displayHeight / 2,
    displayWidth,
    displayHeight
  );
  pop();

  // Draw tracking circle
  noFill();
  stroke(31, 111, 235); // Material Design 3 Primary Blue
  strokeWeight(2);
  circle(trackX, trackY, trackRadius * 2);

  // Draw tracking circle crosshair
  stroke(31, 111, 235);
  line(trackX - trackRadius * 0.5, trackY, trackX + trackRadius * 0.5, trackY);
  line(trackX, trackY - trackRadius * 0.5, trackX, trackY + trackRadius * 0.5);

  // Sample brightness in tracking area
  capture.loadPixels();
  let totalBrightness = 0;
  let pixelCount = 0;

  // Map canvas coordinates to capture coordinates based on video scaling
  let captureX, captureY, captureRadius;

  if (videoAspect > canvasAspect) {
    // Video is wider, fit to height
    captureRadius = trackRadius * (capture.width / displayWidth);
    captureX = (trackX - offsetX) * (capture.width / displayWidth);
    captureY = trackY * (capture.height / displayHeight);
  } else {
    // Video is taller, fit to width
    captureRadius = trackRadius * (capture.height / displayHeight);
    captureX = trackX * (capture.width / displayWidth);
    captureY = (trackY - offsetY) * (capture.height / displayHeight);
  }

  for (
    let y = max(0, captureY - captureRadius);
    y < min(capture.height, captureY + captureRadius);
    y++
  ) {
    for (
      let x = max(0, captureX - captureRadius);
      x < min(capture.width, captureX + captureRadius);
      x++
    ) {
      let index = (floor(y) * capture.width + floor(x)) * 4;
      let r = capture.pixels[index];
      let g = capture.pixels[index + 1];
      let b = capture.pixels[index + 2];
      let brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }
  }

  avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;
  brightnessHistory.push(avgBrightness);
  if (brightnessHistory.length > 10) {
    brightnessHistory.shift();
  }

  // Auto-calibration logic
  if (autoCalibrate && calibrationSamples < maxCalibrationSamples) {
    // Collect brightness samples
    let currentlyOn = avgBrightness > threshold;

    if (currentlyOn) {
      onBrightness.push(avgBrightness);
    } else {
      offBrightness.push(avgBrightness);
    }

    calibrationSamples++;

    // Calculate new threshold if we have enough samples
    if (onBrightness.length > 5 && offBrightness.length > 5) {
      let avgOn = onBrightness.reduce((a, b) => a + b, 0) / onBrightness.length;
      let avgOff =
        offBrightness.reduce((a, b) => a + b, 0) / offBrightness.length;
      threshold = (avgOn + avgOff) / 2;
      thresholdSlider.value = threshold;
      document.getElementById("threshold-value").textContent =
        Math.floor(threshold);
    }
  } else if (!autoCalibrate) {
    // Manual mode - use slider value
    threshold = parseFloat(thresholdSlider.value);
  }

  // Detect state changes
  let currentlyOn = avgBrightness > threshold;

  if (currentlyOn !== isLightOn) {
    let signalLength = millis() - lastStateChange;

    if (isLightOn) {
      // Was on, now off - process the signal duration
      processSignal(signalLength);
    } else {
      // Was off, now on - check the gap duration
      checkForLetterOrWordGap(signalLength);
    }

    isLightOn = currentlyOn;
    lastStateChange = millis();
  }

  // Update UI
  updateStatusDisplay();
  morseOutput.textContent = currentMessage;
  textOutput.textContent = decodedText;
}

function updateStatusDisplay() {
  let statusText = "";

  if (autoCalibrate && calibrationSamples < maxCalibrationSamples) {
    statusText = `Calibrating... ${calibrationSamples}/${maxCalibrationSamples}`;
  } else if (
    autoCalibrate &&
    onBrightness.length > 0 &&
    offBrightness.length > 0
  ) {
    let avgOn = onBrightness.reduce((a, b) => a + b, 0) / onBrightness.length;
    let avgOff =
      offBrightness.reduce((a, b) => a + b, 0) / offBrightness.length;
    statusText = `Calibrated • On: ${Math.floor(avgOn)} Off: ${Math.floor(
      avgOff
    )}`;
  } else {
    statusText = `${isLightOn ? "● ON" : "● OFF"} • Brightness: ${Math.floor(
      avgBrightness
    )}`;
  }

  if (statusDisplay.textContent !== statusText) {
    statusDisplay.textContent = statusText;
  }
}

function processSignal(signalDuration) {
  // Classify based on fixed timing
  // Use midpoint between dot and dash (500ms) as threshold
  if (signalDuration < (DOT_DURATION + DASH_DURATION) / 2) {
    currentMessage += ".";
  } else {
    currentMessage += "-";
  }
}

function checkForLetterOrWordGap(gapDuration) {
  // Symbol gaps (200-300ms) - ignore, just continuing same letter
  if (gapDuration < 350) {
    return;
  }

  // Letter gap detected (around 400ms)
  if (gapDuration >= 350 && gapDuration < 550 && currentMessage.length > 0) {
    let letter = morseCode[currentMessage];
    if (letter) {
      decodedText += letter;
    }
    currentMessage = "";
  }

  // Word gap detected (600ms+)
  if (gapDuration >= 550) {
    if (currentMessage.length > 0) {
      let letter = morseCode[currentMessage];
      if (letter) {
        decodedText += letter;
      }
      currentMessage = "";
    }
    decodedText += " ";
  }
}

function mousePressed() {
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    trackX = mouseX;
    trackY = mouseY;

    // Reset on new tracking point
    brightnessHistory = [];
    currentMessage = "";

    // Restart calibration
    if (autoCalibrate) {
      onBrightness = [];
      offBrightness = [];
      calibrationSamples = 0;
    }
  }
}

function keyPressed() {
  if (key === "r" || key === "R") {
    // Reset everything
    decodedText = "";
    currentMessage = "";
  }

  if (key === "e" || key === "E") {
    // Clear only decoded text
    decodedText = "";
  }

  if (key === "c" || key === "C") {
    // Restart calibration
    onBrightness = [];
    offBrightness = [];
    calibrationSamples = 0;
    autoCalibrate = true;
  }
}

function windowResized() {
  let container = document.getElementById("p5-container");
  if (container) {
    let rect = container.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
  }
}
