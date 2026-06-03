#include <WiFi.h>
#include <ArduinoJson.h>

void sendLocationData() {
    // Fast passive WiFi scan (doesn't send probe requests)
    int n = WiFi.scanNetworks(false, true);  

    if (n == 0) {
        Serial.println("{\"error\":\"No anchors found\"}");
        return;
    }

    StaticJsonDocument<512> jsonDoc;  // Stores scanned results

    for (int i = 0; i < n; i++) {
        String networkSSID = WiFi.SSID(i);
        if (networkSSID.startsWith("Anchor")) {  // Process only anchor networks
            jsonDoc[networkSSID] = WiFi.RSSI(i);
        }
    }

    // Print JSON output
    String jsonString;
    serializeJson(jsonDoc, jsonString);
    Serial.println(jsonString);
}

void setup() {
    Serial.begin(115200);
    WiFi.mode(WIFI_STA);   // Station mode (doesn't start AP)
    WiFi.disconnect();      // Prevent auto-connecting to networks
}

void loop() {
    sendLocationData();
    Serial.println("________________________________________________");
    // delay(500);  // Adjust delay to balance performance and response time
}
