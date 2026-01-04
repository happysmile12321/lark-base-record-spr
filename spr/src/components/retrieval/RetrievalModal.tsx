import React, { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, Building2, ChevronLeft, Brain,
  CheckCircle2, XCircle, BarChart3
} from 'lucide-react';
import {
  SkeletonNode, QuizQuestion, UserAnswer, CalibrationPrediction,
  RetrievalSession, ReconstructedNode, ReconstructionResult
} from '../../types';
import { generateQuizQuestions, evaluateAnswer } from '../../services/geminiService';
import QuickQuiz from './QuickQuiz';
import DeepReconstruction from './DeepReconstruction';

interface RetrievalModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  skeleton: SkeletonNode | null;
  markdown: string;
  onClose: () => void;
  onSaveSession: (session: RetrievalSession) => void;
}

type RetrievalMode = 'select' | 'quiz' | 'reconstruction';

const RetrievalModal: React.FC<RetrievalModalProps> = memo(({
  isOpen,
  theme,
  skeleton,
  markdown,
  onClose,
  onSaveSession
}) => {
  const [mode, setMode] = useState<RetrievalMode>('select');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    answers: UserAnswer[];
    prediction: CalibrationPrediction;
  } | null>(null);
  const [reconstructionResult, setReconstructionResult] = useState<ReconstructionResult | null>(null);

  // 加载测试题
  const loadQuestions = useCallback(async () => {
    if (!skeleton || !markdown) return;
    setIsLoading(true);
    try {
      const generatedQuestions = await generateQuizQuestions(markdown, skeleton, 5);
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [skeleton, markdown]);

  // 选择模式时加载题目
  useEffect(() => {
    if (mode === 'quiz' && questions.length === 0) {
      loadQuestions();
    }
  }, [mode, questions.length, loadQuestions]);

  // 评估答案
  const handleEvaluate = useCallback(async (question: QuizQuestion, answer: string) => {
    return await evaluateAnswer(question, answer);
  }, []);

  // 完成测试
  const handleQuizComplete = useCallback((answers: UserAnswer[], prediction: CalibrationPrediction) => {
    setQuizResult({ answers, prediction });

    const correctCount = answers.filter(a => a.isCorrect).length;
    const actualScore = Math.round((correctCount / answers.length) * 100);
    const predictionMap = { '90+': 95, '70-90': 80, '50-70': 60, '50-': 30 };
    const calibrationError = predictionMap[prediction] - actualScore;

    const session: RetrievalSession = {
      id: `quiz-${Date.now()}`,
      type: 'quiz',
      createdAt: Date.now(),
      completedAt: Date.now(),
      predictedScore: prediction,
      actualScore,
      calibrationError,
      questions,
      answers,
      weakNodes: answers.filter(a => !a.isCorrect).map(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q?.relatedNodePath || '';
      }).filter(Boolean)
    };

    onSaveSession(session);
  }, [questions, onSaveSession]);

  // 完成重构
  const handleReconstructionComplete = useCallback((result: ReconstructionResult, reconstructed: ReconstructedNode) => {
    setReconstructionResult(result);

    const session: RetrievalSession = {
      id: `recon-${Date.now()}`,
      type: 'reconstruction',
      createdAt: Date.now(),
      completedAt: Date.now(),
      actualScore: result.completionRate,
      calibrationError: 0,
      reconstructedTree: reconstructed,
      reconstructionResult: result,
      weakNodes: result.missedNodes
    };

    onSaveSession(session);
  }, [onSaveSession]);

  // 返回选择
  const goBack = useCallback(() => {
    setMode('select');
    setQuizResult(null);
    setReconstructionResult(null);
  }, []);

  // 关闭重置
  const handleClose = useCallback(() => {
    setMode('select');
    setQuestions([]);
    setQuizResult(null);
    setReconstructionResult(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* 背景遮罩 */}
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
          } backdrop-blur-sm`} />

        {/* 模态框 */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className={`relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl ${theme === 'dark'
            ? 'bg-slate-900 border border-white/10'
            : 'bg-white border border-slate-200'
            } shadow-2xl`}
        >
          {/* 头部 */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
            <div className="flex items-center gap-3">
              {mode !== 'select' && (
                <motion.button
                  onClick={goBack}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                    }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark'
                ? 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20'
                : 'bg-gradient-to-br from-indigo-100 to-violet-100'
                }`}>
                <Brain className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
              <div>
                <h2 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {mode === 'select' && '提取训练'}
                  {mode === 'quiz' && '快速测试'}
                  {mode === 'reconstruction' && '深度重构'}
                </h2>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {mode === 'select' && '选择训练模式'}
                  {mode === 'quiz' && 'AI 生成的深层理解测试'}
                  {mode === 'reconstruction' && '从零重建知识骨架'}
                </p>
              </div>
            </div>
            <motion.button
              onClick={handleClose}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
            <AnimatePresence mode="wait">
              {/* 模式选择 */}
              {mode === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid gap-4"
                >
                  {/* 快速测试卡片 */}
                  <motion.button
                    onClick={() => setMode('quiz')}
                    className={`p-6 rounded-2xl text-left transition-all border-2 ${theme === 'dark'
                      ? 'bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border-indigo-500/30 hover:border-indigo-400/50'
                      : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 hover:border-indigo-300'
                      }`}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                        }`}>
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                          快速测试
                        </h3>
                        <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                          AI 根据学习内容生成深层理解测试题，包含填空、判断、简答等题型
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            ⏱️ 5-10分钟
                          </span>
                          <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-600'
                            }`}>
                            🎯 校准预测
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {/* 深度重构卡片 */}
                  <motion.button
                    onClick={() => setMode('reconstruction')}
                    className={`p-6 rounded-2xl text-left transition-all border-2 ${theme === 'dark'
                      ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30 hover:border-emerald-400/50'
                      : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300'
                      }`}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'dark'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                        }`}>
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                          深度重构
                        </h3>
                        <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                          凭记忆从零重建知识骨架，系统会对比原始结构找出遗漏节点
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            ⏱️ 15-20分钟
                          </span>
                          <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'
                            }`}>
                            🏗️ 深度记忆
                          </span>
                        </div>
                      </div>
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
                >
                  <QuickQuiz
                    theme={theme}
                    questions={questions}
                    isLoading={isLoading}
                    onComplete={handleQuizComplete}
                    onEvaluate={handleEvaluate}
                  />
                </motion.div>
              )}

              {/* 深度重构 */}
              {mode === 'reconstruction' && (
                <motion.div
                  key="reconstruction"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* 重构结果展示 */}
                  {reconstructionResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          对比结果
                        </span>
                        <span className={`ml-auto text-2xl font-black ${reconstructionResult.completionRate >= 70
                          ? 'text-emerald-500'
                          : reconstructionResult.completionRate >= 50
                            ? 'text-amber-500'
                            : 'text-red-500'
                          }`}>
                          {reconstructionResult.completionRate}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                          }`}>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                          <div className="text-lg font-bold text-emerald-500">
                            {reconstructionResult.matchedNodes.length}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-600'}`}>
                            匹配
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                          }`}>
                          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                          <div className="text-lg font-bold text-red-500">
                            {reconstructionResult.missedNodes.length}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
                            遗漏
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                          }`}>
                          <div className="text-lg font-bold text-amber-500">
                            {reconstructionResult.extraNodes.length}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'}`}>
                            多余
                          </div>
                        </div>
                      </div>

                      {/* 遗漏节点列表 */}
                      {reconstructionResult.missedNodes.length > 0 && (
                        <div className="mt-4">
                          <p className={`text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                            需要复习的节点：
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {reconstructionResult.missedNodes.slice(0, 5).map((node, i) => (
                              <span
                                key={i}
                                className={`px-2 py-1 rounded-lg text-xs ${theme === 'dark' ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'
                                  }`}
                              >
                                {node}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <DeepReconstruction
                    theme={theme}
                    originalSkeleton={skeleton}
                    onComplete={handleReconstructionComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

RetrievalModal.displayName = 'RetrievalModal';

export default RetrievalModal;
