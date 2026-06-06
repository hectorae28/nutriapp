import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { pacientesApi } from '../api/pacientes';
import { api } from '../api/client';
import ImportarExcel from './ImportarExcel';
import { Clock, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { CONSUMO_GRUPOS } from '../constants/consumoGrupos';

// Tiempos de comida predeterminados para el recordatorio 24h
const TIEMPOS_DEFAULT = [
  { id: 't1', label: 'Desayuno',      icono: '🌅', hora: '07:00', descripcion: '', expandido: true  },
  { id: 't2', label: 'Merienda AM',   icono: '🍎', hora: '10:00', descripcion: '', expandido: false },
  { id: 't3', label: 'Almuerzo',      icono: '🍽️', hora: '12:30', descripcion: '', expandido: true  },
  { id: 't4', label: 'Merienda PM',   icono: '🥤', hora: '16:00', descripcion: '', expandido: false },
  { id: 't5', label: 'Cena',          icono: '🌙', hora: '19:00', descripcion: '', expandido: true  },
  { id: 't6', label: 'Merienda Noche',icono: '🌛', hora: '21:00', descripcion: '', expandido: false },
];

export default function WizardNuevoPaciente({ onClose, onSuccess }) {
  const [paso, setPaso] = useState(1);
  const [saving, setSaving] = useState(false);
  const [creandoPaciente, setCreandoPaciente] = useState(false);
  const [pacienteId, setPacienteId] = useState(null); // ID del paciente ya creado
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [datos, setDatos] = useState({
    // Paso 1
    first_name: '', last_name: '', username: '', email: '',
    cedula: '', consultorio: '', historia_nro: '', fecha_consulta: new Date().toISOString().split('T')[0],
    fecha_nac_dia: '', fecha_nac_mes: '', fecha_nac_anio: '',
    lugar_nacimiento: '', sexo: 'M', estado_civil: 'S',
    direccion: '', religion: '', grado_instruccion: '', ocupacion: '',
    telefono: '', referido_por: '',
    // Paso 2
    motivo_consulta: '', ant_personales: '', obstetrico: {}, ant_familiares: '',
    menarquia_anos: '', fecha_ultima_menstruacion: '',
    num_embarazos: '', edad_ultimo_embarazo: '',
    // Paso 3
    cafeinicos_v_dia: '', alcohol: '', tabaquicos_und_dia: '',
    sueno_hr_dia: '', apetito: 'NORMAL', micciones_v_dia: '', evacuaciones_v_dia: '',
    actividad_fisica: '',
    tg_dispepsia: false, tg_dispepsia_causa: '',
    tg_distension: false, tg_distension_causa: '',
    tg_aerofagia: false, tg_aerofagia_causa: '',
    tg_flatulencia: '', 
    tg_meteorismo: false, tg_meteorismo_causa: '',
    tg_diarrea: false, tg_diarrea_causa: '',
    tg_nauseas: false, tg_nauseas_causa: '',
    tg_vomitos: false, tg_vomitos_causa: '',
    tg_rgef: false, tg_rgef_causa: '',
    estrenimiento: 'NO', alergias_alimentarias: '',
    trat_farmacologico: '', trat_suplemento_oral: '', trat_otros: '',
    // Paso 4 - recordatorio 24h
    recordatorio: TIEMPOS_DEFAULT.map(t => ({ ...t })),
    // Paso 5
    consumo_calorico: CONSUMO_GRUPOS.map(g => ({ ...g })),
    observaciones_calorias: '',
    // Evaluación objetiva
    peso_maximo_kg: '', peso_minimo_kg: '', peso_usual_kg: '',
    peso_ideal_kg: '', peso_deseado_kg: '', peso_prequirurgico_kg: '',
    circunferencia_muneca_cm: '', contextura: '',
    // Antropometría actual (genera RegistroProgreso)
    peso_actual_kg: '', talla_cm: '',
    // Paso 6 - Examen Bioquímico
    examen_fecha: new Date().toISOString().split('T')[0],
    examen_proteinas_totales: '', examen_albumina: '', examen_globulina: '',
    examen_urea: '', examen_creatinina: '', examen_acido_urico: '',
    examen_colesterol: '', examen_hdl: '', examen_ldl: '', examen_vldl: '', examen_trigliceridos: '',
    examen_glucosa: '', examen_glucosa_postprandial: '', examen_insulina: '', examen_hemoglobina_glicosilada: '',
    examen_tgo: '', examen_tgp: '',
    examen_hemoglobina: '', examen_hematocrito: '',
    examen_t3: '', examen_t4: '', examen_tsh: '',
    examen_hierro: '', examen_vitamina_b12: '', examen_sodio: '', examen_potasio: '', examen_calcio: '',
  });

  const [erroresPaso, setErroresPaso] = useState({});

  const set = (campo, valor) => setDatos(prev => ({ ...prev, [campo]: valor }));

  // Edad calculada automáticamente
  const edad = useMemo(() => {
    const { fecha_nac_dia: d, fecha_nac_mes: m, fecha_nac_anio: a } = datos;
    if (!d || !m || !a || String(a).length < 4) return '';
    const hoy = new Date();
    const nac = new Date(parseInt(a), parseInt(m) - 1, parseInt(d));
    let e = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--;
    return isNaN(e) || e < 0 || e > 150 ? '' : e;
  }, [datos.fecha_nac_dia, datos.fecha_nac_mes, datos.fecha_nac_anio]);

  // Totales consumo calórico
  const totales = useMemo(() => datos.consumo_calorico.reduce((acc, i) => ({
    intercambios: +(acc.intercambios + (parseFloat(i.intercambios) || 0)).toFixed(2),
    proteinas_g: +(acc.proteinas_g + (parseFloat(i.proteinas_g) || 0)).toFixed(2),
    grasas_g: +(acc.grasas_g + (parseFloat(i.grasas_g) || 0)).toFixed(2),
    cho_g: +(acc.cho_g + (parseFloat(i.cho_g) || 0)).toFixed(2),
    kcal: +(acc.kcal + (parseFloat(i.kcal) || 0)).toFixed(2),
  }), { intercambios: 0, proteinas_g: 0, grasas_g: 0, cho_g: 0, kcal: 0 }), [datos.consumo_calorico]);

  // ── Cálculos clínicos en tiempo real ────────────────────────────────────────
  const calculos = useMemo(() => {
    const pActual  = parseFloat(datos.peso_actual_kg)  || 0;
    const pUsual   = parseFloat(datos.peso_usual_kg)   || 0;
    const pIdeal   = parseFloat(datos.peso_ideal_kg)   || 0;
    const pPreQx   = parseFloat(datos.peso_prequirurgico_kg) || 0;
    const talla    = parseFloat(datos.talla_cm)        || 0;
    // Peso de referencia para g/kg-p/día: peso actual si existe, sino peso usual
    const pRef     = pActual || pUsual;

    // IMC
    const imc = pActual && talla ? +(pActual / ((talla / 100) ** 2)).toFixed(1) : null;
    const imcLabel = imc == null ? null
      : imc < 18.5 ? 'Bajo peso'
      : imc < 25   ? 'Normal'
      : imc < 30   ? 'Sobrepeso'
      : imc < 35   ? 'Obesidad I'
      : imc < 40   ? 'Obesidad II'
      : 'Obesidad III';

    // %PP = (P.Usual – P.Actual) / P.Usual × 100
    const pct_pp = pActual && pUsual ? +((pUsual - pActual) / pUsual * 100).toFixed(2) : null;
    // %PI = P.Actual / P.Ideal × 100
    const pct_pi = pActual && pIdeal ? +(pActual / pIdeal * 100).toFixed(2) : null;
    // %PU = P.Actual / P.Usual × 100
    const pct_pu = pActual && pUsual ? +(pActual / pUsual * 100).toFixed(2) : null;
    // %P.Pre-Qx = P.Pre-Qx / P.Usual × 100
    const pct_pqx = pPreQx && pUsual ? +(pPreQx / pUsual * 100).toFixed(2) : null;

    // g/kg-p/día
    const p_g_kg  = pRef ? +(totales.proteinas_g / pRef).toFixed(2) : null;
    const g_g_kg  = pRef ? +(totales.grasas_g    / pRef).toFixed(2) : null;
    const cho_g_kg = pRef ? +(totales.cho_g      / pRef).toFixed(2) : null;

    return { imc, imcLabel, pct_pp, pct_pi, pct_pu, pct_pqx, p_g_kg, g_g_kg, cho_g_kg, pRef };
  }, [
    datos.peso_actual_kg, datos.peso_usual_kg, datos.peso_ideal_kg,
    datos.peso_prequirurgico_kg, datos.talla_cm,
    totales.proteinas_g, totales.grasas_g, totales.cho_g,
  ]);

  const PASOS = ['Datos Personales', 'Antecedentes', 'Hábitos y TGI', 'Recordatorio 24h', 'Consumo Calórico', 'Examen Bioquímico'];

  // ── Validación por paso ──────────────────────────────────────────────────
  const validarPaso = (p) => {
    const errs = {};
    if (p === 1) {
      if (!datos.first_name.trim()) errs.first_name = 'Nombre es obligatorio';
      if (!datos.last_name.trim())  errs.last_name  = 'Apellido es obligatorio';
      // Email requerido
      if (!datos.email.trim())
        errs.email = 'Email es obligatorio';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email))
        errs.email = 'Email inválido';
      // Cédula: obligatoria, solo números
      if (!datos.cedula.trim())
        errs.cedula = 'La cédula es obligatoria';
      else if (!/^\d+$/.test(datos.cedula))
        errs.cedula = 'La cédula solo debe contener números';
      else if (datos.cedula.length > 20)
        errs.cedula = 'Cédula máx. 20 dígitos';
      // Teléfono: solo números
      if (datos.telefono && !/^\d+$/.test(datos.telefono))
        errs.telefono = 'El teléfono solo debe contener números';
      if (datos.telefono && datos.telefono.length > 20)
        errs.telefono = 'Teléfono máx. 20 dígitos';
      if (datos.sexo && !['M','F','O'].includes(datos.sexo))
        errs.sexo = 'Sexo inválido';
      if (datos.estado_civil && !['S','C','D','V','U'].includes(datos.estado_civil))
        errs.estado_civil = 'Estado civil inválido';
      if (datos.fecha_nac_anio && datos.fecha_nac_mes && datos.fecha_nac_dia) {
        const anio = parseInt(datos.fecha_nac_anio);
        const mes  = parseInt(datos.fecha_nac_mes);
        const dia  = parseInt(datos.fecha_nac_dia);
        if (anio < 1900 || anio > new Date().getFullYear()) errs.fecha_nac_anio = 'Año inválido';
        if (mes  < 1 || mes  > 12)  errs.fecha_nac_mes  = 'Mes inválido (1-12)';
        if (dia  < 1 || dia  > 31)  errs.fecha_nac_dia  = 'Día inválido (1-31)';
      }
    }
    if (p === 2) {
      if (datos.menarquia_anos && (parseInt(datos.menarquia_anos) < 0 || parseInt(datos.menarquia_anos) > 99))
        errs.menarquia_anos = 'Valor entre 0 y 99';
      if (datos.num_embarazos && (parseInt(datos.num_embarazos) < 0 || parseInt(datos.num_embarazos) > 30))
        errs.num_embarazos = 'Valor entre 0 y 30';
      if (datos.edad_ultimo_embarazo && (parseInt(datos.edad_ultimo_embarazo) < 0 || parseInt(datos.edad_ultimo_embarazo) > 99))
        errs.edad_ultimo_embarazo = 'Valor entre 0 y 99';
    }
    if (p === 3) {
      if (datos.cafeinicos_v_dia && parseFloat(datos.cafeinicos_v_dia) < 0)
        errs.cafeinicos_v_dia = 'No puede ser negativo';
      if (datos.tabaquicos_und_dia && parseFloat(datos.tabaquicos_und_dia) < 0)
        errs.tabaquicos_und_dia = 'No puede ser negativo';
      if (datos.sueno_hr_dia && (parseFloat(datos.sueno_hr_dia) < 0 || parseFloat(datos.sueno_hr_dia) > 24))
        errs.sueno_hr_dia = 'Valor entre 0 y 24';
      if (datos.micciones_v_dia && parseFloat(datos.micciones_v_dia) < 0)
        errs.micciones_v_dia = 'No puede ser negativo';
      if (datos.evacuaciones_v_dia && parseFloat(datos.evacuaciones_v_dia) < 0)
        errs.evacuaciones_v_dia = 'No puede ser negativo';
    }
    if (p === 5) {
      // Consumo calórico: valores no negativos
      datos.consumo_calorico.forEach((item, i) => {
        ['intercambios','proteinas_g','grasas_g','cho_g','kcal'].forEach(campo => {
          const v = parseFloat(item[campo]);
          if (item[campo] !== '' && (isNaN(v) || v < 0))
            errs[`consumo_${i}_${campo}`] = `${campo} inválido en fila ${i+1}`;
        });
      });
      // Pesos: modelo max_digits=5, decimal_places=2 → max 999.99
      const PESOS = ['peso_maximo_kg','peso_minimo_kg','peso_usual_kg','peso_ideal_kg',
                     'peso_deseado_kg','peso_prequirurgico_kg'];
      PESOS.forEach(k => {
        const v = datos[k];
        if (v === '' || v === null || v === undefined) return;
        const n = parseFloat(v);
        if (isNaN(n) || n < 0)        errs[k] = 'Valor inválido';
        else if (n > 999.99)           errs[k] = 'Máx. 999.99 kg (modelo backend)';
        else if (!/^\d{0,3}(\.\d{0,2})?$/.test(String(v))) errs[k] = 'Máx. 3 enteros y 2 decimales';
      });
      const cm = datos.circunferencia_muneca_cm;
      if (cm !== '' && cm !== null && cm !== undefined) {
        const n = parseFloat(cm);
        if (isNaN(n) || n < 0) errs.circunferencia_muneca_cm = 'Valor inválido';
        else if (n > 999.99)   errs.circunferencia_muneca_cm = 'Máx. 999.99 cm';
      }
      // contextura: solo valores válidos del modelo
      if (datos.contextura && !['PEQUENA','MEDIANA','GRANDE',''].includes(datos.contextura))
        errs.contextura = 'Selecciona una opción válida';
    }
    if (p === 6) {
      const camposExamen = [
        'proteinas_totales','albumina','globulina','urea','creatinina','acido_urico',
        'colesterol','hdl','ldl','vldl','trigliceridos','glucosa','glucosa_postprandial',
        'insulina','hemoglobina_glicosilada','tgo','tgp','hemoglobina','hematocrito',
        't3','t4','tsh','hierro','vitamina_b12','sodio','potasio','calcio',
      ];
      const tieneValores = camposExamen.some(c => datos[`examen_${c}`] !== '');
      if (tieneValores && !datos.examen_fecha)
        errs.examen_fecha = 'Fecha del examen es obligatoria si ingresa valores';
    }
    return errs;
  };

  // Convierte errores DRF del backend a errores de campo del paso 1
  const mapearErroresBackend = (errData) => {
    const errs = {};
    const flat = (obj, prefix = '') => {
      if (Array.isArray(obj)) { errs[prefix] = obj.join(', '); return; }
      if (typeof obj === 'object' && obj !== null)
        Object.entries(obj).forEach(([k, v]) => flat(v, k === 'user' ? prefix : (prefix ? `${prefix}.${k}` : k)));
    };
    flat(errData);
    // Mapear claves conocidas a campos del formulario
    const mapa = { email: 'email', username: 'email', cedula: 'cedula', telefono: 'telefono',
                   first_name: 'first_name', last_name: 'last_name' };
    const resultado = {};
    Object.entries(errs).forEach(([k, v]) => {
      const key = k.split('.').pop();
      resultado[mapa[key] || key] = v;
    });
    return resultado;
  };

  const avanzarPaso = async () => {
    const errs = validarPaso(paso);
    if (Object.keys(errs).length > 0) {
      setErroresPaso(errs);
      return;
    }
    setErroresPaso({});

    // ── Paso 1: crear paciente en el backend antes de avanzar ──────────────
    if (paso === 1) {
      // Si ya fue creado (volvió atrás), solo avanza
      if (pacienteId) { setPaso(2); return; }

      setCreandoPaciente(true);
      try {
        // Refrescar CSRF antes del POST (puede haber expirado tras un reload)
        await api.get('/auth/csrf/');

        let fecha_nacimiento = null;
        if (datos.fecha_nac_anio && datos.fecha_nac_mes && datos.fecha_nac_dia)
          fecha_nacimiento = `${datos.fecha_nac_anio}-${String(datos.fecha_nac_mes).padStart(2,'0')}-${String(datos.fecha_nac_dia).padStart(2,'0')}`;

        const resp = await pacientesApi.create({
          first_name:       datos.first_name,
          last_name:        datos.last_name,
          email:            datos.email,
          password:         null,
          cedula:           datos.cedula,
          consultorio:      datos.consultorio,
          historia_nro:     datos.historia_nro,
          telefono:         datos.telefono,
          fecha_nacimiento,
          lugar_nacimiento: datos.lugar_nacimiento,
          sexo:             datos.sexo,
          estado_civil:     datos.estado_civil,
          direccion:        datos.direccion,
          religion:         datos.religion,
          grado_instruccion: datos.grado_instruccion,
          ocupacion:        datos.ocupacion,
          referido_por:     datos.referido_por,
        });
        setPacienteId(resp.id);
        showToast(`✓ Paciente ${datos.first_name} ${datos.last_name} registrado`, 'success');
        setPaso(2);
      } catch (err) {
        // El cliente lanza { status, data }
        if (err?.status === 401) {
          // Sesión expirada
          setErroresPaso({ email: 'Tu sesión expiró. Recarga la página e inicia sesión de nuevo.' });
          showToast('Sesión expirada — vuelve a iniciar sesión', 'error');
        } else if (err?.status === 403) {
          setErroresPaso({ email: 'No tienes permiso para registrar pacientes.' });
          showToast('Sin permiso para esta acción', 'error');
        } else {
          const errData = err?.data || {};
          const campoErrs = mapearErroresBackend(errData);
          if (Object.keys(campoErrs).length > 0) {
            setErroresPaso(campoErrs);
          } else {
            setErroresPaso({ email: `Error ${err?.status || ''}: ${JSON.stringify(err?.data || 'Error inesperado')}` });
          }
          showToast('Error al registrar el paciente. Verifica los datos.', 'error');
        }
      } finally {
        setCreandoPaciente(false);
      }
      return;
    }

    setPaso(p => p + 1);
  };

  // Parsea errores de DRF a mensajes legibles
  const parsearErrores = (errData) => {
    if (typeof errData === 'string') return errData;
    const LABELS = {
      first_name: 'Nombre', last_name: 'Apellido', cedula: 'Cédula',
      email: 'Email', telefono: 'Teléfono', historia_nro: 'Historia Nro.',
      username: 'Usuario', sexo: 'Sexo', estado_civil: 'Estado Civil',
      fecha_nacimiento: 'Fecha de nacimiento', non_field_errors: '',
    };
    const msgs = [];
    const recorrer = (obj, prefix = '') => {
      if (Array.isArray(obj)) {
        msgs.push((prefix ? `${prefix}: ` : '') + obj.join(', '));
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([k, v]) => {
          const label = LABELS[k] || k;
          recorrer(v, prefix ? `${prefix} › ${label}` : label);
        });
      }
    };
    recorrer(errData);
    return msgs.join('\n') || 'Error desconocido';
  };

  const guardar = async () => {
    // Seguridad: el paciente debe haberse creado en el paso 1
    if (!pacienteId) {
      showToast('Debes completar el Paso 1 primero', 'warning');
      setPaso(1);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.get('/auth/csrf/'); // Asegurar CSRF fresco
      const pacienteResp = { id: pacienteId };

      // 2. Crear expediente
      const expedienteData = {
        paciente: pacienteResp.id,
        motivo_consulta: datos.motivo_consulta,
        ant_personales: datos.ant_personales,
        ant_familiares: datos.ant_familiares,
        menarquia_anos: datos.menarquia_anos ? parseInt(datos.menarquia_anos) : null,
        fecha_ultima_menstruacion: datos.fecha_ultima_menstruacion || null,
        num_embarazos: datos.num_embarazos ? parseInt(datos.num_embarazos) : null,
        edad_ultimo_embarazo: datos.edad_ultimo_embarazo ? parseInt(datos.edad_ultimo_embarazo) : null,
        cafeinicos_v_dia: datos.cafeinicos_v_dia ? parseFloat(datos.cafeinicos_v_dia) : null,
        alcohol: datos.alcohol || null,
        tabaquicos_und_dia: datos.tabaquicos_und_dia ? parseFloat(datos.tabaquicos_und_dia) : null,
        sueno_hr_dia: datos.sueno_hr_dia ? parseFloat(datos.sueno_hr_dia) : null,
        apetito: datos.apetito || null,
        micciones_v_dia: datos.micciones_v_dia ? parseInt(datos.micciones_v_dia) : null,
        evacuaciones_v_dia: datos.evacuaciones_v_dia ? parseInt(datos.evacuaciones_v_dia) : null,
        actividad_fisica: datos.actividad_fisica,
        tg_dispepsia: datos.tg_dispepsia,
        tg_dispepsia_causa: datos.tg_dispepsia_causa || '',
        tg_distension: datos.tg_distension,
        tg_distension_causa: datos.tg_distension_causa || '',
        tg_aerofagia: datos.tg_aerofagia,
        tg_aerofagia_causa: datos.tg_aerofagia_causa || '',
        tg_flatulencia: datos.tg_flatulencia,
        tg_meteorismo: datos.tg_meteorismo,
        tg_meteorismo_causa: datos.tg_meteorismo_causa || '',
        tg_diarrea: datos.tg_diarrea,
        tg_diarrea_causa: datos.tg_diarrea_causa || '',
        tg_nauseas: datos.tg_nauseas,
        tg_nauseas_causa: datos.tg_nauseas_causa || '',
        tg_vomitos: datos.tg_vomitos,
        tg_vomitos_causa: datos.tg_vomitos_causa || '',
        tg_rgef: datos.tg_rgef,
        tg_rgef_causa: datos.tg_rgef_causa || '',
        estrenimiento: datos.estrenimiento || null,
        alergias_alimentarias: datos.alergias_alimentarias,
        trat_farmacologico: datos.trat_farmacologico,
        trat_suplemento_oral: datos.trat_suplemento_oral,
        trat_otros: datos.trat_otros,
        observaciones_calorias: datos.observaciones_calorias,
        peso_maximo_kg: datos.peso_maximo_kg ? parseFloat(datos.peso_maximo_kg) : null,
        peso_minimo_kg: datos.peso_minimo_kg ? parseFloat(datos.peso_minimo_kg) : null,
        peso_usual_kg: datos.peso_usual_kg ? parseFloat(datos.peso_usual_kg) : null,
        peso_ideal_kg: datos.peso_ideal_kg ? parseFloat(datos.peso_ideal_kg) : null,
        peso_deseado_kg: datos.peso_deseado_kg ? parseFloat(datos.peso_deseado_kg) : null,
        peso_prequirurgico_kg: datos.peso_prequirurgico_kg ? parseFloat(datos.peso_prequirurgico_kg) : null,
        circunferencia_muneca_cm: datos.circunferencia_muneca_cm ? parseFloat(datos.circunferencia_muneca_cm) : null,
        contextura: datos.contextura || null,
        consumo_calorico: datos.consumo_calorico.map(i => ({
          grupo: i.grupo,
          intercambios: parseFloat(i.intercambios) || 0,
          proteinas_g: parseFloat(i.proteinas_g) || 0,
          grasas_g: parseFloat(i.grasas_g) || 0,
          cho_g: parseFloat(i.cho_g) || 0,
          kcal: parseFloat(i.kcal) || 0,
          orden: i.orden,
        })),
      };

      const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';

      // 2. Crear expediente clínico
      const expResponse = await fetch('/api/expedientes/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(expedienteData),
      });

      if (!expResponse.ok) {
        const errData = await expResponse.json().catch(() => ({}));
        throw new Error(parsearErrores(errData));
      }

      showToast('Historia clínica guardada correctamente', 'success');

      // 3. Crear examen bioquímico si hay fecha Y al menos un valor
      const camposExamenGuardar = [
        'proteinas_totales','albumina','globulina','urea','creatinina','acido_urico',
        'colesterol','hdl','ldl','vldl','trigliceridos','glucosa','glucosa_postprandial',
        'insulina','hemoglobina_glicosilada','tgo','tgp','hemoglobina','hematocrito',
        't3','t4','tsh','hierro','vitamina_b12','sodio','potasio','calcio',
      ];
      const hayValoresExamen = camposExamenGuardar.some(c => datos[`examen_${c}`] !== '');
      if (datos.examen_fecha && hayValoresExamen) {
        const examenPayload = {
          paciente: pacienteResp.id,
          fecha: datos.examen_fecha,
        };
        const numOpt = (v) => (v !== '' && v !== null && v !== undefined ? parseFloat(v) : null);
        camposExamenGuardar.forEach(campo => {
          const val = numOpt(datos[`examen_${campo}`]);
          if (val !== null) examenPayload[campo] = val;
        });

        const examResponse = await fetch('/api/examenes-bioquimicos/', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify(examenPayload),
        });

        if (!examResponse.ok) {
          const errData = await examResponse.json().catch(() => ({}));
          // No lanzamos error fatal, solo avisamos
          showToast(`Advertencia: examen bioquímico no guardado — ${parsearErrores(errData)}`, 'warning', 5000);
        } else {
          showToast('Examen bioquímico guardado', 'success');
        }
      }

      // 4. Guardar Recordatorio 24h si hay entradas con descripción
      const entradasRecordatorio = (datos.recordatorio || [])
        .filter(t => t.descripcion && t.descripcion.trim())
        .map((t, idx) => ({
          nombre:      t.nombre || '',
          hora:        t.hora   || null,
          descripcion: t.descripcion.trim(),
          orden:       t.orden  ?? idx,
        }));

      if (entradasRecordatorio.length > 0) {
        const recPayload = {
          paciente: pacienteResp.id,
          entradas: entradasRecordatorio,
        };
        const recResponse = await fetch('/api/recordatorios/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
          body: JSON.stringify(recPayload),
        });
        if (!recResponse.ok) {
          const errData = await recResponse.json().catch(() => ({}));
          showToast(`Advertencia: recordatorio no guardado — ${parsearErrores(errData)}`, 'warning', 5000);
        }
      }

      // 5. Guardar Registro de Progreso (Antropometría) si hay peso actual
      if (datos.peso_actual_kg) {
        const progresoPayload = {
          paciente: pacienteResp.id,
          fecha: datos.fecha_consulta || new Date().toISOString().split('T')[0],
          peso_kg: parseFloat(datos.peso_actual_kg),
          talla_cm: datos.talla_cm ? parseFloat(datos.talla_cm) : null,
          cintura_cm: null,
          cadera_cm: null,
          notas: '',
        };
        const progResp = await fetch('/api/registros-progreso/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
          body: JSON.stringify(progresoPayload),
        });
        if (!progResp.ok) {
          const errData = await progResp.json().catch(() => ({}));
          showToast(`Advertencia: registro de peso no guardado — ${parsearErrores(errData)}`, 'warning', 4000);
        }
      }

      onSuccess(pacienteResp.id);
    } catch (e) {
      const msg = e.message || 'Error inesperado al guardar';
      setError(msg);
      // Mostrar un toast por cada línea de error
      msg.split('\n').forEach(linea => {
        if (linea.trim()) showToast(linea.trim(), 'error', 6000);
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 760, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📋 Nueva Historia Nutricional</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}>×</button>
        </div>

        {/* Stepper */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 4 }}>
          {PASOS.map((nombre, i) => {
            const esPasoActual = paso === i + 1;
            const esPasado     = paso > i + 1;
            const bloqueado    = i > 0 && !pacienteId; // pasos 2-6 bloqueados hasta crear paciente
            return (
              <button
                key={i}
                onClick={() => { if (!bloqueado) { setErroresPaso({}); setPaso(i + 1); } }}
                disabled={bloqueado}
                title={bloqueado ? 'Completa el Paso 1 primero' : ''}
                style={{
                  flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: esPasoActual ? 700 : 400,
                  background: esPasoActual ? 'var(--accent-green, #16a34a)' : esPasado ? '#dcfce7' : '#f3f4f6',
                  color: esPasoActual ? '#fff' : esPasado ? '#15803d' : bloqueado ? '#c4c4c4' : '#6b7280',
                  border: 'none', borderRadius: 6,
                  cursor: bloqueado ? 'not-allowed' : 'pointer',
                  textAlign: 'center', opacity: bloqueado ? 0.6 : 1,
                }}
              >
                {esPasado && i === 0 ? '✓' : i + 1}. {nombre}
              </button>
            );
          })}
        </div>

        {/* Contenido scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {paso === 1 && <Paso1 datos={datos} set={set} edad={edad} onImportar={() => setShowImport(true)} errs={erroresPaso} />}
          {paso === 2 && <Paso2 datos={datos} set={set} errs={erroresPaso} />}
          {paso === 3 && <Paso3 datos={datos} set={set} errs={erroresPaso} />}
          {paso === 4 && <Paso4 datos={datos} set={set} />}
          {paso === 5 && <Paso5 datos={datos} set={set} totales={totales} calculos={calculos} errs={erroresPaso} />}
          {paso === 6 && <Paso6 datos={datos} set={set} errs={erroresPaso} />}
          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 6 }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setShowImport(true)} style={{ padding: '8px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            📂 Importar Excel
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {paso > 1 && <button onClick={() => { setErroresPaso({}); setError(''); setPaso(p => p - 1); }} style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>← Anterior</button>}
            {paso < 6
              ? <button
                  onClick={avanzarPaso}
                  disabled={creandoPaciente}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: creandoPaciente ? '#9ca3af' : 'var(--accent-green, #16a34a)', color: '#fff', border: 'none', borderRadius: 8, cursor: creandoPaciente ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  {creandoPaciente ? (
                    <><span style={{ width: 13, height: 13, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} /> Registrando...</>
                  ) : paso === 1 && !pacienteId ? 'Registrar y continuar →' : 'Siguiente →'}
                </button>
              : <button onClick={guardar} disabled={saving} style={{ padding: '8px 20px', background: saving ? '#9ca3af' : 'var(--accent-green, #16a34a)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {saving ? 'Guardando...' : '✓ Guardar Paciente'}
                </button>
            }
          </div>
        </div>
      </div>

      {showImport && <ImportarExcel onSuccess={(id) => { setShowImport(false); onSuccess(id); }} onClose={() => setShowImport(false)} />}
    </div>
  );
}

// Helper mensaje de error inline
function ErrMsg({ errs, campo }) {
  if (!errs || !errs[campo]) return null;
  return <span style={{ fontSize: 11, color: '#dc2626', display: 'block', marginTop: 2 }}>{errs[campo]}</span>;
}

// Helper para inputs
function Campo({ label, children, required }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  );
}
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 70 };

function Paso1({ datos, set, edad, onImportar, errs }) {
  const e = errs || {};
  return (
    <div>
      <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
        <button onClick={onImportar} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
          📂 Tengo el archivo Excel — Importar automáticamente
        </button>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#15803d', textAlign: 'center' }}>O rellena el formulario manualmente:</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Campo label="Consultorio"><input value={datos.consultorio} onChange={e => set('consultorio', e.target.value)} style={inputStyle} /></Campo>
        <Campo label="Historia Nro."><input value={datos.historia_nro} onChange={e => set('historia_nro', e.target.value)} style={inputStyle} /></Campo>
        <Campo label="Fecha consulta"><input type="date" value={datos.fecha_consulta} onChange={ev => set('fecha_consulta', ev.target.value)} style={inputStyle} /></Campo>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Campo label="Nombre" required>
          <input value={datos.first_name} onChange={ev => set('first_name', ev.target.value)} style={{ ...inputStyle, borderColor: e.first_name ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="first_name" />
        </Campo>
        <Campo label="Apellido" required>
          <input value={datos.last_name} onChange={ev => set('last_name', ev.target.value)} style={{ ...inputStyle, borderColor: e.last_name ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="last_name" />
        </Campo>
        <Campo label="Cédula" required>
          <input
            type="text" inputMode="numeric" pattern="\d*"
            value={datos.cedula}
            onChange={ev => set('cedula', ev.target.value.replace(/\D/g, ''))}
            style={{ ...inputStyle, borderColor: e.cedula ? '#dc2626' : undefined }}
            placeholder="Ej: 12345678"
          />
          <ErrMsg errs={e} campo="cedula" />
        </Campo>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 90px auto 90px 120px', gap: 8, marginBottom: 12, alignItems: 'end' }}>
        <Campo label="Día nac.">
          <input type="number" min="1" max="31" value={datos.fecha_nac_dia} onChange={ev => set('fecha_nac_dia', ev.target.value)} style={{ ...inputStyle, borderColor: e.fecha_nac_dia ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="fecha_nac_dia" />
        </Campo>
        <Campo label="Mes">
          <input type="number" min="1" max="12" value={datos.fecha_nac_mes} onChange={ev => set('fecha_nac_mes', ev.target.value)} style={{ ...inputStyle, borderColor: e.fecha_nac_mes ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="fecha_nac_mes" />
        </Campo>
        <Campo label="Año">
          <input type="number" min="1900" max="2099" value={datos.fecha_nac_anio} onChange={ev => set('fecha_nac_anio', ev.target.value)} style={{ ...inputStyle, borderColor: e.fecha_nac_anio ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="fecha_nac_anio" />
        </Campo>
        <Campo label="Edad"><div style={{ padding: '7px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{edad ? `${edad} años` : '—'}</div></Campo>
        <Campo label="Sexo">
          <select value={datos.sexo} onChange={ev => set('sexo', ev.target.value)} style={inputStyle}>
            <option value="">—</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
          <ErrMsg errs={e} campo="sexo" />
        </Campo>
        <Campo label="Estado Civil">
          <select value={datos.estado_civil} onChange={ev => set('estado_civil', ev.target.value)} style={inputStyle}>
            <option value="">—</option>
            <option value="S">Soltero/a</option>
            <option value="C">Casado/a</option>
            <option value="D">Divorciado/a</option>
            <option value="V">Viudo/a</option>
            <option value="U">Unión libre</option>
          </select>
        </Campo>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Campo label="Dirección"><input value={datos.direccion} onChange={ev => set('direccion', ev.target.value)} style={inputStyle} /></Campo>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Campo label="Lugar nacimiento"><input value={datos.lugar_nacimiento} onChange={ev => set('lugar_nacimiento', ev.target.value)} style={inputStyle} /></Campo>
        <Campo label="Religión"><input value={datos.religion} onChange={ev => set('religion', ev.target.value)} style={inputStyle} /></Campo>
        <Campo label="Grado Instrucción"><input value={datos.grado_instruccion} onChange={ev => set('grado_instruccion', ev.target.value)} style={inputStyle} /></Campo>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Campo label="Ocupación"><input value={datos.ocupacion} onChange={ev => set('ocupacion', ev.target.value)} style={inputStyle} /></Campo>
        <Campo label="Teléfono">
          <input
            type="text" inputMode="numeric" pattern="\d*"
            value={datos.telefono}
            onChange={ev => set('telefono', ev.target.value.replace(/\D/g, ''))}
            style={{ ...inputStyle, borderColor: e.telefono ? '#dc2626' : undefined }}
            placeholder="Ej: 04141234567"
          />
          <ErrMsg errs={e} campo="telefono" />
        </Campo>
        <Campo label="Referido por"><input value={datos.referido_por} onChange={ev => set('referido_por', ev.target.value)} style={inputStyle} /></Campo>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Campo label="Email" required>
          <input type="email" value={datos.email} onChange={ev => set('email', ev.target.value)} style={{ ...inputStyle, borderColor: e.email ? '#dc2626' : undefined }} placeholder="correo@ejemplo.com" />
          <ErrMsg errs={e} campo="email" />
        </Campo>
      </div>
    </div>
  );
}

const MAX_MOTIVO = 500;
const MAX_ANT    = 800;

function TextAreaConContador({ label, value, onChange, max, style: extraStyle }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{label}</label>
        <span style={{ fontSize: 10, color: value.length > max * 0.9 ? '#dc2626' : '#9ca3af' }}>
          {value.length}/{max}
        </span>
      </div>
      <textarea
        value={value}
        onChange={ev => onChange(ev.target.value.slice(0, max))}
        maxLength={max}
        style={{ ...textareaStyle, ...extraStyle, borderColor: value.length >= max ? '#dc2626' : undefined }}
      />
      {value.length >= max && (
        <span style={{ fontSize: 10, color: '#dc2626' }}>Límite de caracteres alcanzado</span>
      )}
    </div>
  );
}

function Paso2({ datos, set, errs }) {
  const e = errs || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TextAreaConContador
        label="Motivo de consulta"
        value={datos.motivo_consulta}
        onChange={v => set('motivo_consulta', v)}
        max={MAX_MOTIVO}
      />
      <TextAreaConContador
        label="Antecedentes Personales"
        value={datos.ant_personales}
        onChange={v => set('ant_personales', v)}
        max={MAX_ANT}
      />

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151' }}>Antecedentes Obstétricos</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <Campo label="Menarquía (años)">
            <input type="number" min="0" max="99" value={datos.menarquia_anos} onChange={ev => set('menarquia_anos', ev.target.value)} style={{ ...inputStyle, borderColor: e.menarquia_anos ? '#dc2626' : undefined }} />
            <ErrMsg errs={e} campo="menarquia_anos" />
          </Campo>
          <Campo label="FUM"><input type="date" value={datos.fecha_ultima_menstruacion} onChange={ev => set('fecha_ultima_menstruacion', ev.target.value)} style={inputStyle} /></Campo>
          <Campo label="Nro. Embarazos">
            <input type="number" min="0" max="30" value={datos.num_embarazos} onChange={ev => set('num_embarazos', ev.target.value)} style={{ ...inputStyle, borderColor: e.num_embarazos ? '#dc2626' : undefined }} />
            <ErrMsg errs={e} campo="num_embarazos" />
          </Campo>
          <Campo label="Edad último emb.">
            <input type="number" min="0" max="99" value={datos.edad_ultimo_embarazo} onChange={ev => set('edad_ultimo_embarazo', ev.target.value)} style={{ ...inputStyle, borderColor: e.edad_ultimo_embarazo ? '#dc2626' : undefined }} />
            <ErrMsg errs={e} campo="edad_ultimo_embarazo" />
          </Campo>
        </div>
      </div>

      <Campo label="Antecedentes Familiares"><textarea value={datos.ant_familiares} onChange={ev => set('ant_familiares', ev.target.value)} style={textareaStyle} /></Campo>
    </div>
  );
}

function Paso3({ datos, set, errs }) {
  const e = errs || {};
  const TGI = [
    { key: 'tg_dispepsia', label: 'Dispepsia' },
    { key: 'tg_distension', label: 'Distensión' },
    { key: 'tg_aerofagia', label: 'Aerofagia' },
    { key: 'tg_meteorismo', label: 'Meteorismo' },
    { key: 'tg_diarrea', label: 'Diarrea' },
    { key: 'tg_nauseas', label: 'Náuseas' },
    { key: 'tg_vomitos', label: 'Vómitos' },
    { key: 'tg_rgef', label: 'R.GEF' },
  ];
  return (
    <div>
      <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Hábitos Psicobiológicos</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <Campo label="Cafeínicos (v/día)">
          <input type="number" min="0" value={datos.cafeinicos_v_dia} onChange={ev => set('cafeinicos_v_dia', ev.target.value)} style={{ ...inputStyle, borderColor: e.cafeinicos_v_dia ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="cafeinicos_v_dia" />
        </Campo>
        <Campo label="Alcohol">
          <select value={datos.alcohol} onChange={ev => set('alcohol', ev.target.value)} style={inputStyle}>
            <option value="">— No —</option>
            <option value="OCASIONAL">Ocasional</option>
            <option value="FRECUENTE">Frecuente</option>
            <option value="DIARIO">Diario</option>
          </select>
        </Campo>
        <Campo label="Tabáquicos (und/día)">
          <input type="number" min="0" value={datos.tabaquicos_und_dia} onChange={ev => set('tabaquicos_und_dia', ev.target.value)} style={{ ...inputStyle, borderColor: e.tabaquicos_und_dia ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="tabaquicos_und_dia" />
        </Campo>
        <Campo label="Sueño (hr/día)">
          <input type="number" min="0" max="24" step="0.5" value={datos.sueno_hr_dia} onChange={ev => set('sueno_hr_dia', ev.target.value)} style={{ ...inputStyle, borderColor: e.sueno_hr_dia ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="sueno_hr_dia" />
        </Campo>
        <Campo label="Apetito">
          <select value={datos.apetito} onChange={ev => set('apetito', ev.target.value)} style={inputStyle}>
            <option value="">—</option>
            <option value="NORMAL">Normal</option>
            <option value="AUMENTADO">Aumentado</option>
            <option value="DISMINUIDO">Disminuido</option>
          </select>
        </Campo>
        <Campo label="Micciones (v/día)">
          <input type="number" min="0" value={datos.micciones_v_dia} onChange={ev => set('micciones_v_dia', ev.target.value)} style={{ ...inputStyle, borderColor: e.micciones_v_dia ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="micciones_v_dia" />
        </Campo>
        <Campo label="Evacuaciones (v/día)">
          <input type="number" min="0" value={datos.evacuaciones_v_dia} onChange={ev => set('evacuaciones_v_dia', ev.target.value)} style={{ ...inputStyle, borderColor: e.evacuaciones_v_dia ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="evacuaciones_v_dia" />
        </Campo>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Campo label="Actividad física"><textarea value={datos.actividad_fisica} onChange={ev => set('actividad_fisica', ev.target.value)} style={{ ...textareaStyle, minHeight: 50 }} /></Campo>
      </div>

      <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Trastornos Gastrointestinales</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        {TGI.map(({ key, label }) => (
          <div key={key}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={datos[key]} onChange={e => {
                set(key, e.target.checked);
                if (!e.target.checked) set(`${key}_causa`, '');
              }} />
              {label}
            </label>
            {datos[key] && (
              <div style={{ marginLeft: 24, marginTop: 6, transition: 'all 0.2s' }}>
                <input 
                  type="text" 
                  value={datos[`${key}_causa`] || ''} 
                  onChange={e => set(`${key}_causa`, e.target.value)}
                  style={inputStyle}
                  placeholder="Especifica la causa..."
                />
              </div>
            )}
          </div>
        ))}
        <div>
          <Campo label="Flatulencia (describe)">
            <input 
              value={datos.tg_flatulencia} 
              onChange={e => set('tg_flatulencia', e.target.value)} 
              style={inputStyle} 
              placeholder="Ej: Granos, legumbres..." 
            />
          </Campo>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Campo label="Alergias / Intolerancias alimentarias"><input value={datos.alergias_alimentarias} onChange={e => set('alergias_alimentarias', e.target.value)} style={inputStyle} /></Campo>
      </div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#374151' }}>Estreñimiento</p>
        <div style={{ display: 'flex', gap: 16 }}>
          {['NO', 'LEVE', 'MODERADO', 'CRONICO'].map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" name="estrenimiento" value={v} checked={datos.estrenimiento === v} onChange={() => set('estrenimiento', v)} />
              {v === 'NO' ? 'No' : v === 'CRONICO' ? 'Crónico' : v.charAt(0) + v.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>

      <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Tratamientos</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Campo label="Farmacológico"><textarea value={datos.trat_farmacologico} onChange={e => set('trat_farmacologico', e.target.value)} style={{ ...textareaStyle, minHeight: 50 }} /></Campo>
        <Campo label="Suplemento oral (vitaminas/minerales)"><textarea value={datos.trat_suplemento_oral} onChange={e => set('trat_suplemento_oral', e.target.value)} style={{ ...textareaStyle, minHeight: 50 }} /></Campo>
        <Campo label="Otros"><textarea value={datos.trat_otros} onChange={e => set('trat_otros', e.target.value)} style={{ ...textareaStyle, minHeight: 50 }} /></Campo>
      </div>
    </div>
  );
}

// ── Paso 4: Recordatorio 24h — UI tipo PlanEditorView ───────────────────────
const ICONOS_TIEMPO = ['🌅','🍎','🍽️','🥤','🌙','🌛','☕','🥗','🍊','🌾'];

function Paso4({ datos, set }) {
  const tiempos = datos.recordatorio;

  const updateTiempo = (id, campo, valor) => {
    set('recordatorio', tiempos.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  };

  const toggleExpandido = (id) => {
    set('recordatorio', tiempos.map(t => t.id === id ? { ...t, expandido: !t.expandido } : t));
  };

  const agregarTiempo = () => {
    const idx = tiempos.length;
    const icono = ICONOS_TIEMPO[idx % ICONOS_TIEMPO.length];
    set('recordatorio', [
      ...tiempos,
      { id: `t${Date.now()}`, label: `Comida ${idx + 1}`, icono, hora: '', descripcion: '', expandido: true },
    ]);
  };

  const eliminarTiempo = (id) => {
    set('recordatorio', tiempos.filter(t => t.id !== id));
  };

  const tiemposConDatos = tiempos.filter(t => t.descripcion.trim()).length;

  return (
    <div>
      {/* Cabecera informativa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>Recordatorio Alimentario 24h</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
            Describe lo que el paciente consume en un día típico, tiempo por tiempo.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tiemposConDatos > 0 && (
            <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
              {tiemposConDatos}/{tiempos.length} completados
            </span>
          )}
          <button
            type="button"
            onClick={agregarTiempo}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            <Plus size={13} /> Agregar tiempo
          </button>
        </div>
      </div>

      {/* Timeline de tiempos de comida */}
      <div style={{ position: 'relative' }}>
        {/* Línea vertical de timeline */}
        <div style={{ position: 'absolute', left: 19, top: 8, bottom: 8, width: 2, background: '#e5e7eb', zIndex: 0 }} />

        {tiempos.map((t, idx) => {
          const tieneContenido = t.descripcion.trim().length > 0;
          return (
            <div key={t.id} style={{ position: 'relative', display: 'flex', gap: 12, marginBottom: 10 }}>
              {/* Dot del timeline */}
              <div style={{
                flexShrink: 0, width: 40, height: 40, borderRadius: '50%', zIndex: 1,
                background: tieneContenido ? '#16a34a' : '#fff',
                border: `2px solid ${tieneContenido ? '#16a34a' : '#d1d5db'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: tieneContenido ? 16 : 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
                {tieneContenido ? '✓' : t.icono}
              </div>

              {/* Card del tiempo de comida */}
              <div style={{ flex: 1, border: `1px solid ${tieneContenido ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 10, overflow: 'hidden', background: tieneContenido ? '#f0fdf4' : '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Header del card */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleExpandido(t.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{t.label}</span>
                    {tieneContenido && (
                      <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>✓ Con datos</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Input hora */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={ev => ev.stopPropagation()}>
                      <Clock size={12} style={{ color: '#9ca3af' }} />
                      <input
                        type="time"
                        value={t.hora}
                        onChange={ev => updateTiempo(t.id, 'hora', ev.target.value)}
                        style={{ width: 90, padding: '3px 6px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, color: '#374151', background: '#fff' }}
                      />
                    </div>
                    {/* Editar nombre */}
                    <div onClick={ev => ev.stopPropagation()}>
                      <input
                        type="text"
                        value={t.label}
                        onChange={ev => updateTiempo(t.id, 'label', ev.target.value)}
                        style={{ width: 110, padding: '3px 8px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, color: '#374151', background: '#fff' }}
                      />
                    </div>
                    {/* Eliminar */}
                    {tiempos.length > 1 && (
                      <button
                        type="button"
                        onClick={ev => { ev.stopPropagation(); eliminarTiempo(t.id); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, borderRadius: 4 }}
                        title="Eliminar tiempo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <span style={{ color: '#9ca3af' }}>
                      {t.expandido ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </div>
                </div>

                {/* Cuerpo expandible */}
                {t.expandido && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '10px 14px' }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                      ¿Qué consumió el paciente? <span style={{ fontWeight: 400 }}>(describe los alimentos y cantidades)</span>
                    </label>
                    <textarea
                      value={t.descripcion}
                      onChange={ev => updateTiempo(t.id, 'descripcion', ev.target.value)}
                      placeholder="Ej: 2 huevos revueltos con tomate, 1 taza de café con leche, 1 arepa mediana..."
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151', background: '#fff' }}
                    />
                    {/* Contador de caracteres */}
                    <div style={{ textAlign: 'right', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                      {t.descripcion.length}/500
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tiempos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 13 }}>No hay tiempos de comida. Agrega uno arriba.</p>
        </div>
      )}
    </div>
  );
}

function Paso6({ datos, set, errs }) {
  const e = errs || {};
  const seccion = (titulo) => (
    <p style={{ margin: '14px 0 8px', fontWeight: 700, fontSize: 12, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>{titulo}</p>
  );

  const grupos = [
    {
      titulo: 'Proteínas',
      campos: [
        { label: 'Proteínas totales (g/dL)', key: 'proteinas_totales' },
        { label: 'Albúmina (g/dL)', key: 'albumina' },
        { label: 'Globulina (g/dL)', key: 'globulina' },
      ],
    },
    {
      titulo: 'Función Renal',
      campos: [
        { label: 'Urea (mg/dL)', key: 'urea' },
        { label: 'Creatinina (mg/dL)', key: 'creatinina' },
        { label: 'Ácido Úrico (mg/dL)', key: 'acido_urico' },
      ],
    },
    {
      titulo: 'Perfil Lipídico',
      campos: [
        { label: 'Colesterol total (mg/dL)', key: 'colesterol' },
        { label: 'HDL (mg/dL)', key: 'hdl' },
        { label: 'LDL (mg/dL)', key: 'ldl' },
        { label: 'VLDL (mg/dL)', key: 'vldl' },
        { label: 'Triglicéridos (mg/dL)', key: 'trigliceridos' },
      ],
    },
    {
      titulo: 'Glucosa / Insulina',
      campos: [
        { label: 'Glucosa (mg/dL)', key: 'glucosa' },
        { label: 'Glucosa postprandial (mg/dL)', key: 'glucosa_postprandial' },
        { label: 'Insulina (μU/mL)', key: 'insulina' },
        { label: 'HbA1c (%)', key: 'hemoglobina_glicosilada' },
      ],
    },
    {
      titulo: 'Función Hepática',
      campos: [
        { label: 'TGO/AST (U/L)', key: 'tgo' },
        { label: 'TGP/ALT (U/L)', key: 'tgp' },
      ],
    },
    {
      titulo: 'Hematología',
      campos: [
        { label: 'Hemoglobina (g/dL)', key: 'hemoglobina' },
        { label: 'Hematocrito (%)', key: 'hematocrito' },
      ],
    },
    {
      titulo: 'Tiroides',
      campos: [
        { label: 'T3 (ng/dL)', key: 't3' },
        { label: 'T4 (μg/dL)', key: 't4' },
        { label: 'TSH (μUI/mL)', key: 'tsh' },
      ],
    },
    {
      titulo: 'Minerales y Vitaminas',
      campos: [
        { label: 'Hierro (μg/dL)', key: 'hierro' },
        { label: 'Vitamina B12 (pg/mL)', key: 'vitamina_b12' },
        { label: 'Sodio (mEq/L)', key: 'sodio' },
        { label: 'Potasio (mEq/L)', key: 'potasio' },
        { label: 'Calcio (mg/dL)', key: 'calcio' },
      ],
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 12, color: '#1d4ed8' }}>
        🧪 <strong>Opcional</strong> — Ingresa los resultados del examen bioquímico del paciente. Si dejas todos los campos vacíos (excepto la fecha), el registro no se guardará.
      </div>

      <div style={{ marginBottom: 14 }}>
        <Campo label="Fecha del examen" required>
          <input type="date" value={datos.examen_fecha} onChange={ev => set('examen_fecha', ev.target.value)} style={{ ...inputStyle, borderColor: e.examen_fecha ? '#dc2626' : undefined }} />
          <ErrMsg errs={e} campo="examen_fecha" />
        </Campo>
      </div>

      {grupos.map(({ titulo, campos }) => (
        <div key={titulo}>
          {seccion(titulo)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 4 }}>
            {campos.map(({ label, key }) => (
              <Campo key={key} label={label}>
                <input
                  type="number"
                  step="0.01"
                  value={datos[`examen_${key}`]}
                  onChange={e => set(`examen_${key}`, e.target.value)}
                  style={inputStyle}
                  placeholder="—"
                />
              </Campo>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Celda de valor calculado (solo lectura, destacada)
function CalcCell({ value, unit = '', color = '#16a34a', decimals = 2 }) {
  const display = value !== null && value !== undefined
    ? `${Number(value).toFixed(decimals)}${unit}`
    : '—';
  return (
    <div style={{
      padding: '6px 8px', borderRadius: 6, background: value !== null ? '#f0fdf4' : '#f9fafb',
      border: `1px solid ${value !== null ? '#bbf7d0' : '#e5e7eb'}`,
      fontSize: 13, fontWeight: 700, color: value !== null ? color : '#9ca3af',
      textAlign: 'center', minWidth: 60,
    }}>{display}</div>
  );
}

function Paso5({ datos, set, totales, calculos, errs }) {
  const updateCC = (i, campo, valor) => {
    const nuevo = [...datos.consumo_calorico];
    nuevo[i] = { ...nuevo[i], [campo]: valor };
    set('consumo_calorico', nuevo);
  };

  const pesoInputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };
  const thStyle = { padding: '8px 6px', fontSize: 11, fontWeight: 700, color: '#374151', background: '#f3f4f6', textAlign: 'center', borderBottom: '2px solid #d1d5db' };
  const tdStyle = { padding: '4px 4px', borderBottom: '1px solid #f3f4f6' };
  const numInput = (val, onChange) => (
    <input type="number" step="0.01" value={val} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '5px 4px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12, textAlign: 'center', boxSizing: 'border-box' }} />
  );

  const showGKg = calculos.pRef > 0;

  return (
    <div>
      {/* ── Consumo Calórico ─────────────────────────────────────────────── */}
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>Ingresa los intercambios y macronutrientes por grupo de alimento.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left', minWidth: 120 }}>Alimento</th>
              <th style={{ ...thStyle, minWidth: 55 }}>INT</th>
              <th style={{ ...thStyle, minWidth: 65 }}>P (g/día)</th>
              <th style={{ ...thStyle, minWidth: 65 }}>G (g/día)</th>
              <th style={{ ...thStyle, minWidth: 65 }}>CHO (g/día)</th>
              <th style={{ ...thStyle, minWidth: 65 }}>KCAL/día</th>
              {showGKg && <th style={{ ...thStyle, minWidth: 75, background: '#ecfdf5', color: '#15803d' }}>P g/kg-p/día</th>}
              {showGKg && <th style={{ ...thStyle, minWidth: 75, background: '#ecfdf5', color: '#15803d' }}>G g/kg-p/día</th>}
              {showGKg && <th style={{ ...thStyle, minWidth: 75, background: '#ecfdf5', color: '#15803d' }}>CHO g/kg-p/día</th>}
            </tr>
          </thead>
          <tbody>
            {datos.consumo_calorico.map((item, i) => {
              const p  = parseFloat(item.proteinas_g) || 0;
              const g  = parseFloat(item.grasas_g)    || 0;
              const cho = parseFloat(item.cho_g)      || 0;
              return (
                <tr key={item.grupo}>
                  <td style={{ ...tdStyle, fontWeight: 500, padding: '6px 8px', color: '#374151' }}>{item.nombre}</td>
                  <td style={tdStyle}>{numInput(item.intercambios, v => updateCC(i, 'intercambios', v))}</td>
                  <td style={tdStyle}>{numInput(item.proteinas_g,  v => updateCC(i, 'proteinas_g',  v))}</td>
                  <td style={tdStyle}>{numInput(item.grasas_g,     v => updateCC(i, 'grasas_g',     v))}</td>
                  <td style={tdStyle}>{numInput(item.cho_g,        v => updateCC(i, 'cho_g',        v))}</td>
                  <td style={tdStyle}>{numInput(item.kcal,         v => updateCC(i, 'kcal',         v))}</td>
                  {showGKg && <td style={{ ...tdStyle, textAlign: 'center', color: '#15803d', fontSize: 12 }}>{p ? (p / calculos.pRef).toFixed(2) : '—'}</td>}
                  {showGKg && <td style={{ ...tdStyle, textAlign: 'center', color: '#15803d', fontSize: 12 }}>{g ? (g / calculos.pRef).toFixed(2) : '—'}</td>}
                  {showGKg && <td style={{ ...tdStyle, textAlign: 'center', color: '#15803d', fontSize: 12 }}>{cho ? (cho / calculos.pRef).toFixed(2) : '—'}</td>}
                </tr>
              );
            })}
            {/* Fila TOTAL */}
            <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
              <td style={{ ...tdStyle, padding: '8px', color: '#111827' }}>TOTAL</td>
              {['intercambios','proteinas_g','grasas_g','cho_g','kcal'].map(k => (
                <td key={k} style={{ ...tdStyle, textAlign: 'center', color: '#16a34a' }}>{totales[k]}</td>
              ))}
              {showGKg && <td style={{ ...tdStyle, textAlign: 'center', color: '#16a34a' }}>{calculos.p_g_kg ?? '—'}</td>}
              {showGKg && <td style={{ ...tdStyle, textAlign: 'center', color: '#16a34a' }}>{calculos.g_g_kg ?? '—'}</td>}
              {showGKg && <td style={{ ...tdStyle, textAlign: 'center', color: '#16a34a' }}>{calculos.cho_g_kg ?? '—'}</td>}
            </tr>
          </tbody>
        </table>
      </div>
      {!showGKg && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
          💡 Ingresa el Peso Actual o Peso Usual en Evaluación Objetiva para ver g/kg-p/día
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        <Campo label="Observaciones calóricas">
          <input value={datos.observaciones_calorias} onChange={e => set('observaciones_calorias', e.target.value)} style={pesoInputStyle} placeholder="Ej: Gasta 2768 Calorías/día" />
        </Campo>
      </div>

      {/* ── Evaluación Objetiva ───────────────────────────────────────────── */}
      <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Evaluación Objetiva</p>

        {/* Peso Actual y Talla → generan RegistroProgreso y activan cálculos */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#1d4ed8' }}>
            📏 Medición actual (genera registro de progreso)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, alignItems: 'end' }}>
            <Campo label="Peso Actual (kg)">
              <input type="number" step="0.01" min="0" max="999.99" value={datos.peso_actual_kg}
                onChange={ev => set('peso_actual_kg', ev.target.value)}
                style={pesoInputStyle} placeholder="90.15" />
            </Campo>
            <Campo label="Talla (cm)">
              <input type="number" step="0.1" min="0" max="300" value={datos.talla_cm}
                onChange={ev => set('talla_cm', ev.target.value)}
                style={pesoInputStyle} placeholder="177" />
            </Campo>
            {/* IMC calculado */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>IMC</label>
              <div style={{ padding: '7px 10px', borderRadius: 6, background: calculos.imc ? '#f0fdf4' : '#f9fafb', border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 700, color: calculos.imc ? '#15803d' : '#9ca3af' }}>
                {calculos.imc ?? '—'} {calculos.imcLabel && <span style={{ fontSize: 10, fontWeight: 400 }}>({calculos.imcLabel})</span>}
              </div>
            </div>
            {/* Peso ref */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Peso referencia</label>
              <div style={{ padding: '7px 10px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280' }}>
                {calculos.pRef ? `${calculos.pRef} kg` : '—'}
                <span style={{ fontSize: 10, display: 'block', color: '#9ca3af' }}>{datos.peso_actual_kg ? 'Peso actual' : datos.peso_usual_kg ? 'Peso usual' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* %PP / %PI / %PU calculados */}
        {(calculos.pct_pp !== null || calculos.pct_pi !== null || calculos.pct_pu !== null || calculos.pct_pqx !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%PP (Pérdida de Peso)</div>
              <CalcCell value={calculos.pct_pp} unit="%" color={calculos.pct_pp < 0 ? '#dc2626' : calculos.pct_pp > 5 ? '#ea580c' : '#16a34a'} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%PI (Peso Ideal)</div>
              <CalcCell value={calculos.pct_pi} unit="%" color={calculos.pct_pi > 110 ? '#ea580c' : '#16a34a'} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%PU (Peso Usual)</div>
              <CalcCell value={calculos.pct_pu} unit="%" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>%P.Pre-Qx / P.Usual</div>
              <CalcCell value={calculos.pct_pqx} unit="%" color="#7c3aed" />
            </div>
          </div>
        )}

        {/* Pesos de referencia */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Peso Máximo (kg)',        key: 'peso_maximo_kg' },
            { label: 'Peso Mínimo (kg)',         key: 'peso_minimo_kg' },
            { label: 'Peso Usual (kg)',          key: 'peso_usual_kg' },
            { label: 'Peso Ideal (kg)',          key: 'peso_ideal_kg' },
            { label: 'Peso Deseado (kg)',        key: 'peso_deseado_kg' },
            { label: 'P. Pre-Quirúrgico (kg)',   key: 'peso_prequirurgico_kg' },
            { label: 'Circ. Muñeca (cm)',        key: 'circunferencia_muneca_cm' },
          ].map(({ label, key }) => (
            <Campo key={key} label={label}>
              <input
                type="number" step="0.01" min="0" max="999.99"
                value={datos[key]}
                onChange={ev => {
                  const v = ev.target.value;
                  if (v === '' || /^\d{0,3}(\.\d{0,2})?$/.test(v)) set(key, v);
                }}
                style={pesoInputStyle} placeholder="0.00"
              />
            </Campo>
          ))}
          <Campo label="Contextura">
            <select value={datos.contextura} onChange={ev => set('contextura', ev.target.value)} style={pesoInputStyle}>
              <option value="">— Seleccionar —</option>
              <option value="PEQUENA">Pequeña</option>
              <option value="MEDIANA">Mediana</option>
              <option value="GRANDE">Grande</option>
            </select>
          </Campo>
        </div>
      </div>
    </div>
  );
}
