# Clara AI Automation Pipeline

## Overview

This project implements an **end-to-end automation pipeline** that converts customer call recordings into structured AI agent configurations.

The system processes **demo calls** and **onboarding calls** to automatically extract business information, generate agent configuration files, and maintain **versioned updates with change logs**.

The pipeline combines **speech transcription, LLM-based information extraction, and workflow orchestration** to simulate a real-world AI automation system used for configuring AI answering services.

---

## Features

* Converts call recordings into transcripts using **OpenAI Whisper**
* Extracts structured business information using **Llama3 via Ollama**
* Generates initial agent configuration (**v1**) from demo calls
* Updates configuration (**v2**) based on onboarding calls
* Maintains **versioned configurations**
* Automatically generates **change logs**
* Supports **batch processing for multiple accounts**
* Includes **n8n workflow orchestration**

---

## System Architecture

Audio Recording
↓
Whisper Transcription
↓
Transcript Processing
↓
Llama3 Information Extraction
↓
Agent Configuration Generation (v1)
↓
Onboarding Updates (v2)
↓
Change Log Generation
↓
Workflow Automation (n8n)

---

## Project Structure

```
clara-automation
│
├── data
│   ├── demo
│   │   acc_001.txt
│   │   acc_001_chat.txt
│   │
│   └── onboarding
│       acc_001.txt
│
├── outputs
│   └── acc_001
│       ├── v1
│       ├── v2
│       └── changelog.txt
│
├── workflows
│   clara_workflow.json
│
├── index.js
├── index2.js
├── run_all.js
├── README.md
├── package.json
└── .gitignore
```

---

## Installation

### 1. Clone the Repository

```
git clone https://github.com/yourusername/clara-automation.git
cd clara-automation
```

---

### 2. Install Node Dependencies

```
npm install
```

---

### 3. Install Python (for Whisper)

Download Python:

https://www.python.org/downloads/

Then install Whisper:

```
pip install openai-whisper
```

---

### 4. Install FFmpeg

Whisper requires FFmpeg.

Download:

https://ffmpeg.org/download.html

Add FFmpeg to your system PATH.

Verify installation:

```
ffmpeg -version
```

---

### 5. Install Ollama

Download Ollama:

https://ollama.ai

Run:

```
ollama pull llama3
```

Verify:

```
ollama list
```

---

## Running the Pipeline

### Step 1 — Generate Transcript (Whisper)

```
python -m whisper data/demo/acc_001.mp4 --model base --output_dir data/demo
```

This creates:

```
data/demo/acc_001.txt
```

---

### Step 2 — Generate Initial Configuration (v1)

```
node index.js demo acc_001
```

Output:

```
outputs/acc_001/v1/
memo.json
agent_spec.json
```

---

### Step 3 — Process Onboarding Updates (v2)

```
node index2.js acc_001
```

Output:

```
outputs/acc_001/v2/
memo.json
agent_spec.json
changelog.txt
```

---

### Step 4 — Run Batch Pipeline

Process all accounts automatically:

```
node run_all.js
```

---

## Example Output

```
outputs/
acc_001/

v1/
memo.json
agent_spec.json

v2/
memo.json
agent_spec.json

changelog.txt
```

---

## n8n Workflow

An optional **n8n workflow** is included to orchestrate the automation pipeline.

Import workflow:

```
workflows/clara_workflow.json
```

Example workflow:

Manual Trigger
↓
Run Pipeline
↓
Generate Configurations
↓
Store Outputs

---

## Technologies Used

Node.js
Python (Whisper)
Ollama + Llama3
n8n Workflow Automation

---

## Use Case

This project demonstrates how **AI answering services can automatically configure voice agents** by analyzing customer onboarding conversations.

The system extracts:

* Company name
* Contact information
* Business hours
* Pricing details
* Emergency policies
* Call handling logic

and converts them into **structured agent configuration files**.

---

## Author

Soumyajit Pal
VIT Vellore
