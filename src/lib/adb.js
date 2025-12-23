import { Command } from "@tauri-apps/plugin-shell";

/**
 * Executes an ADB command
 * @param {string[]} args 
 * @returns {Promise<string>} stdout
 */
export const runAdbCommand = async (args) => {
    try {
        const command = Command.create("adb", args);
        const output = await command.execute();
        if (output.code !== 0) {
            console.error("ADB Error:", output.stderr);
            throw new Error(output.stderr || "Unknown ADB Error");
        }
        return output.stdout;
    } catch (err) {
        console.error("Command Execution Failed:", err);
        throw err;
    }
};

/**
 * Executes a Fastboot command
 * @param {string[]} args 
 * @returns {Promise<string>}
 */
export const runFastbootCommand = async (args) => {
    try {
        const command = Command.create("fastboot", args);
        const output = await command.execute();
        if (output.code !== 0) {
            throw new Error(output.stderr || "Unknown Fastboot Error");
        }
        return output.stdout;
    } catch (err) {
        console.error("Fastboot Execution Failed:", err);
        throw err;
    }
};

export const getConnectedDevices = async () => {
    try {
        const stdout = await runAdbCommand(["devices", "-l"]);
        const lines = stdout.split("\n").filter(l => l.trim() && !l.startsWith("List of devices"));

        // Parse "serial device product:x model:y device:z transport_id:t"
        return lines.map(line => {
            const parts = line.split(/\s+/);
            const serial = parts[0];
            const state = parts[1]; // device, offline, unauthorized

            const modelPart = parts.find(p => p.startsWith("model:")) || "";
            const model = modelPart.split(":")[1] || "Unknown";

            return { serial, state, model, type: 'adb' };
        });
    } catch (e) {
        return [];
    }
};

export const getFastbootDevices = async () => {
    try {
        const stdout = await runFastbootCommand(["devices"]);
        const lines = stdout.split("\n").filter(l => l.trim());
        return lines.map(line => {
            const parts = line.split(/\s+/);
            return { serial: parts[0], state: 'fastboot', model: 'Fastboot Device', type: 'fastboot' };
        });
    } catch (e) {
        return [];
    }
}

export const getDeviceInfo = async (serial) => {
    if (!serial) return null;
    try {
        const [model, androidVer, batteryOut] = await Promise.all([
            runAdbCommand(["-s", serial, "shell", "getprop", "ro.product.model"]),
            runAdbCommand(["-s", serial, "shell", "getprop", "ro.build.version.release"]),
            runAdbCommand(["-s", serial, "shell", "dumpsys", "battery"])
        ]);

        // Parse Battery
        let level = "N/A";
        const levelMatch = batteryOut.match(/level: (\d+)/);
        if (levelMatch) level = levelMatch[1];

        let status = "Unknown";
        // 2: Charging, 3: Discharging, 4: Not charging, 5: Full
        const statusMatch = batteryOut.match(/status: (\d+)/);
        if (statusMatch) {
            const s = parseInt(statusMatch[1]);
            if (s === 2) status = "Charging";
            else if (s === 3) status = "Discharging";
            else if (s === 4) status = "Not Charging";
            else if (s === 5) status = "Full";
        }

        return {
            model: model.trim(),
            androidVersion: androidVer.trim(),
            batteryLevel: level,
            batteryStatus: status
        };
    } catch (e) {
        console.error("Failed to get device info", e);
        return null;
    }
};

export const getInstalledPackages = async (serial, type = "user") => {
    // type: 'user' (-3), 'system' (-s), 'all' (no flag)
    const args = ["-s", serial, "shell", "pm", "list", "packages"];
    if (type === 'user') args.push("-3");
    else if (type === 'system') args.push("-s");

    try {
        const stdout = await runAdbCommand(args);
        return stdout.split("\n")
            .filter(l => l.startsWith("package:"))
            .map(l => l.replace("package:", "").trim())
            .sort();
    } catch (e) {
        return [];
    }
};

export const uninstallPackage = async (serial, pkgName) => {
    return runAdbCommand(["-s", serial, "uninstall", pkgName]);
};

export const installPackage = async (serial, filePath) => {
    return runAdbCommand(["-s", serial, "install", "-r", filePath]);
};

export const clearPackageData = async (serial, pkgName) => {
    return runAdbCommand(["-s", serial, "shell", "pm", "clear", pkgName]);
};

/**
 * Starts tracking ADB device connections/disconnections.
 * @param {function} onChange - Callback triggered when device list changes
 * @returns {Promise<function>} - Cleanup function to stop tracking
 */
export const startDeviceTracking = async (onChange) => {
    let child = null;

    try {
        const command = Command.create("adb", ["track-devices"]);

        command.stdout.on("data", () => {
            onChange();
        });

        child = await command.spawn();
    } catch (e) {
        console.error("Failed to start device tracking:", e);
    }

    return async () => {
        if (child) {
            try {
                await child.kill();
            } catch (e) {
                console.error("Failed to kill tracking process:", e);
            }
        }
    };
};
