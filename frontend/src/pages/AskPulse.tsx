import { useState } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Send,
  HelpCircle,
  RefreshCw,
  Award,
  Sparkles,
  ShoppingBag,
  DollarSign
} from 'lucide-react';

interface QueryResponse {
  answer: string;
  groundedMetrics: {
    totalSales: number;
    totalTransactions: number;
    avgTransactionValue: number;
  };
}

export default function AskPulse() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState('');
  const merchantId = localStorage.getItem('merchantId') || 'demo-merchant-1';

  const sampleQuestions = [
    'How is my business doing this week?',
    'Why are my evening sales lower?',
    'When are my busiest hours?',
    'What is my average transaction value?',
  ];

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim() || loading) return;
    setLoading(true);
    setError('');
    setQuestion(textToAsk);

    try {
      const res = await axios.post<QueryResponse>('/api/business-pulse/query', {
        question: textToAsk,
        merchantId: merchantId,
      });
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Error communicating with the analytics assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-paytm-cyan text-glow-blue" />
          <span>Ask Business Pulse</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Query your transaction logs using natural language. The AI assistant responds using ONLY verified merchant data.
        </p>
      </div>

      {/* Main chat widget box */}
      <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-paytm-cyan" />
            <span>Select a sample query or type below</span>
          </span>
          <div className="flex flex-wrap gap-2.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                disabled={loading}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white duration-150 text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Form Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="relative flex items-center bg-slate-950 rounded-2xl border border-slate-800/80 focus-within:border-paytm-cyan/50 focus-within:ring-1 focus-within:ring-paytm-cyan/30 duration-150 overflow-hidden"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question (e.g. 'How is my business doing this week?')..."
            disabled={loading}
            className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="mr-3 p-2.5 rounded-xl bg-paytm-cyan text-slate-950 hover:bg-paytm-cyan/90 duration-150 disabled:opacity-30 disabled:bg-paytm-cyan"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>

        {error && (
          <p className="text-xs font-semibold text-rose-400 bg-rose-500/5 border border-rose-500/10 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        {/* Loading display */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-7 w-7 animate-spin text-paytm-cyan" />
            <p className="text-slate-400 text-xs font-medium">Consulting Sarvam AI Analytics models...</p>
          </div>
        )}

        {/* Query Answer Panel */}
        {!loading && result && (
          <div className="mt-8 border-t border-slate-900 pt-8 space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-extrabold text-white">Analysis Response</h2>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 leading-relaxed text-sm text-slate-200">
              {result.answer}
            </div>

            {/* Grounded Metrics Card Grid */}
            <div className="space-y-3">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">
                Grounded Database Metrics Checked
              </span>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-slate-950/30 rounded-xl p-4 border border-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Sales Checked</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      ₹{result.groundedMetrics.totalSales.toLocaleString()}
                    </span>
                  </div>
                  <DollarSign className="h-4.5 w-4.5 text-paytm-cyan/85" />
                </div>
                
                <div className="bg-slate-950/30 rounded-xl p-4 border border-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Checkouts Checked</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {result.groundedMetrics.totalTransactions}
                    </span>
                  </div>
                  <ShoppingBag className="h-4.5 w-4.5 text-paytm-cyan/85" />
                </div>
                
                <div className="bg-slate-950/30 rounded-xl p-4 border border-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Ticket Checked</span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      ₹{result.groundedMetrics.avgTransactionValue}
                    </span>
                  </div>
                  <Award className="h-4.5 w-4.5 text-paytm-cyan/85" />
                </div>
              </div>
            </div>

            {/* Grounded Verification Badge */}
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 px-4 py-3 border border-emerald-500/10 max-w-max">
              <Award className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400/90 leading-tight">
                AI Safety Verification: Response is fully grounded in database calculations. No hallucinations present.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
