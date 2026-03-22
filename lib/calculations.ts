/**
 * SmartFarm HVAC Calculation Engine — v4 알고리즘
 * 참조: smartfarm_hvac_full_v4_20260317.html (글로벌스마트팜연구소)
 */
import { CROP_DATA, MATERIAL_DATA, CropKey, MaterialKey } from "./cropData";

export const SAFETY_FACTOR = 1.2;

// ── 습공기 함수 (Magnus 공식) ──────────────────────────────────────────────
export function esat(T: number): number {
  return 6.112 * Math.exp(17.67 * T / (T + 243.5));
}
export function ahSat(T: number): number {
  return 217 * esat(T) / (T + 273.15);
}
export function rhToHd(T: number, rh: number): number {
  return ahSat(T) * (1 - rh / 100);
}
export function hdToRh(T: number, hd: number): number {
  return Math.max(10, Math.min(99, (ahSat(T) - hd) / ahSat(T) * 100));
}

// ── 입력 스키마 ────────────────────────────────────────────────────────────
export interface HVACInputs {
  facilityType: "greenhouse" | "vertical_farm";
  floorArea: number;
  avgHeight: number;
  material: MaterialKey;
  crop: CropKey;
  region?: string;
  maxSolarIrradiance: number;
  ledTotalKw?: number;
  lightingHours?: number;
  targetTempDay: number;
  targetTempNight: number;
  humidityMode: "rh" | "hd";
  targetRH: number;
  targetHD: number;
  outdoorSummerTemp: number;
  outdoorHDsummer: number;
  outdoorWinterTemp: number;
  outdoorHDwinter: number;
}

// ── 4단계 제어 스테이지 ────────────────────────────────────────────────────
export interface ControlStage {
  code: string;
  name: string;
  trigger: string;
  actions: string[];
  tip: string;
  color: "blue" | "green" | "amber" | "red";
}

// ── 출력 스키마 ────────────────────────────────────────────────────────────
export interface HVACResult {
  sensibleLoad_kW: number;
  latentLoad_kW: number;
  totalLoad_kW: number;
  designCooling_kW: number;
  designCooling_RT: number;
  designCooling_kcalh: number;
  designHeating_kW: number;
  designHeating_kcalh: number;
  latentPercent: number;
  transpiration_Lh: number;
  transpirationAvg_Lh: number;
  transpirationNight_Lh: number;
  transpirationDesign_Lh: number;
  transpirationPeak_gm2h: number;
  ahuCoil_kW: number;
  ahuCoil_RT: number;
  ahuReheat_kW: number;
  ahuCoilLh: number;
  ahuN: number;
  Q_solar_kW: number;
  Q_cond_kW: number;
  Q_scrOffset_kW: number;
  Q_fog_kW: number;
  fogN: number;
  fogPumpLh: number;
  Q_vent_kW: number;
  Q_mechDesign_kW: number;
  Q_mechDesign_RT: number;
  Q_heatAdj_kW: number;
  Q_heatScrOffset_kW: number;
  AH_in: number;
  HD: number;
  AH_sum_out: number;
  AH_win_out: number;
  dAH_nat: number;
  dAH_day: number;
  dAH_night: number;
  dehu_nat_Lh: number;
  dehu_day_Lh: number;
  dehu_night_Lh: number;
  coverageNight: number;
  dehN: number;
  fanN: number;
  fanTotalCMH: number;
  cirN: number;
  acN: number;
  htN: number;
  screenArea: number;
  CMH: number;
  ACH: number;
  envelopeArea_m2: number;
  roofArea_m2: number;
  wallArea_m2: number;
  volume_m3: number;
  uValue: number;
  tau: number;
  internalIrradiance_Wm2: number;
  RH: number;
  hourlyProfile: { hour: number; sensible_kW: number; latent_kW: number }[];
  controlStages: ControlStage[];
}

// ── 핵심 계산 함수 ─────────────────────────────────────────────────────────
export function calculateHVAC(inputs: HVACInputs): HVACResult {
  const crop = CROP_DATA[inputs.crop];
  const mat  = MATERIAL_DATA[inputs.material];
  const { floorArea: fl, avgHeight: h, facilityType: FT } = inputs;

  // 면적 / 체적 (v4: 벽면 + 지붕*1.15)
  const sl  = Math.sqrt(fl);
  const wA  = 4 * sl * h;
  const rA  = fl * 1.15;
  const eA  = wA + rA;
  const vol = fl * h;

  // 외기 절대습도
  const AH_sum_out = Math.max(0, ahSat(inputs.outdoorSummerTemp) - inputs.outdoorHDsummer);
  const AH_win_out = Math.max(0, ahSat(inputs.outdoorWinterTemp) - inputs.outdoorHDwinter);

  // 내부 HD / RH 환산
  const dT = inputs.targetTempDay;
  let hd: number, rh: number;
  if (inputs.humidityMode === "hd") {
    hd = inputs.targetHD;
    rh = hdToRh(dT, hd);
  } else {
    rh = inputs.targetRH;
    hd = rhToHd(dT, rh);
  }
  const AH_in = ahSat(dT) - hd;

  // 설계 온도차
  const dTs = Math.max(0, inputs.outdoorSummerTemp - dT);
  const dTw = Math.max(0, inputs.targetTempNight - inputs.outdoorWinterTemp);

  // ── 현열 / 잠열 부하 ────────────────────────────────────────────────────
  let Qs: number, rI: number, ledW = 0;
  const lhvVal = inputs.lightingHours ?? 18;
  if (FT === "greenhouse") {
    rI = inputs.maxSolarIrradiance * mat.tau;
    Qs = (eA * mat.uValue * dTs + rI * fl) / 1000;
  } else {
    ledW = (inputs.ledTotalKw ?? 0) * 1000;
    rI   = (ledW * 0.4) / Math.max(fl, 1);
    Qs   = (eA * mat.uValue * dTs + ledW * 0.9) / 1000;
  }
  const E_Lh = crop.fCrop * rI * fl * 3600 / 2450000;
  const QL   = E_Lh * 2450 / 3600;
  const Qn   = Qs + QL;
  const Qc   = Qn * SAFETY_FACTOR;
  const QcRT = Qc / 3.517;
  const QcK  = Qc * 860;

  // ── 난방 (온실: 보온스크린으로 지붕 열손실 50% 절감) ──────────────────────
  let Qhw: number;
  if (FT === "greenhouse") {
    Qhw = (wA * mat.uValue * dTw + rA * mat.uValue * dTw * 0.50) / 1000 * SAFETY_FACTOR;
  } else {
    Qhw = eA * mat.uValue * dTw / 1000 * SAFETY_FACTOR;
  }
  const QhK = Qhw * 860;
  const Q_heatScrOffset = FT === "greenhouse" ? (rA * mat.uValue * dTw * 0.50) / 1000 : 0;

  // ── CMH ──────────────────────────────────────────────────────────────────
  const CMH = fl * h * (FT === "greenhouse" ? 1.0 : 0.5);
  const ACH = CMH / vol;

  // ── WUR/RDA 증산 벤치마크 ─────────────────────────────────────────────────
  const transpPerM2Day = crop.transpBenchLm2day;
  const E_gm2h_avg   = transpPerM2Day * 1000 / 24;
  const E_gm2h_peak  = E_gm2h_avg * 1.8;
  const transpDay_lh = FT === "greenhouse"
    ? transpPerM2Day * fl
    : transpPerM2Day * fl * (lhvVal / 16);
  const E_avg_lh = transpDay_lh / 24;

  const E_night_gm2h  = E_gm2h_avg * 0.45;
  const E_night_lh    = E_night_gm2h * fl / 1000;
  const PRACTICAL_CEIL = 50;
  const E_design_gm2h = Math.min(E_night_gm2h, PRACTICAL_CEIL);
  const E_design_lh   = E_design_gm2h * fl / 1000;

  // ── AHU 냉각코일 ──────────────────────────────────────────────────────────
  const Q_lat        = E_design_lh * 2500 / 3600;
  const Q_sens_coil  = Q_lat * 0.40;
  const Q_reheat     = Q_sens_coil * 0.45;
  const Q_coil_raw   = (Q_lat + Q_sens_coil) * SAFETY_FACTOR;
  const Q_coil_cap   = (FT === "greenhouse" ? 100 : 200) * fl / 1000;
  const Q_coil_total = FT === "greenhouse"
    ? Math.min(Q_coil_raw, Q_coil_cap)
    : Q_coil_raw;
  const RT_coil    = Q_coil_total / 3.517;
  const ahuN       = Math.max(1, Math.ceil(Q_coil_total / 50));
  const ahu_coil_lh= Math.min(E_design_lh, Q_coil_total * 3600 / 2500);

  // ── 부하 성분 분리 ────────────────────────────────────────────────────────
  const Q_solar = FT === "greenhouse" ? rI * fl / 1000 : ledW * 0.9 / 1000;
  const Q_cond  = (eA * mat.uValue * dTs) / 1000;

  const scr          = FT === "greenhouse" ? 0.60 : 0.0;
  const Q_solar_r    = Q_solar * (1 - scr);
  const Q_scr_offset = Q_solar * scr;

  const fogNozzle    = 3.5;
  const Q_fog_target = Q_solar * 0.30;
  const fogCoolLH2   = Q_fog_target * 860 / 580;
  const fogN         = Math.max(4, Math.ceil(fogCoolLH2 / fogNozzle));
  const fogPumpLh    = Math.ceil(fogN * fogNozzle * 1.2);
  const Q_fog_kW     = fogN * fogNozzle * (2450 / 3600);

  const Q_vent    = FT === "greenhouse" ? Q_cond * 0.20 : 0;
  const Q_coil_lat= QL * 0.25;

  const Q_mech_s      = Math.max(0, Q_cond + Q_solar_r - Q_fog_kW - Q_vent);
  const Q_mech_net    = Q_mech_s + Q_coil_lat;
  const Q_mech_design = Q_mech_net * SAFETY_FACTOR;
  const QcRT_mech     = Q_mech_design / 3.517;

  // ── 설비 대수 ─────────────────────────────────────────────────────────────
  const acN         = Math.max(1, Math.ceil(QcRT_mech / 20));
  const htN         = Math.max(1, Math.ceil(Qhw / 50));
  const fanN        = Math.max(2, Math.ceil(CMH * 1.2 / 35000));
  const fanTotalCMH = fanN * 35000;
  const cirN        = Math.ceil(vol * 10 / 4500);
  const screenArea  = Math.round(fl * 1.15);

  // ── ΔAH 계산 ──────────────────────────────────────────────────────────────
  const AH_nat_out    = ahSat(dT) * 0.60;
  const dAH_nat       = AH_in - AH_nat_out;
  const dAH_day       = AH_in - AH_sum_out;
  const dAH_night     = AH_in - AH_win_out;

  const CMH_nat       = FT === "greenhouse" ? vol * 0.3 : 0;
  const dehu_nat_lh   = Math.max(0, CMH_nat * dAH_nat / 1000) * 0.35;
  const dehu_day_lh   = Math.max(0, CMH * dAH_day / 1000) * 0.25;
  const dehu_night_lh = Math.max(0, CMH * dAH_night / 1000) * 0.50;

  const night_residual = Math.max(0, E_design_lh - ahu_coil_lh - dehu_night_lh);
  let dehN: number;
  if (FT === "greenhouse") {
    dehN = Math.max(0, Math.ceil(night_residual * SAFETY_FACTOR / 12.5));
  } else {
    const deh_residual_vf = Math.max(0, E_design_lh - ahu_coil_lh);
    dehN = Math.max(1, Math.ceil(deh_residual_vf * SAFETY_FACTOR / 12.5));
  }

  const coverage_night = E_design_lh > 0
    ? Math.min(100, Math.round((ahu_coil_lh + dehu_night_lh) / E_design_lh * 100))
    : 100;

  // ── 24시간 프로파일 ───────────────────────────────────────────────────────
  const hourlyProfile = Array.from({ length: 24 }, (_, hr) => {
    let qs_h = 0, ql_h = 0;
    if (FT === "greenhouse") {
      const T_night_ch = Math.max(inputs.outdoorWinterTemp, dT - (inputs.outdoorSummerTemp - dT) * 0.4);
      const dTeff = (hr >= 7 && hr <= 19)
        ? Math.max(0, inputs.outdoorSummerTemp - dT)
        : Math.max(0, T_night_ch - dT);
      const rExtH = (hr >= 6 && hr <= 18)
        ? inputs.maxSolarIrradiance * Math.sin(Math.PI * (hr - 6) / 12)
        : 0;
      const rIh = rExtH * mat.tau;
      qs_h = (eA * mat.uValue * dTeff + rIh * fl) / 1000;
      ql_h = crop.fCrop * rIh * fl * 3600 / 2450000 * 2450 / 3600;
    } else {
      const ls = 12 - lhvVal / 2;
      const le2 = 12 + lhvVal / 2;
      const isOn = hr >= ls && hr < le2;
      const dTeff = Math.max(0, inputs.outdoorSummerTemp - dT);
      if (isOn) {
        qs_h = (eA * mat.uValue * dTeff + ledW * 0.9) / 1000;
        ql_h = crop.fCrop * (ledW * 0.4 / Math.max(fl, 1)) * fl * 3600 / 2450000 * 2450 / 3600;
      } else {
        const dTn = Math.max(0, Math.max(inputs.outdoorWinterTemp, dT - (inputs.outdoorSummerTemp - dT) * 0.4) - dT);
        qs_h = (eA * mat.uValue * dTn) / 1000;
        ql_h = 0;
      }
    }
    return {
      hour: hr,
      sensible_kW: Math.max(0, Math.round(qs_h * 10) / 10),
      latent_kW:   Math.max(0, Math.round(ql_h * 10) / 10),
    };
  });

  // ── 4단계 제어 알고리즘 ──────────────────────────────────────────────────
  const isVF = FT === "vertical_farm";
  const nT   = inputs.targetTempNight;
  const hdF  = hd.toFixed(1);

  const controlStages: ControlStage[] = [
    {
      code: "STAGE 1", name: "야간 / 보온", color: "blue",
      trigger: isVF ? `T < ${nT}°C` : `T < ${nT}°C  |  HD > ${(hd + 3).toFixed(1)} g/m³`,
      actions: isVF
        ? ["순환팬 저속 (30%)", "보온 커버 유지", "난방 유닛 ON", "LED 정상 점등"]
        : ["보온스크린 100% 전개", "순환팬 저속 (30%)", "난방기 풀가동", "배기팬 OFF"],
      tip: "에너지 절감 최우선 — 최소 설비만 가동",
    },
    {
      code: "STAGE 2", name: "적정 유지", color: "green",
      trigger: isVF ? `${nT}≤T≤${dT}°C` : `T ≈ ${dT}°C  |  HD ≈ ${hdF} g/m³`,
      actions: isVF
        ? ["순환팬 정속 (60%)", "AHU 냉방 대기", "제습기 ON", "LED 점등 유지"]
        : ["차광스크린 20–50% 전개", "순환팬 정속 (60%)", "천창 10% 개방", "포그 예열 대기"],
      tip: "설계 목표값 ±1°C / HD ±1 g/m³ 유지",
    },
    {
      code: "STAGE 3", name: "냉각 개시", color: "amber",
      trigger: isVF
        ? `T > ${dT + 1}°C`
        : `T > ${dT + 1}°C  |  HD < ${(hd - 1.5).toFixed(1)} g/m³`,
      actions: isVF
        ? ["AHU 냉방 50%", "순환팬 고속 (80%)", "포그 가습 ON", "제습기 강화 운전"]
        : ["포그 쿨링 ON", "배기팬 50% 가동", "천창 30–50% 개방", "차광스크린 최대 전개"],
      tip: "증산 부하 급증 구간 — 포그 선행 가동",
    },
    {
      code: "STAGE 4", name: "피크 냉방", color: "red",
      trigger: isVF
        ? `T > ${dT + 3}°C`
        : `T > ${dT + 3}°C  |  Qs > ${Math.round(Qs * 1.3)} kW`,
      actions: isVF
        ? ["AHU 냉방 100%", "순환팬 풀가동 (100%)", "포그 최대 분무", "비상 환기 모드"]
        : ["배기팬 100% 풀가동", "냉방기 가동", "천창 100% 개방", "포그 최대 분무"],
      tip: "전 설비 풀가동 — 작물 보호 최우선",
    },
  ];

  const r1 = (v: number) => Math.round(v * 10) / 10;

  return {
    sensibleLoad_kW:        r1(Qs),
    latentLoad_kW:          r1(QL),
    totalLoad_kW:           r1(Qn),
    designCooling_kW:       r1(Qc),
    designCooling_RT:       r1(QcRT),
    designCooling_kcalh:    Math.round(QcK),
    designHeating_kW:       r1(Qhw),
    designHeating_kcalh:    Math.round(QhK),
    latentPercent:          Math.round(QL / Math.max(Qn, 0.01) * 100),
    transpiration_Lh:       r1(E_Lh),
    transpirationAvg_Lh:    r1(E_avg_lh),
    transpirationNight_Lh:  r1(E_night_lh),
    transpirationDesign_Lh: r1(E_design_lh),
    transpirationPeak_gm2h: r1(E_gm2h_peak),
    ahuCoil_kW:     r1(Q_coil_total),
    ahuCoil_RT:     r1(RT_coil),
    ahuReheat_kW:   r1(Q_reheat),
    ahuCoilLh:      r1(ahu_coil_lh),
    ahuN,
    Q_solar_kW:      r1(Q_solar),
    Q_cond_kW:       r1(Q_cond),
    Q_scrOffset_kW:  r1(Q_scr_offset),
    Q_fog_kW:        r1(Q_fog_kW),
    fogN,
    fogPumpLh:       Math.ceil(fogPumpLh),
    Q_vent_kW:       r1(Q_vent),
    Q_mechDesign_kW: r1(Q_mech_design),
    Q_mechDesign_RT: r1(QcRT_mech),
    Q_heatAdj_kW:    r1(Qhw),
    Q_heatScrOffset_kW: r1(Q_heatScrOffset),
    AH_in: r1(AH_in), HD: r1(hd),
    AH_sum_out: r1(AH_sum_out), AH_win_out: r1(AH_win_out),
    dAH_nat: r1(dAH_nat), dAH_day: r1(dAH_day), dAH_night: r1(dAH_night),
    dehu_nat_Lh:    r1(dehu_nat_lh),
    dehu_day_Lh:    r1(dehu_day_lh),
    dehu_night_Lh:  r1(dehu_night_lh),
    coverageNight:  coverage_night,
    dehN,
    fanN, fanTotalCMH, cirN, acN, htN, screenArea,
    CMH: Math.round(CMH), ACH: r1(ACH),
    envelopeArea_m2: Math.round(eA),
    roofArea_m2:     Math.round(rA),
    wallArea_m2:     Math.round(wA),
    volume_m3:       Math.round(vol),
    uValue:  mat.uValue,
    tau:     mat.tau,
    internalIrradiance_Wm2: Math.round(rI),
    RH: Math.round(rh),
    hourlyProfile,
    controlStages,
  };
}
