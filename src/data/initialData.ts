/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, PowerRecord } from "../types";

export const initialMembers: Member[] = [
  { id: "member-1", communityName: "ckkong", gameName: "逍遙山", sortOrder: 1 },
  { id: "member-2", communityName: "黃日華", gameName: "幻想王", sortOrder: 2 },
  { id: "member-3", communityName: "游邵文", gameName: "招財貓（貓咪）", sortOrder: 3 },
  { id: "member-4", communityName: "hsuan", gameName: "五鳳鈿（雪花兒）", sortOrder: 4 },
  { id: "member-5", communityName: "", gameName: "言言夏日", sortOrder: 5 },
  { id: "member-6", communityName: "Wawa", gameName: "天天糯米腸", sortOrder: 6 },
  { id: "member-7", communityName: "林采榮", gameName: "天天咖啡", sortOrder: 7 },
  { id: "member-8", communityName: "Lakers", gameName: "緹渝", sortOrder: 8 },
  { id: "member-9", communityName: "", gameName: "小酷酷", sortOrder: 9 },
  { id: "member-10", communityName: "易霖", gameName: "普羅米修斯", sortOrder: 10 },
  { id: "member-11", communityName: "汪佩賢💮摩摩", gameName: "衣裳破了又破（雲裳）", sortOrder: 11 },
  { id: "member-12", communityName: "楊琇羽", gameName: "譚惠", sortOrder: 12 },
  { id: "member-13", communityName: "陳彥余", gameName: "譚惠", sortOrder: 13 },
  { id: "member-14", communityName: "阿男", gameName: "星晨焱", sortOrder: 14 },
  { id: "member-15", communityName: "Kenwong157", gameName: "逆襲野豬", sortOrder: 15 },
  { id: "member-16", communityName: "", gameName: "愛著睡覺", sortOrder: 16 },
  { id: "member-17", communityName: "Ling", gameName: "衣角（YOHO）", sortOrder: 17 },
  { id: "member-18", communityName: "幽靈", gameName: "緣起（最吵D霖）", sortOrder: 18 },
  { id: "member-19", communityName: "annie", gameName: "天天妮妮", sortOrder: 19 },
  { id: "member-20", communityName: "阿宏上菜", gameName: "酒精纏身（思晏）", sortOrder: 20 },
  { id: "member-21", communityName: "睡不好-嵐駐", gameName: "睡不好（人類觀察者）", sortOrder: 21 },
  { id: "member-22", communityName: "Bowa Kuo", gameName: "天天紋染", sortOrder: 22 },
  { id: "member-23", communityName: "吳小玲", gameName: "白雪", sortOrder: 23 },
  { id: "member-24", communityName: "Squall Tse (博翔)", gameName: "絕世毛利喵", sortOrder: 24 },
  { id: "member-25", communityName: "Ivan Wong (蕉皮) 🍌", gameName: "醉", sortOrder: 25 },
  { id: "member-26", communityName: "You", gameName: "澄江哈哈", sortOrder: 26 },
  { id: "member-27", communityName: "張俊明 文南早起", gameName: "文南早起", sortOrder: 27 },
  { id: "member-28", communityName: "家", gameName: "幸福快樂", sortOrder: 28 },
  { id: "member-29", communityName: "不無聊", gameName: "荔枝", sortOrder: 29 },
  { id: "member-30", communityName: "🌙🌙🌙", gameName: "夏靈月", sortOrder: 30 },
  { id: "member-31", communityName: "小傑", gameName: "天天囧囧", sortOrder: 31 },
  { id: "member-32", communityName: "$琍$", gameName: "睏貴桃（舞玥）", sortOrder: 32 }
];

export const initialPowerRecords: PowerRecord[] = [
  // 絕世毛利喵 (member-24)
  { id: "rec-m24-w1", memberId: "member-24", weekLabel: "第 1 週", powerValue: 1250000, createdAt: "2026-05-18" },
  { id: "rec-m24-w2", memberId: "member-24", weekLabel: "第 2 週", powerValue: 1320000, createdAt: "2026-05-25" },
  { id: "rec-m24-w3", memberId: "member-24", weekLabel: "第 3 週", powerValue: 1410000, createdAt: "2026-06-01" },
  { id: "rec-m24-w4", memberId: "member-24", weekLabel: "第 4 週", powerValue: 1480000, createdAt: "2026-06-08" },
  { id: "rec-m24-w5", memberId: "member-24", weekLabel: "第 5 週", powerValue: 1590000, createdAt: "2026-06-15" },
  { id: "rec-m24-w6", memberId: "member-24", weekLabel: "第 6 週", powerValue: 1720000, createdAt: "2026-06-22" },
  { id: "rec-m24-w7", memberId: "member-24", weekLabel: "第 7 週", powerValue: 1850000, createdAt: "2026-06-29" },
  { id: "rec-m24-w8", memberId: "member-24", weekLabel: "第 8 週", powerValue: 2050000, createdAt: "2026-07-06" },

  // ckkong (member-1)
  { id: "rec-m1-w1", memberId: "member-1", weekLabel: "第 1 週", powerValue: 980000, createdAt: "2026-05-18" },
  { id: "rec-m1-w2", memberId: "member-1", weekLabel: "第 2 週", powerValue: 1010000, createdAt: "2026-05-25" },
  { id: "rec-m1-w3", memberId: "member-1", weekLabel: "第 3 週", powerValue: 1050000, createdAt: "2026-06-01" },
  { id: "rec-m1-w4", memberId: "member-1", weekLabel: "第 4 週", powerValue: 1100000, createdAt: "2026-06-08" },
  { id: "rec-m1-w5", memberId: "member-1", weekLabel: "第 5 週", powerValue: 1150000, createdAt: "2026-06-15" },
  { id: "rec-m1-w6", memberId: "member-1", weekLabel: "第 6 週", powerValue: 1210000, createdAt: "2026-06-22" },
  { id: "rec-m1-w7", memberId: "member-1", weekLabel: "第 7 週", powerValue: 1280000, createdAt: "2026-06-29" },
  { id: "rec-m1-w8", memberId: "member-1", weekLabel: "第 8 週", powerValue: 1350000, createdAt: "2026-07-06" },

  // 黃日華 (member-2)
  { id: "rec-m2-w1", memberId: "member-2", weekLabel: "第 1 週", powerValue: 1100000, createdAt: "2026-05-18" },
  { id: "rec-m2-w2", memberId: "member-2", weekLabel: "第 2 週", powerValue: 1150000, createdAt: "2026-05-25" },
  { id: "rec-m2-w3", memberId: "member-2", weekLabel: "第 3 週", powerValue: 1220000, createdAt: "2026-06-01" },
  { id: "rec-m2-w4", memberId: "member-2", weekLabel: "第 4 週", powerValue: 1280000, createdAt: "2026-06-08" },
  { id: "rec-m2-w5", memberId: "member-2", weekLabel: "第 5 週", powerValue: 1340000, createdAt: "2026-06-15" },
  { id: "rec-m2-w6", memberId: "member-2", weekLabel: "第 6 週", powerValue: 1400000, createdAt: "2026-06-22" },
  { id: "rec-m2-w7", memberId: "member-2", weekLabel: "第 7 週", powerValue: 1470000, createdAt: "2026-06-29" },
  { id: "rec-m2-w8", memberId: "member-2", weekLabel: "第 8 週", powerValue: 1560000, createdAt: "2026-07-06" }
];
