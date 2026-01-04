import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { PenTool, MessageCircleQuestion } from 'lucide-react';
import { NodeDrawing } from '../../types';
import { getMutedTextClass } from '../../config/themeConfig';
import { DrawingElement, Tool, EditorMode, DRAWING_TOOLS, NOTE_COLORS } from './drawingTypes';
import CanvasToolbar from './CanvasToolbar';
import DrawingCanvas from './DrawingCanvas';
import NotesBoard from './NotesBoard';

interface CanvasEditorProps {
  initialData: NodeDrawing | null;
  theme: 'light' | 'dark';
  onChange: (data: NodeDrawing) => void;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

const CanvasEditor: React.FC<CanvasEditorProps> = memo(({
  initialData,
  theme,
  onChange,
  isCollapsed = false
}) => {
  // 状态
  const [editorMode, setEditorMode] = useState<EditorMode>('draw');
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState(NOTE_COLORS[0].color); // 默认选择第一个颜色
  const [currentLineWidth, setCurrentLineWidth] = useState(2);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLineWidthPicker, setShowLineWidthPicker] = useState(false);

  // 便签编辑状态
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const mutedText = getMutedTextClass(theme);
  const debounceSaveRef = useRef<NodeJS.Timeout>();

  // 初始化
  useEffect(() => {
    if (initialData?.elements?.length) {
      setElements(initialData.elements as DrawingElement[]);
      setHistory([initialData.elements as DrawingElement[]]);
      setHistoryIndex(0);
    } else {
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, []);

  // 防抖保存
  const saveToHistory = useCallback((newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    if (debounceSaveRef.current) clearTimeout(debounceSaveRef.current);
    debounceSaveRef.current = setTimeout(() => {
      onChange({ elements: newElements, appState: {}, files: {} });
    }, 800);
  }, [history, historyIndex, onChange]);

  // 撤销/重做
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newElements = history[newIndex];
      setElements(newElements);
      onChange({ elements: newElements, appState: {}, files: {} });
    }
  }, [historyIndex, history, onChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newElements = history[newIndex];
      setElements(newElements);
      onChange({ elements: newElements, appState: {}, files: {} });
    }
  }, [historyIndex, history, onChange]);

  // 删除/清空
  const handleDelete = useCallback(() => {
    if (selectedElement) {
      const newElements = elements.filter(el => el.id !== selectedElement);
      setElements(newElements);
      setSelectedElement(null);
      saveToHistory(newElements);
    }
  }, [selectedElement, elements, saveToHistory]);

  const handleClear = useCallback(() => {
    if (confirm('确定要清空画布吗？')) {
      setElements([]);
      saveToHistory([]);
    }
  }, [saveToHistory]);

  // 工具栏控制
  const handleToolChange = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    setSelectedElement(null);
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color);
    setShowColorPicker(false);
  }, []);

  const handleLineWidthChange = useCallback((width: number) => {
    setCurrentLineWidth(width);
    setShowLineWidthPicker(false);
  }, []);

  // 便签操作
  const textElements = elements.filter(el => el.type === 'text');

  const handleAddNote = useCallback(() => {
    const newNote: DrawingElement = {
      id: Date.now().toString(),
      type: 'text',
      x: 20 + (textElements.length % 4) * 30,
      y: 20 + Math.floor(textElements.length / 4) * 30,
      color: currentColor || '#fef3c7',
      lineWidth: 1,
      text: '',
      fontSize: 14
    };
    const newElements = [...elements, newNote];
    setElements(newElements);
    setEditingNoteId(newNote.id);
    setEditingValue('');
  }, [elements, textElements.length, currentColor]);

  const handleDeleteNote = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
  }, [elements, saveToHistory]);

  const handleEditNote = useCallback((id: string, text: string) => {
    const newElements = elements.map(el => el.id === id ? { ...el, text } : el);
    setElements(newElements);
    saveToHistory(newElements);
  }, [elements, saveToHistory]);

  if (isCollapsed) return null;

  return (
    <div className="w-full">
      {/* Tab 切换 */}
      <div className={`relative mb-4 p-1.5 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100/80'} backdrop-blur-xl border ${theme === 'dark' ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
        <div className="flex gap-1 relative">
          <motion.div
            className={`absolute top-1 bottom-1 rounded-xl shadow-lg ${theme === 'dark'
              ? 'bg-gradient-to-br from-violet-500/90 via-indigo-500/90 to-blue-500/90'
              : 'bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500'
              }`}
            style={{
              boxShadow: theme === 'dark'
                ? '0 4px 20px -4px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 4px 20px -4px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
            }}
            initial={false}
            animate={{
              left: editorMode === 'draw' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)'
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
          {[
            { mode: 'draw' as EditorMode, icon: PenTool, label: '草图' },
            { mode: 'text' as EditorMode, icon: MessageCircleQuestion, label: '问题', count: textElements.length }
          ].map(({ mode, icon: Icon, label, count }) => (
            <motion.button
              key={mode}
              onClick={() => setEditorMode(mode)}
              className={`flex-1 relative py-3 px-4 rounded-xl text-sm font-semibold z-10 transition-all duration-200 ${editorMode === mode ? 'text-white' : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              whileTap={{ scale: 0.97 }}
            >
              <span className="flex items-center justify-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="tracking-wide">{label}</span>
                {count !== undefined && count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${editorMode === mode ? 'bg-white/25 text-white' : theme === 'dark' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-indigo-500/20 text-indigo-600'
                      }`}
                  >
                    {count}
                  </motion.span>
                )}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 草图模式 */}
      {editorMode === 'draw' && (
        <>
          <CanvasToolbar
            theme={theme}
            tools={DRAWING_TOOLS}
            currentTool={currentTool}
            currentColor={currentColor}
            currentLineWidth={currentLineWidth}
            showColorPicker={showColorPicker}
            showLineWidthPicker={showLineWidthPicker}
            historyIndex={historyIndex}
            historyLength={history.length}
            selectedElement={selectedElement}
            onToolChange={handleToolChange}
            onColorChange={handleColorChange}
            onLineWidthChange={handleLineWidthChange}
            onToggleColorPicker={() => { setShowColorPicker(!showColorPicker); setShowLineWidthPicker(false); }}
            onToggleLineWidthPicker={() => { setShowLineWidthPicker(!showLineWidthPicker); setShowColorPicker(false); }}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDelete={handleDelete}
            onClear={handleClear}
            showLineWidth={true}
          />

          <DrawingCanvas
            theme={theme}
            elements={elements}
            currentTool={currentTool}
            currentColor={currentColor}
            currentLineWidth={currentLineWidth}
            selectedElement={selectedElement}
            onElementsChange={setElements}
            onSelectedChange={setSelectedElement}
            onSaveHistory={saveToHistory}
          />

          <p className={`text-[10px] ${mutedText} text-center mt-2`}>
            草图模式 · 拖拽绘制 · 双击文字编辑 · 自动保存
          </p>
        </>
      )}

      {/* 问题模式 */}
      {editorMode === 'text' && (
        <>
          <NotesBoard
            theme={theme}
            notes={textElements}
            currentColor={currentColor}
            editingNoteId={editingNoteId}
            editingValue={editingValue}
            onColorChange={handleColorChange}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleEditNote}
            onStartEdit={(id, text) => { setEditingNoteId(id); setEditingValue(text); }}
            onCancelEdit={() => { setEditingNoteId(null); setEditingValue(''); }}
            onEditValueChange={setEditingValue}
          />

          {textElements.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-[10px] ${mutedText} text-center mt-3`}
            >
              共 {textElements.length} 个问题 · 双击编辑 · 自动保存
            </motion.p>
          )}
        </>
      )}
    </div>
  );
});

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
