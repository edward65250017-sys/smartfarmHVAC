"use client";

import { HVACInputs, ahSat, rhToHd, hdToRh } from "@/lib/calculations";
import { CROP_DATA, CropKey } from "@/lib/cropData";

interface Props {
  inputs: HVACInputs;
  onChange: (partial: Partial<HVACInputs>) => void;
  onCalculate: () => void;
  onBack: () => void;
}

export default function Step4_Environment({ inputs, onChange, onCalculate, onBack }: Props) {
  const deltaTCool = Math.max(inputs.outdoorSummerTemp - inputs.targetTempDay, 0);
  const deltaTHeat = Math.max(inputs.targetTempNight - inputs.outdoorWinterTemp, 0);
  const crop = CROP_DATA[inputs.crop as CropKey];

  // Compute conversion display
  const T = inputs.targetTempDay;
  const currentRH = inputs.humidityMode === "rh"
    ? inputs.targetRH
    : Math.round(hdToRh(T, inputs.targetHD));
  const currentHD = inputs.humidityMode === "hd"
    ? inputs.targetHD
    : parseFloat(rhToHd(T, inputs.targetRH).toFixed(1));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">목표 환경 조건</h2>
        <p className="text-sm text-gray-500">내부 유지 목표 온·습도를 설정하세요. 작물 선택 시 기본값이 자동 적용됩니다.</p>
      </div>

      {/* Temperature */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">주간 목표 온도 (°C)</label>
          <input type="number" className="input-field" step="0.5" value={inputs.targetTempDay}
            onChange={(e) => onChange({ targetTempDay: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label">야간 목표 온도 (°C)</label>
          <input type="number" className="input-field" step="0.5" value={inputs.targetTempNight}
            onChange={(e) => onChange({ targetTempNight: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      {/* Humidity mode toggle */}
      <div>
        <label className="label">습도 설정 방식</label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { value: "rh", label: "상대습도 (RH %)", desc: "일반 습도계 기준" },
            { value: "hd", label: "습도 적자 (HD g/m³)", desc: "VPD 기반 작물 제어" },
          ].map((opt) => (
            <button key={opt.value}
              onClick={() => onChange({ humidityMode: opt.value as "rh" | "hd" })}
              className={`p-3 rounded-xl border-2 text-left transition-all
                ${inputs.humidityMode === opt.value
                  ? "border-cyan-500 bg-cyan-50 text-gray-900"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
              <div className="font-semibold text-xs">{opt.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>

        {inputs.humidityMode === "rh" ? (
          <div>
            <label className="label">목표 상대습도 (%)</label>
            <input type="number" className="input-field" min="40" max="95" value={inputs.targetRH}
              onChange={(e) => onChange({ targetRH: parseFloat(e.target.value) || 0 })} />
          </div>
        ) : (
          <div>
            <label className="label">목표 HD (g/m³)</label>
            <input type="number" className="input-field" step="0.1" min="0" max="20" value={inputs.targetHD}
              onChange={(e) => onChange({ targetHD: parseFloat(e.target.value) || 0 })} />
            {crop && (
              <p className="text-xs text-cyan-600 mt-1">
                {crop.labelKo} 권장 HD 범위: <span className="font-bold">{crop.hdRange}</span>
              </p>
            )}
          </div>
        )}

        {/* Conversion display */}
        <div className="mt-3 bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2 flex gap-4 text-xs">
          <div>
            <span className="text-gray-400">RH </span>
            <span className="font-bold text-cyan-700">{currentRH}%</span>
          </div>
          <div className="text-gray-300">↔</div>
          <div>
            <span className="text-gray-400">HD </span>
            <span className="font-bold text-cyan-700">{currentHD} g/m³</span>
          </div>
          <div>
            <span className="text-gray-400">포화절대습도 </span>
            <span className="font-bold text-gray-600">{ahSat(T).toFixed(1)} g/m³</span>
          </div>
        </div>
      </div>

      {/* Delta-T cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs text-blue-500 mb-1 font-medium uppercase tracking-wide">냉방 설계 온도차 (ΔT)</div>
          <div className="text-3xl font-bold text-blue-600">{deltaTCool}°C</div>
          <div className="text-xs text-gray-400 mt-1">외기 {inputs.outdoorSummerTemp}°C → 내부 {inputs.targetTempDay}°C</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-xs text-orange-500 mb-1 font-medium uppercase tracking-wide">난방 설계 온도차 (ΔT)</div>
          <div className="text-3xl font-bold text-orange-500">{deltaTHeat}°C</div>
          <div className="text-xs text-gray-400 mt-1">외기 {inputs.outdoorWinterTemp}°C → 내부 {inputs.targetTempNight}°C</div>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">설계 조건 요약</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["시설 유형", inputs.facilityType === "greenhouse" ? "연동형 온실" : "수직농장"],
            ["바닥 면적",  `${inputs.floorArea.toLocaleString()} m²`],
            ["체적",       `${(inputs.floorArea * inputs.avgHeight).toLocaleString()} m³`],
            ["작물",       crop ? crop.labelKo : inputs.crop],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-800 font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← 이전</button>
        <button onClick={onCalculate}
          className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold
                     px-6 py-3 rounded-xl transition-all duration-150 text-base shadow-md shadow-green-100">
          🧮 부하 계산 실행
        </button>
      </div>
    </div>
  );
}
