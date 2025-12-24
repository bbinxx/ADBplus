# DroidOps

DroidOps is a modern, cross-platform desktop graphical user interface (GUI) for the Android Debug Bridge (ADB). Built with Tauri, React, and Tailwind CSS, it simplifies Android device management by providing a user-friendly interface for operations that typically require command-line interaction.

## Features

- **Device Dashboard**: View real-time information about connected devices, including model, manufacturing details, and connection status.
- **App Manager**: extensive application management capabilities allowing users to list installed packages, uninstall applications, and install new APKs directly from the desktop.
- **Fastboot Tools**: Dedicated interface for handling bootloader operations, supporting flashing partitions and other fastboot commands.
- **Sideloading**: Streamlined process for sideloading APKs and OTA updates via drag-and-drop functionality.
- **ADB Shell**: Integrated terminal emulator that provides direct access to the ADB shell for executing raw commands when needed.

## Technology Stack

- **Core**: Tauri v2 (Rust)
- **Frontend**: React, Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## Prerequisites

Before running this project, ensure you have the following installed:

- Node.js (LTS recommended)
- Rust and Cargo (for Tauri)
- ADB installed on your system and added to your PATH (or included in the app bundle)
- Visual Studio C++ Build Tools (for Windows)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bbinxx/droidops.git
    cd droidops
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run in development mode:**
    ```bash
    npm run tauri dev
    ```
    This will start the Vite server and the Tauri application window.

## Building for Production

To build the application for your operating system:

```bash
npm run tauri build
```

The build artifacts (executable files / installers) will be located in the `src-tauri/target/release/bundle` directory.
