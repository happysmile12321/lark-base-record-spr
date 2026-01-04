import { SkeletonNode } from "../types";

// API 提供商类型
export type ApiProvider = 'gemini' | 'siliconflow';

// API 配置接口
export interface ApiConfig {
  provider: ApiProvider;
  geminiApiKey?: string;
  geminiBaseUrl?: string;
  siliconflowApiKey?: string;
  siliconflowBaseUrl?: string;
  siliconflowModel?: string;
}

const DEFAULT_SILICONFLOW_MODEL = "deepseek-ai/DeepSeek-V3";
const DEFAULT_GEMINI_ANALYSIS_MODEL = "gemini-2.0-flash-exp";

/**
 * 使用 Gemini API 分析 Markdown
 */
async function analyzeWithGemini(
  markdown: string,
  apiKey: string,
  baseUrl?: string
): Promise<SkeletonNode> {
  // 动态导入 Gemini
  const { GoogleGenAI, Type } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey,
    baseURL: baseUrl || undefined,
  });

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
              description: "第一层级��部分/Part (例如：第一部分 基础理论)",
            },
            type: { type: Type.STRING, enum: ["part"] },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: {
                    type: Type.STRING,
                    description: "第二层级：章节/Chapter (例如：1. 记忆的生理机制)",
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
                            "高度抽象的认知���子。必须是'名词短语'或'问题指引'。绝对禁止包含具体解释或答案。",
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

  const prompt = `
你是一位精通 "结构化渐进提取 (SPR)" 的认知科学家。
你的任务是将输入的 Markdown 内容转化为一个【认知训练骨架】。

核心目标：帮助用户通过"良性困难"来主动回忆内容，而不是被动阅读摘要。

【处理原则】：
1. **层级严谨**：严格遵守 Part -> Chapter -> Slot 的层级结构。
2. **信息遮蔽 (关键)**：在最底层的 "children" (Slot) 中，**绝对禁止**直接输出结论、定义或解释。
3. **抽象化标签**：将具体内容转化为"元认知标签"。
   - ❌ 错误： "海马体负责将短时记忆转化为长时记忆" (这是答案，不要！)
   - ✅ 正确： "【关键机制：海马体的核心功能】" (这是钩子，要这个！)
4. **分类标记**：
   - 如果是定义、名词，type 标记为 "slot_concept"
   - 如果是运行原理、因果关系，type 标记为 "slot_logic"
   - 如果是具体的学习方法、建议，type 标记为 "slot_action"

【输入文本】：
${markdown}
`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 响应为空");
    return JSON.parse(text) as SkeletonNode;
  } catch (error) {
    console.error("Gemini SPR Analysis Error:", error);
    throw error;
  }
}

/**
 * 使用硅基流动 API 分析 Markdown
 */
async function analyzeWithSiliconFlow(
  markdown: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<SkeletonNode> {
  console.log("使用硅基流动 API 分析...");

  const systemPrompt = `你是一个专业的文档分析专家，擅长从 Markdown 文档中提取结构化知识。

请按照以下 JSON Schema 分析给定的 Markdown 文档内容：

\`\`\`json
{
  "type": "object",
  "properties": {
    "label": { "type": "string", "description": "书籍或文档的总标题" },
    "type": { "type": "string", "enum": ["root"] },
    "children": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "label": {
            "type": "string",
            "description": "第一层级：部分/Part (例如：第一部分 基础理论)"
          },
          "type": { "type": "string", "enum": ["part"] },
          "children": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "label": {
                  "type": "string",
                  "description": "第二层级：章节/Chapter (例如：1. 记忆的生理机制)"
                },
                "type": { "type": "string", "enum": ["chapter"] },
                "children": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "description": "第三层级：SPR 回忆槽位 (关键层级)",
                    "properties": {
                      "label": {
                        "type": "string",
                        "description": "高度抽象的认知钩子。必须是'名词短语'或'问题指引'。绝对禁止包含具体解释或答案。"
                      },
                      "type": {
                        "type": "string",
                        "enum": ["slot_concept", "slot_logic", "slot_action"],
                        "description": "slot_concept=核心概念/名词; slot_logic=机制/原理/推论; slot_action=具体策略/行动建议"
                      }
                    },
                    "required": ["label", "type"]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "required": ["label", "type", "children"]
}
\`\`\`

**重要规则：**
1. 严格按照三层结构组织：Part -> Chapter -> Slot
2. 第三层 Slot 是最重要的回忆层，每个 Slot 应该是一个可独立回忆的知识单元
3. label 必须是抽象的"钩子"，不要直接写出答案
4. 提取的知识点应该是具体、可操作的内容
5. 返回纯 JSON 格式，不要有任何 markdown 标记

【处理原则】：
- **信息遮蔽 (关键)**：在最底层的 Slot 中，**绝对禁止**直接输出结论、定义或解释。
- **抽象化标签**：将具体内容转化为"元认知标签"。
  - ❌ 错误： "海马体负责将短时记忆转化为长时记忆" (这是答案，不要！)
  - ✅ 正确： "【关键机制：海马体的核心功能】" (这是钩子，要这个！)`;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `请分析以下 Markdown 文档：\n\n${markdown}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`硅基流动 API 请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return parsed as SkeletonNode;
  } catch (e) {
    console.error("JSON 解析失败:", content);
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
}

// 导出统一的分析函数
export async function analyzeMarkdownWithProvider(
  markdown: string,
  config: ApiConfig
): Promise<SkeletonNode> {
  switch (config.provider) {
    case 'siliconflow':
      if (!config.siliconflowApiKey) {
        throw new Error("硅基流动 API Key 未配置");
      }
      return analyzeWithSiliconFlow(
        markdown,
        config.siliconflowApiKey,
        config.siliconflowBaseUrl || 'https://api.siliconflow.cn',
        config.siliconflowModel || DEFAULT_SILICONFLOW_MODEL
      );

    case 'gemini':
      if (!config.geminiApiKey) {
        throw new Error("Gemini API Key 未配置");
      }
      return analyzeWithGemini(markdown, config.geminiApiKey, config.geminiBaseUrl);

    default:
      throw new Error("未知的 API 提供商");
  }
}

// 硅基流动默认配置
export const DEFAULT_SILICONFLOW_CONFIG: Partial<ApiConfig> = {
  provider: 'siliconflow',
  siliconflowBaseUrl: 'https://api.siliconflow.cn',
  siliconflowModel: DEFAULT_SILICONFLOW_MODEL,
};

// 创建默认 API 配置（默认使用硅基流动）
export function createDefaultApiConfig(geminiKey?: string): ApiConfig {
  return {
    provider: 'siliconflow',
    geminiApiKey: geminiKey,
    siliconflowBaseUrl: 'https://api.siliconflow.cn',
    siliconflowModel: DEFAULT_SILICONFLOW_MODEL,
  };
}

// 验证 API 配置是否有效
export function validateApiConfig(config: ApiConfig): { valid: boolean; error?: string } {
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      return { valid: false, error: "Gemini API Key 未配置" };
    }
  } else if (config.provider === 'siliconflow') {
    if (!config.siliconflowApiKey) {
      return { valid: false, error: "硅基流动 API Key 未配置" };
    }
  }
  return { valid: true };
}
