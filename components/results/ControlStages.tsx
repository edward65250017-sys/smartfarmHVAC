"use client";

import { ControlStage } from "@/lib/calculations";

const COLOR_MAP = {
  blue:  { border: "border-blue-200",  bg: "bg-blue-50",  text: "text-blue-700",  badge: "bg-blue-200 text-blue-800" },
  green: { border: "border-green-200", bg: "bg-green-50", text: "text-green-700", badge: "bg-green-200 text-green-800" },
  amber: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-200 text-amber-800" },
  red:   { border: "border-red-200",   bg: "bg-red-50",   text: "text-red-700",   badge: "bg-red-200 text-red-800" },
};

export default function ControlStages({ stages }: { stages: ControlStage[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-800 mb-3">4단계 제어 알고리즘</h3>
      <div className="space-y-3">
        {stages.map((stage) => {
          const c = COLOR_MAP[stage.color];
          return (
            <div key={stage.code} className={`border ${c.border} ${c.bg} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{stage.code}</span>
                <span className={`text-sm font-bold ${c.text}`}>{stage.name}</span>
                <span className="ml-auto text-xs text-gray-500 font-mono bg-white/70 px-2 py-0.5 rounded">{stage.trigger}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-2">
                {stage.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.text.replace("text-", "bg-")}`} />
                    {action}
                  </div>
                ))}
              </div>
              <div className={`text-xs ${c.text} font-medium border-t ${c.border} pt-2 mt-2`}>
                💡 {stage.tip}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
