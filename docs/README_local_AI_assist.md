# How to Configure Local AI Assistant in Feder

Feder supports running AI models **locally** on your own computer, which offers several advantages:
- **Privacy**: Your code/writing never leaves your machine.
- **Speed**: No internet lag; responses are generated instantly by your hardware.
- **Cost**: Free to use (requires capable hardware).
- **Offline Capable**: Works without an internet connection.

This guide explains how to set up **Ollama**, the easiest tool for running local LLMs, and configure it with Feder.

---

## 🏗️ Step 1: Install Ollama

**Ollama** is a lightweight tool that lets you download and run powerful AI models like Llama 3, Mistral, Gemma 2, and more with a single command.

1.  **Download & Install**:
    - Go to [ollama.com/download](https://ollama.com/download).
    - Download the version for your OS (Windows, macOS, or Linux).
    - Run the installer.

2.  **Verify Installation**:
    - Open your terminal (PowerShell or Command Prompt).
    - Type `ollama --version` and press Enter.
    - If it shows a version number (e.g., `0.1.32`), you're ready!

---

## 📥 Step 2: Download Your AI Model

You need to "pull" (download) a model to use. Models vary in size (parameters) and capability. Here are the best choices for Feder:

| Model | Command to Install | Best Used For | Notes |
| :--- | :--- | :--- | :--- |
| **Llama 3.1 (8B)** | `ollama pull llama3.1` | **General Purpose** | 🌟 **Top Recommendations**. Fast, smart, great for writing & code. (4.7GB) |
| **Gemma 2 (9B)** | `ollama pull gemma2` | **Creative Writing** | Google's open model. excellent reasoning. (5.5GB) |
| **DeepSeek Coder V2** | `ollama pull deepseek-coder-v2` | **Code Completion** | Best-in-class for programming tasks. (Harder to run, large) |
| **Mistral (7B)** | `ollama pull mistral` | **Speed** | Very fast, good all-rounder for older PCs. (4.1GB) |
| **Phi-3 (Mini)** | `ollama pull phi3` | **Low-End PCs** | Extremely lightweight Microsoft model. Runs on almost anything. (2.4GB) |

### How to Install a Model:
1.  Open your terminal.
2.  Type the command for your chosen model, e.g.:
    ```bash
    ollama pull llama3.1
    ```
3.  Wait for the download to complete (it may take a few minutes depending on your internet).

---

## ⚙️ Step 3: Configure Feder

Now that Ollama is running, connect it to Feder.

1.  Open **Feder**.
2.  Click the **Project Settings** (gear icon) in the bottom left.
3.  Go to the **AI Assist** section.
4.  Toggle **Inline Suggestions** to **ON**.
5.  **Provider**: Select **Ollama (Local)**.
6.  **Ollama Configuration**:
    - **URL**: Keep default `http://localhost:11434` (unless you changed Ollama's port).
    - **Model Name**: Type the *exact name* of the model you downloaded (e.g., `llama3.1`, `gemma2`, `mistral`).
        *   *Tip: You can check your installed models by running `ollama list` in your terminal.*
7.  **Performance Tuning** (bottom of settings):
    - **Max Words**: `12` (Lower is faster. For inline completions, you rarely need more than a sentence fragment).
    - **Debounce**: `300` - `500` ms. (Lower feels snappier, but requires faster hardware).

---

## 🧪 Step 4: Test It Out!

1.  Open any Markdown file in Feder.
2.  Activate the AI-assisted inline suggestions
2.  Type a partial sentence (e.g., `The quick brown fox `) and **stop typing**.
3.  Watch the bottom right corner for "AI is thinking...". (If not, then use the shortcut CTRL + space)
4.  If successful, ghost text will appear in grey. Press **Tab** to accept it!

