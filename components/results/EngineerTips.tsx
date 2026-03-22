"use client";

import { HVACResult, HVACInputs } from "@/lib/calculations";
import { CROP_DATA, CropKey } from "@/lib/cropData";

interface Tip { level: "info" | "warning" | "critical"; icon: string; title: string; body: string; }

function generateTips(result: HVACResult, inputs: HVACInputs): Tip[] {
  const tips: Tip[] = [];
  const crop = CROP_DATA[inputs.crop as CropKey];
  const latentRatio = result.latentLoad_kW / Math.max(result.totalLoad_kW, 0.1);

  if (latentRatio > 0.5)
    tips.push({ level: "warning", icon: "💧", title: "잠열 비중 높음 — 고성능 제습 권장",
      body: "총 냉방 부하 중 잠열 비중이 " + Math.round(latentRatio * 100) + "%에 달합니다. " + (crop ? crop.labelKo : inputs.crop) + "의 LAI(" + (crop ? crop.lai : "-") + ") 특성상 하절기 증산량이 크므로, 단순 냉방기보다 제습 특화형 선택을 권장합니다." });

  if (crop && crop.lai >= 3.5)
    tips.push({ level: "info", icon: "🌿", title: crop.labelKo + ": 고LAI 작물 기류 설계",
      body: "LAI " + crop.lai + " 수준의 밀집 군락은 하층부 공기 정체를 유발합니다. 팬 배치 시 상·하부 교차 순환 방식을 적용하고, ACH " + result.ACH + "회 이상을 유지하세요." });

  if (inputs.facilityType === "vertical_farm" && (inputs.ledTotalKw ?? 0) > 0) {
    const ledShare = ((inputs.ledTotalKw ?? 0) * 0.9) / Math.max(result.totalLoad_kW / 1.2, 0.1);
    if (ledShare > 0.6)
      tips.push({ level: "warning", icon: "💡", title: "LED 발열이 주요 냉방 부하",
        body: "현열 부하의 " + Math.round(ledShare * 100) + "%가 LED 발열에서 기인합니다. LED 위치별 국소 냉방 또는 LED 상부 에어덕트 배치를 통해 균일한 온도 분포를 확보하세요." });
  }

  if (result.designHeating_kW > result.designCooling_kW * 0.8)
    tips.push({ level: "info", icon: "🔥", title: "난방 부하가 냉방에 근접",
      body: "동절기 난방 부하(" + result.designHeating_kW + " kW)가 냉방 부하의 80% 이상입니다. 에너지 절감을 위해 열 회수형 환기장치(HRV) 및 다중 커튼 시스템 적용을 검토하세요." });

  if (result.transpirationDesign_Lh > 50)
    tips.push({ level: "critical", icon: "⚠️", title: "대용량 제습 필요 — " + result.transpirationDesign_Lh + " L/h",
      body: "시간당 " + result.transpirationDesign_Lh + " L 이상의 제습이 필요합니다. 복수 분산 설치를 권장하며, 제습 응축수 회수(관개 재활용) 시스템도 함께 계획하세요." });

  if (result.HD < 2)
    tips.push({ level: "warning", icon: "💦", title: "HD 낮음 — 병해 리스크 주의",
      body: "설계 HD " + result.HD + " g/m³는 병해균 증식 임계값에 근접합니다. 야간 환기 제어 또는 제습기 증설로 HD 2 g/m³ 이상 유지를 권장합니다." });

  if (crop)
    tips.push({ level: "info", icon: "📋", title: crop.labelKo + " 표준 설계 노트", body: crop.notes });
  return tips;
}

const LEVEL_STYLE = {
  info:     { border: "border-gray-200",    bg: "bg-gray-50",    icon: "text-blue-500",   title: "text-gray-800" },
  warning:  { border: "border-amber-200",   bg: "bg-amber-50",   icon: "text-amber-500",  title: "text-amber-800" },
  critical: { border: "border-red-200",     bg: "bg-red-50",     icon: "text-red-500",    title: "text-red-700"   },
};

export default function EngineerTips({ result, inputs }: { result: HVACResult; inputs: HVACInputs }) {
  const tips = generateTips(result, inputs);
  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-800 mb-3">엔지니어 권고 사항</h3>
      <div className="space-y-3">
        {tips.map((tip, i) => {
          const s = LEVEL_STYLE[tip.level];
          return (
            <div key={i} className={"border " + s.border + " " + s.bg + " rounded-lg p-3"}>
              <div className="flex items-start gap-2">
                <span className={"text-base " + s.icon + " mt-0.5 flex-shrink-0"}>{tip.icon}</span>
                <div>
                  <div className={"text-xs font-semibold " + s.title + " mb-1"}>{tip.title}</div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
