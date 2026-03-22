"use client";

import { useRef } from "react";
import { HVACResult, HVACInputs, SAFETY_FACTOR } from "@/lib/calculations";
import { CROP_DATA, CropKey } from "@/lib/cropData";
import LoadChart from "./LoadChart";
import EngineerTips from "./EngineerTips";
import ControlStages from "./ControlStages";

interface Props {
  result: HVACResult;
  inputs: HVACInputs;
  onReset: () => void;
}

function Metric({ label, value, unit, sub, color = "text-green-600" }: {
  label: string; value: string | number; unit: string; sub?: string; color?: string;
}) {
  return (
    <div className="result-card">
      <div className={`result-value ${color}`}>{value}</div>
      <div className="result-unit">{unit}</div>
      <div className="result-label">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-1">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

export default function ResultsPanel({ result, inputs, onReset }: Props) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const crop = CROP_DATA[inputs.crop as CropKey];

  const handleExportPDF = async () => {
    if (!resultsRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(resultsRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let y = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (y < pdfH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -y, pdfW, pdfH);
        y += pageH;
      }
      pdf.save("smartfarm-hvac-report-" + Date.now() + ".pdf");
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">공조 설계 결과</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            안전율 {SAFETY_FACTOR}x 적용 · {crop ? crop.labelKo : inputs.crop} · {inputs.floorArea.toLocaleString()} m²
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-secondary text-xs px-3 py-2">PDF 저장</button>
          <button onClick={onReset}         className="btn-secondary text-xs px-3 py-2">재계산</button>
        </div>
      </div>

      <div ref={resultsRef} className="space-y-5">

        {/* Section 1: 부하 요약 */}
        <Section title="부하 요약" badge={<span className="text-xs text-gray-400">설계값 (안전율 포함)</span>}>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="냉방 용량"   value={result.designCooling_RT}  unit="RT"    color="text-blue-600" />
            <Metric label="냉방 용량"   value={result.designCooling_kW}  unit="kW"    color="text-blue-500" />
            <Metric label="난방 용량"   value={result.designHeating_kW}  unit="kW"    color="text-orange-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="제습량"      value={result.transpirationDesign_Lh} unit="L/h"   color="text-cyan-600"   sub="야간 설계값" />
            <Metric label="환기량"      value={result.CMH.toLocaleString()}   unit="CMH"   color="text-violet-600" />
            <Metric label="잠열 비율"   value={result.latentPercent}          unit="%"     color="text-teal-600"   sub="총 냉방 부하 중" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-3 text-xs text-center">
            <div>
              <div className="text-gray-400 mb-0.5">현열 부하</div>
              <div className="font-bold text-gray-700">{result.sensibleLoad_kW} kW</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">잠열 부하</div>
              <div className="font-bold text-cyan-600">{result.latentLoad_kW} kW</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">ACH</div>
              <div className="font-bold text-violet-600">{result.ACH} 회/h</div>
            </div>
          </div>
        </Section>

        {/* Section 2: 기계냉방 부하 저감 */}
        <Section title="기계냉방 부하 저감" badge={<span className="badge-cooling">냉방</span>}>
          <div className="space-y-2 text-sm">
            {[
              ["일사/LED 부하 (Q_solar)",    String(result.Q_solar_kW) + " kW"],
              ["보온스크린 저감",            "-" + String(result.Q_scrOffset_kW) + " kW"],
              ["포그 쿨링 저감",             "-" + String(result.Q_fog_kW) + " kW"],
              ["환기 기여",                  "-" + String(result.Q_vent_kW) + " kW"],
              ["기계냉방 설계값",            String(result.Q_mechDesign_kW) + " kW / " + String(result.Q_mechDesign_RT) + " RT"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-800 font-semibold font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 3: 제습 수지 */}
        <Section title="제습 수지" badge={<span className="badge-dehum">제습</span>}>
          <div className="space-y-2 text-sm">
            {[
              ["증산 벤치마크 (야간 설계)",  String(result.transpirationDesign_Lh) + " L/h"],
              ["AHU 코일 제습",              String(result.ahuCoilLh) + " L/h"],
              ["환기 기여 제습",             String(result.dehu_night_Lh) + " L/h"],
              ["야간 제습 커버리지",         String(result.coverageNight) + " %"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-800 font-semibold font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <div className="text-gray-400 mb-0.5">내부 AH</div>
              <div className="font-bold text-cyan-700">{result.AH_in} g/m³</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">습도부족분(HD)</div>
              <div className="font-bold text-cyan-700">{result.HD} g/m³</div>
            </div>
            <div>
              <div className="text-gray-400 mb-0.5">내부 RH</div>
              <div className="font-bold text-cyan-700">{result.RH} %</div>
            </div>
          </div>
        </Section>

        {/* Section 4: 설비 사양 */}
        <Section title="설비 사양">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "배기팬",      value: String(result.fanN) + "대",   sub: result.fanTotalCMH.toLocaleString() + " CMH 합계" },
              { label: "순환팬",      value: String(result.cirN) + "대",   sub: result.volume_m3.toLocaleString() + " m³ 기준" },
              { label: "포그노즐",    value: String(result.fogN) + "개",   sub: "펌프 " + String(result.fogPumpLh) + " L/h" },
              { label: "AHU 코일",    value: String(result.ahuCoil_kW) + " kW", sub: String(result.ahuCoil_RT) + " RT · " + String(result.ahuN) + "대" },
              { label: "제습기",      value: String(result.dehN) + "대",   sub: "12.5 L/h 기준" },
              { label: "냉난방유닛",  value: "냉방 " + String(result.acN) + "대 / 난방 " + String(result.htN) + "대", sub: "20 RT / 50 kW 기준" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                <div className="font-bold text-gray-800">{item.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </Section>

        <LoadChart result={result} />
        <ControlStages stages={result.controlStages} />
        <EngineerTips result={result} inputs={inputs} />

        <details className="card cursor-pointer">
          <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide select-none">
            계산 상세 내역 (클릭하여 펼치기)
          </summary>
          <div className="mt-4 space-y-2 text-xs">
            {[
              ["외피 면적",         String(result.envelopeArea_m2) + " m²"],
              ["열관류율 (U)",       String(result.uValue) + " W/m²K"],
              ["일사 투과율 (τ)",    String(result.tau)],
              ["유효 내부 일사량",   String(result.internalIrradiance_Wm2) + " W/m²"],
              ["안전율",             "x " + String(SAFETY_FACTOR)],
              ["순 냉방 부하",       String(result.totalLoad_kW) + " kW"],
              ["하절기 외기 AH",     String(result.AH_sum_out) + " g/m³"],
              ["동절기 외기 AH",     String(result.AH_win_out) + " g/m³"],
              ["보온스크린 면적",    String(result.screenArea) + " m²"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-400">{k}</span>
                <span className="text-gray-700 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
