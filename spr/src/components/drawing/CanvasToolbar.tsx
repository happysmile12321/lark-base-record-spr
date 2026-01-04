import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Undo, Redo, Trash2 } from 'lucide-react';
import { Tool, COLORS, LINE_WIDTHS } from './drawingTypes';
import { getBorderClass, getGlassClass, getMutedTextClass } from '../../config/themeConfig';

interface ToolbarProps {
  theme: 'light' | 'dark';
  tools: { id: Tool; icon: any; label: string }[];
  currentTool: Tool;
  currentColor: string;
  currentLineWidth: number;
  showColorPicker: boolean;
  showLineWidthPicker: boolean;
  historyIndex: number;
  historyLength: number;
  selectedElement: string | null;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onLineWidthChange: (width: number) => void;
  onToggleColorPicker: () => void;
  onToggleLineWidthPicker: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onClear: () => void;
  showLineWidth?: boolean;
}

const CanvasToolbar: React.FC<ToolbarProps> = memo(({
  theme,
  tools,
  currentTool,
  currentColor,
  currentLineWidth,
  showColorPicker,
  showLineWidthPicker,
  historyIndex,
  historyLength,
  selectedElement,
  onToolChange,
  onColorChange,
  onLineWidthChange,
  onToggleColorPicker,
  onToggleLineWidthPicker,
  onUndo,
  onRedo,
  onDelete,
  onClear,
  showLineWidth = true
}) => {
  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const mutedText = getMutedTextClass(theme);

  return (
    <div className="flex items-center justify-between mb-3 px-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* 工具按钮 */}
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-2.5 rounded-xl transition-all relative ${glassClass} ${borderClass} ${currentTool === tool.id ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30' : mutedText
                }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </motion.button>
          );
        })}

        {/* 分隔线 */}
        <div className={`w-px h-6 ${borderClass} mx-1`} />

        {/* 颜色选择 */}
        <div className="relative">
          <motion.button
            onClick={onToggleColorPicker}
            className={`p-2.5 rounded-xl transition-all ${glassClass} ${borderClass} ${mutedText}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-4 h-4 rounded-full border-2 border-white/20" style={{ backgroundColor: currentColor }} />
          </motion.button>
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-full left-0 mt-2 p-2 rounded-xl ${glassClass} ${borderClass} flex gap-1 z-20`}
            >
              {COLORS.map(color => (
                <motion.button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className="w-6 h-6 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* 线宽选择 */}
        {showLineWidth && (
          <div className="relative">
            <motion.button
              onClick={onToggleLineWidthPicker}
              className={`p-2.5 rounded-xl transition-all ${glassClass} ${borderClass} ${mutedText}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-4 h-0.5 bg-current" style={{ height: currentLineWidth }} />
            </motion.button>
            {showLineWidthPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute top-full left-0 mt-2 p-2 rounded-xl ${glassClass} ${borderClass} flex flex-col gap-1 z-20`}
              >
                {LINE_WIDTHS.map(width => (
                  <motion.button
                    key={width}
                    onClick={() => onLineWidthChange(width)}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10"
                  >
                    <div className="bg-current" style={{ width: '20px', height: `${width}px` }} />
                    <span className={`text-xs ${mutedText}`}>{width}px</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        <motion.button
          onClick={onUndo}
          disabled={historyIndex <= 0}
          className={`p-2.5 rounded-xl ${glassClass} ${borderClass} ${mutedText} disabled:opacity-30`}
          whileHover={{ scale: historyIndex > 0 ? 1.05 : 1 }}
          whileTap={{ scale: historyIndex > 0 ? 0.95 : 1 }}
        >
          <Undo className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
          className={`p-2.5 rounded-xl ${glassClass} ${borderClass} ${mutedText} disabled:opacity-30`}
          whileHover={{ scale: historyIndex < historyLength - 1 ? 1.05 : 1 }}
          whileTap={{ scale: historyIndex < historyLength - 1 ? 0.95 : 1 }}
        >
          <Redo className="w-4 h-4" />
        </motion.button>
        {selectedElement && (
          <motion.button
            onClick={onDelete}
            className={`p-2.5 rounded-xl ${glassClass} ${borderClass} ${mutedText} hover:text-rose-500`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        )}
        <motion.button
          onClick={onClear}
          className={`p-2.5 rounded-xl ${glassClass} ${borderClass} ${mutedText} hover:text-rose-500`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
});

CanvasToolbar.displayName = 'CanvasToolbar';

export default CanvasToolbar;
