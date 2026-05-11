import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ScoreRow } from '../types';
import { generateChartData } from '../utils/scoring';

const ORDER = ['L', 'F', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const normalized = (score: ScoreRow) => (score.code ?? score.scaleId).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
const orderedClinical = (scores: ScoreRow[]) => {
  const byCode = new Map(scores.map((score) => [normalized(score), score]));
  const ordered = ORDER.map((code) => byCode.get(code)).filter(Boolean) as ScoreRow[];
  const rest = scores.filter((score) => !ORDER.includes(normalized(score)) && ['validity', 'clinical'].includes((score.type ?? '').toLowerCase()));
  return [...ordered, ...rest];
};

export const ProfileLineChart = ({ scores }: { scores: ScoreRow[] }) => {
  const rcScores = scores.filter((score) => (score.type ?? '').toLowerCase() === 'rc');
  const data = generateChartData(orderedClinical(scores)).filter((item) => item.tScore !== null);
  const rcData = generateChartData(rcScores).filter((item) => item.tScore !== null);
  const chartData = rcData.length ? data : data;
  return (
    <div className="h-72 rounded-2xl border border-slate-100 p-3 sm:h-80 dark:border-slate-800">
      <h3 className="mb-2 font-bold">Line Chart Clinical Profile T-score</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scale" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} domain={[30, 100]} />
          <Tooltip />
          <Legend />
          <ReferenceLine y={65} stroke="#f97316" strokeDasharray="4 4" label="65" />
          <ReferenceLine y={75} stroke="#be123c" strokeDasharray="4 4" label="75" />
          <Line type="monotone" dataKey="tScore" stroke="#2563eb" strokeWidth={3} name="Clinical/Validity T-score" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
      {rcData.length ? <p className="text-xs text-slate-500">RC scales tersedia pada tabel skor; dapat dibuat tab/grafik tersendiri oleh konfigurasi UI lanjutan.</p> : null}
    </div>
  );
};
