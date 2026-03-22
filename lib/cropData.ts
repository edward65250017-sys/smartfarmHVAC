// ─── 작물 데이터 (v4 알고리즘 기준) ─────────────────────────────────────────
export type CropKey = "to" | "cu" | "st" | "le" | "pe";

export interface CropProfile {
  label: string;
  labelKo: string;
  icon: string;
  lai: number;
  fCrop: number;
  transpBenchLm2day: number;  // WUR/RDA 실측 기준 (L/m²/day)
  hdRange: string;
  targetTempDay: number;
  targetTempNight: number;
  targetRH: number;
  notes: string;
  tip: string;
}

export const CROP_DATA: Record<CropKey, CropProfile> = {
  to: {
    label: "Tomato", labelKo: "토마토", icon: "🍅",
    lai: 3.5, fCrop: 0.70, transpBenchLm2day: 4.0,
    hdRange: "3–7 g/m³",
    targetTempDay: 25, targetTempNight: 18, targetRH: 75,
    notes: "LAI 3.5로 잠열 부하 비중이 높습니다. 냉각·제습 복합 유닛을 권장합니다.",
    tip: "LAI 3.5로 잠열 부하 비중이 높습니다. 냉각·제습 복합 유닛을 권장합니다.",
  },
  cu: {
    label: "Cucumber", labelKo: "오이", icon: "🥒",
    lai: 4.0, fCrop: 0.80, transpBenchLm2day: 5.0,
    hdRange: "3–7 g/m³",
    targetTempDay: 24, targetTempNight: 20, targetRH: 75,
    notes: "증산 계수가 최고 수준입니다. 제습 용량 10–15% 추가 여유 확보를 권장합니다.",
    tip: "증산 계수 최고. 제습 용량 10–15% 추가 여유 확보 권장.",
  },
  st: {
    label: "Strawberry", labelKo: "딸기", icon: "🍓",
    lai: 2.0, fCrop: 0.50, transpBenchLm2day: 2.5,
    hdRange: "2–5 g/m³",
    targetTempDay: 20, targetTempNight: 12, targetRH: 65,
    notes: "저온성 작물로 야간 HD 하락 시 잿빛곰팡이 리스크가 급증합니다.",
    tip: "저온성 작물로 야간 HD 하락 시 잿빛곰팡이 리스크가 급증합니다.",
  },
  le: {
    label: "Lettuce", labelKo: "상추", icon: "🥬",
    lai: 1.5, fCrop: 0.40, transpBenchLm2day: 2.0,
    hdRange: "1–4 g/m³",
    targetTempDay: 20, targetTempNight: 16, targetRH: 70,
    notes: "HD 과도 시 팁번 유발 — 1.5–3 g/m³ 유지가 최적입니다.",
    tip: "HD 과도 시 팁번 유발—1.5–3 g/m³ 유지가 최적입니다.",
  },
  pe: {
    label: "Pepper", labelKo: "파프리카", icon: "🫑",
    lai: 3.0, fCrop: 0.65, transpBenchLm2day: 3.5,
    hdRange: "3–7 g/m³",
    targetTempDay: 22, targetTempNight: 18, targetRH: 70,
    notes: "VPD 기반 HD 제어 전략 수립 및 제습 용량을 충분히 확보하세요.",
    tip: "VPD 기반 HD 제어 전략 수립 및 제습 용량 충분히 확보하세요.",
  },
};

// ─── 피복재 / 외피재 (v4 기준) ───────────────────────────────────────────────
export type MaterialKey = "gs" | "gd" | "ps" | "pd" | "ep";

export interface MaterialProfile {
  label: string; labelKo: string;
  uValue: number; tau: number;
}

export const MATERIAL_DATA: Record<MaterialKey, MaterialProfile> = {
  gs: { label: "Glass (Single)",         labelKo: "유리 (단층)",       uValue: 5.8, tau: 0.88 },
  gd: { label: "Glass (Double)",         labelKo: "유리 (복층)",       uValue: 3.0, tau: 0.75 },
  ps: { label: "PO Film (Single)",       labelKo: "PO필름 (단층)",     uValue: 7.0, tau: 0.90 },
  pd: { label: "PO Film (Double)",       labelKo: "PO필름 (이중)",     uValue: 4.0, tau: 0.82 },
  ep: { label: "Sandwich Panel",         labelKo: "샌드위치 판넬",     uValue: 1.5, tau: 0.00 },
};

// ─── 지역 기상 데이터 (v4 기준) ──────────────────────────────────────────────
export type RegionKey = "se" | "cc" | "hn" | "jj";

export interface RegionProfile {
  label: string;
  maxSolarIrradiance: number;  // W/m²
  designSummerTemp: number;
  designWinterTemp: number;
}

export const REGION_DATA: Record<RegionKey, RegionProfile> = {
  se: { label: "서울 / 경기",    maxSolarIrradiance: 850, designSummerTemp: 35, designWinterTemp: -10 },
  cc: { label: "충청 / 전북",    maxSolarIrradiance: 870, designSummerTemp: 35, designWinterTemp:  -8 },
  hn: { label: "전남 / 경남",    maxSolarIrradiance: 900, designSummerTemp: 34, designWinterTemp:  -5 },
  jj: { label: "제주",           maxSolarIrradiance: 920, designSummerTemp: 32, designWinterTemp:   2 },
};
