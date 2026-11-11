import React from "react";

export interface StatCardProps {
  title: string | React.ReactNode;
  value: string | number;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  negative?: boolean;
  trend?: string;
  trendPositive?: boolean;
  valueColor?: string;
  statusBadge?: React.ReactNode;
  progress?: {
    value: number; // 0 to 100
    label?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  negative = false,
  trend,
  trendPositive = true,
  valueColor,
  statusBadge,
  progress,
  className = "",
  children,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 flex flex-col justify-between w-full shadow-xs transition-all hover:border-gray-300 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-gray-600 font-medium text-sm">{title}</div>
        {icon && <div className="text-gray-400 shrink-0">{icon}</div>}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              valueColor
                ? valueColor
                : negative
                ? "text-red-500"
                : "text-gray-900"
            }`}
          >
            {value}
          </h2>

          {trend && (
            <span
              className={`text-xs font-semibold tracking-tight ${
                trendPositive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend}
            </span>
          )}

          {statusBadge && <div className="inline-flex items-center">{statusBadge}</div>}
        </div>

        {progress && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(progress.value, 0), 100)}%`,
                }}
              />
            </div>
            {progress.label && (
              <span className="text-xs text-gray-500 font-medium shrink-0">
                {progress.label}
              </span>
            )}
          </div>
        )}

        {subtitle && (
          <div className="text-xs text-gray-500 mt-2 font-normal leading-relaxed">
            {subtitle}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
