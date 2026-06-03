#include <ESP8266WiFi.h>

const char* ssid = "AnchorSSID_01";  // This anchor's SSID
const char* password = "AnchorPassword";

WiFiServer server(80);
String anchorID = "Anchor_1";  // Unique ID for this anchor
float x = 5.0;  // Default X-coordinate
float y = 0.0;  // Default Y-coordinate

void setup() {
    Serial.begin(115200);
    delay(2000);  // Allow time for Serial Monitor to start

    Serial.println("\n[DEBUG] Starting ESP8266...");
    WiFi.softAP(ssid, password);

    IPAddress IP = WiFi.softAPIP();
    Serial.print("Anchor IP Address: ");
    Serial.println(IP);

    server.begin();
    Serial.println("[DEBUG] Server started!");
    Serial.print("anchor Name : ");
    Serial.print(ssid);
    Serial.print("\n");
    scanAnchors();  // Scan for nearby anchors and set x, y
}

void loop() {
    WiFiClient client = server.available();
    if (client) {
        char response[50];
        sprintf(response, "ID:%s,X:%.2f,Y:%.2f", anchorID.c_str(), x, y);
        client.println(response);
        client.stop();
    }

    delay(5000);  // Reduce unnecessary scanning
}

// 🔹 Function to scan for nearby anchors and assign x, y dynamically
void scanAnchors() {
    Serial.println("\n[DEBUG] Scanning for nearby anchors...");

    int n = WiFi.scanNetworks();
    if (n == 0) {
        Serial.println("[ERROR] No anchors found!");
        return;
    }

    for (int i = 0; i < n; i++) {
        String networkSSID = WiFi.SSID(i);
        Serial.print("Found SSID: ");
        Serial.println(networkSSID);

        if (networkSSID.startsWith("Anchor_")) {
            int underscoreIndex = networkSSID.indexOf('_', 7);  // After "Anchor_"
            if (underscoreIndex > 0) {
                String id = networkSSID.substring(7, underscoreIndex);
                String coordinates = networkSSID.substring(underscoreIndex + 1);

                int commaIndex = coordinates.indexOf(',');
                if (commaIndex > 0) {
                    x = coordinates.substring(0, commaIndex).toFloat();
                    y = coordinates.substring(commaIndex + 1).toFloat();

                    Serial.print("[INFO] Assigned X: ");
                    Serial.print(x);
                    Serial.print(" Y: ");
                    Serial.println(y);
                }
            }
        }
    }
}
