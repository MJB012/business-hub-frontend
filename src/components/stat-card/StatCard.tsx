import React from "react";
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    negative?: boolean;
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    negative = false,
}: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl border-[#0000001a] outline outline-[#0000001a] p-6 flex flex-col justify-between w-full">
            <div className="flex items-center justify-between">
                <p className="text-gray-500 font-medium">{title}</p>
                {icon && <div className="text-gray-400">{icon}</div>}
            </div>

            <div className="mt-6">
                <h2
                    className={`text-3xl font-bold ${negative ? "text-red-500" : "text-black"}`}
                >
                    {value}
                </h2>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}
