/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  communityName: string; // 社群名稱 (e.g. ckkong, 黃日華)
  gameName: string;      // 遊戲名字 (e.g. 逍遙山, 幻想王)
  sortOrder: number;     // 排序順序
  isOutlaw?: boolean;    // 是否為法外狂徒 (流浪成員)
}

export interface PowerRecord {
  id: string;
  memberId: string;      // 對應的成員 id
  weekLabel: string;     // 週別 (e.g. "W1", "W2" 或 "第一週")
  powerValue: number;    // 戰力值
  createdAt: string;     // 記錄建立日期 (YYYY-MM-DD)
}
