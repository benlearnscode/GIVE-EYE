#include <Wire.h>
#include <QMC5883LCompass.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h>

// Compass Initialization
QMC5883LCompass compass;
int calibrationData[3][2] = {{32767, -32768}, {32767, -32768}, {32767, -32768}};
bool isCalibrating = true;
unsigned long calibrationStartTime;
const int calibrationDuration = 5000; // 5 seconds calibration duration

// WiFi and Server Configuration
const char* ssid = "Benny_Lap";
const char* password = "benny0980";
const char* locationServerURL = "http://192.168.11.146:3000/api/location";  // URL for location data
const char* directionServerURL = "http://192.168.11.146:3000/api/direction";  // URL to send direction data
WebServer server(80);
String currentInstruction = "";

void handleInstructions() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, body);

    if (!error) {
      currentInstruction = doc["instruction"].as<String>();
      Serial.println("Received Instruction: " + currentInstruction);
      server.sendHeader("Content-Type", "application/json");
      server.send(200, "application/json", "{\"status\":\"Received\"}");
      return;
    }
  }
  server.send(400, "application/json", "{\"error\":\"Invalid Request\"}");
}

void sendLocationData() {
  int n = WiFi.scanNetworks();
  Serial.println("Scanning for anchors...");

  String locationData = "{";
  bool hasAnchors = false;

  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);

    if (ssid.startsWith("Anchor")) {
      if (hasAnchors) locationData += ",";
      locationData += "\"" + ssid + "\":" + String(rssi);
      hasAnchors = true;
    }
  }

  locationData += hasAnchors ? "}" : "{\"error\":\"no anchors found\"}";

  // Debug JSON Output
  Serial.print("JSON Sent: ");
  Serial.println(locationData);

  // Send to Node.js Server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(locationServerURL);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(locationData);
    String response = http.getString();

    Serial.print("Server Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Server Response: ");
    Serial.println(response);
    Serial.println(WiFi.localIP());

    http.end();
  }
}

void sendDirectionData(String direction, int azimuth) {
  // Prepare the JSON object to send direction data
  StaticJsonDocument<200> doc;
  doc["direction"] = direction;
  doc["azimuth"] = azimuth;

  String directionData;
  serializeJson(doc, directionData);

  // Send direction data to the server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(directionServerURL);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(directionData);
    String response = http.getString();

    Serial.print("Direction Server Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Direction Server Response: ");
    Serial.println(response);

    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin();  // Initialize I2C
  compass.init();
  
  // Initialize WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Start web server for instructions
  server.on("/instruction", HTTP_POST, handleInstructions);
  server.begin();
  Serial.println("✅ Instruction Server started!");

  // Calibration for compass
  Serial.println("Starting calibration... Move the sensor in all directions.");
  calibrationStartTime = millis();
}

void loop() {
  int x, y, z;

  // Read compass values
  compass.read();
  x = compass.getX();
  y = compass.getY();
  z = compass.getZ();

  if (isCalibrating) {
    // Update calibration data with new min/max values
    if (x < calibrationData[0][0]) calibrationData[0][0] = x;
    if (x > calibrationData[0][1]) calibrationData[0][1] = x;

    if (y < calibrationData[1][0]) calibrationData[1][0] = y;
    if (y > calibrationData[1][1]) calibrationData[1][1] = y;

    if (z < calibrationData[2][0]) calibrationData[2][0] = z;
    if (z > calibrationData[2][1]) calibrationData[2][1] = z;

    // Check if calibration time is done
    if (millis() - calibrationStartTime > calibrationDuration) {
      isCalibrating = false;
      Serial.println("\nCalibration complete! Use these values:");

      // Print calibration data for the user
      Serial.print("compass.setCalibration(");
      Serial.print(calibrationData[0][0]);
      Serial.print(", ");
      Serial.print(calibrationData[0][1]);
      Serial.print(", ");
      Serial.print(calibrationData[1][0]);
      Serial.print(", ");
      Serial.print(calibrationData[1][1]);
      Serial.print(", ");
      Serial.print(calibrationData[2][0]);
      Serial.print(", ");
      Serial.print(calibrationData[2][1]);
      Serial.println(");");

      // Apply the calibration data to the compass
      compass.setCalibration(
        calibrationData[0][0], calibrationData[0][1],
        calibrationData[1][0], calibrationData[1][1],
        calibrationData[2][0], calibrationData[2][1]
      );

      Serial.println("Now reading directions...");
    }
  } else {
    // Calculate azimuth (compass heading)
    int azimuth = atan2(y, x) * 180.0 / PI;
    if (azimuth < 0) azimuth += 360;  // Keep azimuth within 0-360 degrees

    // Determine only cardinal directions (N, E, S, W)
    String direction;
    if ((azimuth < 45) || (azimuth > 315)) direction = "North";
    else if (azimuth < 135) direction = "East";
    else if (azimuth < 225) direction = "South";
    else direction = "West";

    // Output results
    Serial.print(direction);
    Serial.print(" | Azimuth: ");
    Serial.print(azimuth);
    Serial.print("° | X: ");
    Serial.print(x);
    Serial.print(" Y: ");
    Serial.print(y);
    Serial.print(" Z: ");
    Serial.println(z);

    // Send the direction data to the server
    sendDirectionData(direction, azimuth);

    delay(100);
  }

  // Handle incoming HTTP requests and send location data
  server.handleClient();
  sendLocationData();
  Serial.println(currentInstruction);
}
