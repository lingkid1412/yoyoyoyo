/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Member, PowerRecord } from "./types";
import { initialMembers, initialPowerRecords } from "./data/initialData";
import MemberTab from "./components/MemberTab";
import CombatPowerTab from "./components/CombatPowerTab";
import { 
  Users, 
  TrendingUp, 
  Sword, 
  Sparkles, 
  ShieldAlert, 
  Database,
  Cat,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  subscribeGlobalSettings,
  updateGlobalSettings,
  subscribeMembers,
  updateAllMembersInDb,
  subscribePowerRecords,
  savePowerRecordToDb,
  deletePowerRecordFromDb,
  seedOrResetDatabase,
  autoSeedIfEmpty,
  GlobalSettings
} from "./lib/firebase";

export default function App() {
  const [activeTab, setActiveTab] = useState<"members" | "combat">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [powerRecords, setPowerRecords] = useState<PowerRecord[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isLoading, setIsLoading] = useState(true);

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    appTitle: "絕世毛利喵戰力觀測站",
    prosperity: "260億",
    lineup: "80億"
  });
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  // Initialize and synchronize Firestore subscriptions
  useEffect(() => {
    let unsubscribeSettings: (() => void) | null = null;
    let unsubscribeMembers: (() => void) | null = null;
    let unsubscribeRecords: (() => void) | null = null;

    async function initDb() {
      try {
        // Auto-seed database if it is brand new or empty
        await autoSeedIfEmpty(initialMembers, initialPowerRecords);

        // 1. Subscribe to Global Settings (Title, Prosperity, Lineup)
        unsubscribeSettings = subscribeGlobalSettings((settings) => {
          setGlobalSettings(settings);
        });

        // 2. Subscribe to Members List
        unsubscribeMembers = subscribeMembers((dbMembers) => {
          setMembers(dbMembers);
          setIsLoading(false);
        });

        // 3. Subscribe to Combat Power Records
        unsubscribeRecords = subscribePowerRecords((dbRecords) => {
          setPowerRecords(dbRecords);
        });
      } catch (error) {
        console.error("Failed to initialize database subscription:", error);
        setIsLoading(false);
      }
    }

    initDb();

    // Clean up subscriptions on unmount
    return () => {
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeRecords) unsubscribeRecords();
    };
  }, []);

  // Update members list (Firestore batch write)
  const handleUpdateMembers = async (newMembers: Member[]) => {
    setSaveStatus("saving");
    try {
      await updateAllMembersInDb(newMembers);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to update members in Firestore:", error);
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  // Reset database back to default initial values
  const handleResetMembers = async () => {
    if (window.confirm("確定要將所有成員名單、排序與戰力數據重設回預設資料嗎？此操作將會同步影響所有使用者。")) {
      setSaveStatus("saving");
      try {
        await seedOrResetDatabase(initialMembers, initialPowerRecords);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Failed to reset database in Firestore:", error);
      } finally {
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    }
  };

  // Add a combat power record
  const handleAddRecord = async (record: Omit<PowerRecord, "id">) => {
    setSaveStatus("saving");
    try {
      const newRecord: PowerRecord = {
        ...record,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      };
      await savePowerRecordToDb(newRecord);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to add power record to Firestore:", error);
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  // Delete a combat power record
  const handleDeleteRecord = async (id: string) => {
    setSaveStatus("saving");
    try {
      await deletePowerRecordFromDb(id);
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to delete power record from Firestore:", error);
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-200 pb-12">
      
      {/* Top Banner & Header */}
      <header className="bg-slate-950 text-white relative overflow-hidden border-b border-slate-900">
        {/* Background decorative neon shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-amber-600/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <Cat className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isEditingTitle ? (
                  <input
                    type="text"
                    className="text-xl md:text-2xl font-bold tracking-tight bg-slate-900 border border-amber-500 rounded-xl px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 max-w-xs md:max-w-md"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={() => {
                      const trimmed = tempTitle.trim();
                      if (trimmed) {
                        updateGlobalSettings({ appTitle: trimmed });
                      }
                      setIsEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const trimmed = tempTitle.trim();
                        if (trimmed) {
                          updateGlobalSettings({ appTitle: trimmed });
                        }
                        setIsEditingTitle(false);
                      } else if (e.key === "Escape") {
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h1 
                    onClick={() => {
                      setTempTitle(globalSettings.appTitle);
                      setIsEditingTitle(true);
                    }}
                    className="text-xl md:text-2xl font-bold tracking-tight cursor-pointer hover:text-amber-400 transition-colors flex items-center gap-1.5 group/title" 
                    id="app-title"
                    title="點擊修改標題"
                  >
                    {globalSettings.appTitle}
                    <span className="text-[10px] text-slate-600 font-normal border border-slate-800 rounded px-1.5 py-0.5 group-hover/title:text-amber-500 group-hover/title:border-amber-500/30 transition-colors">
                      點擊修改
                    </span>
                  </h1>
                )}
                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider">
                  BENTO MONITOR
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                PEERLESS MAORI MEOW MONITOR v2.4
              </p>
            </div>
          </div>

          {/* Sync & Cloud indicators */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-900/80 border border-slate-800 py-1.5 px-3 rounded-lg text-xs">
            <Database className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-slate-400 font-medium">數據狀態:</span>
            {saveStatus === "saving" && (
              <span className="text-amber-400 font-semibold animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                雲端同步中...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-400 font-semibold flex items-center gap-1 animate-bounce">
                <span>✓</span> 已同步
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                雲端即時連線中
              </span>
            )}
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-slate-950 border-t border-slate-900/80 px-4">
          <div className="max-w-6xl mx-auto flex gap-2 py-3">
            {/* Tab 1: Members Table */}
            <button
              onClick={() => setActiveTab("members")}
              className={`
                px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer
                ${activeTab === "members" 
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                  : "bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }
              `}
              id="tab-members"
            >
              <Users className="w-3.5 h-3.5" />
              成員對照表
            </button>

            {/* Tab 2: Combat Power Observation */}
            <button
              onClick={() => setActiveTab("combat")}
              className={`
                px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer
                ${activeTab === "combat" 
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                  : "bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }
              `}
              id="tab-combat"
            >
              <Sword className="w-3.5 h-3.5" />
              絕世毛利喵戰力觀測站
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 animate-pulse font-mono">正在讀取雲端資料，請稍候...</p>
            </div>
          ) : activeTab === "members" ? (
            <motion.div
              key="members-tab-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <MemberTab
                members={members}
                onUpdateMembers={handleUpdateMembers}
                onResetMembers={handleResetMembers}
              />
            </motion.div>
          ) : (
            <motion.div
              key="combat-tab-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <CombatPowerTab
                members={members}
                powerRecords={powerRecords}
                onAddRecord={handleAddRecord}
                onDeleteRecord={handleDeleteRecord}
                prosperity={globalSettings.prosperity}
                lineup={globalSettings.lineup}
                onUpdateProsperity={(val) => {
                  updateGlobalSettings({ prosperity: val });
                }}
                onUpdateLineup={(val) => {
                  updateGlobalSettings({ lineup: val });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Custom design aesthetic pairing guidelines footer */}
      <footer className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>戰力與名單同步監測中 · 目前共有 {members.length} 位成員 · {powerRecords.length} 筆成長數據</span>
        </div>
        <div className="font-mono text-center md:text-right">
          © 2026 絕世毛利喵戰力觀測站 · 採用高階 Drag-n-Drop 技術
        </div>
      </footer>
    </div>
  );
}

