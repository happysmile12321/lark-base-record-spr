import React, { useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Lightbulb, CheckCircle2, XCircle, ChevronRight,
  Loader2, HelpCircle, Clock, Target, BarChart3
} from 'lucide-react';
import { QuizQuestion, UserAnswer, CalibrationPrediction } from '../../types';

interface QuickQuizProps {
  theme: 'light' | 'dark';
  questions: QuizQuestion[];
  isLoading: boolean;
  onComplete: (answers: UserAnswer[], prediction: CalibrationPrediction) => void;
  onEvaluate: (question: QuizQuestion, answer: string) => Promise<{ isCorrect: boolean; feedback: string; score: number }>;
}

type QuizStep = 'calibration' | 'quiz' | 'result';

const PREDICTION_OPTIONS: { value: CalibrationPrediction; label: string; emoji: string }[] = [
  { value: '90+', label: '90%以上', emoji: '🎯' },
  { value: '70-90', label: '70-90%', emoji: '💪' },
  { value: '50-70', label: '50-70%', emoji: '🤔' },
  { value: '50-', label: '50%以下', emoji: '😅' },
];

const QuickQuiz: React.FC<QuickQuizProps> = memo(({
  theme,
  questions,
  isLoading,
  onComplete,
  onEvaluate
}) => {
  const [step, setStep] = useState<QuizStep>('calibration');
  const [prediction, setPrediction] = useState<CalibrationPrediction | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  const currentQuestion = questions[currentIndex];

  // 开始答题
  const startQuiz = useCallback(() => {
    if (prediction) {
      setStep('quiz');
      setStartTime(Date.now());
    }
  }, [prediction]);

  // 提交答案
  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || !currentAnswer.trim()) return;

    setIsEvaluating(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await onEvaluate(currentQuestion, currentAnswer);
      setFeedback(result);

      const answer: UserAnswer = {
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        isCorrect: result.isCorrect,
        timeTaken
      };

      setAnswers(prev => [...prev, answer]);

      // 延迟后进入下一题
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentAnswer('');
          setFeedback(null);
          setShowHint(false);
          setStartTime(Date.now());
        } else {
          setStep('result');
          onComplete([...answers, answer], prediction!);
        }
      }, 1500);
    } finally {
      setIsEvaluating(false);
    }
  }, [currentQuestion, currentAnswer, startTime, currentIndex, questions.length, answers, prediction, onComplete, onEvaluate]);

  // 跳过题目
  const skipQuestion = useCallback(() => {
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      userAnswer: '',
      isCorrect: false,
      timeTaken: Math.floor((Date.now() - startTime) / 1000)
    };

    setAnswers(prev => [...prev, answer]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentAnswer('');
      setFeedback(null);
      setShowHint(false);
      setStartTime(Date.now());
    } else {
      setStep('result');
      onComplete([...answers, answer], prediction!);
    }
  }, [currentQuestion, startTime, currentIndex, questions.length, answers, prediction, onComplete]);

  // 计算结果统计
  const stats = {
    correct: answers.filter(a => a.isCorrect).length,
    total: answers.length,
    percentage: answers.length > 0 ? Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100) : 0
  };

  // 校准误差
  const calibrationError = (() => {
    if (!prediction) return 0;
    const predictionMap = { '90+': 95, '70-90': 80, '50-70': 60, '50-': 30 };
    return predictionMap[prediction] - stats.percentage;
  })();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={`w-12 h-12 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
        </motion.div>
        <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          AI 正在生成测试题...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* 校准步骤 */}
        {step === 'calibration' && (
          <motion.div
            key="calibration"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${theme === 'dark'
                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                  : 'bg-gradient-to-br from-amber-100 to-orange-100'
                  }`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Target className={`w-8 h-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-500'}`} />
              </motion.div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                校准预测
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                根据你对这部分内容的掌握程度，预测能答对多少题？
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PREDICTION_OPTIONS.map(option => (
                <motion.button
                  key={option.value}
                  onClick={() => setPrediction(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${prediction === option.value
                    ? theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-indigo-500 bg-indigo-50'
                    : theme === 'dark'
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-slate-200 hover:border-slate-300'
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl mb-2 block">{option.emoji}</span>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>{option.label}</span>
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={startQuiz}
              disabled={!prediction}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all ${prediction
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400'
                : 'bg-slate-500 cursor-not-allowed opacity-50'
                }`}
              whileHover={prediction ? { scale: 1.02 } : {}}
              whileTap={prediction ? { scale: 0.98 } : {}}
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                开始测试 ({questions.length}题)
              </span>
            </motion.button>
          </motion.div>
        )}

        {/* 答题步骤 */}
        {step === 'quiz' && currentQuestion && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* 进度条 */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Q{currentIndex + 1}/{questions.length}
              </span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                <Clock className="w-3 h-3" />
                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                  难度 {'⭐'.repeat(currentQuestion.difficulty)}
                </span>
              </div>
            </div>

            {/* 进度指示器 */}
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* 题目卡片 */}
            <motion.div
              className={`p-6 rounded-2xl ${feedback
                ? feedback.isCorrect
                  ? theme === 'dark' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                  : theme === 'dark' ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
                : theme === 'dark' ? 'bg-slate-800/50 border border-white/10' : 'bg-white border border-slate-200'
                }`}
              layout
            >
              {/* 题型标签 */}
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs mb-4 ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
                }`}>
                {currentQuestion.type === 'fill-blank' && '填空题'}
                {currentQuestion.type === 'true-false' && '判断题'}
                {currentQuestion.type === 'short-answer' && '简答题'}
              </div>

              {/* 题目内容 */}
              <p className={`text-lg font-medium leading-relaxed mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                {currentQuestion.question}
              </p>

              {/* 输入区域 */}
              {currentQuestion.type === 'true-false' ? (
                <div className="flex gap-3">
                  {['对', '错'].map(opt => (
                    <motion.button
                      key={opt}
                      onClick={() => setCurrentAnswer(opt)}
                      disabled={!!feedback}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${currentAnswer === opt
                        ? 'bg-indigo-500 text-white'
                        : theme === 'dark'
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  disabled={!!feedback}
                  placeholder={currentQuestion.type === 'fill-blank' ? '输入答案...' : '详细作答...'}
                  className={`w-full p-4 rounded-xl border resize-none transition-all ${theme === 'dark'
                    ? 'bg-slate-700/50 border-white/10 text-white placeholder:text-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  rows={currentQuestion.type === 'short-answer' ? 4 : 2}
                />
              )}

              {/* 提示按钮 */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && !showHint && !feedback && (
                <motion.button
                  onClick={() => setShowHint(true)}
                  className={`mt-3 flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <Lightbulb className="w-3 h-3" />
                  显示提示
                </motion.button>
              )}

              {/* 提示内容 */}
              {showHint && currentQuestion.hints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`mt-3 p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                    }`}
                >
                  💡 {currentQuestion.hints.join(' | ')}
                </motion.div>
              )}

              {/* 反馈 */}
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 flex items-center gap-3 p-3 rounded-lg ${feedback.isCorrect
                    ? theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                    : theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
                    }`}
                >
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={feedback.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                    {feedback.feedback}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* 操作按钮 */}
            {!feedback && (
              <div className="flex gap-3">
                <motion.button
                  onClick={skipQuestion}
                  className={`px-6 py-3 rounded-xl font-medium ${theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  whileTap={{ scale: 0.95 }}
                >
                  跳过
                </motion.button>
                <motion.button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isEvaluating}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${currentAnswer.trim() && !isEvaluating
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    : 'bg-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  whileTap={currentAnswer.trim() ? { scale: 0.98 } : {}}
                >
                  {isEvaluating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      提交答案 <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* 结果步骤 */}
        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${stats.percentage >= 70
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                : stats.percentage >= 50
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                  : 'bg-gradient-to-br from-red-500 to-rose-500'
                }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span className="text-3xl font-black text-white">{stats.percentage}%</span>
            </motion.div>

            <div>
              <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                测试完成！
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                正确 {stats.correct}/{stats.total} 题
              </p>
            </div>

            {/* 校准分析 */}
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'
              }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  校准分析
                </span>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                预测: {PREDICTION_OPTIONS.find(o => o.value === prediction)?.label}
                {' → '}
                实际: {stats.percentage}%
              </p>
              <p className={`text-sm mt-1 font-medium ${Math.abs(calibrationError) <= 10
                ? 'text-emerald-500'
                : calibrationError > 0
                  ? 'text-amber-500'
                  : 'text-red-500'
                }`}>
                {Math.abs(calibrationError) <= 10
                  ? '🎯 校准准确！自我认知清晰'
                  : calibrationError > 0
                    ? `⚠️ 过度自信 (+${calibrationError}%)`
                    : `📈 低估自己 (${calibrationError}%)`
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

QuickQuiz.displayName = 'QuickQuiz';

export default QuickQuiz;
