# GIVE-EYE Project Setup Guide

This guide describes how to initialize, configure, and run each component of the GIVE-EYE project from scratch.

---

## Project Structure Overview

* **[GIVE-EYE-backend](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/GIVE-EYE-backend)**: Node.js server/backend API.
* **[GIVE-EYE-ADJMAT/ge](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/GIVE-EYE-ADJMAT/ge)**: React frontend application.
* **[Give_eye-destination](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/Give_eye-destination)**: Python destination selection service.
* **[voice-rego](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/voice-rego)**: Python voice recognition/Vosk service.
* **ESP firmware directories**:
  * [esp-beccons](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/esp-beccons)
  * [esp-navigator](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/esp-navigator)
  * [esp-object-detector](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/esp-object-detector)
* For data about the project visit : (https://ieeexplore.ieee.org/abstract/document/11042040)
---

## 🛠️ Step-by-Step Initialization

### 1. Node.js Backend (`GIVE-EYE-backend`)
1. Navigate to the backend directory:
   ```bash
   cd GIVE-EYE-backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (ignored by Git):
   * Create a `.env` file in the `GIVE-EYE-backend` directory.
   * Add required configurations (database, port, secrets, etc.).
4. Start the backend:
   ```bash
   npm start
   ```

---

### 2. React Frontend (`GIVE-EYE-ADJMAT/ge`)
1. Navigate to the React app directory:
   ```bash
   cd GIVE-EYE-ADJMAT/ge
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

### 3. Python Destination Service (`Give_eye-destination`)
1. Navigate to the destination service directory:
   ```bash
   cd Give_eye-destination
   ```
2. Initialize a new virtual environment:
   ```bash
   python -m venv fordestinationvir
   ```
3. Activate the virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     .\fordestinationvir\Scripts\Activate.ps1
     ```
   * **Windows (CMD):**
     ```cmd
     .\fordestinationvir\Scripts\activate.bat
     ```
   * **macOS/Linux:**
     ```bash
     source fordestinationvir/bin/activate
     ```
4. Install all Python dependencies from the requirements file:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the script:
   ```bash
   python destination-selector.py
   ```

---

### 4. Python Voice Recognition Service (`voice-rego`)
1. Navigate to the voice-rego directory:
   ```bash
   cd voice-rego
   ```
2. Initialize a new virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **Windows (CMD):**
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   * **macOS/Linux:**
     ```bash
     source .venv/bin/activate
     ```
4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. **Speech Recognition Model:**
   * Download and extract the Vosk speech model (e.g. `vosk-model-small-en-in-0.4`) into the `voice-rego` directory.
6. Run the script:
   ```bash
   python main.py
   ```

---

## 🔒 Security Reminder
All sensitive `.env` configurations and heavy local environment directories (`fordestinationvir`, `.venv`, `node_modules`) are configured in the [.gitignore](file:///D:/projects/GIVEEYE_Folder/GIVE-EYE/.gitignore) file to ensure they are never pushed to GitHub. Always use this documentation to rebuild environments from scratch on clean installations.
