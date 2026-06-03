import asyncio
import websockets
import json
import pyttsx3

# Replace with the WebSocket server's IP (if on the same network, use the server's local IP)
SERVER_IP = "192.168.11.146"  # Change this to your WebSocket server's IP
PORT = 8080
WS_URL = f"ws://{SERVER_IP}:{PORT}"

engine = pyttsx3.init()  # Initialize pyttsx3 engine

def speak(text):
    """Converts the given text to speech and plays it."""
    engine.say(text)
    engine.runAndWait()

async def receive_instructions():
    async with websockets.connect(WS_URL) as websocket:
        print(f"Connected to WebSocket server at {WS_URL}")

        while True:
            try:
                message = await websocket.recv()
                print(f"Received: {message}")

                try:
                    data = json.loads(message)

                    if "instruction" in data:
                        instruction = data["instruction"]
                        if isinstance(instruction, str): #check if instruction is a string.
                            try:
                                instruction_data = json.loads(instruction)
                                if "message" in instruction_data:
                                    speak(instruction_data["message"])
                                elif "action" in instruction_data and "newFacingDirection" in instruction_data:
                                    speak(f"Action: {instruction_data['action']}. New Facing Direction: {instruction_data['newFacingDirection']}.")
                                else:
                                    speak(instruction)  # Speak the raw instruction if it's neither "message" nor "action/direction"
                            except json.JSONDecodeError:
                                speak(instruction)  # Speak the instruction as a string if it's not JSON
                        elif isinstance(instruction, dict): #if instruction is a dictionary.
                            if "action" in instruction and "newFacingDirection" in instruction:
                                speak(f"Action: {instruction['action']}. New Facing Direction: {instruction['newFacingDirection']}.")

                        else:
                            speak("Invalid instruction format.")

                    else:
                        speak("No instruction available.")

                except (json.JSONDecodeError, KeyError, TypeError) as e:
                    print(f"Error processing JSON: {e}")
                    speak("Error processing instruction")

            except websockets.ConnectionClosed:
                print("Connection closed. Reconnecting...")
                speak("Connection to server closed.")
                break

asyncio.run(receive_instructions())