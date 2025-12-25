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

/**
 * Lists files in a specific directory on the device
 * @param {string} serial 
 * @param {string} path 
 * @returns {Promise<Array>} List of files
 */
export const listFiles = async (serial, path) => {
    try {
        const stdout = await runAdbCommand(["-s", serial, "shell", "ls", "-pl", path]);
        const lines = stdout.split("\n");

        const files = lines
            .filter(line => line.trim() !== "" && !line.startsWith("total"))
            .map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 6) return null; // Not enough parts 
                if (!/^[d-]/.test(parts[0])) return null;

                let nameIndex = 7;
                // Heuristic: Check if parts[6] or parts[7] looks like time/year
                const timeRegex = /^(\d{2}:\d{2}|\d{4})$/;
                if (timeRegex.test(parts[6])) nameIndex = 7;
                else if (timeRegex.test(parts[7])) nameIndex = 8;
                else nameIndex = 7;

                if (parts.length < nameIndex + 1) return null;

                const name = parts.slice(nameIndex).join(" ");
                if (!name || name === "." || name === "..") return null;

                const isDir = parts[0].startsWith("d");
                const cleanName = name.endsWith('/') ? name.slice(0, -1) : name;

                // Fix path double slashes
                const fullPath = path.endsWith('/') ? path + cleanName : path + '/' + cleanName;

                return {
                    permissions: parts[0],
                    owner: parts[2],
                    group: parts[3],
                    size: parts[4],
                    date: parts[5] + " " + parts[6],
                    name: cleanName,
                    isDirectory: isDir,
                    path: fullPath
                };
            })
            .filter(f => f !== null);

        return files;
    } catch (e) {
        console.error("List files failed", e);
        return [];
    }
};

export const getMediaFiles = async (serial) => {
    try {
        const stdout = await runAdbCommand([
            "-s", serial, "shell", "content", "query",
            "--uri", "content://media/external/images/media",
            "--projection", "_id:_data:bucket_display_name:date_added:mime_type",
            "--sort", "date_added DESC"
        ]);

        return stdout.split("\n")
            .filter(l => l.startsWith("Row:"))
            .map(line => {
                const map = {};
                // Row: 0 _id=123, _data=/path/..., key=val...
                const content = line.substring(line.indexOf(" ") + 1); // remove "Row: "
                const pairs = content.split(", ");

                pairs.forEach(p => {
                    const eqIdx = p.indexOf("=");
                    if (eqIdx > -1) {
                        const key = p.substring(0, eqIdx).trim();
                        const val = p.substring(eqIdx + 1);
                        map[key] = val;
                    }
                });

                if (!map._data) return null;

                return {
                    id: map._id,
                    path: map._data,
                    album: map.bucket_display_name || "Unknown",
                    date: parseInt(map.date_added) * 1000,
                    mime: map.mime_type,
                    name: map._data.split("/").pop()
                };
            })
            .filter(i => i !== null);
    } catch (e) {
        console.error("Get media files failed", e);
        return [];
    }
};

export const pullFile = async (serial, devicePath, localPath) => {
    return runAdbCommand(["-s", serial, "pull", devicePath, localPath]);
};

export const pushFile = async (serial, localPath, devicePath) => {
    return runAdbCommand(["-s", serial, "push", localPath, devicePath]);
};

export const deleteFile = async (serial, devicePath) => {
    return runAdbCommand(["-s", serial, "shell", "rm", "-rf", devicePath]);
};

export const createDirectory = async (serial, path) => {
    return runAdbCommand(["-s", serial, "shell", "mkdir", "-p", path]);
};

export const renameFile = async (serial, oldPath, newPath) => {
    return runAdbCommand(["-s", serial, "shell", "mv", oldPath, newPath]);
};
