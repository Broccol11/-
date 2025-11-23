import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchMarketAnalysis } from './services/geminiService';
import { MarketAnalysis } from './types';
import { AnalysisView } from './components/AnalysisView';
import { Loader2, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

// --- Date Picker Components ---

interface ScrollColumnProps {
  options: number[];
  selected: number;
  onSelect: (val: number) => void;
  label: string;
}

const ScrollColumn: React.FC<ScrollColumnProps> = ({ options, selected, onSelect, label }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item on mount or when selection/options change
  useEffect(() => {
    if (containerRef.current) {
      const selectedIndex = options.indexOf(selected);
      if (selectedIndex !== -1) {
        const itemHeight = 40; // Approx height of each item
        containerRef.current.scrollTop = selectedIndex * itemHeight;
      }
    }
  }, [selected, options]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-slate-500 text-xs font-bold mb-2 uppercase">{label}</div>
      <div 
        ref={containerRef}
        className="h-32 w-20 overflow-y-auto snap-y snap-mandatory scrollbar-hide bg-slate-800 rounded-lg border border-slate-700 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Spacer to allow first item to be in middle */}
        <div className="h-[44px]"></div> 
        
        {options.map((opt) => (
          <div 
            key={opt}
            onClick={() => onSelect(opt)}
            className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-colors ${
              opt === selected ? 'text-up-red font-bold text-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt}
          </div>
        ))}
        
        {/* Spacer to allow last item to be in middle */}
        <div className="h-[44px]"></div>
      </div>
    </div>
  );
};

const DateWheelPicker: React.FC<{
  year: number; setYear: (y: number) => void;
  month: number; setMonth: (m: number) => void;
  day: number; setDay: (d: number) => void;
}> = ({ year, setYear, month, setMonth, day, setDay }) => {
  
  const currentYear = new Date().getFullYear();
  // Years: 2 years back to current
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i); 
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Calculate valid trading days (excluding weekends)
  const validDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => {
        const date = new Date(year, month - 1, d);
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 is Sunday, 6 is Saturday
    });
  }, [year, month]);

  // Ensure day is valid when month/year changes
  useEffect(() => {
    if (validDays.length > 0 && !validDays.includes(day)) {
      // Find the closest valid day to the previously selected day
      const closest = validDays.reduce((prev, curr) => {
        return (Math.abs(curr - day) < Math.abs(prev - day) ? curr : prev);
      }, validDays[0]); // Default to first valid day if reduce fails
      setDay(closest);
    }
  }, [validDays, day, setDay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-4 justify-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <ScrollColumn options={years} selected={year} onSelect={setYear} label="年 (Year)" />
        <ScrollColumn options={months} selected={month} onSelect={setMonth} label="月 (Month)" />
        <ScrollColumn options={validDays} selected={day} onSelect={setDay} label="日 (Day)" />
      </div>
      <span className="text-[10px] text-slate-600 font-mono">* 已自动过滤周末休市日</span>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date Selection State (Default to Today)
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());

  const getFormattedDate = () => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = getFormattedDate();
      console.log("Analyzing for date:", dateStr);
      const result = await fetchMarketAnalysis(dateStr);
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
        <div className="text-center max-w-md w-full">
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-up-red to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                    <span className="text-3xl font-black text-white">α</span>
                </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">AlphaTrader</h1>
            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                AI驱动的A股市场复盘助手<br/>
                专注超短线情绪、涨停梯队分析
            </p>

            {/* Date Picker Section */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-center gap-2 mb-3 text-slate-500 text-xs">
                  <Calendar size={14} />
                  <span>选择复盘日期 (Select Date)</span>
               </div>
               <DateWheelPicker 
                  year={year} setYear={setYear}
                  month={month} setMonth={setMonth}
                  day={day} setDay={setDay}
               />
            </div>

            <button 
                onClick={loadData}
                className="group relative px-8 py-4 bg-slate-100 text-slate-900 rounded-lg font-bold hover:bg-white transition-all active:scale-95 w-full flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-white/10"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
                开始复盘分析 ({year}/{month}/{day})
            </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-up-red animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-200">正在复盘 {getFormattedDate()} 的市场...</h2>
        <div className="mt-2 text-slate-500 text-sm flex flex-col gap-1 items-center">
             <span>正在回溯前5日情绪周期...</span>
             <span>正在分析当涨跌停数据...</span>
             <span>正在生成次日交易策略...</span>
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
            <div className="flex gap-4 justify-center">
                 <button 
                    onClick={() => { setError(null); setData(null); }}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                    返回首页
                </button>
                <button 
                    onClick={loadData}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                >
                    重试
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {data && (
        <AnalysisView 
            data={data} 
            onRefresh={loadData} 
        />
      )}
      
      {/* Back Button Overlay */}
      <div className="fixed bottom-6 right-6 md:top-6 md:bottom-auto">
        <button 
            onClick={() => setData(null)} 
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 p-3 rounded-full backdrop-blur-md border border-slate-600 shadow-lg"
            title="返回日期选择"
        >
            <Calendar size={20} />
        </button>
      </div>
    </div>
  );
};

export default App;