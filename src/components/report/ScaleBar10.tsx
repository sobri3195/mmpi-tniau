export const ScaleBar10 = ({ value }: { value: number | null }) => {
  const segments = [
    { range: '0–2', label: 'Sangat Buruk', color: 'bg-rose-500', min: 0, max: 2 },
    { range: '3–4', label: 'Buruk', color: 'bg-orange-500', min: 3, max: 4 },
    { range: '5–6', label: 'Sedang', color: 'bg-amber-500', min: 5, max: 6 },
    { range: '7–8', label: 'Baik', color: 'bg-sky-500', min: 7, max: 8 },
    { range: '9–10', label: 'Sangat Baik', color: 'bg-teal-600', min: 9, max: 10 },
  ];
  return <div className="mt-4">
    <div className="relative grid overflow-hidden rounded-2xl border border-slate-200 text-center text-[11px] font-bold text-white dark:border-slate-700 sm:grid-cols-5">
      {segments.map((segment) => <div key={segment.label} className={`${segment.color} px-2 py-3`}><div>{segment.range}</div><div>{segment.label}</div></div>)}
    </div>
    <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Nilai saat ini: {value ?? 'Belum tersedia'} / 10</p>
  </div>;
};
