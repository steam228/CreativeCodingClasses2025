#define led 13

// Morse code timing (in milliseconds)
#define DOT_DURATION 200
#define DASH_DURATION 800
#define SYMBOL_GAP 200
#define LETTER_GAP 400
#define WORD_GAP 1000

void setup()
{
    Serial.begin(9600);
    pinMode(led, OUTPUT);
    digitalWrite(led, LOW);
    delay(1000);
    Serial.println("Arduino Morse Encoder - SOS Message");
}

void loop()
{
    // Send SOS message repeatedly
    sendMorse('S'); // ...
    delay(LETTER_GAP);
    sendMorse('O'); // ---
    delay(LETTER_GAP);
    sendMorse('S'); // ...
    delay(WORD_GAP);

    // Pause before repeating
    delay(2000);
}

// Send a single character in morse code
void sendMorse(char character)
{
    String morse = charToMorse(character);

    Serial.print(character);
    Serial.print(": ");
    Serial.println(morse);

    for (int i = 0; i < morse.length(); i++)
    {
        if (morse[i] == '.')
        {
            blinkLED(DOT_DURATION);
        }
        else if (morse[i] == '-')
        {
            blinkLED(DASH_DURATION);
        }
        delay(SYMBOL_GAP);
    }
}

// Blink LED for specified duration
void blinkLED(int duration)
{
    digitalWrite(led, HIGH);
    delay(duration);
    digitalWrite(led, LOW);
}

// Convert character to morse code
String charToMorse(char c)
{
    c = toUpperCase(c);

    switch (c)
    {
    case 'A':
        return ".-";
    case 'B':
        return "-...";
    case 'C':
        return "-.-.";
    case 'D':
        return "-..";
    case 'E':
        return ".";
    case 'F':
        return "..-.";
    case 'G':
        return "--.";
    case 'H':
        return "....";
    case 'I':
        return "..";
    case 'J':
        return ".---";
    case 'K':
        return "-.-";
    case 'L':
        return ".-..";
    case 'M':
        return "--";
    case 'N':
        return "-.";
    case 'O':
        return "---";
    case 'P':
        return ".--.";
    case 'Q':
        return "--.-";
    case 'R':
        return ".-.";
    case 'S':
        return "...";
    case 'T':
        return "-";
    case 'U':
        return "..-";
    case 'V':
        return "...-";
    case 'W':
        return ".--";
    case 'X':
        return "-..-";
    case 'Y':
        return "-.--";
    case 'Z':
        return "--..";
    case '0':
        return "-----";
    case '1':
        return ".----";
    case '2':
        return "..---";
    case '3':
        return "...--";
    case '4':
        return "....-";
    case '5':
        return ".....";
    case '6':
        return "-....";
    case '7':
        return "--...";
    case '8':
        return "---..";
    case '9':
        return "----.";
    default:
        return "";
    }
}
