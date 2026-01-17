# Feder

Feder is a specialized web application designed for scriptwriting and journal editing. Built with React and Vite, it offers a tailored environment for creating and managing structured documents with support for Markdown and mathematical notation.

## Prerequisites

Before installing the application, ensure you have the following software installed on your system:

- **Node.js**: Version 18.0 or higher is recommended.
- **npm**: Typically included with the Node.js installation.

## Installation

To set up the project locally, follow these steps:

1.  **Clone the repository**
    
    Open your terminal and run the following command to download the source code:
    ```bash
    git clone https://github.com/CodexFabrica/Feder.git
    ```

2.  **Navigate to the project directory**

    ```bash
    cd Feder
    ```

3.  **Install dependencies**

    Run the installation command to download all required packages:
    ```bash
    npm install
    ```

## Usage

You can run the application using either the command line or the provided Windows shortcut.

### Option 1: Command Line (Cross-Platform)

To start the development server manually, execute:

```bash
npm run dev
```

Once the server is running, you can access the application in your browser, typically at `http://localhost:5173`.

### Option 2: Windows Launcher

For Windows users, the repository includes a convenience script. Simply double-click the `Feder.bat` file in the root directory. This script will automatically:
1.  Start the development server.
2.  Open the application in your default web browser.

Is recommended to create a direct access of `Feder.bat`.

## Building for Production

To create an optimized build for deployment, run the following command:

```bash
npm run build
```

This will generate the production files in the `dist` folder, which can be deployed to any static site hosting service.
