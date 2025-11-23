import React from 'react';
import { MarketAnalysis, TradingPlan, HotSector, SentimentPoint, SectorPoint } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  ShieldAlert, 
  Zap,
  ExternalLink,
  Thermometer,
  AlertTriangle,
  Crosshair,
  TrendingUp as TrendingUpIcon,
  PieChart,
  History,
  BarChart2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalysisViewProps {
  data: MarketAnalysis;
  onRefresh: () => void;
}

const SentimentGauge: React.FC<{ score: number; text: string }> = ({ score, text }) => {
  // A-Share: Red is hot (good/high), Green is cold.
  let colorClass = "text-gray-400";
  if (score >= 80) colorClass = "text-up-red";
  else if (score >= 60) colorClass = "text-orange-400";
  else if (score >= 40) colorClass = "text-yellow-400";
  else colorClass = "text-down-green";

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-xl border border-slate-700">
      <div className="flex items-center gap-2 mb-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
        <Thermometer size={16} /> 市场情绪 (Sentiment)
      </div>
      <div className={`text-5xl font-black ${colorClass} mb-1`}>{score}</div>
      <div className="text-sm font-medium text-slate-300">{text}</div>
      <div className="w-full bg-slate-700 h-2 mt-4 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${score > 50 ? 'bg-up-red' : 'bg-down-green'}`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; type?: 'up' | 'down' | 'neutral' }> = ({ title, value, icon, type = 'neutral' }) => {
  const textColor = type === 'up' ? 'text-up-red' : type === 'down' ? 'text-down-green' : 'text-slate-100';
  const borderColor = type === 'up' ? 'border-red-900/30' : type === 'down' ? 'border-green-900/30' : 'border-slate-700';
  const bgGradient = type === 'up' ? 'bg-gradient-to-br from-slate-800 to-red-900/10' : type === 'down' ? 'bg-gradient-to-br from-slate-800 to-green-900/10' : 'bg-slate-800';

  return (
    <div className={`${bgGradient} p-4 rounded-xl border ${borderColor} flex flex-col items-start`}>
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">{title}</span>
        <span className="text-slate-500">{icon}</span>
      </div>
      <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
    </div>
  );
};

const PlanCard: React.FC<{ plan: TradingPlan }> = ({ plan }) => {
  const isBuy = plan.direction === 'BUY';
  const isWatch = plan.direction === 'WATCH';
  
  const directionText = isBuy ? '买入' : isWatch ? '观察' : '卖出';

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className={`px-4 py-3 flex justify-between items-center ${isBuy ? 'bg-up-red/10 border-b border-up-red/20' : isWatch ? 'bg-yellow-500/10 border-b border-yellow-500/20' : 'bg-slate-700/50'}`}>
        <div className="flex items-center gap-2">
            {isBuy ? <Zap className="text-up-red" size={18}/> : <AlertTriangle className="text-yellow-500" size={18}/>}
            <span className="font-bold text-lg text-slate-100">{plan.targetName}</span>
            <span className="text-xs text-slate-400 ml-2 font-mono px-2 py-0.5 rounded bg-slate-900/50 border border-slate-700/50">{plan.strategy}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${isBuy ? 'bg-up-red text-white' : isWatch ? 'bg-yellow-500 text-black' : 'bg-slate-600'}`}>
          {directionText}
        </span>
      </div>
      
      <div className="p-4 space-y-4 text-sm">
        
        {/* Logic Section */}
        <div>
             <div className="text-slate-500 text-xs mb-1 font-bold">交易逻辑 (Rationale)</div>
             <p className="text-slate-300 leading-relaxed bg-slate-700/20 p-2 rounded border border-slate-700/30">
                {plan.rationale}
             </p>
        </div>

        {/* Execution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
            {/* Trigger */}
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase">
                    <Crosshair size={12} className="text-blue-400"/> 触发条件 (Entry)
                </div>
                <div className="text-sm text-blue-100 font-mono font-medium break-words leading-tight">
                    {plan.triggerCondition}
                </div>
            </div>

            {/* Position */}
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase">
                    <PieChart size={12} className="text-purple-400"/> 仓位管理 (Size)
                </div>
                <div className="text-sm text-purple-100 font-mono font-medium leading-tight">
                    {plan.positionControl}
                </div>
            </div>

            {/* Stop Loss */}
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase">
                    <ShieldAlert size={12} className="text-red-400"/> 止损防守 (Stop Loss)
                </div>
                <div className="text-sm text-red-100 font-mono font-medium leading-tight">
                    {plan.stopLoss}
                </div>
            </div>

            {/* Take Profit */}
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase">
                    <TrendingUpIcon size={12} className="text-green-400"/> 止盈预期 (Target)
                </div>
                <div className="text-sm text-green-100 font-mono font-medium leading-tight">
                    {plan.takeProfit}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SentimentTrendChart: React.FC<{ data: SentimentPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-slate-500 text-sm p-4">暂无历史数据</div>;

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            domain={[0, 100]}
            hide={true}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            itemStyle={{ color: '#f1f5f9' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#ef4444" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} 
            activeDot={{ r: 6, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const SectorRotationRow: React.FC<{ data: SectorPoint[] }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-slate-500 text-sm p-4">暂无历史数据</div>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {data.map((item, idx) => (
                <div key={idx} className="bg-slate-700/30 rounded-lg p-2 border border-slate-700 flex flex-col items-center text-center relative overflow-hidden group hover:border-slate-500 transition-colors">
                    {/* Intensity Bar Background */}
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-red-500/10 transition-all" 
                        style={{ height: `${(item.intensity || 5) * 10}%` }}
                    />
                    
                    <div className="text-[10px] text-slate-500 font-mono mb-1">{item.date}</div>
                    <div className="font-bold text-slate-200 text-sm mb-1 truncate w-full px-1">{item.sectorName}</div>
                    <div className="text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded-full border border-slate-700/50">
                        {item.description}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ data, onRefresh }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">AlphaTrader <span className="text-up-red">A股复盘</span></h1>
          <p className="text-slate-400 text-sm mt-1">AI驱动的超短线市场情报与执行系统</p>
        </div>
        <div className="text-right">
            <div className="text-slate-500 text-xs uppercase font-mono mb-1">复盘日期</div>
            <div className="text-xl font-mono text-slate-200">{data.marketDate}</div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SentimentGauge score={data.sentimentScore} text={data.sentimentText} />
        <StatCard 
            title="涨停家数 (Limit Up)" 
            value={data.limitUpCount} 
            icon={<TrendingUp size={20} className="text-up-red"/>} 
            type="up" 
        />
        <StatCard 
            title="跌停家数 (Limit Down)" 
            value={data.limitDownCount} 
            icon={<TrendingDown size={20} className="text-down-green"/>} 
            type="down" 
        />
        <StatCard 
            title="成交量 (Volume)" 
            value={data.marketVolume} 
            icon={<Activity size={20}/>} 
        />
      </div>

      {/* Trend Analysis Section (New) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sentiment Trend */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm md:col-span-1">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History size={16} /> 近5日情绪走势 (Sentiment Trend)
            </h3>
            <SentimentTrendChart data={data.sentimentTrend} />
        </div>

        {/* Sector Rotation */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm md:col-span-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 size={16} /> 近5日热点轮动 (Sector Rotation)
            </h3>
            <SectorRotationRow data={data.sectorTrend} />
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Market Logic & Sectors (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Market Logic */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Activity className="text-blue-500" /> 市场逻辑与周期 (Cycle)
                </h2>
                <div className="prose prose-invert prose-slate max-w-none">
                    <p className="whitespace-pre-line leading-relaxed text-slate-300">
                        {data.marketLogic}
                    </p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">资金流向分析 (Fund Flow)</h3>
                    <p className="text-slate-300 leading-relaxed">{data.fundFlowAnalysis}</p>
                </div>
            </div>

            {/* Hot Sectors Chart/List (Today) */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                 <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                    <Zap className="text-yellow-500" /> 今日领涨热点 (Hot Sectors Today)
                </h2>
                <div className="space-y-4">
                    {data.hotSectors.map((sector, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-lg text-slate-200">{sector.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{sector.flowStatus}</span>
                                </div>
                                <div className="text-sm text-slate-500">龙头: <span className="text-slate-300">{sector.leaderStock}</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-up-red">{sector.performance}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* Right Column: Trading Plan (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
             <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 h-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Target className="text-up-red" /> 次日计划 (Plan)
                    </h2>
                    <span className="text-xs text-slate-500 uppercase tracking-widest">TOMORROW</span>
                </div>
                
                <div className="space-y-4">
                    {data.tradingPlans.length === 0 ? (
                        <div className="p-4 bg-slate-800 rounded border border-slate-700 text-center text-slate-400">
                            建议空仓观望 (Empty Position)
                        </div>
                    ) : (
                        data.tradingPlans.map((plan, idx) => (
                            <PlanCard key={idx} plan={plan} />
                        ))
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">参考数据源 (Sources)</h4>
                    <ul className="space-y-2">
                        {data.sources.slice(0, 5).map((source, idx) => (
                            <li key={idx} className="truncate">
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline">
                                    <ExternalLink size={10} />
                                    {source.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

      </div>
      
      <div className="text-center pt-10 pb-4 text-slate-600 text-xs">
         免责声明：AI生成的分析仅供参考，不构成任何投资建议。股市有风险，入市需谨慎。
      </div>
    </div>
  );
};