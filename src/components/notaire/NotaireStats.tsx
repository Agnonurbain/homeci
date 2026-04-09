import { HColors, HAlpha } from '../../styles/homeci-tokens';

export function NotaireStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Disponibles" count={stats.disponible} accent={HColors.orangeCI} bg={HAlpha.orange10} border={HAlpha.orange25} />
      <StatCard label="En cours" count={stats.enCours} accent={HColors.gold} bg={HAlpha.gold10} border={HAlpha.gold25} />
      <StatCard label="Prêts" count={stats.pret} accent={HColors.navy} bg={HAlpha.navy08} border={HAlpha.navy20} />
      <StatCard label="Certifiés" count={stats.certifie} accent={HColors.vertCI} bg={HAlpha.vertCI10} border={HAlpha.vertCI25} />
    </div>
  );
}

function StatCard({ label, count, accent, bg, border }: any) {
  return (
    <div className="p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:scale-105"
      style={{ background: bg, border: `1.5px solid ${border}` }}>
      <span className="text-2xl font-black mb-1" style={{ color: accent }}>{count}</span>
      <span className="text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: HColors.darkBrown }}>{label}</span>
      <div className="w-8 h-1 rounded-full mt-2" style={{ background: accent, opacity: 0.3 }} />
    </div>
  );
}
