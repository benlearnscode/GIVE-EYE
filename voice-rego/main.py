from vosk import Model, KaldiRecognizer
import pyaudio
import ollama
import requests
import pyttsx3

engine = pyttsx3.init()

# Load Vosk model
model = Model("vosk-model-small-en-in-0.4")
recognizer = KaldiRecognizer(model, 16000)

# Set up microphone stream
mic = pyaudio.PyAudio()

stream = mic.open(
    format=pyaudio.paInt16,
    channels=1,
    rate=16000,
    input=True,
    frames_per_buffer=8192,
    input_device_index=1,
)

URL = "http://192.168.11.146:3000/api/"
destinationUrl = URL + "destinationslist"
sendDestiantionUrl = URL + "selecteddestination"

response = requests.get(destinationUrl)

if response.status_code == 200:
    data = response.json()
    print("Destinations List:", data)
    destinations = data
else:
    print(f"Failed to fetch data. Status Code: {response.status_code}")

def get_destination_from_ollama(voice_text, retries=3):
    if retries == 0:
        return -1
    prompt = (
        f"Given the list of destinations: {destinations}, identify the most relevant destination mentioned in the following voice command: '{voice_text}'. "
        f"Correct minor spelling or pronunciation errors to match an existing destination. "
        f"Return ONLY the index of the matched destination from the list, starting from 0. "
        f"If no match is found, return -1. "
        f"If the command is 'stop searching', return -2. "
        f"Your response MUST be a single integer without any extra words, symbols, or formatting."
    )

    response = ollama.chat(model="gemma2:2b", messages=[{"role": "user", "content": prompt}])
    try:
        index = int(response["message"]["content"].strip())
        return index
    except ValueError:
        print(f"Error converting response to integer. Retrying...")
        return get_destination_from_ollama(voice_text, retries=retries - 1)
    return -1

stream.start_stream()
print("✅ Model loaded. Listening...")

destinationIndex = -1
stop_search = False

engine.say("say our destination. Or say 'stop searching' to cancel.")
engine.runAndWait()

isRetry = False

try:
    while not stop_search:
        if(isRetry):
            engine.say("say our destination. Or say 'stop searching' to cancel.")
            engine.runAndWait()
            isRetry = False

        data = stream.read(4096, exception_on_overflow=False)
        if recognizer.AcceptWaveform(data):
            text = recognizer.Result()
            print(f"🗣 {text[14:-3]}")
            voice_input = text[14:-3]
            destinationIndex = get_destination_from_ollama(voice_input)
            print(destinationIndex)

            if destinationIndex == -2:
                stop_search = True
                print("Search stopped by user.")
                break
            elif destinationIndex != -1:
                break
            else:
                isRetry = True

except KeyboardInterrupt:
    print("Stopping...")
    stop_search = True

stream.stop_stream()
stream.close()
mic.terminate()

if not stop_search and destinationIndex != -2:
    selected_name = destinations[destinationIndex]
    payload = {"index": destinationIndex, "name": selected_name}
    post_response = requests.post(sendDestiantionUrl, json=payload)

    if post_response.status_code == 200:
        print(f"✅ Sent: {selected_name} (Index: {destinationIndex})")
        print("📩 Server Response:", post_response.json())
    else:
        print(f"Failed to send data. Status Code: {post_response.status_code}")