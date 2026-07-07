/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Member } from "../types";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Search, 
  RotateCcw, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MemberTabProps {
  members: Member[];
  onUpdateMembers: (members: Member[]) => void;
  onResetMembers: () => void;
}

export default function MemberTab({ members, onUpdateMembers, onResetMembers }: MemberTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCell, setEditingCell] = useState<{ id: string; field: "communityName" | "gameName" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // New member temporary state
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newGameName, setNewGameName] = useState("");

  // Drag and drop state using IDs
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Edit input ref
  const editInputRef = useRef<HTMLInputElement>(null);

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const q = searchQuery.toLowerCase();
    return (
      member.communityName.toLowerCase().includes(q) ||
      member.gameName.toLowerCase().includes(q)
    );
  });

  // Calculate lists
  const normalMembers = filteredMembers.filter(m => !m.isOutlaw);
  const outlawMembers = filteredMembers.filter(m => !!m.isOutlaw);

  const renderItems = [
    ...normalMembers.map(m => ({ type: "member" as const, member: m, key: m.id })),
    { type: "separator" as const, key: "separator" },
    ...outlawMembers.map(m => ({ type: "member" as const, member: m, key: m.id }))
  ];

  // Inline editing actions
  const startEditing = (member: Member, field: "communityName" | "gameName") => {
    setEditingCell({ id: member.id, field });
    setEditValue(field === "communityName" ? member.communityName : member.gameName);
    // Small timeout to allow input to render and focus
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 50);
  };

  const saveEditing = () => {
    if (!editingCell) return;
    
    const updated = members.map(m => {
      if (m.id === editingCell.id) {
        return {
          ...m,
          [editingCell.field]: editValue.trim()
        };
      }
      return m;
    });

    onUpdateMembers(updated);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditing();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // Add new member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const newMember: Member = {
      id: `member-${Date.now()}`,
      communityName: newCommunityName.trim(),
      gameName: newGameName.trim(),
      sortOrder: members.length > 0 ? Math.max(...members.map(m => m.sortOrder)) + 1 : 1
    };

    onUpdateMembers([...members, newMember]);
    setNewCommunityName("");
    setNewGameName("");
    setIsAdding(false);
  };

  // Delete member
  const handleDeleteMember = (id: string) => {
    const updated = members
      .filter(m => m.id !== id)
      .map((m, index) => ({
        ...m,
        sortOrder: index + 1
      }));
    onUpdateMembers(updated);
    setDeleteConfirmId(null);
  };

  // Move member buttons (for mobile / accessibility)
  const moveMember = (indexInRender: number, direction: "up" | "down") => {
    const currentItem = renderItems[indexInRender];
    if (!currentItem || currentItem.type !== "member" || !currentItem.member) return;

    const targetIndexInRender = direction === "up" ? indexInRender - 1 : indexInRender + 1;
    if (targetIndexInRender < 0 || targetIndexInRender >= renderItems.length) return;

    const targetItem = renderItems[targetIndexInRender];
    const updated = [...members];
    const currentMemberId = currentItem.member.id;
    const currentIndexInMembers = updated.findIndex(m => m.id === currentMemberId);
    if (currentIndexInMembers === -1) return;

    const [memberToMove] = updated.splice(currentIndexInMembers, 1);

    if (targetItem.type === "separator") {
      // Toggle isOutlaw status when moving across the separator row
      memberToMove.isOutlaw = !memberToMove.isOutlaw;
      
      if (direction === "down") {
        const firstOutlawIndex = updated.findIndex(m => !!m.isOutlaw);
        if (firstOutlawIndex !== -1) {
          updated.splice(firstOutlawIndex, 0, memberToMove);
        } else {
          updated.push(memberToMove);
        }
      } else {
        const lastNormalIndex = updated.map(m => !m.isOutlaw).lastIndexOf(true);
        if (lastNormalIndex !== -1) {
          updated.splice(lastNormalIndex + 1, 0, memberToMove);
        } else {
          updated.unshift(memberToMove);
        }
      }
    } else if (targetItem.member) {
      const targetMemberId = targetItem.member.id;
      const targetIndexInMembers = updated.findIndex(m => m.id === targetMemberId);
      if (targetIndexInMembers !== -1) {
        memberToMove.isOutlaw = !!targetItem.member.isOutlaw;
        updated.splice(targetIndexInMembers, 0, memberToMove);
      }
    }

    const final = updated.map((m, idx) => ({
      ...m,
      sortOrder: idx + 1
    }));

    onUpdateMembers(final);
  };

  // HTML5 Drag and Drop Handlers (ID-based)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId === id) return;
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const updated = [...members];
    const draggedIndex = updated.findIndex(m => m.id === draggedId);
    if (draggedIndex === -1) return;

    const [draggedMember] = updated.splice(draggedIndex, 1);

    if (targetId === "separator") {
      draggedMember.isOutlaw = true;
      const firstOutlawIndex = updated.findIndex(m => !!m.isOutlaw);
      if (firstOutlawIndex !== -1) {
        updated.splice(firstOutlawIndex, 0, draggedMember);
      } else {
        updated.push(draggedMember);
      }
    } else {
      const targetIndex = updated.findIndex(m => m.id === targetId);
      if (targetIndex !== -1) {
        const targetMember = updated[targetIndex];
        draggedMember.isOutlaw = !!targetMember.isOutlaw;
        updated.splice(targetIndex, 0, draggedMember);
      }
    }

    const final = updated.map((m, idx) => ({
      ...m,
      sortOrder: idx + 1
    }));

    onUpdateMembers(final);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      {/* Search and Quick Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-slate-800 rounded-xl text-sm text-slate-200 bg-slate-950 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-500"
            placeholder="搜尋人員名字或遊戲名字..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="member-search-input"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            id="btn-toggle-add-member"
          >
            <Plus className="w-4 h-4" />
            新增成員
          </button>
          <button
            onClick={() => {
              if (confirm("您確定要重置名單回預設狀態嗎？這會覆蓋所有修改。")) {
                onResetMembers();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-800 hover:border-amber-500/50 hover:text-amber-400 text-slate-400 bg-slate-900/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            id="btn-reset-members"
            title="還原為原始 32 人名單"
          >
            <RotateCcw className="w-4 h-4" />
            重置預設
          </button>
        </div>
      </div>

      {/* Add Member Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl"
          >
            <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-amber-500" />
              新增成員資料
            </h3>
            <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1 w-full">
                <label className="block text-xs font-medium text-slate-400">社群 / 人員名稱</label>
                <input
                  type="text"
                  placeholder="例如: Squall Tse (博翔)"
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-600"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  id="new-member-community-name"
                />
              </div>
              <div className="flex-1 space-y-1 w-full">
                <label className="block text-xs font-medium text-slate-400">遊戲內名字 (必填)</label>
                <input
                  type="text"
                  placeholder="例如: 絕世毛利喵"
                  required
                  className="w-full px-3 py-2 border border-slate-800 bg-slate-950 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-600"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  id="new-member-game-name"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  id="btn-submit-new-member"
                >
                  確認加入
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  id="btn-cancel-new-member"
                >
                  取消
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table Container */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 shadow-inner overflow-hidden">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center">
          <div className="text-xs font-semibold text-slate-400 tracking-wider">
            目前名單: {filteredMembers.length} 人 {searchQuery && `(符合搜尋條件)`}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            點擊文字欄位可直接修改 · 拖曳左側圖示可排序
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">找不到符合搜尋條件的成員</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="member-table">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-950/40">
                  <th className="py-3 px-4 w-12 text-center">排序</th>
                  <th className="py-3 px-2 w-10"></th>
                  <th className="py-3 px-4 min-w-[150px]">人員 / 社群名稱</th>
                  <th className="py-3 px-4 min-w-[150px]">遊戲內名字</th>
                  <th className="py-3 px-4 w-28 text-center">上下移動</th>
                  <th className="py-3 px-4 w-20 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {renderItems.map((item, renderIdx) => {
                  if (item.type === "separator") {
                    const isDraggingOverSep = dragOverId === "separator";
                    return (
                      <tr
                        key="separator"
                        onDragOver={(e) => handleDragOver(e, "separator")}
                        onDrop={(e) => handleDrop(e, "separator")}
                        className={`
                          border-y border-slate-800 transition-colors
                          ${isDraggingOverSep ? "bg-red-500/10 border-red-500/40" : "bg-slate-950/80"}
                        `}
                      >
                        <td colSpan={6} className="py-4 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                                <AlertCircle className="w-4 h-4" />
                              </span>
                              <div>
                                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                                  法外狂徒 (流浪在外的成員)
                                </span>
                                <span className="ml-2 text-[10px] text-slate-500 font-normal">
                                  (可直接將上方成員拖曳至此處)
                                </span>
                              </div>
                            </div>
                            <span className="text-xs bg-red-500/15 text-red-400 font-semibold px-2 py-0.5 rounded border border-red-500/20">
                              {outlawMembers.length} 人
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const member = item.member!;
                  const isEditingCommunityName = editingCell?.id === member.id && editingCell?.field === "communityName";
                  const isEditingGameName = editingCell?.id === member.id && editingCell?.field === "gameName";
                  const isDraggingOver = dragOverId === member.id;
                  const isBeingDragged = draggedId === member.id;

                  // Calculate dynamic rowSpan for merging communityNames within same sub-list
                  let rowSpan = 1;
                  let shouldRenderCommunityCell = true;
                  const isCurrentEmpty = !member.communityName;

                  const currentGroup = member.isOutlaw ? outlawMembers : normalMembers;
                  const memberIndexInGroup = currentGroup.findIndex(m => m.id === member.id);

                  if (isCurrentEmpty) {
                    // Check if there is a preceding row in same group with non-empty communityName
                    let parentIndex = -1;
                    for (let j = memberIndexInGroup - 1; j >= 0; j--) {
                      if (currentGroup[j].communityName) {
                        parentIndex = j;
                        break;
                      }
                    }
                    if (parentIndex !== -1) {
                      shouldRenderCommunityCell = false;
                    }
                  } else {
                    // Count subsequent consecutive empty rows in same group
                    for (let j = memberIndexInGroup + 1; j < currentGroup.length; j++) {
                      if (!currentGroup[j].communityName) {
                        rowSpan++;
                      } else {
                        break;
                      }
                    }
                  }

                  // Find absolute sequence index in filteredMembers list to show correct numbering
                  const absoluteIndex = filteredMembers.findIndex(m => m.id === member.id);

                  return (
                    <tr
                      key={member.id}
                      draggable={!editingCell}
                      onDragStart={(e) => handleDragStart(e, member.id)}
                      onDragOver={(e) => handleDragOver(e, member.id)}
                      onDrop={(e) => handleDrop(e, member.id)}
                      onDragEnd={handleDragEnd}
                      className={`
                        border-b border-slate-800/60 group transition-all duration-150
                        ${isBeingDragged ? "opacity-30 bg-slate-900" : ""}
                        ${isDraggingOver ? "border-t-2 border-t-amber-500 bg-amber-500/5" : ""}
                        hover:bg-slate-900/40
                      `}
                    >
                      {/* Original Number Order */}
                      <td className="py-3 px-4 text-center text-xs font-mono font-medium text-slate-500">
                        {absoluteIndex + 1}
                      </td>

                      {/* Drag Handle */}
                      <td className="py-3 px-2 text-slate-400 cursor-grab active:cursor-grabbing">
                        <div className="p-1 rounded hover:bg-slate-800 inline-block transition-colors">
                          <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                        </div>
                      </td>

                      {/* Community / Real Name */}
                      {shouldRenderCommunityCell && (
                        <td className="py-3 px-4 align-middle bg-slate-950/20" rowSpan={rowSpan}>
                          {isEditingCommunityName ? (
                            <div className="flex items-center gap-1">
                              <input
                                ref={editInputRef}
                                type="text"
                                className="w-full px-2 py-1 text-sm border border-amber-500 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-950 text-slate-200"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEditing}
                                onKeyDown={handleKeyDown}
                                id={`edit-comm-${member.id}`}
                              />
                              <button 
                                onMouseDown={saveEditing} 
                                className="p-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onMouseDown={() => setEditingCell(null)} 
                                className="p-1 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => startEditing(member, "communityName")}
                              className={`
                                py-1 px-2 -mx-2 rounded text-sm cursor-pointer transition-colors flex items-center justify-between
                                ${member.communityName ? "text-slate-300 font-medium" : "text-slate-600 italic"}
                                hover:bg-slate-800/50 hover:text-white
                              `}
                              title="點擊修改名字"
                            >
                              <span className="truncate max-w-[200px]">
                                {member.communityName || "(無紀錄)"}
                              </span>
                              <span className="text-[10px] text-amber-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                編輯
                              </span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Game Name */}
                      <td className="py-3 px-4">
                        {isEditingGameName ? (
                          <div className="flex items-center gap-1">
                            <input
                              ref={editInputRef}
                              type="text"
                              className="w-full px-2 py-1 text-sm border border-amber-500 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-950 text-slate-200"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEditing}
                              onKeyDown={handleKeyDown}
                              id={`edit-game-${member.id}`}
                            />
                            <button 
                              onMouseDown={saveEditing} 
                              className="p-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onMouseDown={() => setEditingCell(null)} 
                              className="p-1 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => startEditing(member, "gameName")}
                            className={`
                              py-1 px-2 -mx-2 rounded text-sm cursor-pointer transition-colors flex items-center justify-between
                              ${member.gameName === "絕世毛利喵" ? "text-amber-400 font-bold" : "text-slate-200"}
                              hover:bg-slate-800/50 hover:text-white
                            `}
                            title="點擊修改名字"
                          >
                            <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                              {member.gameName === "絕世毛利喵" && (
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              )}
                              {member.gameName}
                            </span>
                            <span className="text-[10px] text-amber-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              編輯
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Manual Up/Down Controls */}
                      <td className="py-3 px-4">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() => moveMember(renderIdx, "up")}
                            disabled={renderIdx === 0}
                            className={`p-1 rounded-md border border-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer`}
                            title="上移"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveMember(renderIdx, "down")}
                            disabled={renderIdx === renderItems.length - 1}
                            className={`p-1 rounded-md border border-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer`}
                            title="下移"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Operations / Delete */}
                      <td className="py-3 px-4 text-right">
                        {deleteConfirmId === member.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-red-400 font-medium animate-pulse">確定？</span>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-slate-950 text-[10px] rounded hover:text-white font-bold cursor-pointer"
                            >
                              刪除
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 border border-slate-800 text-slate-400 text-[10px] rounded hover:bg-slate-800 cursor-pointer"
                            >
                              否
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(member.id)}
                            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="刪除此成員"
                            id={`btn-delete-${member.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
