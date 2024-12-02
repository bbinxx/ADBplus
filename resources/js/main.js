//main.js
// Function to execute ADB commands and handle output
async function executeADBCommand(command) {
    try {
        let output = await Neutralino.os.execCommand(command);
        document.getElementById("commandOutput").innerText = output.stdOut || output.stdErr;
    } catch (error) {
        document.getElementById("commandOutput").innerText = `Error: ${error.message}`;
    }
}

// Function to refresh the list of connected devices
async function refreshDevices() {
    try {
        let output = await Neutralino.os.execCommand('adb devices');
        let lines = output.stdOut.split('\n');
        let devices = lines.slice(1).filter(line => line.trim() && !line.includes("List of devices"));
        let dropdown = document.getElementById('devicesDropdown');
        dropdown.innerHTML = ""; // Clear existing options

        devices.forEach(device => {
            let [deviceId] = device.split(/\s+/); // Get the device ID
            let option = document.createElement("option");
            option.value = deviceId;
            option.text = deviceId;
            dropdown.appendChild(option);
        });

        if (devices.length > 0) {
            document.getElementById("info").innerText = `Connected Devices: ${devices.length}`;
        } else {
            document.getElementById("info").innerText = "No devices connected!";
        }
    } catch (error) {
        document.getElementById("commandOutput").innerText = `Error: ${error.message}`;
    }
}

// Function to handle Fastboot mode
async function runFastboot() {
    try {
        let selectedDevice = getSelectedDevice();
        await executeADBCommand(`adb -s ${selectedDevice} reboot bootloader`);
    } catch (error) {
        document.getElementById("commandOutput").innerText = `Error: ${error.message}`;
    }
}

// Function to sideload the ZIP file to the device
async function sideloadZip() {
    try {
        let selectedDevice = getSelectedDevice();
        let zipFilePath = document.getElementById("recoveryZip").files[0]?.path;
        if (!zipFilePath) {
            alert("Please select a ZIP file for sideloading.");
            return;
        }

        // Validate if the file is a ZIP
        if (!zipFilePath.endsWith(".zip")) {
            alert("Please select a valid ZIP file.");
            return;
        }

        await executeADBCommand(`adb -s ${selectedDevice} sideload "${zipFilePath}"`);
    } catch (error) {
        document.getElementById("commandOutput").innerText = `Error: ${error.message}`;
    }
}

// Function to reboot the device to recovery mode
async function rebootToRecovery() {
    try {
        let selectedDevice = getSelectedDevice();
        await executeADBCommand(`adb -s ${selectedDevice} reboot recovery`);
    } catch (error) {
        document.getElementById("commandOutput").innerText = `Error: ${error.message}`;
    }
}

// Get the selected device from the dropdown
function getSelectedDevice() {
    let dropdown = document.getElementById("devicesDropdown");
    if (!dropdown.value) {
        alert("Please select a device from the dropdown.");
        throw new Error("No device selected.");
    }
    return dropdown.value;
}

// Toggle theme between light and dark
document.getElementById("themeToggle").addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");
    let buttonText = document.body.classList.contains("dark-theme") ? "Switch to Light Mode" : "Switch to Dark Mode";
    document.getElementById("themeToggle").textContent = buttonText;
});

// Event listeners for sidebar navigation
document.getElementById("linkADB").addEventListener("click", function() {
    showSection("adbSection");
});

document.getElementById("linkFastboot").addEventListener("click", function() {
    showSection("fastbootSection");
});

document.getElementById("linkScrcpy").addEventListener("click", function() {
    showSection("scrcpySection");
});

// Function to show the selected section and hide others
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}


// Show the ADB section by default
showSection("adbSection");

// Initialize Neutralino and refresh devices on load
Neutralino.init();
Neutralino.events.on("windowClose", () => Neutralino.app.exit());
refreshDevices();
