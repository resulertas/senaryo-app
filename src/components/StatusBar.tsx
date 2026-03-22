export default function StatusBar({ theme }: { theme: 'dark' | 'light' }) {
  const bgClass = theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-slate-100 border-slate-300';

  return (
    <div className={`flex items-center justify-between px-4 py-1.5 border-t text-xs text-slate-500 no-print ${bgClass}`}>
      <div className="flex items-center space-x-4">
        <span>Senaryo Motoru v4.2.0</span>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
          <span>Bulut Eşitleme Aktif</span>
        </div>
      </div>
      <div>
        Oturum: 1 saat 12 dakika
      </div>
    </div>
  );
}
