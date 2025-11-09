import { GoogleGenAI } from "@google/genai";

// Assume the API key is set in the environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // In a real application, you'd want to handle this more gracefully.
  // For this environment, we assume it's always available.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "YOUR_API_KEY" });

const TONE_MAP: { [key: string]: string } = {
  'Standard': '标准',
  'Formal': '正式',
  'Informal': '非正式',
  'Critical': '批判性',
  'Enthusiastic': '热情',
};

const OPTION_PROMPTS: { [key: string]: string } = {
  'Character Arcs and Development': '角色弧光与发展：详细分析每个主要角色的旅程。他们的性格、动机和目标是如何在故事中演变的？他们经历了哪些关键的转变？请为每个主要角色提供一个独立的分析部分。',
  'Plot Analysis': '情节分析：评估故事结构、节奏和关键情节点（如激励事件、上升行动、高潮、下降行动和结局）。情节是否引人入胜？是否存在逻辑漏洞？',
  'Dialogue Quality': '对话质量：深入评估剧本中的对话。分析其真实性和自然程度，以及每个角色的声音是否独特且一致。评估对话在揭示角色性格、推动情节、营造冲突和传达潜台词方面的效果。',
  'Thematic Elements': '主题元素：识别并探讨剧本的核心主题和潜在信息。这些主题是如何通过情节、角色和象征手法来表达的？',
};

export const analyzeScript = async (script: string, options: string[], tone: string, customPoints: string): Promise<string> => {
  let analysisInstruction: string;

  if (options.includes('Full Analysis')) {
    analysisInstruction = `请对这个剧本进行全面、详细、深入的分析和总结，包括但不限于：
- 主要人物介绍 (性格、动机、发展)
- 人物关系分析
- 故事情节大纲 (按集或场景划分)
- 核心冲突
- 探讨的主题`;
  } else if (options.length > 0) {
     const specificPrompts = options.map(opt => OPTION_PROMPTS[opt] || opt).join('\n- ');
     analysisInstruction = `请深入分析剧本的以下特定方面：\n- ${specificPrompts}`;
  } else {
    analysisInstruction = '请深入分析剧本。';
  }

  if (customPoints.trim()) {
    if (options.length === 0) {
      analysisInstruction = `请根据以下自定义要点，深入分析剧本：\n${customPoints.trim()}`;
    } else {
      analysisInstruction += `\n\n请在分析中特别关注以下几点：\n${customPoints.trim()}`;
    }
  }

  const mappedTone = TONE_MAP[tone] || '标准';
  const toneInstruction = `请使用${mappedTone}的语气进行分析。`;

  const prompt = `你是一位专业的剧本分析师。请用中文，根据以下要求，分析提供的电视剧剧本。\n\n分析要求：\n${analysisInstruction}\n\n分析语气：\n${toneInstruction}\n\n---\n\n剧本内容：\n${script}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing script with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`An error occurred while analyzing the script: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the script.");
  }
};