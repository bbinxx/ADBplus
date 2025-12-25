import React, { useState, useEffect } from "react";
import { getConnectedDevices, getFastbootDevices, startDeviceTracking } from "../lib/adb";
import { RefreshCw, Smartphone, Monitor } from "lucide-react";
import { STRINGS } from "../data/strings";

export function DeviceSelector({ selectedDevice, onSelect, className }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        setLoading(true);
        const [adbDevs, fastbootDevs] = await Promise.all([
            getConnectedDevices(),
            getFastbootDevices()
        ]);
        const all = [...adbDevs, ...fastbootDevs];
        setDevices(all);

        // Auto Select first if none selected or selection lost
        if (all.length > 0 && (!selectedDevice || !all.find(d => d.serial === selectedDevice.serial))) {
            onSelect(all[0]);
        } else if (all.length === 0) {
            onSelect(null);
        }

        setLoading(false);
    };

    useEffect(() => {
        let cleanup = null;
        let debounceTimer = null;

        const handleChange = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                refresh();
            }, 500);
        };

        const initTracking = async () => {
            await refresh(); // Initial check
            cleanup = await startDeviceTracking(handleChange);
        };

        initTracking();

        return () => {
            if (cleanup) cleanup();
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, []); // eslint-disable-line

    return (
        <div className={`flex items-center gap-4 bg-[#1a1a1f] border border-[#27272a] rounded-lg p-1.5 px-3 shadow-xl ${className}`}>
            <div className="flex items-center gap-2 text-gray-400">
                <span className="text-xs uppercase font-bold tracking-wider">{STRINGS.device.label}</span>
            </div>

            <div className="relative">
                <select
                    value={selectedDevice?.serial || ""}
                    onChange={(e) => {
                        const dev = devices.find(d => d.serial === e.target.value);
                        onSelect(dev || null);
                    }}
                    className="bg-black/30 border-none text-white text-sm rounded cursor-pointer min-w-[200px] py-1 pl-2 pr-8 appearance-none focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    {devices.length === 0 ? (
                        <option value="">{STRINGS.device.noDevicesFound}</option>
                    ) : (
                        devices.map(d => (
                            <option key={d.serial} value={d.serial}>
                                {d.model} ({d.serial}) - {d.type.toUpperCase()}
                            </option>
                        ))
                    )}
                </select>
                {/* Custom Arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
            </div>

            <button onClick={refresh} className="text-gray-400 hover:text-white transition-colors" title="Refresh">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
    );
}
