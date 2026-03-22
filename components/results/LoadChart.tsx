"use client";

import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { HVACResult } from "@/lib/calculations";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-lg">
        <p className="text-gray-700 font-semibold mb-2">{label}시</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}:</span>
            <span className="font-bold" style={{ color: p.color }}>
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value} kW
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LoadChart({ result }: { result: HVACResult }) {
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-800 mb-1">24시간 부하 변동 프로파일</h3>
      <p className="text-xs text-gray-400 mb-4">현열/잠열 부하 시뮬레이션 (적층 막대)</p>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={result.hourlyProfile} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(h) => h + "h"} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "kW", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} formatter={(val) => <span style={{ color: "#64748b" }}>{val}</span>} />
          <Bar dataKey="sensible_kW" name="현열 부하" stackId="a" fill="#3b82f6" fillOpacity={0.8} radius={[0, 0, 0, 0]} />
          <Bar dataKey="latent_kW"   name="잠열 부하" stackId="a" fill="#06b6d4" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
