"use client";

import { HVACInputs } from "@/lib/calculations";
import { REGION_DATA, RegionKey } from "@/lib/cropData";

interface Props {
  inputs: HVACInputs;
  onChange: (partial: Partial<HVACInputs>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3_Light({ inputs, onChange, onNext, onBack }: Props) {
  const isGH = inputs.facilityType === "greenhouse";
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {isGH ? "태양광 설정" : "LED 조명 설정"}
        </h2>
        <p className="text-sm text-gray-500">
          {isGH ? "지역별 최대 일사량이 자동 적용됩니다." : "LED 총 소비전력의 약 90%가 현열 부하로 전환됩니다."}
        </p>
      </div>

      {isGH ? (
        <>
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
                  className={`py-2.5 px-3 rounded-lg border-2 text-xs font-medium transition-all text-center
                    ${inputs.region === key
                      ? "border-green-500 bg-green-50 text-gray-900"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                  {data.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">최대 외부 일사량 (W/m²)</label>
            <input type="number" className="input-field" value={inputs.maxSolarIrradiance || ""}
              onChange={(e) => onChange({ maxSolarIrradiance: parseFloat(e.target.value) || 0 })} />
            <p className="text-xs text-gray-400 mt-1">지역 선택 시 자동 설정 · 직접 수정 가능</p>
          </div>
          {inputs.maxSolarIrradiance > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 grid grid-cols-2 gap-3 text-center text-sm">
              <div>
                <div className="text-xs text-gray-400">내부 유효 일사량 (τ={inputs.material ? "auto" : "-"})</div>
                <div className="font-bold text-amber-600">{inputs.maxSolarIrradiance} W/m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">일사 냉방 기여 (일 최고)</div>
                <div className="font-bold text-orange-500">{Math.round(inputs.maxSolarIrradiance * inputs.floorArea / 1000)} kW</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">LED 총 소비전력 (kW)</label>
              <input type="number" className="input-field" placeholder={`예: ${Math.round(inputs.floorArea * 0.25)}`}
                value={inputs.ledTotalKw || ""}
                onChange={(e) => onChange({ ledTotalKw: parseFloat(e.target.value) || 0 })} />
              <p className="text-xs text-gray-400 mt-1">일반적으로 바닥면적 × 200–350 W/m²</p>
            </div>
            <div>
              <label className="label">일일 점등 시간 (h)</label>
              <input type="number" className="input-field" placeholder="18" min="1" max="24"
                value={inputs.lightingHours || ""}
                onChange={(e) => onChange({ lightingHours: parseFloat(e.target.value) || 18 })} />
            </div>
          </div>
          {(inputs.ledTotalKw ?? 0) > 0 && inputs.floorArea > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="text-xs text-gray-400">설치 밀도</div>
                <div className="font-bold text-amber-600">{Math.round((inputs.ledTotalKw ?? 0) * 1000 / inputs.floorArea)} W/m²</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">LED 발열</div>
                <div className="font-bold text-orange-500">{Math.round((inputs.ledTotalKw ?? 0) * 0.9 * 10) / 10} kW</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">일일 전력</div>
                <div className="font-bold text-sky-600">{Math.round((inputs.ledTotalKw ?? 0) * (inputs.lightingHours ?? 18))} kWh</div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← 이전</button>
        <button onClick={onNext} className="btn-primary flex-1">다음 단계 →</button>
      </div>
    </div>
  );
}
