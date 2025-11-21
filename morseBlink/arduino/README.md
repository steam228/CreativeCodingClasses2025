# Arduino Morse Code Encoder & Decoder

Simple Arduino sketches for transmitting and receiving morse code using an LED and an LDR (Light Dependent Resistor).

## Hardware Setup

Both sketches use the following connections:
- **LED**: Connected to **Pin 13**
- **LDR**: Connected to **Analog Pin A0**

```
Arduino Pin 13 ----[220Ω resistor]---- LED ---- GND
Arduino GND ----[LDR]---- Analog Pin A0 ----[10kΩ pulldown resistor]---- GND
```

## Morse Code Timing

Both sketches use standard morse timing:
- **Dot (·)**: 200ms
- **Dash (−)**: 800ms
- **Gap between symbols**: 200ms
- **Gap between letters**: 400ms
- **Gap between words**: 1000ms

## Encoder (encoder.ino)

Continuously transmits the morse code message **SOS** by blinking the LED.

### Features
- Sends "SOS" message repeatedly
- Prints current character and morse code to Serial monitor
- Simple, straightforward morse transmission

### How to Use
1. Upload the sketch to your Arduino
2. The LED will start blinking the SOS pattern
3. Check the Serial monitor (9600 baud) to see the morse sequence

### Example Serial Output
```
Arduino Morse Encoder - SOS Message
S: ...
O: ---
S: ...
S: ...
O: ---
S: ...
```

## Decoder (decoder.ino)

Reads morse code from the LDR and decodes it to text.

### Features
- Monitors LDR light changes to detect morse signals
- Auto-calibrates threshold based on your environment
- Prints decoded morse patterns and letters to Serial monitor
- Automatically detects letter and word gaps

### How to Use

#### Step 1: Calibration
1. Upload the sketch
2. Open the Serial monitor (9600 baud)
3. Watch the **LDR values** printed every 100ms
4. Note the values when:
   - **LED is OFF** (bright ambient light): High values (e.g., 600-800)
   - **LED is ON** (dark from LED light): Low values (e.g., 200-400)

#### Step 2: Set Threshold
1. Look at the range of LDR values
2. Set `THRESHOLD_DARK` in the code to a value between the light-on and light-off readings
   - Recommended: approximately halfway between the two ranges
3. Example: If LED-on reads ~300 and LED-off reads ~700, set threshold to ~500

#### Step 3: Decode
1. Point your encoder (another Arduino or the encoder.ino) at the LDR
2. Watch the Serial monitor as it decodes the morse code
3. The decoder will print dots (.), dashes (-), letter boundaries, and decoded characters

### Example Serial Output
```
LDR: 650
LDR: 580
. - . [E]  [S] [SPACE]
```

### Troubleshooting

**LDR not detecting changes:**
- Make sure the LED is bright and close to the LDR
- Check that your LDR is properly connected to A0
- Verify the threshold value is between your on/off readings

**Threshold too high/low:**
- Read the serial output values when LED is on/off
- Adjust `THRESHOLD_DARK` to the midpoint
- Re-upload and test

## Modifying the Code

### Change the message in encoder.ino:
Replace the SOS in the `loop()` function with any text:
```cpp
void loop() {
  sendMorse('H');  // H: ....
  delay(LETTER_GAP);
  sendMorse('I');  // I: ..
  delay(LETTER_GAP);
  sendMorse('!');  // Not supported, will skip
  delay(WORD_GAP);
  delay(2000);
}
```

### Supported characters:
- A-Z (letters)
- 0-9 (numbers)
- Space (automatic word gap)

## Morse Code Reference

| Character | Morse | Character | Morse |
|-----------|-------|-----------|-------|
| A         | .-    | N         | -.    |
| B         | -...  | O         | ---   |
| C         | -.-.  | P         | .--.  |
| D         | -..   | Q         | --.-  |
| E         | .     | R         | .-.   |
| F         | ..-.  | S         | ...   |
| G         | --.   | T         | -     |
| H         | ....  | U         | ..-   |
| I         | ..    | V         | ...-  |
| J         | .---  | W         | .--   |
| K         | -.-   | X         | -..-  |
| L         | .-..  | Y         | -.--  |
| M         | --    | Z         | --..  |
