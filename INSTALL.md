# Installation Guide - Feder

This is a web-based Markdown editor designed for researchers and journalists. It uses the modern **File System Access API** to work directly with your local files.

## Prerequisites

- **Node.js** (Version 18 or higher recommended)
- **npm** (comes with Node.js)
- A **Chromium-based browser** (Chrome, Edge, Opera) is required for full file system features.

## Setup Instructions

1. **Clone or Download the Repository**
   Download the source code to your computer.

2. **Install Dependencies**
   Open your terminal (Command Prompt, PowerShell, or Bash) in the project folder and run:
   ```bash
   npm install
   ```

3. **Run the Application**
   Start the development server:
   ```bash
   npm run dev
   ```

4. **Access the Editor**
   Once started, open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Usage Notes

- **Permissions**: The first time you open a project or save a file, the browser will ask for permission to access your local folders. Click "Allow" or "Save Changes" to enable editing.
- **Browser Support**: Safari and Firefox do not fully support the File System Access API yet. For the best experience, use **Google Chrome** or **Microsoft Edge**.

## Building for Production

To create a optimized production build:
```bash
npm run build
```
The output will be in the `dist` folder.
