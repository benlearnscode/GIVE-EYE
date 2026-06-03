from flask import Flask, request, jsonify
import whisper

app= Flask(__name__)


model = whisper.load_model("small")

destinations = {
    "home": "1,2",
    "office": "5,3",
    "market": "7,4",
    "hospital": "3,6",
    "school": "4,8"
}
@app.route('/upload_audio', methods=['POST'])
def process_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No audio file received"}), 400

    # Save the received file
    audio_file = request.files['file']
    audio_path = "audio.wav"
    audio_file.save(audio_path)

    # Run AI-based voice recognition
    result = model.transcribe(audio_path)
    recognized_text = result['text'].strip().lower()
    
    # Match recognized text to known destinations
    matched_dest = destinations.get(recognized_text, "Unknown")

    response = {
        "recognized_text": recognized_text,
        "destination": matched_dest
    }

    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)