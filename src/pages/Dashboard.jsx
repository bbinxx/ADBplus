import React, { useEffect, useState } from "react";
import { getDeviceInfo } from "../lib/adb";
import { Battery, Smartphone, Activity } from "lucide-react";

export function Dashboard({ selectedDevice }) {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedDevice?.serial && selectedDevice?.type === 'adb') {
            setLoading(true);
            getDeviceInfo(selectedDevice.serial).then((data) => {
                setInfo(data);
                setLoading(false);
            });
        } else {
            setInfo(null);
        }
    }, [selectedDevice]);

    if (!selectedDevice) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Smartphone size={48} className="mb-4 opacity-50" />
                <p className="text-xl">No device selected</p>
                <p className="text-sm">Connect a device and select it from the dropdown</p>
            </div>
        );
    }

    if (selectedDevice.type === 'fastboot') {
        return (
            <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-white">Device Dashboard</h2>
                <div className="bg-orange-900/20 border border-orange-500/30 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-orange-400 mb-2">Fastboot Mode</h3>
                    <p className="text-gray-300">Device is in Fastboot/Bootloader mode. Limited information available.</p>
                    <p className="mt-2 text-sm text-gray-400">Serial: {selectedDevice.serial}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-white">Device Overview</h2>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading device info...</div>
            ) : info ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoCard
                        icon={<Smartphone className="text-blue-400" />}
                        label="Model"
                        value={info.model}
                    />
                    <InfoCard
                        icon={<Activity className="text-green-400" />}
                        label="Android Version"
                        value={info.androidVersion}
                    />
                    <InfoCard
                        icon={<Battery className={getBatteryColor(info.batteryLevel)} />}
                        label="Battery"
                        value={`${info.batteryLevel}% (${info.batteryStatus})`}
                    />
                </div>
            ) : (
                <div className="text-red-400">Failed to load device info</div>
            )}

            <div className="mt-8 bg-[#1a1a1f] p-6 rounded-xl border border-[#27272a]">
                <h3 className="text-lg font-semibold mb-4 text-gray-200">Quick Actions</h3>
                <p className="text-gray-500 text-sm">Select a tab from the sidebar to manage apps, files, or execute commands.</p>
            </div>
        </div>
    );
}

function InfoCard({ icon, label, value }) {
    return (
        <div className="bg-[#1a1a1f] p-6 rounded-xl border border-[#27272a] shadow-lg flex items-center gap-4 hover:border-blue-500/50 transition-colors">
            <div className="p-3 bg-black/30 rounded-lg">{icon}</div>
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-lg font-semibold text-white">{value}</p>
            </div>
        </div>
    );
}

function getBatteryColor(level) {
    const l = parseInt(level);
    if (isNaN(l)) return "text-gray-400";
    if (l > 60) return "text-green-400";
    if (l > 20) return "text-yellow-400";
    return "text-red-500";
}
