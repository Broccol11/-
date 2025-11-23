import { GoogleGenAI } from "@google/genai";
import { MarketAnalysis } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位顶尖的A股（中国股市）超短线游资交易员，擅长龙头战法和情绪博弈。
你的目标是分析最新的市场数据，并为下一个交易日提供**高度可执行、量化、且风险可控**的交易计划。

**核心宗旨:**
1. **只做确定性**: 宁可空仓，不做杂毛。如果市场处于退潮期或冰点，明确建议空仓观望。
2. **量化标准**: 拒绝模糊。买入条件必须包含具体的盘口特征、价格位置或成交量要求。
3. **风险厌恶**: 每一笔交易必须先想好怎么输。止损条件必须铁面无私，给出具体价格或跌幅。

**任务:**
1. 使用 Google Search 查找指定日期（Target Date）的A股市场复盘信息（涨跌停对比、连板梯队、成交量、北向/机构/游资流向）。
2. **重要**: 同时回顾该日期前4个交易日的数据，梳理出近5日的情绪周期走势和热点板块轮动路径。
3. 研判当时的市场情绪周期（启动、发酵、主升、分歧、退潮、冰点、混沌）。
4. 制定下一个交易日的交易计划。

**输出格式 (JSON):**
必须返回一个符合以下特定 Schema 的原始 JSON 对象（不要使用 markdown 代码块）：
所有文本字段的内容必须使用 **简体中文**。

{
  "marketDate": "YYYY-MM-DD",
  "sentimentScore": number (0-100, 50为中性, >80为过热, <20为冰点),
  "sentimentText": "string (如：情绪冰点, 弱修复, 高潮加速)",
  "limitUpCount": number,
  "limitDownCount": number,
  "marketVolume": "string (如：8000亿)",
  "hotSectors": [
    { "name": "板块名", "performance": "涨幅%", "leaderStock": "龙头股", "flowStatus": "流入/流出" }
  ],
  "sentimentTrend": [
    { 
      "date": "MM-DD", 
      "score": number, 
      "label": "简短描述",
      "phase": "周期阶段" 
      // phase 必须是以下之一: "启动", "主升", "高位震荡", "退潮", "低位混沌"
    } 
    // 必须包含包括Target Date在内的过去5个交易日的数据，按时间升序排列
  ],
  "sectorTrend": [
    { "date": "MM-DD", "sectorName": "当日最强板块", "intensity": number (1-10强度), "description": "简评" }
    // 必须包含包括Target Date在内的过去5个交易日的数据，按时间升序排列
  ],
  "fundFlowAnalysis": "资金面分析...",
  "marketLogic": "核心逻辑复盘与情绪周期判定...",
  "tradingPlans": [
    {
      "targetName": "个股或板块名称",
      "direction": "BUY" | "WATCH" | "SELL",
      "triggerCondition": "精确的买入信号。如：'竞价高开>2%且金额超5000万'，'回踩5日线(约12.5元)企稳'，'打板确认(封单>1亿)'。",
      "strategy": "模式名称。如：'龙头首阴'，'反包二板'，'低吸核心'。",
      "positionControl": "具体仓位及加仓逻辑。如：'轻仓10%试错'，'分批建仓，总仓位不超过30%'。",
      "stopLoss": "刚性止损线。如：'跌破今日低点'，'收盘价跌破5日线'，'亏损-4%无条件离场'。",
      "takeProfit": "预期目标。如：'次日冲高5-8%止盈'，'断板即走'。",
      "rationale": "逻辑硬核。如：'板块唯一活口，具备身位优势'。"
    }
  ]
}
`;

const MAX_RETRIES = 3;

export const fetchMarketAnalysis = async (targetDate?: string): Promise<MarketAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const dateToAnalyze = targetDate || new Date().toISOString().split('T')[0];
    
    const prompt = `Search for A-Share market summary for specific date: ${dateToAnalyze}. 
    Key data points needed: Limit Up/Down counts, Total Volume, Northbound/Main fund flow, Hot concepts.
    
    CRITICAL: You MUST also search for and summarize the market sentiment and top hot sectors for the 4 trading days LEADING UP TO ${dateToAnalyze} to build a 5-day trend ending on ${dateToAnalyze}.
    
    Identify the specific 'Cycle Phase' (phase) for each of the 5 days (e.g., Launch, Rise, Divergence, Decline, Chaos).
    
    Based on the analysis of ${dateToAnalyze}, generate specific trading plans for the NEXT trading day.
    For the trading plans, be extremely specific about ENTRY triggers and STOP LOSS levels.
    Calculate potential support/resistance levels based on price action found in search results.
    
    If ${dateToAnalyze} is a weekend or holiday, analyze the last valid trading day BEFORE it, but explicitly state the actual trading date analyzed in the 'marketDate' field of the JSON.

    Return the analysis as a VALID JSON object matching the defined schema.
    Ensure all content is in Simplified Chinese.
    
    IMPORTANT: Return ONLY the JSON object. Do not wrap it in markdown code blocks.`;

    let result;
    let lastError;

    // Retry loop for robustness against transient network/RPC errors
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });

        if (result.text) break; // Success, exit loop
      } catch (err: any) {
        console.warn(`Attempt ${attempt} failed:`, err);
        lastError = err;
        
        if (attempt === MAX_RETRIES) break; // Don't wait after last attempt
        
        // Exponential backoff: 1s, 2s, 4s...
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const text = result?.text;
    
    if (!text) {
      throw lastError || new Error("No response from AI. The model might be overloaded or search failed.");
    }

    // Extract grounding metadata
    const groundingChunks = result?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((s: any) => s !== null);

    let parsedData: any;
    try {
        parsedData = JSON.parse(text);
    } catch (e) {
        // Fallback cleanup if the model adds markdown code blocks or intro text
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Find JSON object boundaries if there is extra text
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        try {
            parsedData = JSON.parse(cleanText);
        } catch (e2) {
             console.error("Failed to parse JSON:", text);
             throw new Error("Failed to parse market analysis data. The model response was not valid JSON.");
        }
    }

    // Validate essential fields to prevent UI crashes
    if (!parsedData.hotSectors) parsedData.hotSectors = [];
    if (!parsedData.tradingPlans) parsedData.tradingPlans = [];
    if (!parsedData.sentimentTrend) parsedData.sentimentTrend = [];
    if (!parsedData.sectorTrend) parsedData.sectorTrend = [];

    return {
      ...parsedData,
      sources: sources
    };

  } catch (error: any) {
    console.error("Analysis failed:", error);
    // Enhance error message for UI
    if (error.message && (error.message.includes("Rpc failed") || error.message.includes("xhr error"))) {
      throw new Error("Connection unstable (RPC/XHR Error). Retried 3 times but failed. Please try again.");
    }
    throw error;
  }
};