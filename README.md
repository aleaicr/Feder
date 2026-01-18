# Feder

OPEN-SOURCE WEBAPP TO WRITE. This works in PC, not in the website. This is a side project using Antigravity.

## Prerequisites

Before installing the application, ensure you have the following software installed on your system:

- **Node.js**: Version 18.0 or higher is recommended.
- **npm**: Typically included with the Node.js installation.

## Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/CodexFabrica/Feder.git
    ```

2.  **Navigate to the project directory**

    ```bash
    cd Feder
    ```

3.  **Install dependencies**

    ```bash
    npm install
    ```

## Usage

### Web Version
To open the web application, you can simply run the provided batch file:
- Double-click **`FederWebApp.bat`**

Or manually via terminal:
```bash
npm run dev
```

### Desktop Version (Development)
To create a production build of the desktop application (executable):

1. Double-click **`BuildDesktop.bat`**
   - *Note: This script may request Administrator privileges to perform the build.*

2. Once the build is complete, the executable files will be located in the `dist_electron` directory.
   - The installer/setup file: `dist_electron/Feder Setup <version>.exe`
   - Unpacked executable: `dist_electron/win-unpacked/Feder.exe`

Alternatively, you can build via the command line:
```bash
npm run electron:build
```

#### Run Desktop Version:  <—
To run the desktop version in development mode (or open the built version if it exists):
- Double-click **`FederDesktop.bat`**

Or manually:
```bash
npm run electron:dev
```