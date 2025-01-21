#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Benny_Lap";
const char* password = "benny0980";
// const char* serverURL = "http://192.168.1.21:3000/location";
const char* serverURL = "http://192.168.137.1:3000/api/location/";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
}

void loop() {
  int n = WiFi.scanNetworks();
  Serial.println("Scanning for anchors...");

  String locationData = "{";
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);

    // Filter only anchors (SSID contains "Anchor")
    if (ssid.startsWith("Anchor")) {
      locationData += "\"" + ssid + "\":" + String(rssi) + ",";
    }
  }
  locationData.remove(locationData.length() - 1); // Remove trailing comma
  locationData += "}";

  // Send location data to Node.js server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(locationData);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server Response: " + response);
    } else {
      Serial.println("Error in sending POST request");
    }

    http.end();
  }

  delay(5000);
}
