"use client";

import { useState, useCallback } from "react";
import { HVACInputs, HVACResult, calculateHVAC } from "@/lib/calculations";
import StepIndicator from "@/components/StepIndicator";
import Step1_Facility from "@/components/steps/Step1_Facility";
import Step2_Crop from "@/components/steps/Step2_Crop";
import Step3_Light from "@/components/steps/Step3_Light";
import Step4_Environment from "@/components/steps/Step4_Environment";
import ResultsPanel from "@/components/results/ResultsPanel";

const DEFAULT_INPUTS: HVACInputs = {
  facilityType: "greenhouse",
  floorArea: 2000,
  avgHeight: 5,
  material: "pd",
  crop: "to",
  region: "se",
  maxSolarIrradiance: 850,
  ledTotalKw: 800,
  lightingHours: 18,
  targetTempDay: 25,
  targetTempNight: 18,
  humidityMode: "rh",
  targetRH: 75,
  targetHD: 5.0,
  outdoorSummerTemp: 35,
  outdoorHDsummer: 8.0,
  outdoorWinterTemp: -10,
  outdoorHDwinter: 0.5,
};

const STEPS = [
  { label: "시설 정보", icon: "🏗" },
  { label: "작물 선택", icon: "🌱" },
  { label: "광원 설정", icon: "☀️" },
  { label: "환경 목표", icon: "🌡" },
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<HVACInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<HVACResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = useCallback((partial: Partial<HVACInputs>) => {
    setInputs((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const res = calculateHVAC(inputs);
        setResult(res);
        setStep(4);
      } finally {
        setIsCalculating(false);
      }
    }, 400);
  };

  const handleReset = () => { setResult(null); setStep(0); };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🌾</span>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">SmartFarm HVAC Designer</h1>
            <p className="text-xs text-gray-400 mt-0.5">스마트팜 공조 용량 설계 툴</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">Wageningen 방법론 기반 · 안전율 1.2×</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {step < 4 && (
          <StepIndicator currentStep={step} totalSteps={STEPS.length} steps={STEPS} />
        )}

        {isCalculating && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">열역학 방정식 계산 중...</p>
          </div>
        )}

        {!isCalculating && step === 0 && <Step1_Facility inputs={inputs} onChange={handleChange} onNext={() => setStep(1)} />}
        {!isCalculating && step === 1 && <Step2_Crop inputs={inputs} onChange={handleChange} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {!isCalculating && step === 2 && <Step3_Light inputs={inputs} onChange={handleChange} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {!isCalculating && step === 3 && <Step4_Environment inputs={inputs} onChange={handleChange} onCalculate={handleCalculate} onBack={() => setStep(2)} />}
        {!isCalculating && step === 4 && result && (
          <ResultsPanel result={result} inputs={inputs} onReset={handleReset} />
        )}
      </main>

      <footer className="border-t border-gray-200 mt-10 py-4">
        <p className="text-center text-xs text-gray-400">
          SmartFarm HVAC Designer · 열역학 기반 공조 용량 산출 · 실제 시공 시 공인 엔지니어 검토 필요
        </p>
      </footer>
    </div>
  );
}
