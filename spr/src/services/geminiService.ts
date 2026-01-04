import { GoogleGenAI, Type } from "@google/genai";
import {
  SkeletonNode,
  MindMapNode,
  ParagraphSummary,
  QuizQuestion,
} from "../types";
import { GEMINI_API_KEY } from "../config/env";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 摘要结果接口（用于API响应）
export interface SummaryResult {
  title: string;
  mindMap: MindMapNode;
  keyPoints: string[];
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    label: { type: Type.STRING, description: "书籍或文档的总标题" },
    type: { type: Type.STRING, enum: ["root"] },
    children: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: "第一层级：部分/Part (例如：第一部分 基础理论)",
          },
          type: { type: Type.STRING, enum: ["part"] },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: {
                  type: Type.STRING,
                  description:
                    "第二层级：章节/Chapter (例如：1. 记忆的生理机制)",
                },
                type: { type: Type.STRING, enum: ["chapter"] },
                children: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    description: "第三层级：SPR 回忆槽位 (关键层级)",
                    properties: {
                      label: {
                        type: Type.STRING,
                        description:
                          "高度抽象的认知钩子。必须是'名词短语'或'问题指引'。绝对禁止包含具体解释或答案。例如：'【核心隐喻：电影摄制组】' 而非 '大脑像电影摄制组一样工作'。",
                      },
                      type: {
                        type: Type.STRING,
                        enum: ["slot_concept", "slot_logic", "slot_action"],
                        description:
                          "slot_concept=核心概念/名词; slot_logic=机制/原理/推论; slot_action=具体策略/行动建议",
                      },
                    },
                    required: ["label", "type"],
                  },
                },
              },
              required: ["label", "children", "type"],
            },
          },
        },
        required: ["label", "children", "type"],
      },
    },
  },
  required: ["label", "children", "type"],
};

export const analyzeMarkdown = async (
  content: string
): Promise<SkeletonNode> => {
  const prompt = `
  你是一位精通 "结构化渐进提取 (SPR)" 的认知科学家。
  你的任务是将输入的 Markdown 内容转化为一个【认知训练骨架】。
  
  核心目标：帮助用户通过“良性困难”来主动回忆内容，而不是被动阅读摘要。
  
  【处理原则】：
  1. **层级严谨**：严格遵守 Part -> Chapter -> Slot 的层级结构。
  2. **信息遮蔽 (关键)**：在最底层的 "children" (Slot) 中，**绝对禁止**直接输出结论、定义或解释。
  3. **抽象化标签**：将具体内容转化为“元认知标签”。
     - ❌ 错误： "海马体负责将短时记忆转化为长时记忆" (这是答案，不要！)
     - ✅ 正确： "【关键机制：海马体的核心功能】" (这是钩子，要这个！)
     - ✅ 正确： "【实验案例：H.M.病人的记忆缺失】"
  4. **分类标记**：
     - 如果是定义、名词，type 标记为 "slot_concept"
     - 如果是运行原理、因果关系，type 标记为 "slot_logic"
     - 如果是具体的学习方法、建议，type 标记为 "slot_action"

  【输入文本】：
  ${content}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 4000 },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 响应为空");
    return JSON.parse(text) as SkeletonNode;
  } catch (error) {
    console.error("Gemini SPR Analysis Error:", error);
    throw error;
  }
};

const noteSchema = {
  type: Type.OBJECT,
  properties: {
    correctedContent: { type: Type.STRING, description: "修正后的内容" },
    category: { type: Type.STRING, description: "所属分类" },
  },
  required: ["correctedContent", "category"],
};

export const processNote = async (
  content: string,
  categories: string[]
): Promise<{ correctedContent: string; category: string }> => {
  const categoriesStr = categories.join(", ");
  const prompt = `分析笔记并分类。可选分类: [${categoriesStr}]。内容: ${content}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: noteSchema,
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { correctedContent: content, category: categories[0] || "未分类" };
  }
};

// 摘要思维导图Schema（增强emoji支持）
const summarySchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "摘要的核心主题标题，简洁有力，前面加上合适的emoji",
    },
    mindMap: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        label: { type: Type.STRING, description: "中心节点标签，概括整体主题" },
        emoji: { type: Type.STRING, description: "节点对应的emoji符号" },
        type: { type: Type.STRING, enum: ["center"] },
        children: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING, description: "主要概念节点" },
              emoji: { type: Type.STRING, description: "节点对应的emoji符号" },
              type: { type: Type.STRING, enum: ["main"] },
              children: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING, description: "子概念节点" },
                    emoji: {
                      type: Type.STRING,
                      description: "节点对应的emoji符号",
                    },
                    type: { type: Type.STRING, enum: ["sub"] },
                  },
                  required: ["id", "label", "type", "emoji"],
                },
              },
            },
            required: ["id", "label", "type", "emoji"],
          },
        },
      },
      required: ["id", "label", "type", "children", "emoji"],
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5个核心要点，每个要点前面加上合适的emoji，简洁明了",
    },
  },
  required: ["title", "mindMap", "keyPoints"],
};

// 生成段落摘要思维导图
export const generateSummary = async (
  paragraphs: string[]
): Promise<SummaryResult> => {
  const content = paragraphs.join("\n\n");
  const prompt = `
  你是一位擅长知识提炼和可视化的专家。请分析以下内容，生成结构化的摘要思维导图。

  【任务要求】：
  1. 提取核心主题作为中心节点
  2. 识别3-5个主要概念作为一级分支
  3. 每个主要概念下可以有1-3个子概念
  4. 提炼3-5个最重要的要点

  【输出原则】：
  - 🎯 标签简洁有力，每个节点不超过15个字
  - 🔗 突出概念之间的逻辑关系
  - 📝 使用名词短语而非完整句子
  - ✨ 每个节点和要点都必须配上合适的emoji表情符号！
  - 🌟 emoji要有意义，能够反映节点内容的本质

  【emoji参考】：
  - 概念类：💡🎯📌🔑💎🌟⭐
  - 过程类：🔄📈🚀⚡🎬🔧
  - 关系类：🔗🤝💬🔀➡️↔️
  - 结果类：✅🎉🏆💯🎁📊
  - 警告类：⚠️❗🚨💥❌🔴
  - 其他：🧠📚🎨🔬🌍💻🎯

  【待分析内容】：
  ${content}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: summarySchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 响应为空");
    return JSON.parse(text) as SummaryResult;
  } catch (error) {
    console.error("Summary Generation Error:", error);
    // 返回默认结构
    return {
      title: "⚠️ 摘要生成失败",
      mindMap: {
        id: "center",
        label: "内容概述",
        emoji: "📋",
        type: "center",
        children: [
          {
            id: "main1",
            label: "请重试",
            emoji: "🔄",
            type: "main",
          },
        ],
      },
      keyPoints: ["⚠️ 摘要生成过程中出现错误，请稍后重试"],
    };
  }
};

// ===== 第四阶段：测试题生成 =====

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ["fill-blank", "true-false", "short-answer"],
            description: "题目类型",
          },
          question: {
            type: Type.STRING,
            description: "题目内容。填空题用____表示空白处",
          },
          answer: {
            type: Type.STRING,
            description: "正确答案",
          },
          hints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "1-2个提示，帮助回忆",
          },
          relatedNodePath: {
            type: Type.STRING,
            description: "关联的骨架节点路径，如 '第一章/1.1'",
          },
          difficulty: {
            type: Type.NUMBER,
            description: "难度等级：1=简单, 2=中等, 3=困难",
          },
        },
        required: ["id", "type", "question", "answer", "difficulty"],
      },
    },
  },
  required: ["questions"],
};

// 生成测试题
export const generateQuizQuestions = async (
  content: string,
  skeleton: SkeletonNode,
  count: number = 5
): Promise<QuizQuestion[]> => {
  // 提取骨架的关键节点路径
  const extractPaths = (node: SkeletonNode, prefix: string = ""): string[] => {
    const currentPath = prefix ? `${prefix}/${node.label}` : node.label;
    const paths = [currentPath];
    if (node.children) {
      node.children.forEach((child) => {
        paths.push(...extractPaths(child, currentPath));
      });
    }
    return paths;
  };
  const nodePaths = extractPaths(skeleton).slice(0, 10).join("\n");

  const prompt = `
  你是一位精通"生成式提取"学习法的教育专家。
  请基于以下学习内容，生成${count}道深层理解测试题。

  【题型要求】：
  1. 填空题(fill-blank)：测试关键概念的记忆，用____表示填空处
  2. 判断题(true-false)：测试常见误解，问题以"对还是错："开头
  3. 简答题(short-answer)：测试概念关系和应用能力

  【出题原则 - 极其重要】：
  - 🎯 测试"为什么"而非"是什么"
  - 🔗 关注概念之间的关系和因果
  - 💡 避免死记硬背型题目
  - 🧠 优先考察深层理解和应用
  - ❌ 禁止出过于简单的定义题

  【难度分布】：
  - 难度1(简单)：核心概念识别 - 占20%
  - 难度2(中等)：概念关系理解 - 占50%
  - 难度3(困难)：应用与迁移 - 占30%

  【骨架节点路径】：
  ${nodePaths}

  【学习内容】：
  ${content.slice(0, 3000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 响应为空");
    const result = JSON.parse(text);
    return result.questions as QuizQuestion[];
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    // 返回备用题目
    return [
      {
        id: "fallback-1",
        type: "short-answer",
        question: "请用自己的话概括这部分内容的核心观点。",
        answer: "(开放性问题)",
        relatedNodePath: skeleton.label,
        difficulty: 2,
      },
    ];
  }
};

// 评估用户答案
export const evaluateAnswer = async (
  question: QuizQuestion,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string; score: number }> => {
  const prompt = `
  评估用户的答案是否正确。

  【题目】：${question.question}
  【标准答案】：${question.answer}
  【用户答案】：${userAnswer}

  请以JSON格式返回：
  - isCorrect: 是否正确(boolean)
  - score: 得分0-100
  - feedback: 简短反馈(不超过30字)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
          },
          required: ["isCorrect", "score", "feedback"],
        },
      },
    });

    return JSON.parse(
      response.text || '{"isCorrect":false,"score":0,"feedback":"评估失败"}'
    );
  } catch (error) {
    // 简单的字符串匹配作为后备
    const isCorrect = userAnswer
      .toLowerCase()
      .includes(question.answer.toLowerCase().slice(0, 10));
    return {
      isCorrect,
      score: isCorrect ? 80 : 20,
      feedback: isCorrect ? "基本正确" : "需要复习",
    };
  }
};
