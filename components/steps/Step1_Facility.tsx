"use client";

import { HVACInputs } from "@/lib/calculations";
import { MATERIAL_DATA, MaterialKey, REGION_DATA, RegionKey } from "@/lib/cropData";

interface Props {
  inputs: HVACInputs;
  onChange: (partial: Partial<HVACInputs>) => void;
  onNext: () => void;
}

export default function Step1_Facility({ inputs, onChange, onNext }: Props) {
  const isValid = inputs.floorArea > 0 && inputs.avgHeight > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">시설 유형 & 제원</h2>
        <p className="text-sm text-gray-500">설계 대상 시설의 기본 정보를 입력하세요.</p>
      </div>

      {/* Facility type toggle */}
      <div>
        <label className="label">시설 유형</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "greenhouse",    icon: "🌿", label: "연동형 온실",  desc: "태양광 활용 재배 시설" },
            { value: "vertical_farm", icon: "🏗️", label: "수직농장",     desc: "인공조명 밀폐 재배 시설" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ facilityType: opt.value as HVACInputs["facilityType"] })}
              className={`p-4 rounded-xl border-2 text-left transition-all
                ${inputs.facilityType === opt.value
                  ? "border-green-500 bg-green-50 text-gray-900"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}
            >
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Geometry */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">바닥 면적 (m²)</label>
          <input type="number" className="input-field" placeholder="예: 2000"
            value={inputs.floorArea || ""}
            onChange={(e) => onChange({ floorArea: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label">평균 높이 (m)</label>
          <input type="number" className="input-field" placeholder="예: 5.0" step="0.1"
            value={inputs.avgHeight || ""}
            onChange={(e) => onChange({ avgHeight: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      {inputs.floorArea > 0 && inputs.avgHeight > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">체적 </span>
            <span className="font-bold text-green-700">{(inputs.floorArea * inputs.avgHeight).toLocaleString()} m³</span>
          </div>
          <div>
            <span className="text-gray-500">외피 면적 </span>
            <span className="font-bold text-green-700">
              {Math.round(inputs.floorArea * 1.15 + 4 * Math.sqrt(inputs.floorArea) * inputs.avgHeight).toLocaleString()} m²
            </span>
          </div>
        </div>
      )}

      {/* Material */}
      <div>
        <label className="label">피복재 / 벽체 재질</label>
        <select className="select-field" value={inputs.material}
          onChange={(e) => onChange({ material: e.target.value as MaterialKey })}>
          {Object.entries(MATERIAL_DATA).map(([key, mat]) => (
            <option key={key} value={key}>
              {mat.labelKo} — U={mat.uValue} W/m²K {mat.tau > 0 ? `/ 투과율 ${(mat.tau * 100).toFixed(0)}%` : "(불투명)"}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-3 gap-3 text-center text-sm">
        <div>
          <div className="text-gray-400 text-xs">열관류율 (U)</div>
          <div className="font-bold text-amber-600">{MATERIAL_DATA[inputs.material].uValue} W/m²K</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">일사 투과율 (τ)</div>
          <div className="font-bold text-sky-600">
            {MATERIAL_DATA[inputs.material].tau > 0 ? `${(MATERIAL_DATA[inputs.material].tau * 100).toFixed(0)}%` : "불투명"}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">단열 등급</div>
          <div className="font-bold text-green-600">
            {MATERIAL_DATA[inputs.material].uValue <= 1.0 ? "우수" : MATERIAL_DATA[inputs.material].uValue <= 3.5 ? "보통" : "낮음"}
          </div>
        </div>
      </div>

      {/* Climate section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">기후 정보 — 설계 외기 조건</h3>
          <p className="text-xs text-gray-500">지역을 선택하면 설계 외기 온도가 자동 적용됩니다.</p>
        </div>

        <div>
          <label className="label">지역 선택</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(REGION_DATA) as [RegionKey, typeof REGION_DATA[RegionKey]][]).map(([key, data]) => (
              <button key={key}
                onClick={() => onChange({
                  region: key,
                  maxSolarIrradiance: data.maxSolarIrradiance,
                  outdoorSummerTemp: data.designSummerTemp,
                  outdoorWinterTemp: data.designWinterTemp,
                })}
                className={`py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all text-center
                  ${inputs.region === key
                    ? "border-green-500 bg-green-50 text-gray-900"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                {data.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Summer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">하절기</div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최고 외기 온도 (°C)</label>
              <input type="number" className="input-field" step="0.5"
                value={inputs.outdoorSummerTemp ?? ""}
                onChange={(e) => onChange({ outdoorSummerTemp: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">외기 HD (g/m³)</label>
              <input type="number" className="input-field" step="0.1"
                value={inputs.outdoorHDsummer ?? ""}
                onChange={(e) => onChange({ outdoorHDsummer: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Winter */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">동절기</div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최저 외기 온도 (°C)</label>
              <input type="number" className="input-field" step="0.5"
                value={inputs.outdoorWinterTemp ?? ""}
                onChange={(e) => onChange({ outdoorWinterTemp: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">외기 HD (g/m³)</label>
              <input type="number" className="input-field" step="0.1"
                value={inputs.outdoorHDwinter ?? ""}
                onChange={(e) => onChange({ outdoorHDwinter: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
      </div>

      <button onClick={onNext} disabled={!isValid} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
        다음 단계 →
      </button>
    </div>
  );
}
