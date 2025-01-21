#include <ESP8266WiFi.h>

const char* ssid = "AnchorSSID";
const char* password = "AnchorPassword";

WiFiServer server(80);
String anchorID = "Anchor_2";  // Change this for each anchor
float x = 5.0;  // Anchor X-coordinate
float y = 0.0;  // Anchor Y-coordinate

void setup() {
  Serial.begin(115200);
  WiFi.softAP(ssid, password);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("Anchor IP Address: ");
  Serial.println(IP);
  Serial.println("cceee");
  server.begin();
}

void loop() {
  WiFiClient client = server.available();
  if (client) {
    String response = "ID:" + anchorID + ",X:" + String(x) + ",Y:" + String(y);
    client.println(response);
    client.stop();
  }
}
