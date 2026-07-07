/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Member, PowerRecord } from "../types";
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Award, 
  Zap, 
  Calendar, 
  BarChart2, 
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  Clock,
  ListOrdered
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CombatPowerTabProps {
  members: Member[];
  powerRecords: PowerRecord[];
  onAddRecord: (record: Omit<PowerRecord, "id">) => void;
  onDeleteRecord: (id: string) => void;
  prosperity: string;
  lineup: string;
  onUpdateProsperity: (val: string) => void;
  onUpdateLineup: (val: string) => void;
}

export default function CombatPowerTab({ 
  members, 
  powerRecords, 
  onAddRecord, 
  onDeleteRecord,
  prosperity,
  lineup,
  onUpdateProsperity,
  onUpdateLineup
}: CombatPowerTabProps) {
  
  // Find "絕世毛利喵" (Squall Tse) as the default selected member, otherwise fall back to first member
  const defaultMemberId = useMemo(() => {
    const maoliMeow = members.find(m => m.gameName === "絕世毛利喵");
    return maoliMeow ? maoliMeow.id : (members[0]?.id || "");
  }, [members]);

  const [selectedMemberId, setSelectedMemberId] = useState<string>(defaultMemberId);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sync selectedMemberId with defaultMemberId
  React.useEffect(() => {
    setSelectedMemberId(defaultMemberId);
  }, [defaultMemberId]);

  // Form State for logging a new record
  const [weekLabel, setWeekLabel] = useState("");
  const [powerValueStr, setPowerValueStr] = useState("");
  const [createdAt, setCreatedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [showLogForm, setShowLogForm] = useState(false);

  // Prosperity and Lineup state (editing helpers)
  const [isEditingProsperity, setIsEditingProsperity] = useState(false);
  const [isEditingLineup, setIsEditingLineup] = useState(false);
  const [tempProsperity, setTempProsperity] = useState("");
  const [tempLineup, setTempLineup] = useState("");

  // Currently selected member details
  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  // Filter and sort records for the selected member
  const memberRecords = useMemo(() => {
    return powerRecords
      .filter(r => r.memberId === selectedMemberId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [powerRecords, selectedMemberId]);

  // If there is no manual week label set, guess the next one based on current records
  const suggestedNextWeek = useMemo(() => {
    if (memberRecords.length === 0) return "第 1 週";
    const lastLabel = memberRecords[memberRecords.length - 1].weekLabel;
    const match = lastLabel.match(/\d+/);
    if (match) {
      const nextNum = parseInt(match[0], 10) + 1;
      return lastLabel.replace(match[0], nextNum.toString());
    }
    return `第 ${memberRecords.length + 1} 週`;
  }, [memberRecords]);

  // Handle setting initial suggested values when showing form
  React.useEffect(() => {
    setWeekLabel(suggestedNextWeek);
    setPowerValueStr("");
  }, [suggestedNextWeek, showLogForm]);

  // Calculations for stats
  const stats = useMemo(() => {
    if (memberRecords.length === 0) {
      return {
        currentPower: 0,
        latestGrowth: 0,
        latestGrowthRate: 0,
        averageGrowth: 0,
        maxGrowth: 0,
        maxGrowthRate: 0
      };
    }

    const latest = memberRecords[memberRecords.length - 1];
    const currentPower = latest.powerValue;

    // Calculate growth details for all weeks
    const growths: number[] = [];
    const growthRates: number[] = [];

    for (let i = 1; i < memberRecords.length; i++) {
      const prev = memberRecords[i - 1].powerValue;
      const curr = memberRecords[i].powerValue;
      const diff = curr - prev;
      growths.push(diff);
      if (prev > 0) {
        growthRates.push((diff / prev) * 100);
      }
    }

    const latestGrowth = growths.length > 0 ? growths[growths.length - 1] : 0;
    const latestGrowthRate = growthRates.length > 0 ? growthRates[growthRates.length - 1] : 0;
    
    const totalGrowth = growths.reduce((sum, val) => sum + val, 0);
    const averageGrowth = growths.length > 0 ? totalGrowth / growths.length : 0;

    const maxGrowth = growths.length > 0 ? Math.max(...growths) : 0;
    const maxGrowthRate = growthRates.length > 0 ? Math.max(...growthRates) : 0;

    return {
      currentPower,
      latestGrowth,
      latestGrowthRate,
      averageGrowth,
      maxGrowth,
      maxGrowthRate
    };
  }, [memberRecords]);

  // Live formatting of numbers for the form placeholder and help label
  const powerValueInMillion = useMemo(() => {
    const val = parseInt(powerValueStr, 10);
    if (isNaN(val)) return null;
    if (val >= 10000) {
      return (val / 10000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " 萬";
    }
    return val.toLocaleString();
  }, [powerValueStr]);

  // Handle new record submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const powerNum = parseInt(powerValueStr, 10);
    if (!weekLabel.trim() || isNaN(powerNum) || powerNum <= 0) return;

    onAddRecord({
      memberId: selectedMemberId,
      weekLabel: weekLabel.trim(),
      powerValue: powerNum,
      createdAt: createdAt
    });

    setPowerValueStr("");
    setShowLogForm(false);
  };

  // SVG Line Chart dimension scales
  const chartWidth = 600;
  const chartHeight = 220;
  const chartPadding = { top: 20, right: 30, bottom: 30, left: 70 };

  const chartData = useMemo(() => {
    if (memberRecords.length === 0) return [];

    const minVal = Math.min(...memberRecords.map(r => r.powerValue));
    const maxVal = Math.max(...memberRecords.map(r => r.powerValue));
    
    // Give some margins so chart stays inside bounds
    const yMin = Math.max(0, minVal - (maxVal - minVal) * 0.2 || minVal * 0.9);
    const yMax = maxVal + (maxVal - minVal) * 0.2 || maxVal * 1.1;

    const points = memberRecords.map((rec, idx) => {
      // Scale X
      const xPercent = memberRecords.length > 1 ? idx / (memberRecords.length - 1) : 0.5;
      const x = chartPadding.left + xPercent * (chartWidth - chartPadding.left - chartPadding.right);
      
      // Scale Y
      const yPercent = (rec.powerValue - yMin) / (yMax - yMin || 1);
      const y = chartHeight - chartPadding.bottom - yPercent * (chartHeight - chartPadding.top - chartPadding.bottom);

      // WoW growth info
      const prevRec = idx > 0 ? memberRecords[idx - 1] : null;
      const growth = prevRec ? rec.powerValue - prevRec.powerValue : null;
      const growthRate = prevRec && prevRec.powerValue > 0 ? (growth! / prevRec.powerValue) * 100 : null;

      return {
        ...rec,
        x,
        y,
        growth,
        growthRate
      };
    });

    return {
      points,
      yMin,
      yMax
    };
  }, [memberRecords]);

  // Format big combat power numbers (e.g. 2050000 -> 205.0萬)
  const formatPower = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + " 萬";
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Selector and Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500/10" />
            絕世毛利喵戰力觀測站
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            追蹤與分析「絕世毛利喵」每週戰力的成長曲線與進步幅度
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs bg-amber-500/15 text-amber-400 font-semibold px-3 py-1 rounded-xl border border-amber-500/20 uppercase tracking-wider">
            觀測對象: 絕世毛利喵
          </span>
        </div>
      </div>

      {/* Prosperity & Lineup Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-r from-amber-500/5 to-slate-900/20 p-5 rounded-2xl border border-amber-500/10">
        {/* Prosperity Block */}
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            個人總繁榮度 (預設260億，點擊可直接修改)
          </div>
          {isEditingProsperity ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                className="px-3 py-1 bg-slate-950 border border-amber-500 rounded-xl text-xl font-bold font-mono text-white focus:outline-none w-48"
                value={tempProsperity}
                onChange={(e) => setTempProsperity(e.target.value)}
                onBlur={() => {
                  const val = tempProsperity.trim();
                  if (val) {
                    onUpdateProsperity(val);
                  }
                  setIsEditingProsperity(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = tempProsperity.trim();
                    if (val) {
                      onUpdateProsperity(val);
                    }
                    setIsEditingProsperity(false);
                  } else if (e.key === "Escape") {
                    setIsEditingProsperity(false);
                  }
                }}
                autoFocus
              />
              <span className="text-[10px] text-slate-500">按 Enter 儲存</span>
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempProsperity(prosperity);
                setIsEditingProsperity(true);
              }}
              className="text-2xl font-black text-slate-100 font-mono mt-1 hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-2 group/prop"
              title="點擊修改繁榮度"
            >
              <span>繁榮 {prosperity}</span>
              <span className="text-[10px] text-slate-600 font-normal border border-slate-900 px-1.5 py-0.5 rounded group-hover/prop:text-amber-500 group-hover/prop:border-amber-500/30 transition-colors">
                修改
              </span>
            </div>
          )}
        </div>

        {/* Lineup Block */}
        <div className="space-y-1">
          <div className="text-xs font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            個人主力陣容 (預設80億，點擊可直接修改)
          </div>
          {isEditingLineup ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                className="px-3 py-1 bg-slate-950 border border-amber-500 rounded-xl text-xl font-bold font-mono text-white focus:outline-none w-48"
                value={tempLineup}
                onChange={(e) => setTempLineup(e.target.value)}
                onBlur={() => {
                  const val = tempLineup.trim();
                  if (val) {
                    onUpdateLineup(val);
                  }
                  setIsEditingLineup(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = tempLineup.trim();
                    if (val) {
                      onUpdateLineup(val);
                    }
                    setIsEditingLineup(false);
                  } else if (e.key === "Escape") {
                    setIsEditingLineup(false);
                  }
                }}
                autoFocus
              />
              <span className="text-[10px] text-slate-500">按 Enter 儲存</span>
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempLineup(lineup);
                setIsEditingLineup(true);
              }}
              className="text-2xl font-black text-slate-100 font-mono mt-1 hover:text-amber-400 cursor-pointer transition-colors flex items-center gap-2 group/line"
              title="點擊修改主力陣容"
            >
              <span>陣容 {lineup}</span>
              <span className="text-[10px] text-slate-600 font-normal border border-slate-900 px-1.5 py-0.5 rounded group-hover/line:text-amber-500 group-hover/line:border-amber-500/30 transition-colors">
                修改
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Combat Power */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-amber-500/30 transition-colors duration-300">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">目前戰力值</div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {stats.currentPower > 0 ? stats.currentPower.toLocaleString() : "無紀錄"}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{stats.currentPower > 0 ? formatPower(stats.currentPower) : "尚未建立資料"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: This Week WoW Growth */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-green-500/30 transition-colors duration-300">
          <div className={`p-3 rounded-xl ${stats.latestGrowth >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">本週成長幅度</div>
            <div className={`text-xl font-bold font-mono mt-1 ${stats.latestGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.latestGrowth >= 0 ? "+" : ""}
              {stats.latestGrowth.toLocaleString()}
            </div>
            <div className="text-xs mt-1 font-semibold flex items-center gap-0.5 text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>成長率: {stats.latestGrowthRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Avg Weekly Growth */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-blue-500/30 transition-colors duration-300">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">平均每週成長</div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              +{Math.round(stats.averageGrowth).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              穩定發育速度估算
            </div>
          </div>
        </div>

        {/* Card 4: Historical Peak Growth */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-purple-500/30 transition-colors duration-300">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">歷史單週最高成長</div>
            <div className="text-xl font-bold text-purple-400 font-mono mt-1">
              +{stats.maxGrowth.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-0.5">
              <span>最高成長率: +{stats.maxGrowthRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualized Chart Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Curve Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">戰力成長趨勢 (走勢圖)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">滑鼠懸停於頂點可檢視詳細成長比率</p>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
              {selectedMember?.gameName}
            </span>
          </div>

          {memberRecords.length < 2 ? (
            <div className="h-64 flex flex-col justify-center items-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Calendar className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm">需要至少 2 筆歷史紀錄來繪製成長曲線</p>
              <button 
                onClick={() => setShowLogForm(true)} 
                className="mt-3 text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                + 立即新增戰力紀錄
              </button>
            </div>
          ) : (
            <div className="relative pt-2">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-auto overflow-visible"
              >
                {/* Definitions for Gradients */}
                <defs>
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Axis Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                  const yVal = chartData.yMin! + p * (chartData.yMax! - chartData.yMin!);
                  const y = chartHeight - chartPadding.bottom - p * (chartHeight - chartPadding.top - chartPadding.bottom);
                  return (
                    <g key={i} className="opacity-40">
                      <line 
                        x1={chartPadding.left} 
                        y1={y} 
                        x2={chartWidth - chartPadding.right} 
                        y2={y} 
                        stroke="#1e293b" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={chartPadding.left - 10} 
                        y={y + 4} 
                        fill="#64748b" 
                        fontSize="9" 
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {Math.round(yVal).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Weeks Labels */}
                {chartData.points!.map((pt, idx) => (
                  <text 
                    key={idx} 
                    x={pt.x} 
                    y={chartHeight - 10} 
                    fill="#64748b" 
                    fontSize="9" 
                    textAnchor="middle"
                    className="font-medium"
                  >
                    {pt.weekLabel}
                  </text>
                ))}

                {/* Area Gradient Fill */}
                <path
                  d={`
                    M ${chartData.points![0].x} ${chartHeight - chartPadding.bottom}
                    ${chartData.points!.map(pt => `L ${pt.x} ${pt.y}`).join(" ")}
                    L ${chartData.points![chartData.points!.length - 1].x} ${chartHeight - chartPadding.bottom}
                    Z
                  `}
                  fill="url(#chart-area-grad)"
                />

                {/* Draw main line path */}
                <path
                  d={chartData.points!.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points circles */}
                {chartData.points!.map((pt, idx) => (
                  <g 
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Pulsing ring for selected hover */}
                    {hoveredIndex === idx && (
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r="10" 
                        fill="#f59e0b" 
                        className="animate-ping opacity-25" 
                      />
                    )}
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={hoveredIndex === idx ? "6" : "4"} 
                      fill="#ffffff" 
                      stroke="#f59e0b" 
                      strokeWidth={hoveredIndex === idx ? "4" : "2"} 
                      transition="all 0.15s"
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip Popup */}
              <AnimatePresence>
                {hoveredIndex !== null && chartData.points![hoveredIndex] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute z-10 bg-slate-950/90 border border-slate-800 backdrop-blur text-white p-3 rounded-xl shadow-xl text-xs space-y-1"
                    style={{ 
                      left: `${(chartData.points![hoveredIndex].x / chartWidth) * 100}%`,
                      top: `${(chartData.points![hoveredIndex].y / chartHeight) * 100 - 30}%`,
                      transform: "translateX(-50%)"
                    }}
                  >
                    <div className="font-semibold border-b border-slate-750 pb-1 mb-1">
                      {chartData.points![hoveredIndex].weekLabel} ({chartData.points![hoveredIndex].createdAt})
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">戰力:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {chartData.points![hoveredIndex].powerValue.toLocaleString()}
                      </span>
                    </div>
                    {chartData.points![hoveredIndex].growth !== null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">成長:</span>
                        <span className={`font-semibold ${chartData.points![hoveredIndex].growth! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {chartData.points![hoveredIndex].growth! >= 0 ? "+" : ""}
                          {chartData.points![hoveredIndex].growth!.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {chartData.points![hoveredIndex].growthRate !== null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">成長率:</span>
                        <span className="text-green-400 font-semibold">
                          +{chartData.points![hoveredIndex].growthRate!.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Growth Bar Chart */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">每週成長幅度 (差值分析)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">長條長度代表當週新增的戰力額度</p>
          </div>

          {memberRecords.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic">
              無足夠歷史跨度資料
            </div>
          ) : (
            <div className="space-y-3 my-4">
              {(() => {
                // Generate growth rates and maximums
                const deltas = memberRecords.map((rec, idx) => {
                  if (idx === 0) return { weekLabel: rec.weekLabel, growth: 0, rate: 0 };
                  const prev = memberRecords[idx - 1].powerValue;
                  const growth = rec.powerValue - prev;
                  const rate = prev > 0 ? (growth / prev) * 100 : 0;
                  return {
                    weekLabel: rec.weekLabel,
                    growth,
                    rate
                  };
                }).slice(1);

                const maxGrowth = Math.max(...deltas.map(d => Math.abs(d.growth)), 1);

                return deltas.map((d, i) => {
                  const percent = Math.max(5, (d.growth / maxGrowth) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-400">{d.weekLabel} 成長</span>
                        <span className="text-slate-200 font-mono font-semibold">
                          +{formatPower(d.growth)} ({d.rate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          <div className="text-[10px] text-slate-500 bg-slate-950/60 p-2.5 border border-slate-800/50 rounded-xl">
            成長率由 <span className="font-semibold text-slate-400">當週戰力減上週，除以上週</span> 計算得出。
          </div>
        </div>
      </div>

      {/* Record Management & Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* New Record Logging Form */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-500" />
              登錄週戰力
            </h3>
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              {showLogForm ? "收起" : "快速輸入"}
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">週別 (名稱)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 focus:bg-slate-900 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="例如: 第 9 週"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                required
                id="log-week-label"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-400">戰力數值 (整數)</label>
                {powerValueInMillion && (
                  <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    約合: {powerValueInMillion}
                  </span>
                )}
              </div>
              <input
                type="number"
                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 focus:bg-slate-900 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                placeholder="例如: 2150000"
                value={powerValueStr}
                onChange={(e) => setPowerValueStr(e.target.value)}
                required
                min="1"
                id="log-power-value"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400">記錄日期</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-800 bg-slate-950 focus:bg-slate-900 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                required
                id="log-date"
              />
            </div>

            <button
              type="submit"
              disabled={!weekLabel || !powerValueStr}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              id="btn-log-submit"
            >
              登入 {selectedMember?.gameName} 數據
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-slate-500" />
              觀測對象歷史記錄 ({memberRecords.length} 筆)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ID: {selectedMemberId}
            </span>
          </div>

          {memberRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              該成員尚未登錄任何戰力紀錄。請於左側登錄一筆新戰力。
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-800 rounded-xl">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-4">週別</th>
                      <th className="py-2.5 px-4">記錄日期</th>
                      <th className="py-2.5 px-4 text-right">戰力數值</th>
                      <th className="py-2.5 px-4 text-right">當週增量</th>
                      <th className="py-2.5 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberRecords.map((rec, idx) => {
                      const prevVal = idx > 0 ? memberRecords[idx - 1].powerValue : null;
                      const growth = prevVal ? rec.powerValue - prevVal : null;
                      const growthRate = prevVal && prevVal > 0 ? (growth! / prevVal) * 100 : null;

                      return (
                        <tr key={rec.id} className="border-b border-slate-800/40 hover:bg-slate-900/20">
                          <td className="py-2.5 px-4 font-semibold text-slate-200">{rec.weekLabel}</td>
                          <td className="py-2.5 px-4 text-slate-500">{rec.createdAt}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                            {rec.powerValue.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {growth !== null ? (
                              <span className={`font-mono font-semibold ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {growth >= 0 ? "+" : ""}
                                {growth.toLocaleString()} 
                                <span className="text-[10px] ml-1">
                                  ({growthRate !== null ? `${growthRate.toFixed(1)}%` : ""})
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`您確定要刪除 ${rec.weekLabel} 的紀錄嗎？`)) {
                                  onDeleteRecord(rec.id);
                                }
                              }}
                              className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                              title="刪除紀錄"
                              id={`btn-del-record-${rec.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
