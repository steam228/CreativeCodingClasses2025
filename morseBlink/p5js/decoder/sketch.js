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
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide();

  trackX = width / 2;
  trackY = height / 2;

  // Create threshold slider
  createP("Threshold:").position(10, 490).style("color", "white");
  thresholdSlider = createSlider(20, 200, 100);
  thresholdSlider.position(100, 500);

  // Create auto-calibrate checkbox
  let autoCalDiv = createDiv("");
  autoCalDiv.position(250, 490);
  let checkbox = createCheckbox("Auto-calibrate", true);
  checkbox.parent(autoCalDiv);
  checkbox.style("color", "white");
  checkbox.changed(() => {
    autoCalibrate = checkbox.checked();
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

  // Draw video with correct proportions
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

  image(capture, offsetX, offsetY, displayWidth, displayHeight);

  // Draw tracking circle
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);
  circle(trackX, trackY, trackRadius * 2);

  // Sample brightness in tracking area
  capture.loadPixels();
  let totalBrightness = 0;
  let pixelCount = 0;

  for (
    let y = max(0, trackY - trackRadius);
    y < min(height, trackY + trackRadius);
    y++
  ) {
    for (
      let x = max(0, trackX - trackRadius);
      x < min(width, trackX + trackRadius);
      x++
    ) {
      let index = (floor(y) * width + floor(x)) * 4;
      let r = capture.pixels[index];
      let g = capture.pixels[index + 1];
      let b = capture.pixels[index + 2];
      let brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }
  }

  let avgBrightness = totalBrightness / pixelCount;
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
      thresholdSlider.value(threshold);
    }
  } else if (!autoCalibrate) {
    // Manual mode - use slider value
    threshold = thresholdSlider.value();
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

  // Display info
  fill(255);
  noStroke();
  textSize(16);
  text(`Brightness: ${floor(avgBrightness)}`, 10, height - 130);
  text(
    `Threshold: ${floor(threshold)} ${autoCalibrate ? "(auto)" : "(manual)"}`,
    10,
    height - 110
  );
  if (autoCalibrate && calibrationSamples < maxCalibrationSamples) {
    text(
      `Calibrating... ${calibrationSamples}/${maxCalibrationSamples}`,
      10,
      height - 90
    );
  } else if (autoCalibrate) {
    text(
      `Calibrated! On:${floor(
        onBrightness.reduce((a, b) => a + b, 0) / onBrightness.length
      )} Off:${floor(
        offBrightness.reduce((a, b) => a + b, 0) / offBrightness.length
      )}`,
      10,
      height - 90
    );
  } else {
    text(`Status: ${isLightOn ? "ON" : "OFF"}`, 10, height - 90);
  }
  text(`Status: ${isLightOn ? "ON" : "OFF"}`, 10, height - 70);
  text(
    `Timing: Dot=${DOT_DURATION}ms Dash=${DASH_DURATION}ms LetterGap=${LETTER_GAP}ms`,
    10,
    height - 50
  );
  text(`Current: ${currentMessage}`, 10, height - 30);
  text(`Decoded: ${decodedText}`, 10, height - 10);

  // Instructions
  fill(255, 255, 0);
  textSize(14);
  text("Click LED | R: reset | E: clear | C: recalibrate", 10, 20);
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
  resizeCanvas(windowWidth, windowHeight);
}
