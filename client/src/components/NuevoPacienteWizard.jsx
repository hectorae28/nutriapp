import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, User, Clipboard, Activity, Clock, Table, FileText, Calendar, Droplet, Sun, FastForward, CheckSquare, Heart, FlaskConical, Stethoscope, Briefcase, Ruler, Mail, Phone, MapPin, BookOpen, UserCheck, Scale, Hand, Bone } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { pacientesApi, getConsumoCaloricoDefecto } from '../api/pacientes';
import ImportarExcel from './ImportarExcel'; // New component

// Helper for date calculation
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const [year, month, day] = fechaNacimiento.split('-').map(Number);
  const hoy = new Date();
  const nac = new Date(year, month - 1, day);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

// Helper for calorie totals
const calcularTotalesConsumoCalorico = (items) => {
  const totals = {
    intercambios: 0,
    proteinas_g: 0,
    grasas_g: 0,
    cho_g: 0,
    kcal: 0,
  };

  items.forEach(item => {
    totals.intercambios += parseFloat(item.intercambios || 0);
    totals.proteinas_g += parseFloat(item.proteinas_g || 0);
    totals.grasas_g += parseFloat(item.grasas_g || 0);
    totals.cho_g += parseFloat(item.cho_g || 0);
    totals.kcal += parseFloat(item.kcal || 0);
  });
  return totals;
};

// ── Shared Input Styles (matching design system) ──
const F = {
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
    appearance: 'none', // Remove default arrow
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%239CA3AF' aria-hidden='true'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1.2em',
  },
  radioGroup: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  checkboxGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
  },
  checkboxOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
};

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p style={{ fontSize: 11, color: 'var(--accent-coral)', marginTop: 3 }}>{error.message}</p>
  );
}

function Field({ label, name, type = 'text', register, errors, children, fullWidth, className = '', readOnly = false, ...props }) {
  const inputStyle = type === 'textarea' ? F.textarea : (type === 'select' ? F.select : F.input);
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}} className={className}>
      <label style={F.label}>{label}</label>
      {children ?? (
        type === 'textarea' ? (
          <textarea {...register(name)} style={inputStyle} readOnly={readOnly} {...props}></textarea>
        ) : (
          <input type={type} {...register(name)} style={inputStyle} readOnly={readOnly} {...props} />
        )
      )}
      <FieldError error={errors[name]} />
    </div>
  );
}

// ── Yup Schemas for each step ──
const commonStrings = yup.string().nullable().transform((v, o) => o === '' ? null : v);
const commonNumbers = yup.number().nullable().transform((v, o) => o === '' ? null : v);

const step1Schema = yup.object().shape({
  // User fields
  first_name: commonStrings.required('Nombre requerido').max(150, 'Máx. 150 caracteres'),
  last_name: commonStrings.required('Apellido requerido').max(150, 'Máx. 150 caracteres'),
  username: commonStrings
    .matches(/^[\w.@+\-]+$/, 'Solo letras, números y @/./+/-/_')
    .required('Usuario requerido')
    .max(150, 'Máx. 150 caracteres'),
  password: yup.string().required('Contraseña requerida').min(8, 'Mínimo 8 caracteres'),
  email: commonStrings.email('Email inválido'),

  // Patient fields (Datos Personales)
  consultorio: commonStrings.max(100, 'Máx. 100 caracteres'),
  fecha_consulta: yup.date().nullable().transform((v, o) => o === '' ? null : v), // YYYY-MM-DD
  historia_nro: commonStrings.max(50, 'Máx. 50 caracteres'),
  cedula: commonStrings.required('La cédula es obligatoria').max(20, 'Máx. 20 caracteres'),
  fecha_nacimiento: yup.date().nullable().transform((v, o) => o === '' ? null : v), // YYYY-MM-DD
  lugar_nacimiento: commonStrings.max(100, 'Máx. 100 caracteres'),
  sexo: commonStrings.oneOf(['F', 'M', 'O', null], 'Género inválido'),
  estado_civil: commonStrings.oneOf(['S', 'C', 'D', 'V', 'U', null], 'Estado civil inválido'),
  direccion: commonStrings.max(255, 'Máx. 255 caracteres'),
  religion: commonStrings.max(100, 'Máx. 100 caracteres'),
  grado_instruccion: commonStrings.max(100, 'Máx. 100 caracteres'),
  ocupacion: commonStrings.max(100, 'Máx. 100 caracteres'),
  telefono: commonStrings.max(20, 'Máx. 20 caracteres'),
  referido_por: commonStrings.max(100, 'Máx. 100 caracteres'),
});

const step2Schema = yup.object().shape({
  motivo_consulta: commonStrings,
  antecedentes_personales: commonStrings,
  menarquia_anios: commonNumbers.min(0, 'No puede ser negativo').max(99, 'Máx. 99 años'),
  fum_fecha: yup.date().nullable().transform((v, o) => o === '' ? null : v),
  embarazos_nro: commonNumbers.min(0, 'No puede ser negativo').max(20, 'Máx. 20 embarazos'),
  edad_ultimo_embarazo: commonNumbers.min(0, 'No puede ser negativo').max(99, 'Máx. 99 años'),
  antecedentes_familiares: commonStrings,
});

const step3Schema = yup.object().shape({
  // Hábitos Psicobiológicos
  cafeinicos_vdia: commonNumbers.min(0, 'No puede ser negativo'),
  alcohol_tipo: commonStrings.oneOf(['OC', 'FRECUENTE', 'DIARIO', null], 'Tipo de alcohol inválido'),
  tabaquicos_undia: commonNumbers.min(0, 'No puede ser negativo'),
  sueno_hrdia: commonNumbers.min(0, 'No puede ser negativo').max(24, 'Máx. 24 horas'),
  apetito: commonStrings.oneOf(['NORMAL', 'AUMENTADO', 'DISMINUIDO', null], 'Apetito inválido'),
  micciones_vdia: commonNumbers.min(0, 'No puede ser negativo'),
  evacuaciones_vdia: commonNumbers.min(0, 'No puede ser negativo'),
  actividad_fisica: commonStrings,

  // Trastornos Gastrointestinales
  dispepsia: yup.boolean(),
  dispepsia_causa: commonStrings,
  distension: yup.boolean(),
  distension_causa: commonStrings,
  aerofagia: yup.boolean(),
  aerofagia_causa: commonStrings,
  flatulencia: commonStrings,
  meteorismo: yup.boolean(),
  meteorismo_causa: commonStrings,
  diarrea: yup.boolean(),
  diarrea_causa: commonStrings,
  nauseas: yup.boolean(),
  nauseas_causa: commonStrings,
  vomitos: yup.boolean(),
  vomitos_causa: commonStrings,
  rgef: yup.boolean(),
  rgef_causa: commonStrings,
  alergias_intolerancias: commonStrings,
  estrenimiento: commonStrings.oneOf(['NO', 'LEVE', 'MODERADO', 'CRONICO', null], 'Estreñimiento inválido'),

  // Tratamientos
  tratamiento_farmacologico: commonStrings,
  suplemento_oral: commonStrings,
  otros_tratamientos: commonStrings,
});

const recordatorioTiempoComidaSchema = yup.object().shape({
  hora: commonNumbers.min(1, 'Hora inválida').max(12, 'Hora inválida'),
  am_pm: commonStrings.oneOf(['AM', 'PM', null], 'Formato AM/PM inválido'),
  descripcion_alimentos: commonStrings,
});

const step4Schema = yup.object().shape({
  recordatorio_desayuno: recordatorioTiempoComidaSchema,
  recordatorio_merienda_am: recordatorioTiempoComidaSchema,
  recordatorio_almuerzo: recordatorioTiempoComidaSchema,
  recordatorio_merienda_pm: recordatorioTiempoComidaSchema,
  recordatorio_cena: recordatorioTiempoComidaSchema,
  recordatorio_merienda_noche: recordatorioTiempoComidaSchema,
});

const consumoCaloricoItemSchema = yup.object().shape({
  grupo: yup.string().required(),
  nombre: yup.string().required(),
  intercambios: commonNumbers.min(0).max(9999),
  proteinas_g: commonNumbers.min(0).max(9999),
  grasas_g: commonNumbers.min(0).max(9999),
  cho_g: commonNumbers.min(0).max(9999),
  kcal: commonNumbers.min(0).max(9999),
  orden: yup.number().required(),
});

const step5Schema = yup.object().shape({
  consumo_calorico: yup.array().of(consumoCaloricoItemSchema),
  observaciones_caloricas: commonStrings,
  // Evaluación objetiva
  peso_max_kg: commonNumbers.min(0).max(999.99, 'Máx. 999.99 kg'),
  peso_min_kg: commonNumbers.min(0).max(999.99, 'Máx. 999.99 kg'),
  peso_usual_kg: commonNumbers.min(0).max(999.99, 'Máx. 999.99 kg'),
  peso_ideal_kg: commonNumbers.min(0).max(999.99, 'Máx. 999.99 kg'),
  peso_deseado_kg: commonNumbers.min(0).max(999.99, 'Máx. 999.99 kg'),
  peso_prequirurgico_kg: commonNumbers.min(0).max(999.99, 'Máx. 999.99 kg'),
  circunferencia_muneca_cm: commonNumbers.min(0).max(999.99, 'Máx. 999.99 cm'),
  contextura: commonStrings.oneOf(['PEQUENA', 'MEDIANA', 'GRANDE', null], 'Contextura inválida'),
});

const schemas = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema];

const defaultValues = {
  // Step 1
  first_name: '', last_name: '', username: '', password: '', email: '',
  consultorio: '', fecha_consulta: new Date().toISOString().split('T')[0], historia_nro: '', cedula: '',
  fecha_nacimiento: '', lugar_nacimiento: '', sexo: '', estado_civil: '', direccion: '',
  religion: '', grado_instruccion: '', ocupacion: '', telefono: '', referido_por: '',
  // Step 2
  motivo_consulta: '', antecedentes_personales: '', menarquia_anios: '', fum_fecha: '',
  embarazos_nro: '', edad_ultimo_embarazo: '', antecedentes_familiares: '',
  // Step 3
  cafeinicos_vdia: '', alcohol_tipo: '', tabaquicos_undia: '', sueno_hrdia: '', apetito: '',
  micciones_vdia: '', evacuaciones_vdia: '', actividad_fisica: '',
  dispepsia: false, dispepsia_causa: '', distension: false, distension_causa: '',
  aerofagia: false, aerofagia_causa: '', flatulencia: '',
  meteorismo: false, meteorismo_causa: '', diarrea: false, diarrea_causa: '',
  nauseas: false, nauseas_causa: '', vomitos: false, vomitos_causa: '',
  rgef: false, rgef_causa: '',
  alergias_intolerancias: '', estrenimiento: '',
  tratamiento_farmacologico: '', suplemento_oral: '', otros_tratamientos: '',
  // Step 4
  recordatorio_desayuno: { hora: '', am_pm: 'AM', descripcion_alimentos: '' },
  recordatorio_merienda_am: { hora: '', am_pm: 'AM', descripcion_alimentos: '' },
  recordatorio_almuerzo: { hora: '', am_pm: 'PM', descripcion_alimentos: '' },
  recordatorio_merienda_pm: { hora: '', am_pm: 'PM', descripcion_alimentos: '' },
  recordatorio_cena: { hora: '', am_pm: 'PM', descripcion_alimentos: '' },
  recordatorio_merienda_noche: { hora: '', am_pm: 'AM', descripcion_alimentos: '' },
  // Step 5
  consumo_calorico: getConsumoCaloricoDefecto(),
  observaciones_caloricas: '',
  peso_max_kg: '', peso_min_kg: '', peso_usual_kg: '', peso_ideal_kg: '', peso_deseado_kg: '',
  peso_prequirurgico_kg: '', circunferencia_muneca_cm: '', contextura: '',
};

function NuevoPacienteWizard({ onClose, onCreado, defaultData = {} }) {
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const isEditing = !!defaultData.id; // Check if we are editing an existing patient

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
    trigger,
    getValues,
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schemas[currentStep]),
    defaultValues: {
      ...defaultValues,
      ...defaultData,
      // For recordatorio_tiempo: Ensure nested objects exist
      recordatorio_desayuno: { ...defaultValues.recordatorio_desayuno, ...defaultData.recordatorio_desayuno },
      recordatorio_merienda_am: { ...defaultValues.recordatorio_merienda_am, ...defaultData.recordatorio_merienda_am },
      recordatorio_almuerzo: { ...defaultValues.recordatorio_almuerzo, ...defaultData.recordatorio_almuerzo },
      recordatorio_merienda_pm: { ...defaultValues.recordatorio_merienda_pm, ...defaultData.recordatorio_merienda_pm },
      recordatorio_cena: { ...defaultValues.recordatorio_cena, ...defaultData.recordatorio_cena },
      recordatorio_merienda_noche: { ...defaultValues.recordatorio_merienda_noche, ...defaultData.recordatorio_merienda_noche },
      // For consumo_calorico: Merge default with fetched data
      consumo_calorico: defaultData.consumo_calorico && defaultData.consumo_calorico.length > 0
        ? defaultData.consumo_calorico
        : getConsumoCaloricoDefecto(),
    },
  });

  useEffect(() => {
    // Reset resolver when step changes
    control.unregister(); // Unregister fields from previous schema
    // `resolver` can be updated directly, no need to recreate useForm
    // This part is a bit tricky with useForm, but `trigger` and `formState.errors` will reflect current step's schema
  }, [currentStep, control]);

  // Watch fields for dynamic calculations/rendering
  const fechaNacimiento = useWatch({ control, name: 'fecha_nacimiento' });
  const sexo = useWatch({ control, name: 'sexo' });
  const dispepsiaChecked = useWatch({ control, name: 'dispepsia' });
  const distensionChecked = useWatch({ control, name: 'distension' });
  const aerofagiaChecked = useWatch({ control, name: 'aerofagia' });
  const meteorismoChecked = useWatch({ control, name: 'meteorismo' });
  const diarreaChecked = useWatch({ control, name: 'diarrea' });
  const nauseasChecked = useWatch({ control, name: 'nauseas' });
  const vomitosChecked = useWatch({ control, name: 'vomitos' });
  const rgefChecked = useWatch({ control, name: 'rgef' });
  const consumoCaloricoItems = useWatch({ control, name: 'consumo_calorico' });

  const age = calcularEdad(fechaNacimiento);
  const consumoCaloricoTotales = calcularTotalesConsumoCalorico(consumoCaloricoItems || []);

  const handleNext = async () => {
    const isValid = await trigger();
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      clearErrors(); // Clear root errors for next step
    } else {
      setError('root', { message: 'Por favor, corrige los errores en este paso.' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
    clearErrors(); // Clear root errors for next step
  };

  const handleImportExcelSuccess = (pacienteId) => {
    setShowImportExcel(false);
    addToast({ message: 'Paciente importado exitosamente!', type: 'success' });
    onCreado(pacienteId); // Navigate to patient detail
  };

  const handleImportExcelManual = (data) => {
    setShowImportExcel(false);
    reset({ ...getValues(), ...data }); // Fill form with extracted data
    addToast({ message: 'Datos cargados al formulario, por favor revísa.', type: 'info' });
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        user: {
          username: data.username,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || '',
        },
        cedula: data.cedula || '',
        telefono: data.telefono || '',
        fecha_nacimiento: data.fecha_nacimiento || null,
        lugar_nacimiento: data.lugar_nacimiento || '',
        sexo: data.sexo || '',
        estado_civil: data.estado_civil || '',
        direccion: data.direccion || '',
        religion: data.religion || '',
        grado_instruccion: data.grado_instruccion || '',
        ocupacion: data.ocupacion || '',
        referido_por: data.referido_por || '',
        historia_nro: data.historia_nro || '',
        consultorio: data.consultorio || '',
        fecha_consulta: data.fecha_consulta || null,
        motivo_consulta: data.motivo_consulta || '',
        antecedentes_personales: data.antecedentes_personales || '',
        menarquia_anios: data.menarquia_anios || null,
        fum_fecha: data.fum_fecha || null,
        embarazos_nro: data.embarazos_nro || null,
        edad_ultimo_embarazo: data.edad_ultimo_embarazo || null,
        antecedentes_familiares: data.antecedentes_familiares || '',
        cafeinicos_vdia: data.cafeinicos_vdia || null,
        alcohol_tipo: data.alcohol_tipo || '',
        tabaquicos_undia: data.tabaquicos_undia || null,
        sueno_hrdia: data.sueno_hrdia || null,
        apetito: data.apetito || '',
        micciones_vdia: data.micciones_vdia || null,
        evacuaciones_vdia: data.evacuaciones_vdia || null,
        actividad_fisica: data.actividad_fisica || '',
        dispepsia: data.dispepsia || false,
        dispepsia_causa: data.dispepsia_causa || '',
        distension: data.distension || false,
        distension_causa: data.distension_causa || '',
        aerofagia: data.aerofagia || false,
        aerofagia_causa: data.aerofagia_causa || '',
        flatulencia: data.flatulencia || '',
        meteorismo: data.meteorismo || false,
        meteorismo_causa: data.meteorismo_causa || '',
        diarrea: data.diarrea || false,
        diarrea_causa: data.diarrea_causa || '',
        nauseas: data.nauseas || false,
        nauseas_causa: data.nauseas_causa || '',
        vomitos: data.vomitos || false,
        vomitos_causa: data.vomitos_causa || '',
        rgef: data.rgef || false,
        rgef_causa: data.rgef_causa || '',
        alergias_intolerancias: data.alergias_intolerancias || '',
        estrenimiento: data.estrenimiento || '',
        tratamiento_farmacologico: data.tratamiento_farmacologico || '',
        suplemento_oral: data.suplemento_oral || '',
        otros_tratamientos: data.otros_tratamientos || '',
        recordatorio_desayuno: data.recordatorio_desayuno,
        recordatorio_merienda_am: data.recordatorio_merienda_am,
        recordatorio_almuerzo: data.recordatorio_almuerzo,
        recordatorio_merienda_pm: data.recordatorio_merienda_pm,
        recordatorio_cena: data.recordatorio_cena,
        recordatorio_merienda_noche: data.recordatorio_merienda_noche,
        consumo_calorico: data.consumo_calorico,
        observaciones_caloricas: data.observaciones_caloricas || '',
        peso_max_kg: data.peso_max_kg || null,
        peso_min_kg: data.peso_min_kg || null,
        peso_usual_kg: data.peso_usual_kg || null,
        peso_ideal_kg: data.peso_ideal_kg || null,
        peso_deseado_kg: data.peso_deseado_kg || null,
        peso_prequirurgico_kg: data.peso_prequirurgico_kg || null,
        circunferencia_muneca_cm: data.circunferencia_muneca_cm || null,
        contextura: data.contextura || '',
      };

      let response;
      if (isEditing) {
        response = await pacientesApi.update(defaultData.id, payload); // Assuming patient ID is part of defaultData
        addToast({ message: 'Expediente actualizado exitosamente', type: 'success' });
      } else {
        response = await pacientesApi.create(payload);
        addToast({ message: 'Paciente creado exitosamente', type: 'success' });
      }
      onCreado(response.id || response.paciente.id); // Pass new patient ID for navigation
    } catch (err) {
      setError('root', { message: err.message || 'Error al guardar el expediente. Verifica los datos.' });
      addToast({ message: 'Error al guardar expediente', type: 'error' });
    }
  };

  const steps = [
    { name: 'Datos Personales', icon: User },
    { name: 'Antecedentes', icon: Clipboard },
    { name: 'Hábitos y Trastornos', icon: Activity },
    { name: 'Recordatorio 24h', icon: Clock },
    { name: 'Consumo Calórico', icon: Table },
  ];

  return (
    <div className="na-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="na-modal" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div
          className="na-modal-header"
          style={{ background: 'linear-gradient(135deg, var(--accent-green), #52B788)' }}
        >
          <div>
            <p className="na-modal-subtitle">{isEditing ? 'Edición' : 'Registro'}</p>
            <h2 className="na-modal-title">{isEditing ? 'Editar Expediente' : 'Nuevo Paciente'}</h2>
          </div>
          <button className="na-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-gray-100 p-4 border-b border-gray-200">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center flex-1 ${
                  index === currentStep ? 'text-accent-green' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors duration-300 ${
                    index === currentStep
                      ? 'bg-accent-green text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <step.icon size={16} />
                </div>
                <span className="text-center">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          <form id="form-nuevo-paciente-wizard" onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Datos Personales */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isEditing && ( // Only show import for new patient creation
                  <div className="md:col-span-2 flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => setShowImportExcel(true)}
                      className="px-4 py-2 bg-gradient-to-r from-accent-green-dark to-accent-green text-white font-semibold rounded-md hover:from-accent-green-darker hover:to-accent-green-dark focus:outline-none focus:ring-2 focus:ring-accent-green flex items-center gap-2"
                    >
                      <FileText size={16} /> Importar desde Excel
                    </button>
                  </div>
                )}

                <Field label="Consultorio" name="consultorio" register={register} errors={errors} />
                <Field label="Historia Nro." name="historia_nro" register={register} errors={errors} />
                <Field
                  label="Fecha de Consulta"
                  name="fecha_consulta"
                  type="date"
                  register={register}
                  errors={errors}
                />
                <div /> {/* Spacer */}
                <Field label="Nombre *" name="first_name" register={register} errors={errors} />
                <Field label="Apellido *" name="last_name" register={register} errors={errors} />
                <Field label="Cédula *" name="cedula" register={register} errors={errors} />
                <Field
                  label="Fecha de Nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  register={register}
                  errors={errors}
                />
                <Field label="Edad (años)" name="edad_calculada" readOnly value={age} />
                <Field label="Lugar de Nacimiento" name="lugar_nacimiento" register={register} errors={errors} />
                <Field label="Sexo" name="sexo" register={register} errors={errors}>
                  <select {...register('sexo')} style={F.select}>
                    <option value="">— Seleccionar —</option>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="O">Otro</option>
                  </select>
                </Field>
                <Field label="Estado Civil" name="estado_civil" register={register} errors={errors}>
                  <select {...register('estado_civil')} style={F.select}>
                    <option value="">— Seleccionar —</option>
                    <option value="S">Soltero/a</option>
                    <option value="C">Casado/a</option>
                    <option value="D">Divorciado/a</option>
                    <option value="V">Viudo/a</option>
                    <option value="U">Unión libre</option>
                  </select>
                </Field>
                <Field label="Dirección" name="direccion" register={register} errors={errors} fullWidth type="textarea" />
                <Field label="Religión" name="religion" register={register} errors={errors} />
                <Field label="Grado de Instrucción" name="grado_instruccion" register={register} errors={errors} />
                <Field label="Ocupación" name="ocupacion" register={register} errors={errors} />
                <Field label="Teléfono" name="telefono" register={register} errors={errors} />
                <Field label="Email *" name="email" type="email" register={register} errors={errors} />
                <Field label="Referido por" name="referido_por" register={register} errors={errors} />

                {!isEditing && ( // Only show password for new patient creation
                  <>
                    <hr className="md:col-span-2 my-2 border-gray-200" />
                    <h3 className="md:col-span-2 text-md font-semibold text-gray-700 mb-2">Acceso al Sistema</h3>
                    <Field label="Usuario *" name="username" register={register} errors={errors} />
                    <Field label="Contraseña *" name="password" type="password" register={register} errors={errors} />
                  </>
                )}
              </div>
            )}

            {/* Step 2: Antecedentes */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Motivo de Consulta" name="motivo_consulta" register={register} errors={errors} fullWidth type="textarea" />
                <Field label="Antecedentes Personales" name="antecedentes_personales" register={register} errors={errors} fullWidth type="textarea" />

                {(sexo === 'F' || !sexo) && ( // Show obstetric history only for females or if not defined
                  <>
                    <hr className="md:col-span-2 my-2 border-gray-200" />
                    <h3 className="md:col-span-2 text-md font-semibold text-gray-700 mb-2">Antecedentes Obstétricos</h3>
                    <Field label="Menarquía (años)" name="menarquia_anios" type="number" register={register} errors={errors} />
                    <Field label="FUM (Fecha última menstruación)" name="fum_fecha" type="date" register={register} errors={errors} />
                    <Field label="Número de Embarazos" name="embarazos_nro" type="number" register={register} errors={errors} />
                    <Field label="Edad Último Embarazo" name="edad_ultimo_embarazo" type="number" register={register} errors={errors} />
                  </>
                )}
                <Field label="Antecedentes Familiares" name="antecedentes_familiares" register={register} errors={errors} fullWidth type="textarea" />
              </div>
            )}

            {/* Step 3: Hábitos y Trastornos */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h3 className="md:col-span-2 text-md font-semibold text-gray-700 mb-2">Hábitos Psicobiológicos</h3>
                <Field label="Cafeínicos (v/día)" name="cafeinicos_vdia" type="number" register={register} errors={errors} />
                <Field label="Alcohol" name="alcohol_tipo" register={register} errors={errors}>
                  <select {...register('alcohol_tipo')} style={F.select}>
                    <option value="">— Seleccionar —</option>
                    <option value="OC">Ocasional</option>
                    <option value="FRECUENTE">Frecuente</option>
                    <option value="DIARIO">Diario</option>
                  </select>
                </Field>
                <Field label="Tabáquicos (und/día)" name="tabaquicos_undia" type="number" register={register} errors={errors} />
                <Field label="Sueño (hr/día)" name="sueno_hrdia" type="number" register={register} errors={errors} />
                <Field label="Apetito" name="apetito" register={register} errors={errors}>
                  <select {...register('apetito')} style={F.select}>
                    <option value="">— Seleccionar —</option>
                    <option value="NORMAL">Normal</option>
                    <option value="AUMENTADO">Aumentado</option>
                    <option value="DISMINUIDO">Disminuido</option>
                  </select>
                </Field>
                <Field label="Micciones (v/día)" name="micciones_vdia" type="number" register={register} errors={errors} />
                <Field label="Evacuaciones (v/día)" name="evacuaciones_vdia" type="number" register={register} errors={errors} />
                <Field label="Actividad Física" name="actividad_fisica" register={register} errors={errors} fullWidth type="textarea" />

                <h3 className="md:col-span-2 text-md font-semibold text-gray-700 mt-4 mb-2">Trastornos Gastrointestinales</h3>
                <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('dispepsia')} className="form-checkbox" /> Dispepsia
                  </label>
                  {dispepsiaChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="dispepsia_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('distension')} className="form-checkbox" /> Distensión
                  </label>
                  {distensionChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="distension_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('aerofagia')} className="form-checkbox" /> Aerofagia
                  </label>
                  {aerofagiaChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="aerofagia_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Flatulencia (describe)" name="flatulencia" register={register} errors={errors} fullWidth>
                      <input type="text" {...register('flatulencia')} style={F.input} placeholder="Ej: Granos, legumbres..." />
                    </Field>
                  </div>
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('meteorismo')} className="form-checkbox" /> Meteorismo
                  </label>
                  {meteorismoChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="meteorismo_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('diarrea')} className="form-checkbox" /> Diarrea
                  </label>
                  {diarreaChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="diarrea_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('nauseas')} className="form-checkbox" /> Náuseas
                  </label>
                  {nauseasChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="nauseas_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('vomitos')} className="form-checkbox" /> Vómitos
                  </label>
                  {vomitosChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="vomitos_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                  <label style={F.checkboxOption}>
                    <input type="checkbox" {...register('rgef')} className="form-checkbox" /> R.GEF
                  </label>
                  {rgefChecked && (
                    <div style={{ marginLeft: 24, transition: 'all 0.2s' }}>
                      <Field label="Describe la causa..." name="rgef_causa" register={register} errors={errors} type="textarea" />
                    </div>
                  )}
                </div>
                <Field label="Alergias/Intolerancias Alimentarias" name="alergias_intolerancias" register={register} errors={errors} fullWidth type="textarea" />
                <div className="md:col-span-2">
                  <label style={F.label}>Estreñimiento</label>
                  <div style={F.radioGroup}>
                    {['NO', 'LEVE', 'MODERADO', 'CRONICO'].map((option) => (
                      <label key={option} style={F.radioOption}>
                        <input type="radio" {...register('estrenimiento')} value={option} className="form-radio" /> {option}
                      </label>
                    ))}
                  </div>
                  <FieldError error={errors.estrenimiento} />
                </div>

                <h3 className="md:col-span-2 text-md font-semibold text-gray-700 mt-4 mb-2">Tratamientos</h3>
                <Field label="Farmacológico" name="tratamiento_farmacologico" register={register} errors={errors} fullWidth type="textarea" />
                <Field label="Suplemento Oral" name="suplemento_oral" register={register} errors={errors} fullWidth type="textarea" />
                <Field label="Otros Tratamientos" name="otros_tratamientos" register={register} errors={errors} fullWidth type="textarea" />
              </div>
            )}

            {/* Step 4: Recordatorio 24h */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 gap-6">
                {['desayuno', 'merienda_am', 'almuerzo', 'merienda_pm', 'cena', 'merienda_noche'].map((time, index) => (
                  <div key={time} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-700 mb-3 capitalize flex items-center gap-2">
                      <Clock size={16} /> {time.replace('_', ' ')}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Hora" name={`recordatorio_${time}.hora`} type="number" register={register} errors={errors} min="1" max="12" />
                      <Field label="AM/PM" name={`recordatorio_${time}.am_pm`} register={register} errors={errors}>
                        <select {...register(`recordatorio_${time}.am_pm`)} style={F.select}>
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </Field>
                      <div className="col-span-3">
                        <Field
                          label="Descripción de Alimentos"
                          name={`recordatorio_${time}.descripcion_alimentos`}
                          type="textarea"
                          register={register}
                          errors={errors}
                          placeholder="Ej: Huevo revuelto, arepa, jugo de naranja..."
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Consumo Calórico y Evaluación Objetiva */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Consumo Calórico Diario</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alimento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P(g)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">G(g)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CHO(g)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KCAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {consumoCaloricoItems.map((item, index) => (
                        <tr key={item.grupo}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                          <td className="px-4 py-1">
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                              {...register(`consumo_calorico.${index}.intercambios`)}
                            />
                            <FieldError error={errors.consumo_calorico?.[index]?.intercambios} />
                          </td>
                          <td className="px-4 py-1">
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                              {...register(`consumo_calorico.${index}.proteinas_g`)}
                            />
                            <FieldError error={errors.consumo_calorico?.[index]?.proteinas_g} />
                          </td>
                          <td className="px-4 py-1">
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                              {...register(`consumo_calorico.${index}.grasas_g`)}
                            />
                            <FieldError error={errors.consumo_calorico?.[index]?.grasas_g} />
                          </td>
                          <td className="px-4 py-1">
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                              {...register(`consumo_calorico.${index}.cho_g`)}
                            />
                            <FieldError error={errors.consumo_calorico?.[index]?.cho_g} />
                          </td>
                          <td className="px-4 py-1">
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                              {...register(`consumo_calorico.${index}.kcal`)}
                            />
                            <FieldError error={errors.consumo_calorico?.[index]?.kcal} />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{consumoCaloricoTotales.intercambios.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{consumoCaloricoTotales.proteinas_g.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{consumoCaloricoTotales.grasas_g.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{consumoCaloricoTotales.cho_g.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{consumoCaloricoTotales.kcal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Field label="Observaciones Calóricas" name="observaciones_caloricas" register={register} errors={errors} fullWidth type="textarea" />

                <h3 className="text-md font-semibold text-gray-700 mt-4 mb-2">Evaluación Objetiva</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Peso Máximo (kg)" name="peso_max_kg" type="number" register={register} errors={errors} />
                  <Field label="Peso Mínimo (kg)" name="peso_min_kg" type="number" register={register} errors={errors} />
                  <Field label="Peso Usual (kg)" name="peso_usual_kg" type="number" register={register} errors={errors} />
                  <Field label="Peso Ideal (kg)" name="peso_ideal_kg" type="number" register={register} errors={errors} />
                  <Field label="Peso Deseado (kg)" name="peso_deseado_kg" type="number" register={register} errors={errors} />
                  <Field label="Peso P-PQx (kg)" name="peso_prequirurgico_kg" type="number" register={register} errors={errors} />
                  <Field label="Circunferencia Muñeca (cm)" name="circunferencia_muneca_cm" type="number" register={register} errors={errors} />
                  <Field label="Contextura" name="contextura" register={register} errors={errors}>
                    <select {...register('contextura')} style={F.select}>
                      <option value="">— Seleccionar —</option>
                      <option value="PEQUENA">Pequeña</option>
                      <option value="MEDIANA">Mediana</option>
                      <option value="GRANDE">Grande</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="na-modal-footer">
          {errors.root && (
            <p style={{ fontSize: 12, color: 'var(--accent-coral)' }}>{errors.root.message}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                }}
              >
                Anterior
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="na-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                form="form-nuevo-paciente-wizard"
                disabled={isSubmitting}
                className="na-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid #fff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                      }}
                    />
                    Guardando...
                  </>
                ) : (
                  <>
                    <UserCheck size={15} />
                    {isEditing ? 'Actualizar Expediente' : 'Crear Paciente'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {showImportExcel && (
        <ImportarExcel
          onSuccess={handleImportExcelSuccess}
          onManual={handleImportExcelManual}
          onClose={() => setShowImportExcel(false)}
        />
      )}
    </div>
  );
}

NuevoPacienteWizard.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreado: PropTypes.func.isRequired,
  defaultData: PropTypes.object, // For editing
};

export default NuevoPacienteWizard;
