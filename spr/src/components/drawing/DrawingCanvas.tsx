import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { motion } from 'framer-motion';
import { DrawingElement, Tool, getMousePos, pointToLineDistance } from './drawingTypes';
import { getBorderClass, getGlassClass, getMutedTextClass } from '../../config/themeConfig';

interface DrawingCanvasProps {
  theme: 'light' | 'dark';
  elements: DrawingElement[];
  currentTool: Tool;
  currentColor: string;
  currentLineWidth: number;
  selectedElement: string | null;
  onElementsChange: (elements: DrawingElement[]) => void;
  onSelectedChange: (id: string | null) => void;
  onSaveHistory: (elements: DrawingElement[]) => void;
}

export interface DrawingCanvasRef {
  redraw: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  theme,
  elements,
  currentTool,
  currentColor,
  currentLineWidth,
  selectedElement,
  onElementsChange,
  onSelectedChange,
  onSaveHistory
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // 编辑状态
  const [editingTextId, setEditingTextId] = React.useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = React.useState('');
  const [editingTextPos, setEditingTextPos] = React.useState({ x: 0, y: 0 });

  const glassClass = getGlassClass(theme);
  const borderClass = getBorderClass(theme);
  const mutedText = getMutedTextClass(theme);

  // 初始化画布尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width - 32;
    canvas.height = 300;
  }, []);

  // 重绘画布
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (element.id === selectedElement) {
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }

      switch (element.type) {
        case 'stroke':
          if (element.points?.length) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            element.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
          break;
        case 'rectangle':
          if (element.width !== undefined && element.height !== undefined) {
            ctx.beginPath();
            ctx.rect(element.x, element.y, element.width, element.height);
            ctx.stroke();
          }
          break;
        case 'diamond':
          if (element.width !== undefined && element.height !== undefined) {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            ctx.beginPath();
            ctx.moveTo(cx, element.y);
            ctx.lineTo(element.x + element.width, cy);
            ctx.lineTo(cx, element.y + element.height);
            ctx.lineTo(element.x, cy);
            ctx.closePath();
            ctx.stroke();
          }
          break;
        case 'circle':
          if (element.width !== undefined && element.height !== undefined) {
            const rx = Math.abs(element.width) / 2;
            const ry = Math.abs(element.height) / 2;
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case 'line':
          if (element.endX !== undefined && element.endY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(element.endX, element.endY);
            ctx.stroke();
          }
          break;
        case 'arrow':
          if (element.endX !== undefined && element.endY !== undefined) {
            const headLen = 12;
            const angle = Math.atan2(element.endY - element.y, element.endX - element.x);
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(element.endX, element.endY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(element.endX, element.endY);
            ctx.lineTo(element.endX - headLen * Math.cos(angle - Math.PI / 6), element.endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(element.endX, element.endY);
            ctx.lineTo(element.endX - headLen * Math.cos(angle + Math.PI / 6), element.endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
          break;
        case 'text':
          if (element.text) {
            ctx.font = `${element.fontSize || 16}px sans-serif`;
            ctx.fillStyle = element.color;
            ctx.fillText(element.text, element.x, element.y);
          }
          break;
      }
      ctx.shadowBlur = 0;
    });
  }, [theme, elements, selectedElement]);

  // 暴露重绘方法
  useImperativeHandle(ref, () => ({ redraw: redrawCanvas }));

  // 元素变化时重绘
  useEffect(() => { redrawCanvas(); }, [elements, redrawCanvas]);

  // 查找元素
  const findElementAt = useCallback((x: number, y: number): DrawingElement | null => {
    const canvas = canvasRef.current;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'rectangle' || el.type === 'diamond') {
        const left = Math.min(el.x, el.x + (el.width || 0));
        const right = Math.max(el.x, el.x + (el.width || 0));
        const top = Math.min(el.y, el.y + (el.height || 0));
        const bottom = Math.max(el.y, el.y + (el.height || 0));
        if (x >= left && x <= right && y >= top && y <= bottom) return el;
      } else if (el.type === 'circle') {
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        const rx = Math.abs(el.width || 0) / 2;
        const ry = Math.abs(el.height || 0) / 2;
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) return el;
      } else if (el.type === 'text' && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = `${el.fontSize || 16}px sans-serif`;
          const metrics = ctx.measureText(el.text || '');
          const th = el.fontSize || 16;
          if (x >= el.x && x <= el.x + metrics.width && y >= el.y - th && y <= el.y + th * 0.3) return el;
        }
      } else if ((el.type === 'line' || el.type === 'arrow') && pointToLineDistance(x, y, el.x, el.y, el.endX || 0, el.endY || 0) < 10) {
        return el;
      } else if (el.type === 'stroke' && el.points) {
        for (const p of el.points) {
          if (Math.hypot(p.x - x, p.y - y) < 15) return el;
        }
      }
    }
    return null;
  }, [elements]);

  // 鼠标事件
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e, canvasRef.current);

    if (currentTool === 'select') {
      const clicked = findElementAt(pos.x, pos.y);
      if (clicked) {
        onSelectedChange(clicked.id);
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: pos.x - clicked.x, y: pos.y - clicked.y };
      } else {
        onSelectedChange(null);
      }
      return;
    }

    isDrawingRef.current = true;
    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: currentTool === 'pen' || currentTool === 'eraser' ? 'stroke' :
            currentTool === 'circle' ? 'circle' :
            currentTool === 'line' ? 'line' :
            currentTool === 'arrow' ? 'arrow' :
            currentTool === 'diamond' ? 'diamond' : 'rectangle',
      x: pos.x,
      y: pos.y,
      points: currentTool === 'pen' || currentTool === 'eraser' ? [{ x: pos.x, y: pos.y }] : undefined,
      width: 0,
      height: 0,
      endX: pos.x,
      endY: pos.y,
      color: currentTool === 'eraser' ? (theme === 'dark' ? '#1e293b' : '#ffffff') : currentColor,
      lineWidth: currentTool === 'eraser' ? 20 : currentLineWidth
    };
    onElementsChange([...elements, newElement]);
  }, [currentTool, currentColor, currentLineWidth, theme, elements, findElementAt, onElementsChange, onSelectedChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e, canvasRef.current);

    if (isDraggingRef.current && selectedElement) {
      const updated = elements.map(el => {
        if (el.id === selectedElement) {
          const newX = pos.x - dragOffsetRef.current.x;
          const newY = pos.y - dragOffsetRef.current.y;
          const dx = newX - el.x;
          const dy = newY - el.y;
          if (el.type === 'line' || el.type === 'arrow') {
            return { ...el, x: newX, y: newY, endX: (el.endX || 0) + dx, endY: (el.endY || 0) + dy };
          }
          return { ...el, x: newX, y: newY };
        }
        return el;
      });
      onElementsChange(updated);
      return;
    }

    if (!isDrawingRef.current) return;

    const current = [...elements];
    const last = current[current.length - 1];
    if (!last) return;

    if (last.type === 'stroke' && last.points) {
      last.points.push({ x: pos.x, y: pos.y });
    } else if (['rectangle', 'circle', 'diamond'].includes(last.type)) {
      last.width = pos.x - last.x;
      last.height = pos.y - last.y;
    } else if (['line', 'arrow'].includes(last.type)) {
      last.endX = pos.x;
      last.endY = pos.y;
    }
    onElementsChange(current);
  }, [elements, selectedElement, onElementsChange]);

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      onSaveHistory(elements);
    }
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onSaveHistory(elements);
    }
  }, [elements, onSaveHistory]);

  // 双击编辑
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e, canvasRef.current);
    const clicked = findElementAt(pos.x, pos.y);
    if (clicked?.type === 'text') {
      setEditingTextId(clicked.id);
      setEditingTextValue(clicked.text || '');
      setEditingTextPos({ x: clicked.x, y: clicked.y });
    }
  }, [findElementAt]);

  // 保存编辑
  const saveEditedText = useCallback(() => {
    if (editingTextId && editingTextValue.trim()) {
      const updated = elements.map(el => el.id === editingTextId ? { ...el, text: editingTextValue } : el);
      onElementsChange(updated);
      onSaveHistory(updated);
    }
    setEditingTextId(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextValue, elements, onElementsChange, onSaveHistory]);

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="w-full rounded-xl cursor-crosshair"
        style={{ touchAction: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' }}
      />

      {/* 文字编辑弹窗 */}
      {editingTextId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute"
          style={{ left: editingTextPos.x, top: editingTextPos.y - 40, transform: 'translateY(-100%)' }}
        >
          <div className={`flex gap-2 p-2 rounded-xl ${glassClass} ${borderClass} shadow-lg`}>
            <input
              type="text"
              value={editingTextValue}
              onChange={(e) => setEditingTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditedText();
                if (e.key === 'Escape') { setEditingTextId(null); setEditingTextValue(''); }
              }}
              autoFocus
              className={`rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                theme === 'dark' ? 'bg-white/[0.05] border border-white/[0.1] text-white' : 'bg-black/[0.05] border border-black/[0.1] text-slate-900'
              }`}
              style={{ minWidth: '200px' }}
            />
            <motion.button
              onClick={saveEditedText}
              className="bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              确定
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default memo(DrawingCanvas);
