"use client";

import { HVACInputs } from "@/lib/calculations";
import { CROP_DATA, CropKey } from "@/lib/cropData";

interface Props {
  inputs: HVACInputs;
  onChange: (partial: Partial<HVACInputs>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2_Crop({ inputs, onChange, onNext, onBack }: Props) {
  const crop = CROP_DATA[inputs.crop as CropKey];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">작물 정보</h2>
        <p className="text-sm text-gray-500">재배 작물을 선택하면 LAI와 증산 계수가 자동으로 설정됩니다.</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {(Object.entries(CROP_DATA) as [CropKey, typeof CROP_DATA[CropKey]][]).map(([key, data]) => (
          <button key={key}
            onClick={() => onChange({ crop: key, targetTempDay: data.targetTempDay, targetTempNight: data.targetTempNight, targetRH: data.targetRH })}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm
              ${inputs.crop === key
                ? "border-green-500 bg-green-50 text-gray-900"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
            <span className="text-2xl">{data.icon}</span>
            <span className="font-medium text-xs">{data.labelKo}</span>
          </button>
        ))}
      </div>

      {crop && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{crop.icon}</span>
            <span className="font-bold text-green-700">{crop.labelKo}</span>
            <span className="text-gray-400 text-sm">({crop.label})</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">엽면적지수 (LAI)</div>
              <div className="text-xl font-bold text-amber-600">{crop.lai}</div>
              <div className="text-xs text-gray-400 mt-1">증산 능력 기준 지표</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">증산 보정 계수 (f)</div>
              <div className="text-xl font-bold text-sky-600">{crop.fCrop}</div>
              <div className="text-xs text-gray-400 mt-1">광량→증산 변환 효율</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">WUR/RDA 기준 증산량</div>
              <div className="font-bold text-cyan-600">{crop.transpBenchLm2day} L/m²/day</div>
              <div className="text-xs text-gray-400 mt-1">실측 벤치마크</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">설계 HD 범위</div>
              <div className="font-bold text-violet-600">{crop.hdRange}</div>
              <div className="text-xs text-gray-400 mt-1">권장 습도부족분</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">주간 적정온도</div>
              <div className="font-bold text-orange-500">{crop.targetTempDay}°C</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">야간 적정온도</div>
              <div className="font-bold text-blue-500">{crop.targetTempNight}°C</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">목표 상대습도</div>
              <div className="font-bold text-cyan-600">{crop.targetRH}%</div>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-amber-500 text-sm mt-0.5">💡</span>
            <p className="text-xs text-amber-700 leading-relaxed">{crop.notes}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← 이전</button>
        <button onClick={onNext} className="btn-primary flex-1">다음 단계 →</button>
      </div>
    </div>
  );
}
