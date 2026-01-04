import React, { memo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, X } from 'lucide-react';
import { DrawingElement, NOTE_COLORS } from './drawingTypes';

interface NotesBoardProps {
  theme: 'light' | 'dark';
  notes: DrawingElement[];
  currentColor: string;
  editingNoteId: string | null;
  editingValue: string;
  onColorChange: (color: string) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (id: string, text: string) => void;
  onStartEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
}

const NotesBoard: React.FC<NotesBoardProps> = memo(({
  theme,
  notes,
  currentColor,
  editingNoteId,
  editingValue,
  onColorChange,
  onAddNote,
  onDeleteNote,
  onEditNote,
  onStartEdit,
  onCancelEdit,
  onEditValueChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当有新便签正在编辑时自动聚焦
  useEffect(() => {
    if (editingNoteId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingNoteId]);

  const getBorderColor = useCallback((noteColor: string) => {
    const found = NOTE_COLORS.find(c => c.color === noteColor);
    return found?.border || '#d1d5db';
  }, []);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50/80'
        } border ${theme === 'dark' ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
      style={{ minHeight: '320px' }}
    >
      {/* 工具栏 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            问题颜色
          </span>
          <div className="flex gap-1.5">
            {NOTE_COLORS.map(({ color, border, name }) => (
              <motion.button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-6 h-6 rounded-lg transition-all ${currentColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                style={{
                  backgroundColor: color,
                  border: `2px solid ${border}`,
                }}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
                title={name}
              />
            ))}
          </div>
        </div>
        <motion.button
          onClick={onAddNote}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${theme === 'dark'
            ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
            : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20'
            }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MessageCircleQuestion className="w-4 h-4" />
          添加问题
        </motion.button>
      </div>

      {/* 便签画布 */}
      <div className="relative p-4" style={{ minHeight: '260px' }}>
        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: theme === 'dark'
              ? 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <AnimatePresence>
          {notes.length > 0 ? (
            <div className="relative flex flex-wrap gap-3">
              {notes.map((note, idx) => {
                const isEditing = editingNoteId === note.id;
                const noteColor = note.color || '#fef3c7';
                const borderColor = getBorderColor(noteColor);

                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    whileHover={{ scale: 1.02, rotate: 1, y: -4 }}
                    className="relative group"
                    style={{ width: '180px', minHeight: '120px' }}
                  >
                    <div
                      className="w-full h-full rounded-xl p-3 cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                      style={{
                        backgroundColor: noteColor,
                        border: `2px solid ${borderColor}`,
                        boxShadow: `0 4px 12px -2px ${borderColor}40`
                      }}
                      onDoubleClick={() => onStartEdit(note.id, note.text || '')}
                    >
                      {/* 顶部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: borderColor }} />
                          <span className="text-[10px] font-medium text-slate-500">#{idx + 1}</span>
                        </div>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-800/10 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </div>

                      {/* 内容 */}
                      {isEditing ? (
                        <textarea
                          ref={textareaRef}
                          autoFocus
                          value={editingValue}
                          onChange={(e) => onEditValueChange(e.target.value)}
                          onBlur={() => {
                            if (editingValue.trim()) {
                              onEditNote(note.id, editingValue);
                            } else {
                              onDeleteNote(note.id);
                            }
                            onCancelEdit();
                          }}
                          onKeyDown={(e) => e.key === 'Escape' && onCancelEdit()}
                          className="w-full h-20 bg-transparent border-none outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400"
                          placeholder="输入你的问题..."
                        />
                      ) : (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                          {note.text || <span className="text-slate-400 italic">双击编辑...</span>}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <MessageCircleQuestion className={`w-12 h-12 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
              </motion.div>
              <p className={`text-sm mt-3 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                点击上方「添加问题」开始记录
              </p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>
                双击问题卡片可编辑内容
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

NotesBoard.displayName = 'NotesBoard';

export default NotesBoard;
