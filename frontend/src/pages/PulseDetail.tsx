import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  ListTodo
} from 'lucide-react';

interface InsightItem {
  id: string;
  insight_type: string;
  headline: string;
  observation: string;
  explanation: string;
  recommendation: string;
  confidence: string;
  created_at: string;
}

interface PulseDetailData {
  summary: any;
  signals: any[];
  anomalies: any[];
}

export default function PulseDetail() {
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<PulseDetailData | null>(null);
  const [history, setHistory] = useState<InsightItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPulseDetails();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage]);

  const fetchPulseDetails = async () => {
    try {
      const summaryRes = await axios.get('/api/merchant/summary');
      setDetailData({
        summary: summaryRes.data.summary,
        signals: summaryRes.data.signals,
        anomalies: summaryRes.data.anomalies,
      });
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch analytics signals.');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get<{ insights: InsightItem[] }>('/api/business-pulse/history');
      setHistory(res.data.insights);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async (page: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/merchant/transactions?page=${page}&limit=12`);
      setTransactions(res.data.transactions);
      setTxTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-500 font-semibold mb-2">{error}</p>
        <button onClick={fetchPulseDetails} className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-white">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl flex items-center gap-2">
          <Activity className="h-7 w-7 text-paytm-cyan text-glow-blue" />
          <span>Pattern Detection & Anomaly Logs</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore deterministic calculations, statistical outliers, and historical AI insights.
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Left 2 Columns: Signals & Anomalies, Transactions List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Signals Calculated */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-paytm-cyan" />
              <span>Active Business Signals</span>
            </h2>
            {detailData && detailData.signals.length > 0 ? (
              <div className="space-y-4">
                {detailData.signals.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-900 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-200">{s.display_name}</span>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 border border-slate-800 text-[9px] font-bold text-slate-400">
                          {s.metric}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal max-w-md">
                        {s.context_description}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {s.change_percent >= 0 ? (
                        <div className="flex items-center text-sm font-bold text-emerald-400 justify-end">
                          <TrendingUp className="h-4 w-4 mr-0.5" />
                          <span>+{s.change_percent}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm font-bold text-rose-400 justify-end">
                          <TrendingDown className="h-4 w-4 mr-0.5" />
                          <span>{s.change_percent}%</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block mt-1">
                        CONFIDENCE: {s.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No active signals found.</p>
            )}
          </div>

          {/* Section 2: Outliers/Anomalies Detected */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              <span>Statistical Outliers Detected</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Days when sales volume deviated significantly (&gt; 1.5x standard deviations) from the 30-day baseline average.
            </p>
            {detailData && detailData.anomalies.length > 0 ? (
              <div className="space-y-3">
                {detailData.anomalies.map((an, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex items-start gap-3">
                    <div className={`mt-0.5 rounded p-1 ${an.type === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {an.type === 'HIGH' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        {new Date(an.date).toLocaleDateString('en-IN', { weekday: 'long', dateStyle: 'medium' })}
                      </span>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">
                        {an.description}
                      </p>
                      <span className="inline-block text-[9px] font-bold text-paytm-cyan bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80 mt-2">
                        Deviation factor: {an.devFactor}σ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/20 border border-dashed border-slate-900 text-center text-xs text-slate-500">
                No statistical outliers detected this week.
              </div>
            )}
          </div>

          {/* Section 3: Full Transactions Log */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-slate-400" />
                <span>Transaction Activity Log</span>
              </h2>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-paytm-cyan" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-extrabold">
                    <th className="py-2.5 pb-4">Transaction ID</th>
                    <th className="py-2.5 pb-4">Time</th>
                    <th className="py-2.5 pb-4">Payment Method</th>
                    <th className="py-2.5 pb-4">Status</th>
                    <th className="py-2.5 pb-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs">
                  {transactions.map((t) => (
                    <tr key={t.id} className="text-slate-350 hover:bg-slate-900/10">
                      <td className="py-3 font-semibold text-slate-200">{t.external_transaction_id}</td>
                      <td className="py-3">
                        {new Date(t.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-paytm-cyan">{t.payment_method}</span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          t.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-white">₹{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {txTotalPages > 1 && (
              <div className="mt-6 flex justify-between items-center text-xs border-t border-slate-900 pt-4">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-slate-500">
                  Page <strong className="text-white">{txPage}</strong> of <strong className="text-white">{txTotalPages}</strong>
                </span>
                <button
                  onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                  disabled={txPage === txTotalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Pulse Timeline Log */}
        <div>
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ListTodo className="h-4.5 w-4.5 text-paytm-cyan" />
              <span>Insight History Log</span>
            </h2>
            <p className="text-xs text-slate-400 leading-normal">
              A historical ledger of anomalous events detected by Paytm Business Pulse and analyzed by Sarvam AI.
            </p>

            <div className="relative border-l border-slate-800 pl-4 space-y-6 ml-2">
              {history.map((h) => (
                <div key={h.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-paytm-cyan ring-4 ring-slate-950 group-hover:scale-125 duration-100"></div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                      {new Date(h.created_at).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}
                    </span>
                    <span className="text-xs font-extrabold text-white group-hover:text-paytm-cyan duration-100 block">
                      {h.headline}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-900">
                      <strong>Observation:</strong> {h.observation}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      <strong>Action:</strong> {h.recommendation}
                    </p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-4">No historical records found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
