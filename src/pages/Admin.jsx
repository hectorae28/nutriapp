import { useState } from "react";
import {
  User, Phone, Mail, MapPin, Briefcase, Calendar, Activity,
  FileText, ChevronDown, ChevronUp, TrendingDown, ClipboardList,
  Heart, Droplets, Scale, Target, AlertCircle, CheckCircle2,
  BarChart2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot
} from "recharts";
import { mockPatient } from "../data/mockPatient";

const TABS = [
  { id: "patient", label: "Datos del Paciente", icon: User },
  { id: "dietary", label: "Historia Dietética", icon: ClipboardList },
  { id: "reports", label: "Reportes Semanales", icon: BarChart2 },
  { id: "weight", label: "Evolución del Peso", icon: TrendingDown },
];

export default function Admin() {
  const [tab, setTab] = useState("patient");
  const p = mockPatient;

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
            {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
            <p className="text-sm text-gray-400">{p.age} años · {p.gender} · {p.occupation}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Chip color="blue" label={`IMC: ${p.anthropometry.bmi}`} sub={p.anthropometry.bmiCategory} />
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
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "patient" && <PatientTab p={p} />}
        {tab === "dietary" && <DietaryTab p={p} />}
        {tab === "reports" && <ReportsTab p={p} />}
        {tab === "weight" && <WeightTab p={p} />}
      </div>
    </div>
  );
}

// ── Patient Data Tab ────────────────────────────────────────────────────────

function PatientTab({ p }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
      {/* Personal info */}
      <Section title="Datos Personales" icon={User}>
        <InfoRow icon={User} label="Nombre completo" value={p.name} />
        <InfoRow icon={Calendar} label="Fecha de nacimiento" value={`${p.dob} (${p.age} años)`} />
        <InfoRow icon={User} label="Género" value={p.gender} />
        <InfoRow icon={Briefcase} label="Ocupación" value={p.occupation} />
        <InfoRow icon={Phone} label="Teléfono" value={p.phone} />
        <InfoRow icon={Mail} label="Correo" value={p.email} />
        <InfoRow icon={MapPin} label="Dirección" value={p.address} />
        <InfoRow icon={Calendar} label="Fecha de consulta" value={p.consultDate} />
        <InfoRow icon={User} label="Nutricionista" value={p.nutritionist} />
      </Section>

      {/* Anthropometry */}
      <Section title="Datos Antropométricos" icon={Scale}>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Peso actual" value={`${p.anthropometry.currentWeight} kg`} color="blue" />
          <MetricCard label="Peso ideal" value={`${p.anthropometry.idealWeight} kg`} color="emerald" />
          <MetricCard label="Talla" value={`${p.anthropometry.height} cm`} color="purple" />
          <MetricCard label="IMC" value={p.anthropometry.bmi} sub={p.anthropometry.bmiCategory} color="orange" />
          <MetricCard label="Cintura" value={`${p.anthropometry.waistCircumference} cm`} color="red" />
          <MetricCard label="Cadera" value={`${p.anthropometry.hipCircumference} cm`} color="pink" />
          <MetricCard label="ICC" value={p.anthropometry.waistHipRatio} color="yellow" />
          <MetricCard label="% Grasa corporal" value={`${p.anthropometry.bodyFat}%`} color="gray" />
        </div>
      </Section>

      {/* Labs */}
      <Section title="Exámenes de Laboratorio" icon={Droplets}>
        <p className="text-xs text-gray-400 mb-3">Fecha: {p.labs.date}</p>
        <div className="grid grid-cols-2 gap-3">
          <LabCard label="Glucosa" value={p.labs.glucose} unit="mg/dL" normal="70-100" warn={p.labs.glucose > 100} />
          <LabCard label="HbA1c" value={p.labs.hba1c} unit="%" normal="< 5.7" warn={p.labs.hba1c >= 5.7} />
          <LabCard label="Colesterol Total" value={p.labs.cholesterol} unit="mg/dL" normal="< 200" warn={p.labs.cholesterol >= 200} />
          <LabCard label="LDL" value={p.labs.ldl} unit="mg/dL" normal="< 130" warn={p.labs.ldl >= 130} />
          <LabCard label="HDL" value={p.labs.hdl} unit="mg/dL" normal="> 50" warn={p.labs.hdl < 50} />
          <LabCard label="Triglicéridos" value={p.labs.triglycerides} unit="mg/dL" normal="< 150" warn={p.labs.triglycerides >= 150} />
          <LabCard label="Insulina" value={p.labs.insulin} unit="μU/mL" normal="2-25" warn={false} />
        </div>
      </Section>

      {/* Nutritional evaluation */}
      <Section title="Evaluación Nutricional" icon={Target}>
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-700 mb-1">Diagnóstico</p>
          <p className="text-sm text-amber-800">{p.nutritionalEvaluation.diagnosis}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricCard label="Energía" value={`${p.nutritionalEvaluation.energyNeeds} kcal`} color="orange" />
          <MetricCard label="Proteínas" value={`${p.nutritionalEvaluation.proteinNeeds} g`} color="red" />
          <MetricCard label="Carbohidratos" value={`${p.nutritionalEvaluation.carbNeeds} g`} color="yellow" />
          <MetricCard label="Grasas" value={`${p.nutritionalEvaluation.fatNeeds} g`} color="purple" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Objetivos:</p>
          <ul className="space-y-1">
            {p.nutritionalEvaluation.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
        {p.nutritionalEvaluation.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">{p.nutritionalEvaluation.notes}</p>
          </div>
        )}
      </Section>
    </div>
  );
}

// ── Dietary History Tab ─────────────────────────────────────────────────────

function DietaryTab({ p }) {
  const dh = p.dietaryHistory;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
      <Section title="Motivo de Consulta y Antecedentes" icon={FileText}>
        <InfoRow icon={AlertCircle} label="Motivo principal" value={dh.mainComplaint} />
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Dietas previas:</p>
          <ul className="space-y-1">
            {dh.previousDiets.map((d, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Alergias e Intolerancias" icon={AlertCircle}>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Alergias:</p>
          <div className="flex flex-wrap gap-2">
            {dh.allergies.map((a, i) => (
              <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full">{a}</span>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Intolerancias:</p>
          <div className="flex flex-wrap gap-2">
            {dh.intolerances.map((a, i) => (
              <span key={i} className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded-full">{a}</span>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Preferencias alimentarias:</p>
          <div className="flex flex-wrap gap-2">
            {dh.foodPreferences.map((a, i) => (
              <span key={i} className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full">{a}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Aversiones:</p>
          <div className="flex flex-wrap gap-2">
            {dh.foodAversions.map((a, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded-full">{a}</span>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Hábitos Alimentarios" icon={Activity}>
        <InfoRow icon={Droplets} label="Consumo de agua" value={dh.waterIntake} />
        <InfoRow icon={ClipboardList} label="Frecuencia de comidas" value={dh.mealFrequency} />
        <InfoRow icon={Activity} label="Preparación de alimentos" value={dh.cookingMethod} />
        <InfoRow icon={Activity} label="Actividad física" value={dh.physicalActivity} />
      </Section>

      <Section title="Estilo de Vida" icon={Heart}>
        <InfoRow icon={Activity} label="Horas de sueño" value={`${dh.sleepHours} horas/noche`} />
        <InfoRow icon={Activity} label="Nivel de estrés" value={dh.stressLevel} />
        <InfoRow icon={Activity} label="Consumo de alcohol" value={dh.alcoholConsumption} />
        <InfoRow icon={Activity} label="Tabaquismo" value={dh.smoking ? "Sí" : "No"} />
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 mb-1">Plan nutricional indicado</p>
          <p className="text-sm text-blue-600">{p.nutritionalEvaluation.plan}</p>
        </div>
      </Section>
    </div>
  );
}

// ── Weekly Reports Tab ──────────────────────────────────────────────────────

function ReportsTab({ p }) {
  const [openWeek, setOpenWeek] = useState(0);
  return (
    <div className="space-y-4 pb-10">
      {p.weeklyReports.map((report, wi) => (
        <div key={wi} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Week header */}
          <button
            onClick={() => setOpenWeek(openWeek === wi ? null : wi)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm">{report.week}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {report.meals.length} días registrados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Adherence badge */}
              <div className="text-right">
                <p className="text-xs text-gray-400">Adherencia</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        report.adherence >= 80 ? "bg-emerald-500" :
                        report.adherence >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${report.adherence}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${
                    report.adherence >= 80 ? "text-emerald-600" :
                    report.adherence >= 60 ? "text-yellow-600" : "text-red-600"
                  }`}>{report.adherence}%</span>
                </div>
              </div>
              {openWeek === wi
                ? <ChevronUp className="w-5 h-5 text-gray-400" />
                : <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
          </button>

          {/* Week detail */}
          {openWeek === wi && (
            <div className="px-5 pb-5 border-t border-gray-100">
              {/* Days */}
              <div className="mt-4 space-y-3">
                {report.meals.map((day, di) => (
                  <div key={di} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">{day.day}</span>
                      <span className="text-xs text-gray-400">{day.items.length} comidas</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {day.items.map((meal, mi) => (
                        <div key={mi} className="px-4 py-2.5 flex gap-4">
                          <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0 mt-0.5">{meal.meal}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {meal.foods.map((food, fi) => (
                              <span key={fi} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {food}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {report.notes && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Notas del nutricionista</p>
                  <p className="text-sm text-blue-600">{report.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Weight Chart Tab ────────────────────────────────────────────────────────

function WeightTab({ p }) {
  const data = p.weightHistory;
  const idealWeight = p.anthropometry.idealWeight;
  const current = data[data.length - 1].weight;
  const initial = data[0].weight;
  const lost = (initial - current).toFixed(1);
  const remaining = (current - idealWeight).toFixed(1);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-bold text-gray-800">{payload[0].value} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Peso inicial" value={`${initial} kg`} color="gray" />
        <MetricCard label="Peso actual" value={`${current} kg`} color="blue" />
        <MetricCard label="Peso perdido" value={`-${lost} kg`} color="emerald" />
        <MetricCard label="Por alcanzar meta" value={`${remaining} kg`} color="orange" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-800">Evolución del Peso</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {data.length} semanas de seguimiento · Meta: {idealWeight} kg
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
              Peso real
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-300 inline-block rounded border-dashed border-t" />
              Peso ideal
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[idealWeight - 2, initial + 1]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={idealWeight}
              stroke="#93c5fd"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: `Meta ${idealWeight}kg`, position: "insideTopRight", fontSize: 11, fill: "#60a5fa" }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#059669" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Progress table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Registro Semanal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Semana</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Peso (kg)</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">Cambio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, i) => {
                const diff = i === 0 ? 0 : (row.weight - data[i - 1].weight).toFixed(1);
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-700">{row.label}</td>
                    <td className="px-5 py-3 text-gray-400">{row.date}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-800">{row.weight}</td>
                    <td className="px-5 py-3 text-right">
                      {i === 0 ? (
                        <span className="text-gray-400 text-xs">—</span>
                      ) : (
                        <span className={`text-xs font-semibold ${
                          diff < 0 ? "text-emerald-600" : diff > 0 ? "text-red-500" : "text-gray-400"
                        }`}>
                          {diff > 0 ? "+" : ""}{diff} kg
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  purple: "bg-purple-50 text-purple-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
  pink: "bg-pink-50 text-pink-700",
  yellow: "bg-yellow-50 text-yellow-700",
  gray: "bg-gray-100 text-gray-700",
};

function MetricCard({ label, value, sub, color = "gray" }) {
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
    <div className={`rounded-xl px-3 py-2.5 border ${warn ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-medium text-gray-500">{label}</p>
        {warn
          ? <AlertCircle className="w-3 h-3 text-amber-500" />
          : <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        }
      </div>
      <p className={`text-sm font-bold ${warn ? "text-amber-700" : "text-gray-700"}`}>
        {value} <span className="text-xs font-normal">{unit}</span>
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Normal: {normal}</p>
    </div>
  );
}

function Chip({ color, label, sub }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className={`px-3 py-1.5 rounded-xl border ${colors[color]}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] opacity-70">{sub}</p>
    </div>
  );
}
