import React, { useState, useEffect } from 'react';
import { fetchMarketAnalysis } from './services/geminiService';
import { MarketAnalysis } from './types';
import { AnalysisView } from './components/AnalysisView';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMarketAnalysis();
      setData(result);
    } catch (err: any) {
      setError(err.message || "分析市场数据失败。");
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading && !error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-up-red to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                    <span className="text-3xl font-black text-white">α</span>
                </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-100 mb-4">AlphaTrader</h1>
            <p className="text-slate-400 mb-8 leading-relaxed">
                AI驱动的A股市场复盘助手。
                专注超短线情绪、涨停梯队分析，并提供严格的执行计划。
            </p>
            <button 
                onClick={loadData}
                className="group relative px-8 py-4 bg-slate-100 text-slate-900 rounded-lg font-bold hover:bg-white transition-all active:scale-95 w-full flex items-center justify-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
                开始市场复盘
            </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-up-red animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-200">正在分析市场数据...</h2>
        <div className="mt-2 text-slate-500 text-sm flex flex-col gap-1 items-center">
             <span>正在搜索今日涨跌停数据...</span>
             <span>正在分析龙虎榜与资金流向...</span>
             <span>正在生成交易策略...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-900/50 p-8 rounded-xl max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">分析失败 (Analysis Failed)</h2>
            <p className="text-red-200/70 mb-6">{error}</p>
            <button 
                onClick={loadData}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
            >
                重试
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {data && <AnalysisView data={data} onRefresh={loadData} />}
    </div>
  );
};

export default App;