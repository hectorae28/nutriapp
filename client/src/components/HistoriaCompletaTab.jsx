import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FileText, User, Clipboard, Activity, Clock, Table, Ruler, FileDown,
  Pencil, Info, Calendar, Phone, Mail, MapPin, BookOpen, Briefcase,
  AlertCircle, CheckCircle2, Droplets, ChevronDown, ChevronUp, Bone, Heart,
  Download, FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { expedienteApi } from '../api/expediente';
import { recordatoriosApi } from '../api/recordatorios';
import ImportarExcel from './ImportarExcel';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './SharedComponents';
import { GRUPOS_NOMBRES } from '../constants/consumoGrupos';

// ── Helper para descarga de archivo desde API ────────────────────────────────
async function _descargarArchivo(url, filename) {
  const resp = await fetch(url, { credentials: 'include' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const blob = await resp.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href; a.download = filename; a.click();
  URL.revokeObjectURL(href);
}

// ── Helpers de display ───────────────────────────────────────────────────────
const val = (v, unit = '') =>
  v !== null && v !== '' && v !== undefined ? `${v}${unit ? ' ' + unit : ''}` : '—';

const SEXO       = { F: 'Femenino', M: 'Masculino', O: 'Otro' };
const CIVIL      = { S: 'Soltero/a', C: 'Casado/a', D: 'Divorciado/a', V: 'Viudo/a', U: 'Unión Libre' };
const APETITO    = { NORMAL: 'Normal', AUMENTADO: 'Aumentado', DISMINUIDO: 'Disminuido' };
const ESTREN     = { NO: 'No', LEVE: 'Leve', MODERADO: 'Moderado', CRONICO: 'Crónico' };
const CONTEXTURA = { PEQUENA: 'Pequeña', MEDIANA: 'Mediana', GRANDE: 'Grande' };

const calcEdad = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date(), nac = new Date(fecha);
  let e = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() < nac.getMonth() ||
     (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--;
  return e;
};

// ── Componentes UI ───────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, open = false }) => {
  const [isOpen, setIsOpen] = useState(open);
  // Abrir automáticamente si el prop cambia (ej: cuando llegan datos asincrónicos)
  useEffect(() => { if (open) setIsOpen(true); }, [open]);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', marginBottom: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          fontWeight: 600, fontSize: 14, color: '#374151', textAlign: 'left' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} style={{ color: '#16a34a' }} /> {title}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const Row = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#374151', marginBottom: 6 }}>
    {Icon && <Icon size={13} style={{ color: '#6b7280', marginTop: 2, flexShrink: 0 }} />}
    <span style={{ fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{label}:</span>
    <span style={{ color: value === '—' ? '#d1d5db' : '#111827' }}>{value}</span>
  </div>
);

const Grid = ({ cols = 3, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '6px 20px' }}>
    {children}
  </div>
);

const Chip = ({ activo, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
    padding: '2px 10px', borderRadius: 12,
    background: activo ? '#dcfce7' : '#f3f4f6',
    color: activo ? '#16a34a' : '#9ca3af',
    fontWeight: activo ? 600 : 400,
  }}>
    {activo ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {label}
  </span>
);

const Metric = ({ label, value, unit = '' }) => (
  <div style={{ textAlign: 'center', padding: '10px 8px', border: '1px solid #e5e7eb',
    borderRadius: 8, background: '#f9fafb' }}>
    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
      {value !== null && value !== undefined && value !== '' ? value : '—'}
      {value !== null && value !== undefined && value !== '' && unit &&
        <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', marginLeft: 3 }}>{unit}</span>
      }
    </div>
  </div>
);

// ── Componente principal ─────────────────────────────────────────────────────
const HistoriaCompletaTab = ({ paciente, onExpedienteUpdated, readOnly = false }) => {
  const { addToast } = useToast();
  const [expediente, setExpediente] = useState(null);
  const [recordatorios, setRecordatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecordatorios, setLoadingRecordatorios] = useState(true);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [exportando, setExportando] = useState(null); // 'excel' | 'pdf' | null

  const nombreArchivo = (ext) => {
    const nombre = paciente.user?.first_name
      ? `${paciente.user.first_name}_${paciente.user.last_name || ''}`.replace(/\s+/g,'_')
      : `paciente_${paciente.id}`;
    return `historia_${nombre}.${ext}`;
  };

  const handleExportarExcel = async () => {
    setExportando('excel');
    try {
      await _descargarArchivo(`/api/pacientes/${paciente.id}/exportar-excel/`, nombreArchivo('xls'));
      addToast({ message: '✓ Excel descargado correctamente', type: 'success' });
    } catch (e) {
      addToast({ message: `Error al exportar Excel: ${e.message}`, type: 'error' });
    } finally { setExportando(null); }
  };

  const handleExportarPdf = async () => {
    setExportando('pdf');
    try {
      await _descargarArchivo(`/api/pacientes/${paciente.id}/exportar-pdf/`, nombreArchivo('pdf'));
      addToast({ message: '✓ PDF descargado correctamente', type: 'success' });
    } catch (e) {
      addToast({ message: `Error al exportar PDF: ${e.message}`, type: 'error' });
    } finally { setExportando(null); }
  };

  const cargarExpediente = async () => {
    setLoading(true);
    try {
      // expedienteApi.obtener ya retorna el primer objeto o null
      const data = await expedienteApi.obtener(paciente.id);
      setExpediente(data || null);
    } catch (err) {
      console.error('Error cargando expediente:', err);
      addToast({ message: 'Error al cargar el expediente', type: 'error' });
      setExpediente(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarRecordatorios = async () => {
    setLoadingRecordatorios(true);
    try {
      const data = await recordatoriosApi.lista(paciente.id);
      const lista = Array.isArray(data) ? data : data.results || [];
      setRecordatorios(lista);
    } catch (err) {
      console.error('Error cargando recordatorios:', err);
      setRecordatorios([]);
    } finally {
      setLoadingRecordatorios(false);
    }
  };

  useEffect(() => { 
    cargarExpediente(); 
    cargarRecordatorios();
  }, [paciente.id]);

  const handleImportExcelSuccess = () => {
    setShowImportExcel(false);
    addToast({ message: 'Expediente actualizado exitosamente', type: 'success' });
    cargarExpediente();
    cargarRecordatorios();   // recargar recordatorio importado desde el Excel
    onExpedienteUpdated();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <LoadingSpinner size={32} message="Cargando historia clínica..." />
    </div>
  );

  if (!expediente) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 16 }}>
      <EmptyState icon={BookOpen} title="Historia Clínica Vacía"
        message="Este paciente aún no tiene un expediente nutricional." />
      {!readOnly && (
        <button
          onClick={() => setShowImportExcel(true)}
          style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <FileDown size={14} style={{ display: 'inline', marginRight: 6 }} />
          Importar desde Excel
        </button>
      )}
    </div>
  );

  // ── Datos personales vienen del prop `paciente` ──────────────────────────
  const p = paciente;
  const u = paciente.user || {};
  const exp = expediente;

  // ── Consumo calórico ────────────────────────────────────────────────────
  const cc = Array.isArray(exp.consumo_calorico) ? exp.consumo_calorico : [];
  const ccTotales = cc.reduce((a, i) => ({
    intercambios: a.intercambios + (parseFloat(i.intercambios) || 0),
    proteinas_g:  a.proteinas_g  + (parseFloat(i.proteinas_g)  || 0),
    grasas_g:     a.grasas_g     + (parseFloat(i.grasas_g)     || 0),
    cho_g:        a.cho_g        + (parseFloat(i.cho_g)        || 0),
    kcal:         a.kcal         + (parseFloat(i.kcal)         || 0),
  }), { intercambios: 0, proteinas_g: 0, grasas_g: 0, cho_g: 0, kcal: 0 });

  // Campos calculados que devuelve la API (serializer)
  const gKgP = {
    proteinas: exp.proteinas_g_kg_dia,
    grasas:    exp.grasas_g_kg_dia,
    cho:       exp.cho_g_kg_dia,
  };
  const tieneGKg = gKgP.proteinas !== null && gKgP.proteinas !== undefined;

  // GRUPOS_NOMBRES is imported at top from shared constants

  return (
    <div>
      {/* ── DATOS PERSONALES ── */}
      <Section title="Datos Personales" icon={User} open>
        <Grid cols={3}>
          <Row icon={Briefcase} label="Consultorio"        value={val(p.consultorio)} />
          <Row icon={BookOpen}  label="Historia Nro."      value={val(p.historia_nro)} />
          <Row icon={Calendar}  label="Fecha Consulta"     value={val(p.fecha_consulta)} />
          <Row icon={User}      label="Nombre"             value={val(`${u.first_name || ''} ${u.last_name || ''}`.trim())} />
          <Row icon={FileText}  label="Cédula"             value={val(p.cedula)} />
          <Row icon={Calendar}  label="Fecha Nacimiento"   value={val(p.fecha_nacimiento)} />
          <Row icon={Info}      label="Edad"               value={val(calcEdad(p.fecha_nacimiento), 'años')} />
          <Row icon={MapPin}    label="Lugar Nacimiento"   value={val(p.lugar_nacimiento)} />
          <Row icon={User}      label="Sexo"               value={SEXO[p.sexo] || '—'} />
          <Row icon={Heart}     label="Estado Civil"       value={CIVIL[p.estado_civil] || '—'} />
          <Row icon={Phone}     label="Teléfono"           value={val(p.telefono)} />
          <Row icon={Mail}      label="Email"              value={val(u.email)} />
          <Row icon={MapPin}    label="Dirección"          value={val(p.direccion)} />
          <Row icon={BookOpen}  label="Religión"           value={val(p.religion)} />
          <Row icon={BookOpen}  label="Grado Instrucción"  value={val(p.grado_instruccion)} />
          <Row icon={Briefcase} label="Ocupación"          value={val(p.ocupacion)} />
          <Row icon={User}      label="Referido por"       value={val(p.referido_por)} />
        </Grid>
      </Section>

      {/* ── MOTIVO Y ANTECEDENTES ── */}
      <Section title="Motivo de Consulta y Antecedentes" icon={Clipboard} open>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Motivo de Consulta</div>
            <div style={{ fontSize: 13, color: '#111827', background: '#f9fafb', padding: '8px 12px', borderRadius: 8 }}>
              {exp.motivo_consulta || '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Antecedentes Personales</div>
            <div style={{ fontSize: 13, color: '#111827', background: '#f9fafb', padding: '8px 12px', borderRadius: 8 }}>
              {exp.ant_personales || '—'}
            </div>
          </div>

          {/* Antecedentes Obstétricos — solo si sexo F o no definido */}
          {(p.sexo === 'F' || !p.sexo) && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                Antecedentes Obstétricos
              </div>
              <Grid cols={4}>
                <Row icon={Calendar} label="Menarquía"       value={val(exp.menarquia_anos, 'años')} />
                <Row icon={Calendar} label="FUM"             value={val(exp.fecha_ultima_menstruacion)} />
                <Row icon={Info}     label="Nro. Embarazos"  value={val(exp.num_embarazos)} />
                <Row icon={Info}     label="Edad último emb."value={val(exp.edad_ultimo_embarazo, 'años')} />
              </Grid>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Antecedentes Familiares</div>
            <div style={{ fontSize: 13, color: '#111827', background: '#f9fafb', padding: '8px 12px', borderRadius: 8 }}>
              {exp.ant_familiares || '—'}
            </div>
          </div>
        </div>
      </Section>

      {/* ── HÁBITOS Y TGI ── */}
      <Section title="Hábitos Psicobiológicos y Trastornos" icon={Activity}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Hábitos Psicobiológicos</div>
        <Grid cols={3}>
          <Row icon={Droplets} label="Cafeínicos"   value={val(exp.cafeinicos_v_dia, 'v/día')} />
          <Row icon={Droplets} label="Alcohol"      value={exp.alcohol ? ({ OCASIONAL: 'Ocasional', FRECUENTE: 'Frecuente', DIARIO: 'Diario' }[exp.alcohol] || exp.alcohol) : '—'} />
          <Row icon={Droplets} label="Tabáquicos"   value={val(exp.tabaquicos_und_dia, 'und/día')} />
          <Row icon={Clock}    label="Sueño"        value={val(exp.sueno_hr_dia, 'hr/día')} />
          <Row icon={Info}     label="Apetito"      value={APETITO[exp.apetito] || '—'} />
          <Row icon={Droplets} label="Micciones"    value={val(exp.micciones_v_dia, 'v/día')} />
          <Row icon={Droplets} label="Evacuaciones" value={val(exp.evacuaciones_v_dia, 'v/día')} />
        </Grid>
        {exp.actividad_fisica && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Actividad Física</div>
            <div style={{ fontSize: 13, color: '#111827' }}>{exp.actividad_fisica}</div>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '14px 0 8px' }}>
          Trastornos Gastrointestinales
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <Chip activo={exp.tg_dispepsia}   label="Dispepsia" />
          <Chip activo={exp.tg_distension}  label="Distensión" />
          <Chip activo={exp.tg_aerofagia}   label="Aerofagia" />
          <Chip activo={!!exp.tg_flatulencia} label={`Flatulencia${exp.tg_flatulencia ? ` (${exp.tg_flatulencia})` : ''}`} />
          <Chip activo={exp.tg_meteorismo}  label="Meteorismo" />
          <Chip activo={exp.tg_diarrea}     label="Diarrea" />
          <Chip activo={exp.tg_nauseas}     label="Náuseas" />
          <Chip activo={exp.tg_vomitos}     label="Vómitos" />
          <Chip activo={exp.tg_rgef}        label="R.GEF" />
        </div>
        <Grid cols={2}>
          <Row icon={AlertCircle} label="Alergias/Intolerancias" value={val(exp.alergias_alimentarias)} />
          <Row icon={Info}        label="Estreñimiento"          value={ESTREN[exp.estrenimiento] || '—'} />
        </Grid>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '14px 0 8px' }}>Tratamientos</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row icon={FileText} label="Farmacológico"   value={val(exp.trat_farmacologico)} />
          <Row icon={FileText} label="Suplemento Oral" value={val(exp.trat_suplemento_oral)} />
          <Row icon={FileText} label="Otros"           value={val(exp.trat_otros)} />
        </div>
      </Section>

      {/* ── RECORDATORIO 24H ── */}
      <Section title="Recordatorio Alimentario 24h" icon={Clock} open={recordatorios.length > 0}>
        {loadingRecordatorios ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <LoadingSpinner size={20} />
          </div>
        ) : recordatorios.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
            Sin recordatorios alimentarios registrados.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {recordatorios.map((rec, idx) => (
              <div key={rec.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', background: '#fafafa' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>
                  📅 {rec.fecha}
                </div>
                {rec.entradas && rec.entradas.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rec.entradas.map((entrada, i) => (
                      <div key={entrada.id || i} style={{ borderBottom: i < rec.entradas.length - 1 ? '1px solid #f3f4f6' : 'none', paddingBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                          {entrada.nombre}
                          {entrada.hora && (
                            <span style={{ marginLeft: 6, fontWeight: 400, color: '#6b7280' }}>
                              ({entrada.hora})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#111827' }}>
                          {entrada.descripcion || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Sin entradas registradas.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── CONSUMO CALÓRICO ── */}
      <Section title="Consumo Calórico Diario" icon={Table}>
        {cc.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: 16 }}>
            Sin datos de consumo calórico registrados.
          </p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Alimento','INT','P (g/día)','G (g/día)','CHO (g/día)','KCAL/día',
                      ...(tieneGKg ? ['P g/kg-p/d','G g/kg-p/d','CHO g/kg-p/d'] : [])
                    ].map((h, idx) => (
                      <th key={h} style={{
                        padding: '8px 10px', textAlign: h === 'Alimento' ? 'left' : 'right',
                        fontSize: 11, fontWeight: 700, borderBottom: '2px solid #e5e7eb',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        color: idx > 5 ? '#15803d' : '#6b7280',
                        background: idx > 5 ? '#ecfdf5' : '#f9fafb',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cc.map((item, i) => {
                    const p   = parseFloat(item.proteinas_g) || 0;
                    const g   = parseFloat(item.grasas_g)    || 0;
                    const cho = parseFloat(item.cho_g)       || 0;
                    const pRef = parseFloat(exp.peso_usual_kg) || 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500, color: '#374151' }}>
                          {GRUPOS_NOMBRES[item.grupo] || item.nombre || item.grupo}
                        </td>
                        {['intercambios','proteinas_g','grasas_g','cho_g','kcal'].map(k => (
                          <td key={k} style={{ padding: '7px 10px', textAlign: 'right', color: '#374151' }}>
                            {parseFloat(item[k]) || 0}
                          </td>
                        ))}
                        {tieneGKg && pRef > 0 && (
                          <>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#15803d', fontSize: 12 }}>{p ? (p / pRef).toFixed(2) : '—'}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#15803d', fontSize: 12 }}>{g ? (g / pRef).toFixed(2) : '—'}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#15803d', fontSize: 12 }}>{cho ? (cho / pRef).toFixed(2) : '—'}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
                    <td style={{ padding: '8px 10px', color: '#111827' }}>TOTAL</td>
                    {['intercambios','proteinas_g','grasas_g','cho_g','kcal'].map(k => (
                      <td key={k} style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a' }}>
                        {ccTotales[k].toFixed(2)}
                      </td>
                    ))}
                    {tieneGKg && (
                      <>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{gKgP.proteinas?.toFixed(2) ?? '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{gKgP.grasas?.toFixed(2) ?? '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{gKgP.cho?.toFixed(2) ?? '—'}</td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            {exp.observaciones_calorias && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Observaciones</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{exp.observaciones_calorias}</div>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ── EVALUACIÓN OBJETIVA ── */}
      <Section title="Evaluación Objetiva — Pesos" icon={Ruler}>
        {/* Pesos de referencia */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
          <Metric label="Peso Máximo"       value={exp.peso_maximo_kg}        unit="kg" />
          <Metric label="Peso Mínimo"       value={exp.peso_minimo_kg}        unit="kg" />
          <Metric label="Peso Usual"        value={exp.peso_usual_kg}         unit="kg" />
          <Metric label="Peso Ideal"        value={exp.peso_ideal_kg}         unit="kg" />
          <Metric label="Peso Deseado"      value={exp.peso_deseado_kg}       unit="kg" />
          <Metric label="Peso Pre-Qx"       value={exp.peso_prequirurgico_kg} unit="kg" />
          <Metric label="Circ. Muñeca"      value={exp.circunferencia_muneca_cm} unit="cm" />
          <div style={{ textAlign: 'center', padding: '10px 8px', border: '1px solid #e5e7eb',
            borderRadius: 8, background: '#f9fafb' }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Contextura</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              {CONTEXTURA[exp.contextura] || '—'}
            </div>
          </div>
        </div>

        {/* Campos calculados: %PP, %PI, %PU, %P.Pre-Qx */}
        {(exp.pct_peso_ideal !== null || exp.pct_peso_prequirurgico !== null) && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '10px 0 8px' }}>
              Porcentajes calculados
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
              {/* %PI = peso_usual / peso_ideal × 100 */}
              <div style={{ textAlign: 'center', padding: '10px 8px', border: '1px solid #bbf7d0', borderRadius: 8, background: '#f0fdf4' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%PI (Peso Ideal)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: exp.pct_peso_ideal > 110 ? '#ea580c' : '#15803d' }}>
                  {exp.pct_peso_ideal != null ? `${Number(exp.pct_peso_ideal).toFixed(1)}%` : '—'}
                </div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>P.Usual / P.Ideal</div>
              </div>
              {/* %P.Pre-Qx = peso_prequirurgico / peso_usual × 100 */}
              <div style={{ textAlign: 'center', padding: '10px 8px', border: '1px solid #ddd6fe', borderRadius: 8, background: '#f5f3ff' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%P.Pre-Qx / P.Usual</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>
                  {exp.pct_peso_prequirurgico != null ? `${Number(exp.pct_peso_prequirurgico).toFixed(1)}%` : '—'}
                </div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>P.Pre-Qx / P.Usual</div>
              </div>
              {/* %PP y %PU se calculan por RegistroProgreso → se ven en sección Progreso */}
              <div style={{ textAlign: 'center', padding: '10px 8px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%PP / %PU</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Ver sección</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>Progreso / Antropometría</div>
              </div>
            </div>
          </>
        )}

        {exp.diagnostico_nutricional && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
              Diagnóstico Nutricional
            </div>
            <div style={{ fontSize: 13, color: '#374151', background: '#f0fdf4',
              padding: '8px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              {exp.diagnostico_nutricional}
            </div>
          </div>
        )}
      </Section>

      {showImportExcel && (
        <ImportarExcel
          onSuccess={handleImportExcelSuccess}
          onClose={() => setShowImportExcel(false)}
        />
      )}
    </div>
  );
};

HistoriaCompletaTab.propTypes = {
  paciente: PropTypes.object.isRequired,
  onExpedienteUpdated: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default HistoriaCompletaTab;
