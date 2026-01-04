import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Minus, Check, X, ChevronRight, ChevronDown,
  Trash2, Edit3, CornerDownRight, Target
} from 'lucide-react';
import { SkeletonNode, ReconstructedNode, ReconstructionResult } from '../../types';

interface DeepReconstructionProps {
  theme: 'light' | 'dark';
  originalSkeleton: SkeletonNode | null;
  onComplete: (result: ReconstructionResult, reconstructed: ReconstructedNode) => void;
}

type ReconstructionStep = 'build' | 'compare';

const DeepReconstruction: React.FC<DeepReconstructionProps> = memo(({
  theme,
  originalSkeleton,
  onComplete
}) => {
  const [step, setStep] = useState<ReconstructionStep>('build');
  const [rootNode, setRootNode] = useState<ReconstructedNode>({
    id: 'root',
    label: '',
    children: []
  });
  const [editingId, setEditingId] = useState<string | null>('root');
  const [editValue, setEditValue] = useState('');

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 递归更新节点
  const updateNode = useCallback((
    nodes: ReconstructedNode,
    targetId: string,
    updater: (node: ReconstructedNode) => ReconstructedNode
  ): ReconstructedNode => {
    if (nodes.id === targetId) {
      return updater(nodes);
    }
    if (nodes.children) {
      return {
        ...nodes,
        children: nodes.children.map(child => updateNode(child, targetId, updater))
      };
    }
    return nodes;
  }, []);

  // 添加子节点
  const addChild = useCallback((parentId: string) => {
    const newChild: ReconstructedNode = {
      id: generateId(),
      label: '',
      children: []
    };
    setRootNode(prev => updateNode(prev, parentId, node => ({
      ...node,
      children: [...(node.children || []), newChild]
    })));
    setEditingId(newChild.id);
    setEditValue('');
  }, [generateId, updateNode]);

  // 删除节点
  const deleteNode = useCallback((nodeId: string, parentId: string) => {
    setRootNode(prev => updateNode(prev, parentId, node => ({
      ...node,
      children: (node.children || []).filter(c => c.id !== nodeId)
    })));
  }, [updateNode]);

  // 保存编辑
  const saveEdit = useCallback(() => {
    if (editingId && editValue.trim()) {
      setRootNode(prev => updateNode(prev, editingId, node => ({
        ...node,
        label: editValue.trim()
      })));
    }
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, updateNode]);

  // 开始编辑
  const startEdit = useCallback((nodeId: string, currentLabel: string) => {
    setEditingId(nodeId);
    setEditValue(currentLabel);
  }, []);

  // 统计节点数量
  const countNodes = useCallback((node: ReconstructedNode): number => {
    let count = node.label ? 1 : 0;
    if (node.children) {
      node.children.forEach(child => {
        count += countNodes(child);
      });
    }
    return count;
  }, []);

  // 提取原始骨架的节点标签
  const extractOriginalLabels = useCallback((node: SkeletonNode): string[] => {
    const labels = [node.label];
    if (node.children) {
      node.children.forEach(child => {
        labels.push(...extractOriginalLabels(child));
      });
    }
    return labels;
  }, []);

  // 提取重构的节点标签
  const extractReconstructedLabels = useCallback((node: ReconstructedNode): string[] => {
    const labels = node.label ? [node.label] : [];
    if (node.children) {
      node.children.forEach(child => {
        labels.push(...extractReconstructedLabels(child));
      });
    }
    return labels;
  }, []);

  // 完成重构，进行对比
  const completeReconstruction = useCallback(() => {
    if (!originalSkeleton) return;

    const originalLabels = extractOriginalLabels(originalSkeleton);
    const reconstructedLabels = extractReconstructedLabels(rootNode);

    // 简单匹配逻辑：检查标签相似度
    const matched: string[] = [];
    const missed: string[] = [];
    const extra: string[] = [];

    originalLabels.forEach(original => {
      const found = reconstructedLabels.some(r =>
        r.toLowerCase().includes(original.toLowerCase().slice(0, 5)) ||
        original.toLowerCase().includes(r.toLowerCase().slice(0, 5))
      );
      if (found) {
        matched.push(original);
      } else {
        missed.push(original);
      }
    });

    reconstructedLabels.forEach(r => {
      const found = originalLabels.some(original =>
        r.toLowerCase().includes(original.toLowerCase().slice(0, 5)) ||
        original.toLowerCase().includes(r.toLowerCase().slice(0, 5))
      );
      if (!found) {
        extra.push(r);
      }
    });

    const completionRate = Math.round((matched.length / originalLabels.length) * 100);

    const result: ReconstructionResult = {
      matchedNodes: matched,
      missedNodes: missed,
      extraNodes: extra,
      completionRate
    };

    setStep('compare');
    onComplete(result, rootNode);
  }, [originalSkeleton, rootNode, extractOriginalLabels, extractReconstructedLabels, onComplete]);

  // 渲染节点
  const renderNode = (node: ReconstructedNode, parentId: string | null, depth: number = 0) => {
    const isEditing = editingId === node.id;
    const isRoot = parentId === null;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${depth > 0 ? 'ml-6 border-l-2 border-dashed pl-4' : ''} ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
          }`}
      >
        <div className={`flex items-center gap-2 py-2 group`}>
          {/* 展开图标 */}
          {node.children && node.children.length > 0 ? (
            <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          ) : (
            <CornerDownRight className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
          )}

          {/* 节点内容 */}
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                placeholder={isRoot ? '输入根节点名称...' : '输入节点名称...'}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${theme === 'dark'
                  ? 'bg-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white text-slate-800 placeholder:text-slate-400'
                  } border-2 border-indigo-500 outline-none`}
              />
              <motion.button
                onClick={saveEdit}
                className="p-1.5 rounded-lg bg-emerald-500 text-white"
                whileTap={{ scale: 0.9 }}
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => setEditingId(null)}
                className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            <>
              <span
                onClick={() => startEdit(node.id, node.label)}
                className={`flex-1 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${node.label
                  ? theme === 'dark'
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-white text-slate-800 hover:bg-slate-50'
                  : theme === 'dark'
                    ? 'bg-slate-800/50 text-slate-500 border border-dashed border-slate-600'
                    : 'bg-slate-100 text-slate-400 border border-dashed border-slate-300'
                  } text-sm`}
              >
                {node.label || (isRoot ? '点击输入根节点...' : '点击输入...')}
              </span>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.button
                  onClick={() => addChild(node.id)}
                  className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                    }`}
                  whileTap={{ scale: 0.9 }}
                  title="添加子节点"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
                {!isRoot && parentId && (
                  <motion.button
                    onClick={() => deleteNode(node.id, parentId)}
                    className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                      }`}
                    whileTap={{ scale: 0.9 }}
                    title="删除节点"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>

        {/* 子节点 */}
        {node.children && node.children.map(child => renderNode(child, node.id, depth + 1))}
      </motion.div>
    );
  };

  const nodeCount = countNodes(rootNode);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'build' && (
          <motion.div
            key="build"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* 说明 */}
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
              }`}>
              <div className="flex items-start gap-3">
                <Target className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                <div>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-amber-300' : 'text-amber-800'}`}>
                    挑战说明
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-amber-200/70' : 'text-amber-700'}`}>
                    请凭记忆重构之前学习的骨架结构。点击节点可编辑，使用 + 添加子节点。
                  </p>
                </div>
              </div>
            </div>

            {/* 构建区域 */}
            <div className={`p-4 rounded-xl min-h-[300px] ${theme === 'dark' ? 'bg-slate-800/30 border border-white/10' : 'bg-white border border-slate-200'
              }`}>
              {renderNode(rootNode, null)}
            </div>

            {/* 统计 */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                已构建 {nodeCount} 个节点
              </span>
              <motion.button
                onClick={completeReconstruction}
                disabled={nodeCount < 2}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${nodeCount >= 2
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  : 'bg-slate-500 cursor-not-allowed opacity-50'
                  }`}
                whileTap={nodeCount >= 2 ? { scale: 0.98 } : {}}
              >
                <span className="flex items-center gap-2">
                  完成重构 <ChevronRight className="w-4 h-4" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              重构完成！
            </h3>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              请查看上方的对比结果
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DeepReconstruction.displayName = 'DeepReconstruction';

export default DeepReconstruction;
