#define ldr A0
#define led 13

// Morse code timing (in milliseconds)
#define DOT_DURATION 200
#define DASH_DURATION 800
#define SYMBOL_GAP 200
#define LETTER_GAP 400
#define WORD_GAP 1000
#define THRESHOLD_DARK 400 // Adjust this value based on your LDR readings

int ldrValue = 0;
int threshold = THRESHOLD_DARK;
bool isLightOn = false;
bool lastLightOn = false;
unsigned long lastStateChange = 0;
unsigned long signalDuration = 0;
unsigned long gapDuration = 0;

String currentMorse = "";
String decodedText = "";

// Morse to character dictionary
const char morseMap[26][6] = {
    ".-",   // A
    "-...", // B
    "-.-.", // C
    "-..",  // D
    ".",    // E
    "..-.", // F
    "--.",  // G
    "....", // H
    "..",   // I
    ".---", // J
    "-.-",  // K
    ".-..", // L
    "--",   // M
    "-.",   // N
    "---",  // O
    ".--.", // P
    "--.-", // Q
    ".-.",  // R
    "...",  // S
    "-",    // T
    "..-",  // U
    "...-", // V
    ".--",  // W
    "-..-", // X
    "-.--", // Y
    "--.."  // Z
};

void setup()
{
    Serial.begin(9600);
    pinMode(ldr, INPUT);
    pinMode(led, OUTPUT);
    digitalWrite(led, LOW);

    delay(1000);
    Serial.println("Arduino Morse Decoder");
    Serial.println("Adjust THRESHOLD_DARK value (currently: " + String(threshold) + ")");
    Serial.println("Watch LDR values below...");
}

void loop()
{
    // Read LDR value
    ldrValue = analogRead(ldr);

    // Print LDR value every 100ms for calibration
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 100)
    {
        Serial.println("LDR: " + String(ldrValue));
        lastPrint = millis();
    }

    // Determine if light is on (high value = bright, low value = dark with LED on)
    isLightOn = (ldrValue > threshold);

    // Detect state change
    if (isLightOn != lastLightOn)
    {
        unsigned long currentTime = millis();

        if (lastLightOn)
        {
            // Light was on, now off - process signal
            signalDuration = currentTime - lastStateChange;
            processSignal(signalDuration);
        }
        else
        {
            // Light was off, now on - check gap
            gapDuration = currentTime - lastStateChange;
            checkForGap(gapDuration);
        }

        lastLightOn = isLightOn;
        lastStateChange = currentTime;
    }

    delay(10);
}

void processSignal(unsigned long duration)
{
    // Classify signal as dot or dash
    unsigned int midpoint = (DOT_DURATION + DASH_DURATION) / 2;

    if (duration < midpoint)
    {
        currentMorse += ".";
        Serial.print(".");
    }
    else
    {
        currentMorse += "-";
        Serial.print("-");
    }
}

void checkForGap(unsigned long duration)
{
    // Symbol gaps: ignore (200-300ms)
    if (duration < 350)
    {
        return;
    }

    // Letter gap detected (around 400ms)
    if (duration >= 350 && duration < 550 && currentMorse.length() > 0)
    {
        char letter = morseToChar(currentMorse);
        if (letter != '?')
        {
            decodedText += letter;
            Serial.print(" [" + String(letter) + "] ");
        }
        currentMorse = "";
    }

    // Word gap detected (600ms+)
    if (duration >= 550)
    {
        if (currentMorse.length() > 0)
        {
            char letter = morseToChar(currentMorse);
            if (letter != '?')
            {
                decodedText += letter;
                Serial.print(" [" + String(letter) + "] ");
            }
            currentMorse = "";
        }
        decodedText += " ";
        Serial.println(" [SPACE] ");
    }
}

char morseToChar(String morse)
{
    // Check against morse dictionary
    for (int i = 0; i < 26; i++)
    {
        if (morse == morseMap[i])
        {
            return 'A' + i;
        }
    }
    return '?';
}
