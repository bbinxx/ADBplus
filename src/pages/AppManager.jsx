import React, { useEffect, useState } from "react";
import { getInstalledPackages, uninstallPackage, clearPackageData, installPackage } from "../lib/adb";
import { Search, Trash2, Eraser, RefreshCw, Package, Upload } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

export function AppManager({ selectedDevice }) {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const [type, setType] = useState("user"); // user, system, all

    useEffect(() => {
        loadApps();
    }, [selectedDevice, type]);

    const loadApps = async () => {
        if (!selectedDevice || selectedDevice.type !== 'adb') return;
        setLoading(true);
        const list = await getInstalledPackages(selectedDevice.serial, type);
        setApps(list);
        setLoading(false);
    };

    const handleInstall = async () => {
        const file = await open({
            multiple: false,
            filters: [{ name: "APK", extensions: ["apk"] }]
        });
        if (file) {
            try {
                setLoading(true);
                await installPackage(selectedDevice.serial, file);
                alert("Install Successful");
                loadApps();
            } catch (e) {
                alert("Install Failed: " + e);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUninstall = async (pkg) => {
        if (!window.confirm(`Are you sure you want to uninstall ${pkg}?`)) return;
        try {
            await uninstallPackage(selectedDevice.serial, pkg);
            loadApps();
        } catch (e) {
            alert("Uninstall failed: " + e);
        }
    };

    const handleClearData = async (pkg) => {
        if (!window.confirm(`Clear data for ${pkg}?`)) return;
        try {
            await clearPackageData(selectedDevice.serial, pkg);
            alert("Data cleared");
        } catch (e) {
            alert("Failed: " + e);
        }
    };

    const filteredApps = apps.filter(app => app.toLowerCase().includes(filter.toLowerCase()));

    if (!selectedDevice || selectedDevice.type !== 'adb') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Package size={48} className="mb-4 opacity-50" />
                <p>Connect a device in ADB mode to manage apps</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">App Manager</h2>

                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search packages..."
                            className="bg-[#1a1a1f] border border-[#27272a] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-64"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="bg-[#1a1a1f] border border-[#27272a] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    >
                        <option value="user">User Apps</option>
                        <option value="system">System Apps</option>
                        <option value="all">All Apps</option>
                    </select>

                    <button onClick={loadApps} className="p-2 hover:bg-[#27272a] rounded-lg text-gray-400 hover:text-white transition-colors" title="Refresh">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <button onClick={handleInstall} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Upload size={16} /> Install APK
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#1a1a1f] rounded-xl border border-[#27272a]">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading installed packages...</div>
                ) : filteredApps.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No apps found matching "{filter}"</div>
                ) : (
                    <div className="divide-y divide-[#27272a]">
                        {filteredApps.map(pkg => (
                            <div key={pkg} className="p-4 flex justify-between items-center hover:bg-black/20 transition-colors group">
                                <span className="text-gray-300 font-mono text-sm">{pkg}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleClearData(pkg)}
                                        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg"
                                        title="Clear Data"
                                    >
                                        <Eraser size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleUninstall(pkg)}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                        title="Uninstall"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-2 text-xs text-gray-500 px-1">
                Showing {filteredApps.length} of {apps.length} packages.
            </div>
        </div>
    );
}
