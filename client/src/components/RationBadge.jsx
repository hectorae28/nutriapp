import { getGrupoColorStroke } from '../constants/grupoStyles';

export default function RationBadge({ current, target, grupo, size = 'md' }) {
  // Accept grupo object or grupo name
  const grupoNombre = typeof grupo === 'string' ? grupo : grupo?.nombre;
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  const complete = current >= target && target > 0;

  const sizes = {
    sm: { r: 16, stroke: 3, box: 40, font: 'text-xs' },
    md: { r: 22, stroke: 4, box: 56, font: 'text-sm' },
  };
  const s = sizes[size];
  const circumference = 2 * Math.PI * s.r;
  const dash = circumference * pct;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: s.box, height: s.box }}>
        <svg width={s.box} height={s.box} className="-rotate-90">
          <circle
            cx={s.box / 2}
            cy={s.box / 2}
            r={s.r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={s.stroke}
          />
          <circle
            cx={s.box / 2}
            cy={s.box / 2}
            r={s.r}
            fill="none"
            stroke={complete ? '#10b981' : getGrupoColorStroke(grupoNombre)}
            strokeWidth={s.stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-bold ${s.font} ${complete ? 'text-emerald-600' : 'text-gray-700'}`}
          >
            {current}/{target}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400">raciones</span>
    </div>
  );
}
