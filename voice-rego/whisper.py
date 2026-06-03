import queue
import sys
import torch
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel

# Set up Faster-Whisper
model_size = "small"  # "tiny", "base", "small", "medium", "large-v2"
device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float32" if device == "cuda" else "int8"  # Safe for all devices
model = WhisperModel(model_size, device=device, compute_type=compute_type)

print(f"Using {device.upper()} with {compute_type} precision.")

# Audio settings
SAMPLE_RATE = 16000
BUFFER_DURATION = 5
BLOCK_SIZE = int(SAMPLE_RATE * BUFFER_DURATION)

# Queue for audio data
audio_queue = queue.Queue()

# Callback function to capture audio
def audio_callback(indata, frames, time, status):
    if status:
        print(f"Error: {status}", file=sys.stderr)
    audio_queue.put(indata.copy())  # Store audio chunk in queue

print("🎤 Listening... (Press Ctrl+C to stop)")

# Start the microphone stream
with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="float32", callback=audio_callback):
    try:
        while True:
            audio_chunk = audio_queue.get()
            audio_chunk = np.squeeze(audio_chunk)
            audio_chunk = (audio_chunk * 32768).astype(np.int16)  # Convert float32 to int16

            if np.abs(audio_chunk).mean() < 500:
                continue  # Skip silent chunks

            segments, _ = model.transcribe(audio_chunk, language="en")
            for segment in segments:
                print(f"[{segment.start:.2f}s -> {segment.end:.2f}s]: {segment.text}")

    except KeyboardInterrupt:
        print("\n🔴 Live transcription stopped.")
