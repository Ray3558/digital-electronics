
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Terminal, Cpu, Trophy, Send,
  PartyPopper, Sparkles, Heart, Timer, Play, HelpCircle,
  RotateCcw, AlertCircle
} from 'lucide-react';
import { TaskType, ReviewResult } from './types';
import { SEGMENT_MAP } from './constants';
import SevenSegment from './components/SevenSegment';

const ENCOURAGING_MESSAGES = [
  "準備就緒！挑戰開始，專注每一行邏輯！🔥",
  "計時啟動！全代碼隨機挖空，考驗你的真本領！🎓",
  "每一行 Verilog 都是關鍵，細心填寫！🚀",
  "挑戰自我，這就是通往證照的捷徑！✨",
  "冷靜應對隨機空格，你是邏輯大師！💻"
];

// 去掉 Verilog 行尾的 // 註解
const stripComment = (s: string) => s.replace(/\/\/.*$/, '');

// 試題一固定顯示「3.210」，小數點在左一位
const TASK1_DIGITS = ['3', '2', '1', '0'];
const task1Seg = (i: number) =>
  (i === 0 ? '1' : '0') + SEGMENT_MAP[TASK1_DIGITS[i]].substring(1);

const App: React.FC = () => {
  const [activeTask, setActiveTask] = useState<TaskType>(TaskType.TASK1);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [isAnswering, setIsAnswering] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [userInputs, setUserInputs] = useState<Record<number, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  // 與 Verilog 行為一致：放開按鍵後仍顯示最後按下的鍵
  const [lastKey, setLastKey] = useState<string | null>(null);

  const [showCheer, setShowCheer] = useState(false);
  const [cheerMsg, setCheerMsg] = useState("");

  const timerRef = useRef<number | null>(null);

  const taskData = useMemo(() => {
    if (activeTask === TaskType.TASK1) {
      return [
        { code: "module no1(input ck, output reg[3:0] s, output reg[7:0] seg);", hint: "定義 I/O" },
        { code: "  reg [13:0] t;", hint: "計數器暫存器" },
        { code: "  always@(posedge ck) t <= t + 1;", hint: "除頻計數" },
        { code: "  always@(posedge t[13])", hint: "掃描時脈" },
        { code: "  case(s)", hint: "掃描判斷" },
        { code: `    4'b0001 : begin s <= 4'b0010; seg <= 8'b${task1Seg(0)}; end`, hint: `顯示 [3.]（含小數點）` },
        { code: `    4'b0010 : begin s <= 4'b0100; seg <= 8'b${task1Seg(1)}; end`, hint: `顯示 [2]` },
        { code: `    4'b0100 : begin s <= 4'b1000; seg <= 8'b${task1Seg(2)}; end`, hint: `顯示 [1]` },
        { code: `    default : begin s <= 4'b0001; seg <= 8'b${task1Seg(3)}; end`, hint: `顯示 [0]` },
        { code: "  endcase", hint: "結束判斷" },
        { code: "endmodule", hint: "結束模組" }
      ];
    } else {
      return [
        { code: "module no2(input ck, output reg[6:0] s, output reg [3:0] R, input [2:0] C);", hint: "定義 I/O" },
        { code: "  always @ (posedge ck)", hint: "掃描時脈" },
        { code: "  case (R)", hint: "列掃描判斷" },
        { code: "    4'b1110: //R[0]為接地掃描", hint: "第一列" },
        { code: "      begin", hint: "開始區塊" },
        { code: "        if(C==3'b110)s<=7'b1111001; //如果C[0]為地，表示R[0]與C[0]有接通，則顯示1", hint: "顯示 1" },
        { code: "        if(C==3'b101)s<=7'b0100100; //如果C[1]為地，表示R[0]與C[1]有接通，則顯示2", hint: "顯示 2" },
        { code: "        if(C==3'b011)s<=7'b0110000; //如果C[2]為地，表示R[0]與C[2]有接通，則顯示3", hint: "顯示 3" },
        { code: "        R<=4'b1101;     //在下一個ck讓R[1]為接地掃描", hint: "切換第二列" },
        { code: "      end", hint: "結束區塊" },
        { code: "    4'b1101: //R[1]為接地掃描", hint: "第二列" },
        { code: "      begin", hint: "開始區塊" },
        { code: "        if(C==3'b110)s<=7'b0011001; //如果C[0]為地，表示R[1]與C[0]有接通，則顯示4", hint: "顯示 4" },
        { code: "        if(C==3'b101)s<=7'b0010010; //如果C[1]為地，表示R[1]與C[1]有接通，則顯示5", hint: "顯示 5" },
        { code: "        if(C==3'b011)s<=7'b0000010; //如果C[2]為地，表示R[1]與C[2]有接通，則顯示6", hint: "顯示 6" },
        { code: "        R<=4'b1011;     //在下一個ck讓R[2]為接地掃描", hint: "切換第三列" },
        { code: "      end", hint: "結束區塊" },
        { code: "    4'b1011: //R[2]為接地掃描", hint: "第三列" },
        { code: "      begin", hint: "開始區塊" },
        { code: "        if(C==3'b110)s<=7'b1111000; //如果C[0]為地，表示R[2]與C[0]有接通，則顯示7", hint: "顯示 7" },
        { code: "        if(C==3'b101)s<=7'b0000000; //如果C[1]為地，表示R[2]與C[1]有接通，則顯示8", hint: "顯示 8" },
        { code: "        if(C==3'b011)s<=7'b0011000; //如果C[2]為地，表示R[2]與C[2]有接通，則顯示9", hint: "顯示 9" },
        { code: "        R<=4'b0111;     //在下一個ck讓R[3]為接地掃描", hint: "切換第四列" },
        { code: "      end", hint: "結束區塊" },
        { code: "    default: //R[3]為接地掃描，或者初始狀態", hint: "第四列/預設" },
        { code: "      begin", hint: "開始區塊" },
        { code: "        if(C==3'b110)s<=7'b0100111; //如果C[0]為地，表示R[3]與C[0]有接通，則顯示*", hint: "顯示 *" },
        { code: "        if(C==3'b101)s<=7'b1000000; //如果C[1]為地，表示R[3]與C[1]有接通，則顯示0", hint: "顯示 0" },
        { code: "        if(C==3'b011)s<=7'b0110011; //如果C[2]為地，表示R[3]與C[2]有接通，則顯示#", hint: "顯示 #" },
        { code: "        R<=4'b1110;     //在下一個ck讓R[0]為接地掃描", hint: "回歸第一列" },
        { code: "      end", hint: "結束區塊" },
        { code: "  endcase", hint: "結束判斷" },
        { code: "endmodule", hint: "結束模組" }
      ];
    }
  }, [activeTask]);

  const fullCodeLines = useMemo(() => taskData.map(d => d.code), [taskData]);

  const generateBlanks = () => {
    const indices = Array.from({ length: fullCodeLines.length }, (_, i) => i);
    const validIndices = indices.filter(idx => {
      return stripComment(fullCodeLines[idx]).trim().length > 2;
    });
    const shuffled = [...validIndices].sort(() => 0.5 - Math.random());
    setBlankIndices(shuffled.slice(0, 5).sort((a, b) => a - b));
    setUserInputs({});
  };

  // 評分時忽略註解、空白與分號
  const normalize = (s: string) => stripComment(s).replace(/\s+/g, '').replace(/;/g, '');

  // 開始目前所選題目的挑戰
  const handleStartChallenge = () => {
    setRefreshNonce(prev => prev + 1);
    setIsAnswering(true);
    setResult(null);
    setSeconds(0);
    setCheerMsg(ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]);
    setShowCheer(true);
    setTimeout(() => setShowCheer(false), 3000);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const handleGrade = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnalyzing(true);

    const blankResults = blankIndices.map(idx => {
      const userVal = (userInputs[idx] || "").trim();
      const correctVal = fullCodeLines[idx].trim();
      return {
        index: idx,
        userValue: userVal,
        correctValue: correctVal,
        isCorrect: normalize(userVal) === normalize(correctVal)
      };
    });

    const correctCount = blankResults.filter(r => r.isCorrect).length;
    setResult({
      hasError: correctCount < 5,
      score: correctCount * 20,
      blankResults,
      errors: [],
      suggestions: [`耗時：${Math.floor(seconds / 60)}分${seconds % 60}秒`, correctCount === 5 ? "邏輯完全正確！" : "請參考標準解答修正錯誤之處。"]
    });
    setIsAnalyzing(false);
    setIsAnswering(false);
  };

  useEffect(() => {
    generateBlanks();
    setResult(null);
  }, [activeTask, refreshNonce]);

  // 清除舊版本以明碼存放在瀏覽器中的 Gemini API Key
  useEffect(() => {
    try { localStorage.removeItem('gemini_api_key'); } catch { /* 無法存取 storage 時略過 */ }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      {showCheer && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 zoom-in-95 duration-500">
          <div className="bg-indigo-600 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border-4 border-indigo-400">
            <PartyPopper className="text-yellow-300 animate-bounce" size={32} />
            <span className="text-xl font-black tracking-widest">{cheerMsg}</span>
            <Sparkles className="text-yellow-300 animate-pulse" size={32} />
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl"><Cpu size={32} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              數位電子乙級：術科練習
              {(isAnswering || result) && <span className="flex items-center gap-2 bg-indigo-100 px-3 py-1 rounded-full text-indigo-700 text-sm animate-pulse ml-2 font-mono"><Timer size={14} /> {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</span>}
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Select Task & Start Random Challenge</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isAnswering && !result ? (
            <button onClick={handleStartChallenge} className="flex items-center gap-3 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all active:scale-95 group">
              <Play className="fill-white group-hover:scale-110 transition-transform" size={20} /> 開始挑戰
            </button>
          ) : isAnswering ? (
            <button onClick={handleGrade} disabled={isAnalyzing} className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all active:scale-95">
              <Send size={20} /> {isAnalyzing ? '正在評分...' : '提交評分'}
            </button>
          ) : (
            <button onClick={handleStartChallenge} className="flex items-center gap-3 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-200 transition-all active:scale-95 group">
              <RotateCcw className="group-hover:rotate-180 transition-transform duration-500" size={20} /> 再次挑戰 (重新挖空)
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={64} className="text-white" /></div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 text-center relative z-10">硬體模擬看板</h2>
            <div className="flex flex-col items-center gap-8 relative z-10">
              <div className="bg-slate-800 p-8 rounded-[2rem] border-[6px] border-slate-700 flex gap-4 shadow-inner">
                {activeTask === TaskType.TASK1 ? (
                  TASK1_DIGITS.map((_, i) => <SevenSegment key={i} bits={task1Seg(i)} />)
                ) : (
                  <SevenSegment bits={!lastKey ? '00000000' : (lastKey === '*' ? SEGMENT_MAP['c'] : lastKey === '#' ? SEGMENT_MAP['revC'] : SEGMENT_MAP[lastKey]) || '00000000'} />
                )}
              </div>
              {activeTask === TaskType.TASK2 && (
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                    <button key={k} onPointerDown={() => setLastKey(k)} onClick={() => setLastKey(k)} className={`h-12 w-14 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 active:bg-indigo-600 active:scale-90 transition-all shadow-md flex items-center justify-center ${lastKey === k ? 'ring-2 ring-indigo-400' : ''}`}>{k}</button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-500">
            <div className="flex bg-slate-50 border-b">
              {Object.entries(TaskType).map(([key, val]) => (
                <button
                  key={val}
                  onClick={() => setActiveTask(val as TaskType)}
                  disabled={isAnswering}
                  className={`px-8 py-5 text-sm font-black transition-all ${activeTask === val ? 'bg-white text-indigo-600 border-t-4 border-t-indigo-600' : 'text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                >
                  {val === TaskType.TASK1 ? '試題一：四位數顯示' : '試題二：鍵盤偵測'}
                </button>
              ))}
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Terminal size={18} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verilog HDL Source Code</span>
                  <button onClick={() => setShowHints(!showHints)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all ${showHints ? 'bg-amber-100 text-amber-700' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}><HelpCircle size={12} /> {showHints ? '隱藏提示' : '顯示邏輯提示'}</button>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] font-mono text-sm leading-relaxed overflow-y-auto max-h-[500px] border border-slate-800 shadow-inner">
                {taskData.map((data, idx) => (
                  <div key={idx} className="flex flex-col gap-1 mb-1 group">
                    <div className="flex gap-4 items-center">
                      <span className="w-6 text-slate-700 text-right shrink-0 select-none text-xs group-hover:text-slate-500 transition-colors">{idx + 1}</span>
                      {isAnswering && blankIndices.includes(idx) ? (
                        <div className="w-full">
                          <input
                            type="text"
                            className={`w-full bg-indigo-900/10 text-indigo-300 border-b-2 border-indigo-500/30 outline-none px-2 py-1 rounded-md transition-all focus:bg-indigo-900/30 focus:border-indigo-400`}
                            value={userInputs[idx] || ""}
                            onChange={e => setUserInputs({ ...userInputs, [idx]: e.target.value })}
                            placeholder="填寫 Verilog 代碼..."
                          />
                        </div>
                      ) : result && blankIndices.includes(idx) ? (
                        <div className="w-full">
                          <div className={`px-2 py-1 rounded-md border-b-2 ${result.blankResults.find(r => r.index === idx)?.isCorrect ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30 line-through'}`}>
                            {userInputs[idx] || "(未填寫)"}
                          </div>
                          {!result.blankResults.find(r => r.index === idx)?.isCorrect && (
                            <div className="text-emerald-400 text-[10px] font-black mt-2 pl-2 bg-emerald-900/10 py-1 rounded border-l-2 border-emerald-500 animate-in slide-in-from-left-2">
                              標準語法：{fullCodeLines[idx].trim()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre className={`py-1 transition-colors ${data.code.trim().startsWith('//') ? 'text-slate-600 italic' : 'text-slate-400'}`}>{data.code}</pre>
                      )}
                    </div>
                    {showHints && <div className="pl-10 text-[10px] text-amber-500/50 italic font-bold animate-in slide-in-from-left-4 duration-500 select-none">// {data.hint}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in slide-in-from-bottom-8 pb-10">
              <div className="md:col-span-4 bg-white p-8 rounded-[2.5rem] border shadow-2xl flex flex-col items-center justify-center text-center group">
                <span className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-[0.2em]">本次評核得分</span>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="50" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={314} strokeDashoffset={314 - (314 * result.score / 100)} className={`${result.score === 100 ? 'text-emerald-500' : result.score >= 60 ? 'text-indigo-500' : 'text-amber-500'} transition-all duration-1000 ease-out`} />
                  </svg>
                  <span className="absolute text-4xl font-black text-slate-800 group-hover:scale-110 transition-transform">{result.score}</span>
                </div>
              </div>
              <div className="md:col-span-8 bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <h4 className="font-black text-xl flex items-center gap-3 mb-6 text-slate-800">
                  {result.score === 100 ? <Trophy className="text-yellow-400" size={28} /> : <AlertCircle className="text-indigo-400" size={28} />}
                  專家診斷建議
                </h4>
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    {result.suggestions.map((s, i) => (
                      <span key={i} className="text-xs font-black text-indigo-700 bg-indigo-50 px-5 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-sm">
                        <Sparkles size={14} className="text-indigo-400" /> {s}
                      </span>
                    ))}
                  </div>
                  {result.score < 100 && (
                    <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-indigo-200 italic shadow-inner">
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                        注意：Verilog 極度重視位元數與分號。挑戰期間標籤功能會暫時鎖定以維持練習完整性。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center mt-12 mb-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex flex-col items-center gap-3 opacity-60">
        <div className="flex items-center gap-2"><span>反覆練習，成就數位電子乙級證照之路</span><Heart size={10} className="text-rose-400 fill-rose-400 animate-pulse" /></div>
        <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        <span>霧峰農工 睿懌老師 製作</span>
        <span>© 2024 DIGITAL B-LEVEL EXPERT TRAINING SYSTEM</span>
      </footer>
    </div>
  );
};

export default App;
