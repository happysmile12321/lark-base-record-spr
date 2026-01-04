import React, { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, Building2, Brain, ChevronRight, Loader2,
  CheckCircle2, XCircle, Lightbulb, Target, Check, BarChart3
} from 'lucide-react';
import { SkeletonNode, QuizQuestion, UserAnswer, ReconstructedNode, ReconstructionResult, NodeRetrievalStats } from '../../types';
import { generateQuizQuestions, evaluateAnswer } from '../../services/geminiService';

interface RetrievalPanelProps {
  theme: 'light' | 'dark';
  node: SkeletonNode;
  nodePath: string;
  currentStats?: NodeRetrievalStats;
  onClose: () => void;
  onSaveStats: (path: string, stats: NodeRetrievalStats) => void;
}

type PanelMode = 'select' | 'quiz' | 'reconstruction' | 'result';

// 提取节点的所有标签用于测试
const extractNodeLabels = (node: SkeletonNode): string[] => {
  const labels = [node.label];
  if (node.children) {
    node.children.forEach(child => {
      labels.push(...extractNodeLabels(child));
    });
  }
  return labels;
};

const RetrievalPanel: React.FC<RetrievalPanelProps> = memo(({
  theme,
  node,
  nodePath,
  currentStats,
  onClose,
  onSaveStats
}) => {
  const [mode, setMode] = useState<PanelMode>('select');
  const [isLoading, setIsLoading] = useState(false);

  // 快速测试状态
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  // 深度重构状态
  const [rootNode, setRootNode] = useState<ReconstructedNode>({
    id: 'root',
    label: '',
    children: []
  });
  const [editingId, setEditingId] = useState<string | null>('root');
  const [editValue, setEditValue] = useState('');
  const [reconstructionResult, setReconstructionResult] = useState<ReconstructionResult | null>(null);

  // 样式
  const glassBg = theme === 'dark' ? 'bg-white/[0.03]' : 'bg-black/[0.03]';
  const borderClass = theme === 'dark' ? 'border-white/[0.08]' : 'border-black/[0.08]';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const mutedText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  // 生成基于当前章节的内容描述
  const chapterContent = extractNodeLabels(node).join('、');

  // 加载测试题
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // 构建章节内容作为 markdown
      const chapterMarkdown = `# ${node.label}\n\n本章节包含以下知识点：\n${node.children?.map(c => `- ${c.label}`).join('\n') || ''}`;
      const generatedQuestions = await generateQuizQuestions(chapterMarkdown, node, 3);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [node]);

  // 选择测试模式时加载题目
  useEffect(() => {
    if (mode === 'quiz' && questions.length === 0) {
      loadQuestions();
    }
  }, [mode, questions.length, loadQuestions]);

  // 提交答案
  const submitAnswer = useCallback(async () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || !currentAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await evaluateAnswer(currentQuestion, currentAnswer);
      setFeedback(result);

      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        isCorrect: result.isCorrect,
        timeTaken: 0
      };
      setAnswers(prev => [...prev, answer]);

      // 延迟后进入下一题或结果
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentAnswer('');
          setFeedback(null);
          setShowHint(false);
        } else {
          setMode('result');
        }
      }, 1500);
    } finally {
      setIsEvaluating(false);
    }
  }, [currentIndex, currentAnswer, questions]);

  // 跳过题目
  const skipQuestion = useCallback(() => {
    const currentQuestion = questions[currentIndex];
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      userAnswer: '',
      isCorrect: false,
      timeTaken: 0
    };
    setAnswers(prev => [...prev, answer]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswer('');
      setFeedback(null);
      setShowHint(false);
    } else {
      setMode('result');
    }
  }, [currentIndex, questions]);

  // 深度重构相关
  const generateId = useCallback(() => {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

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

  const addChild = useCallback((parentId: string) => {
    const newChild: ReconstructedNode = {
      id: generateId(),
      label: '',
      children: []
    };
    setRootNode(prev => updateNode(prev, parentId, n => ({
      ...n,
      children: [...(n.children || []), newChild]
    })));
    setEditingId(newChild.id);
    setEditValue('');
  }, [generateId, updateNode]);

  const deleteNode = useCallback((nodeId: string, parentId: string) => {
    setRootNode(prev => updateNode(prev, parentId, n => ({
      ...n,
      children: (n.children || []).filter(c => c.id !== nodeId)
    })));
  }, [updateNode]);

  const saveEdit = useCallback(() => {
    if (editingId && editValue.trim()) {
      setRootNode(prev => updateNode(prev, editingId, n => ({
        ...n,
        label: editValue.trim()
      })));
    }
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, updateNode]);

  const extractReconstructedLabels = useCallback((n: ReconstructedNode): string[] => {
    const labels = n.label ? [n.label] : [];
    if (n.children) {
      n.children.forEach(child => {
        labels.push(...extractReconstructedLabels(child));
      });
    }
    return labels;
  }, []);

  const countNodes = useCallback((n: ReconstructedNode): number => {
    let count = n.label ? 1 : 0;
    if (n.children) {
      n.children.forEach(child => {
        count += countNodes(child);
      });
    }
    return count;
  }, []);

  const completeReconstruction = useCallback(() => {
    const originalLabels = extractNodeLabels(node);
    const reconstructedLabels = extractReconstructedLabels(rootNode);

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
    setReconstructionResult({
      matchedNodes: matched,
      missedNodes: missed,
      extraNodes: extra,
      completionRate
    });
    setMode('result');
  }, [node, rootNode, extractReconstructedLabels]);

  // 计算测试结果
  const quizStats = {
    correct: answers.filter(a => a.isCorrect).length,
    total: answers.length,
    percentage: answers.length > 0 ? Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100) : 0
  };

  // 进入结果模式时保存统计数据
  useEffect(() => {
    if (mode === 'result') {
      const newStats: NodeRetrievalStats = {
        quizCount: (currentStats?.quizCount || 0) + (reconstructionResult ? 0 : 1),
        reconCount: (currentStats?.reconCount || 0) + (reconstructionResult ? 1 : 0),
        lastTestTime: Date.now(),
        lastQuizScore: reconstructionResult ? currentStats?.lastQuizScore : quizStats.percentage,
        lastReconScore: reconstructionResult ? reconstructionResult.completionRate : currentStats?.lastReconScore
      };
      onSaveStats(nodePath, newStats);
    }
  }, [mode, reconstructionResult, quizStats.percentage, nodePath, currentStats, onSaveStats]);

  const currentQuestion = questions[currentIndex];
  const nodeCount = countNodes(rootNode);

  // 重置到选择模式
  const resetPanel = useCallback(() => {
    setMode('select');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setFeedback(null);
    setShowHint(false);
    setRootNode({ id: 'root', label: '', children: [] });
    setEditingId('root');
    setEditValue('');
    setReconstructionResult(null);
  }, []);

  // 渲染重构节点
  const renderReconNode = (n: ReconstructedNode, parentId: string | null, depth: number = 0) => {
    const isEditing = editingId === n.id;
    const isRoot = parentId === null;

    return (
      <div key={n.id} className={`${depth > 0 ? 'ml-4 border-l border-dashed pl-3' : ''} ${borderClass}`}>
        <div className="flex items-center gap-2 py-1.5 group">
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
                placeholder={isRoot ? '章节名...' : '知识点...'}
                className={`flex-1 px-2 py-1 rounded-lg text-xs ${theme === 'dark'
                  ? 'bg-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white text-slate-800 placeholder:text-slate-400'
                  } border border-indigo-500 outline-none`}
              />
              <button onClick={saveEdit} className="p-1 rounded bg-emerald-500 text-white">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span
                onClick={() => { setEditingId(n.id); setEditValue(n.label); }}
                className={`flex-1 px-2 py-1 rounded-lg cursor-pointer text-xs ${n.label
                  ? theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
                  : theme === 'dark' ? 'bg-slate-800/50 text-slate-500 border border-dashed border-slate-600' : 'bg-slate-100 text-slate-400 border border-dashed'
                  }`}
              >
                {n.label || (isRoot ? '点击输入...' : '点击输入...')}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => addChild(n.id)}
                  className={`p-1 rounded ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                {!isRoot && parentId && (
                  <button
                    onClick={() => deleteNode(n.id, parentId)}
                    className={`p-1 rounded ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {n.children && n.children.map(child => renderReconNode(child, n.id, depth + 1))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-[1.5rem] overflow-hidden ${glassBg} border ${borderClass}`}
      style={{ boxShadow: theme === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.05)' }}
    >
      {/* 头部 */}
      <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <Brain className={`w-4 h-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
          <span className={`text-xs font-bold ${textColor}`}>
            {mode === 'select' && '提取训练'}
            {mode === 'quiz' && '快速测试'}
            {mode === 'reconstruction' && '深度重构'}
            {mode === 'result' && '训练结果'}
          </span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full ${glassBg} ${borderClass} ${mutedText}`}>
            {node.label}
          </span>
        </div>
        <button onClick={onClose} className={`${mutedText} hover:text-rose-500 transition-colors`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* 模式选择 */}
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <motion.button
                onClick={() => setMode('quiz')}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 border transition-all ${theme === 'dark'
                  ? 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-400/40'
                  : 'bg-indigo-50 border-indigo-200 hover:border-indigo-300'
                  }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-500'
                  }`}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${textColor}`}>快速测试</div>
                  <div className={`text-[10px] ${mutedText}`}>AI 生成 3 道测试题</div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => setMode('reconstruction')}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 border transition-all ${theme === 'dark'
                  ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-400/40'
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500' : 'bg-emerald-500'
                  }`}>
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${textColor}`}>深度重构</div>
                  <div className={`text-[10px] ${mutedText}`}>凭记忆重建知识结构</div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* 快速测试 */}
          {mode === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {isLoading ? (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  <p className={`mt-2 text-xs ${mutedText}`}>生成测试题中...</p>
                </div>
              ) : currentQuestion ? (
                <>
                  {/* 进度 */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${mutedText}`}>Q{currentIndex + 1}/{questions.length}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${glassBg}`}>
                      {'⭐'.repeat(currentQuestion.difficulty)}
                    </span>
                  </div>

                  {/* 题目 */}
                  <div className={`p-3 rounded-xl ${feedback
                    ? feedback.isCorrect
                      ? theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50'
                      : theme === 'dark' ? 'bg-red-500/20' : 'bg-red-50'
                    : theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
                    } border ${borderClass}`}>
                    <div className={`text-[10px] px-2 py-0.5 rounded inline-block mb-2 ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                      {currentQuestion.type === 'fill-blank' && '填空题'}
                      {currentQuestion.type === 'true-false' && '判断题'}
                      {currentQuestion.type === 'short-answer' && '简答题'}
                    </div>
                    <p className={`text-xs leading-relaxed ${textColor}`}>{currentQuestion.question}</p>

                    {/* 输入 */}
                    {currentQuestion.type === 'true-false' ? (
                      <div className="flex gap-2 mt-3">
                        {['对', '错'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setCurrentAnswer(opt)}
                            disabled={!!feedback}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium ${currentAnswer === opt
                              ? 'bg-indigo-500 text-white'
                              : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={currentAnswer}
                        onChange={e => setCurrentAnswer(e.target.value)}
                        disabled={!!feedback}
                        placeholder="输入答案..."
                        className={`w-full mt-3 p-2 rounded-lg text-xs border resize-none ${theme === 'dark'
                          ? 'bg-slate-700/50 border-white/10 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                          } focus:outline-none`}
                        rows={2}
                      />
                    )}

                    {/* 提示 */}
                    {currentQuestion.hints && !showHint && !feedback && (
                      <button
                        onClick={() => setShowHint(true)}
                        className={`mt-2 flex items-center gap-1 text-[10px] ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
                      >
                        <Lightbulb className="w-3 h-3" /> 显示提示
                      </button>
                    )}
                    {showHint && currentQuestion.hints && (
                      <div className={`mt-2 p-2 rounded-lg text-[10px] ${theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                        }`}>
                        💡 {currentQuestion.hints.join(' | ')}
                      </div>
                    )}

                    {/* 反馈 */}
                    {feedback && (
                      <div className={`mt-2 flex items-center gap-2 text-xs ${feedback.isCorrect ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                        {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {feedback.feedback}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {!feedback && (
                    <div className="flex gap-2">
                      <button
                        onClick={skipQuestion}
                        className={`px-3 py-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        跳过
                      </button>
                      <button
                        onClick={submitAnswer}
                        disabled={!currentAnswer.trim() || isEvaluating}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold text-white ${currentAnswer.trim() && !isEvaluating
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                          : 'bg-slate-500 opacity-50'
                          }`}
                      >
                        {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '提交'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className={`text-xs text-center py-4 ${mutedText}`}>无法生成题目</p>
              )}
            </motion.div>
          )}

          {/* 深度重构 */}
          {mode === 'reconstruction' && (
            <motion.div
              key="reconstruction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className={`p-2 rounded-lg text-[10px] flex items-start gap-2 ${theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                }`}>
                <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>凭记忆重建 "{node.label}" 的知识结构</span>
              </div>

              <div className={`p-3 rounded-xl min-h-[120px] ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-white'
                } border ${borderClass}`}>
                {renderReconNode(rootNode, null)}
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${mutedText}`}>已构建 {nodeCount} 个节点</span>
                <button
                  onClick={completeReconstruction}
                  disabled={nodeCount < 2}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${nodeCount >= 2
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    : 'bg-slate-500 opacity-50'
                    }`}
                >
                  完成对比
                </button>
              </div>
            </motion.div>
          )}

          {/* 结果 */}
          {mode === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {reconstructionResult ? (
                // 重构结果
                <>
                  <div className="text-center">
                    <div className={`text-3xl font-black ${reconstructionResult.completionRate >= 70 ? 'text-emerald-500'
                      : reconstructionResult.completionRate >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                      {reconstructionResult.completionRate}%
                    </div>
                    <p className={`text-[10px] ${mutedText}`}>完成度</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <div className="text-sm font-bold text-emerald-500">{reconstructionResult.matchedNodes.length}</div>
                      <div className={`text-[9px] ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-600'}`}>匹配</div>
                    </div>
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'}`}>
                      <div className="text-sm font-bold text-red-500">{reconstructionResult.missedNodes.length}</div>
                      <div className={`text-[9px] ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>遗漏</div>
                    </div>
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <div className="text-sm font-bold text-amber-500">{reconstructionResult.extraNodes.length}</div>
                      <div className={`text-[9px] ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'}`}>多余</div>
                    </div>
                  </div>

                  {reconstructionResult.missedNodes.length > 0 && (
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                      <p className={`text-[10px] mb-1 ${mutedText}`}>需复习：</p>
                      <div className="flex flex-wrap gap-1">
                        {reconstructionResult.missedNodes.slice(0, 3).map((n, i) => (
                          <span key={i} className={`text-[9px] px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'
                            }`}>{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // 测试结果
                <>
                  <div className="text-center">
                    <div className={`text-3xl font-black ${quizStats.percentage >= 70 ? 'text-emerald-500'
                      : quizStats.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                      {quizStats.percentage}%
                    </div>
                    <p className={`text-[10px] ${mutedText}`}>正确率 ({quizStats.correct}/{quizStats.total})</p>
                  </div>

                  <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                    <p className={`text-xs ${quizStats.percentage >= 70 ? 'text-emerald-500'
                      : quizStats.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                      {quizStats.percentage >= 70 ? '🎉 掌握良好！'
                        : quizStats.percentage >= 50 ? '💪 继续加油！' : '📚 需要复习'}
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={resetPanel}
                className={`w-full py-2 rounded-lg text-xs font-medium ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                再来一次
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

RetrievalPanel.displayName = 'RetrievalPanel';

export default RetrievalPanel;
