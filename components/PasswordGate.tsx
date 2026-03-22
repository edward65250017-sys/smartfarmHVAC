"use client";

import { useState, useEffect, useRef } from "react";

const APP_PASSWORD = "0204";

interface Props { children: React.ReactNode; }

export default function PasswordGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [input,    setInput]    = useState("");
  const [error,    setError]    = useState(false);
  const [shake,    setShake]    = useState(false);
  const [show,     setShow]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = () => {
    if (input.trim() === APP_PASSWORD) {
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => { setShake(false); setError(false); }, 600);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-green-100 blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-100 blur-3xl opacity-60" />
      </div>

      <div
        className="relative w-full max-w-sm"
        style={shake ? { animation: "shake 0.4s ease" } : {}}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-green-50 border border-green-200 text-3xl mb-4 shadow-sm">
            🌾
          </div>
          <h1 className="text-xl font-bold text-gray-900">SmartFarm HVAC Designer</h1>
          <p className="text-sm text-gray-400 mt-1">스마트팜 공조 설계 툴</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <p className="text-xs text-gray-400 text-center mb-5 uppercase tracking-widest font-medium">
            비밀번호를 입력하세요
          </p>

          <div className="relative">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="••••"
              className={`w-full bg-gray-50 border rounded-xl px-4 py-3 pr-11 text-gray-900
                          text-sm focus:outline-none focus:ring-2 transition placeholder-gray-300
                          ${error
                            ? "border-red-400 focus:ring-red-400 bg-red-50"
                            : "border-gray-300 focus:ring-green-500 focus:border-transparent"}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-sm select-none"
            >
              {show ? "🙈" : "👁"}
            </button>
          </div>

          <div className={`text-xs text-red-500 text-center mt-2 transition-opacity duration-200 ${error ? "opacity-100" : "opacity-0"}`}>
            비밀번호가 올바르지 않습니다
          </div>

          <button
            onClick={handleSubmit}
            className="mt-4 w-full bg-green-600 hover:bg-green-500 active:bg-green-700
                       text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-md shadow-green-100"
          >
            입장하기
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-6px); }
          80%     { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
