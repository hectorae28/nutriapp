import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  ClipboardList,
  Heart,
  Droplets,
  Scale,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';

const TABS = [
  { id: 'patient', label: 'Datos del Paciente', icon: User },
  { id: 'dietary', label: 'Historia Dietética', icon: ClipboardList },
  { id: 'reports', label: 'Reportes Semanales', icon: BarChart2 },
  { id: 'weight', label: 'Evolución del Peso', icon: TrendingDown },
];

export default function Admin() {
  const [tab, setTab] = useState('patient');
  // TODO: Load real patient data from API
  const p = {
    name: 'Administrador',
    age: 0,
    gender: '-',
    occupation: '-',
    anthropometry: {
      bmi: 0,
      bmiCategory: '-',
      currentWeight: 0,
      height: 0,
    },
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-3">
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Panel de Administrador</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Historial y seguimiento nutricional del paciente
          </p>
        </div>

        {/* Patient quick card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
            <p className="text-sm text-gray-400">
              {p.age} años · {p.gender} · {p.occupation}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Chip
              color="blue"
              label={`IMC: ${p.anthropometry.bmi}`}
              sub={p.anthropometry.bmiCategory}
            />
            <Chip color="emerald" label={`${p.anthropometry.currentWeight} kg`} sub="Peso actual" />
            <Chip color="purple" label={`${p.anthropometry.height} cm`} sub="Talla" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  tab === t.id
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === 'patient' && <PatientTab p={p} />}
        {tab === 'dietary' && <EmptyTab label="Historia Dietética" />}
        {tab === 'reports' && <EmptyTab label="Reportes Semanales" />}
        {tab === 'weight' && <EmptyTab label="Evolución del Peso" />}
      </div>
    </div>
  );
}

// ── Patient Data Tab ────────────────────────────────────────────────────────

function PatientTab({ p }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
      <Section title="Datos Personales" icon={User}>
        <InfoRow icon={User} label="Nombre completo" value={p.name} />
        <InfoRow icon={User} label="Género" value={p.gender} />
        <InfoRow icon={Briefcase} label="Ocupación" value={p.occupation} />
      </Section>
      <Section title="Datos Antropométricos" icon={Scale}>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Peso actual" value={`${p.anthropometry.currentWeight} kg`} color="blue" />
          <MetricCard label="Talla" value={`${p.anthropometry.height} cm`} color="purple" />
          <MetricCard label="IMC" value={p.anthropometry.bmi} sub={p.anthropometry.bmiCategory} color="orange" />
        </div>
      </Section>
    </div>
  );
}

function EmptyTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <BarChart2 className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{label} — disponible próximamente.</p>
    </div>
  );
}


// ── Reusable components ──────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <span className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 font-medium flex-1">{value}</span>
    </div>
  );
}

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  purple: 'bg-purple-50 text-purple-700',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
  pink: 'bg-pink-50 text-pink-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  gray: 'bg-gray-100 text-gray-700',
};

function MetricCard({ label, value, sub, color = 'gray' }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${COLOR_MAP[color]}`}>
      <p className="text-[10px] font-medium opacity-70 mb-0.5">{label}</p>
      <p className="text-base font-bold leading-none">{value}</p>
      {sub && <p className="text-[10px] mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

function LabCard({ label, value, unit, normal, warn }) {
  return (
    <div
      className={`rounded-xl px-3 py-2.5 border ${warn ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-medium text-gray-500">{label}</p>
        {warn ? (
          <AlertCircle className="w-3 h-3 text-amber-500" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        )}
      </div>
      <p className={`text-sm font-bold ${warn ? 'text-amber-700' : 'text-gray-700'}`}>
        {value} <span className="text-xs font-normal">{unit}</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Normal: {normal}</p>
    </div>
  );
}

function Chip({ color, label, sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`px-3 py-1.5 rounded-xl border ${colors[color]}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] opacity-70">{sub}</p>
    </div>
  );
}
