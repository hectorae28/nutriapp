import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function ImportarExcel({ onSuccess, onClose }) {
  const [archivo, setArchivo] = useState(null);
  const [estado, setEstado] = useState('idle'); // idle | uploading | preview | error
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const { addToast } = useToast();
  const showToast = (message, type = 'info') => addToast({ message, type });

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx'].includes(ext)) {
      setError('Solo se aceptan archivos .xls o .xlsx');
      setArchivo(null);
      return;
    }
    setArchivo(file);
    setError('');
  };

  const procesar = async () => {
    if (!archivo) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }
    setEstado('uploading');
    setError(''); // Limpiar errores previos
    const formData = new FormData();
    formData.append('archivo', archivo);
    try {
      const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
      const resp = await fetch('/api/pacientes/importar-excel/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!resp.ok) {
        let errorMessage = `Error ${resp.status}`;
        try {
            const errorData = await resp.json();
            errorMessage = errorData.error || errorData.detail || JSON.stringify(errorData);
        } catch (jsonError) {
            // No se pudo parsear el JSON de error, usar el status
            errorMessage = `Error ${resp.status}: ${resp.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await resp.json();
      setResultado(data);
      setEstado('preview');
      showToast('Archivo Excel importado con éxito', 'success');
    } catch (e) {
      setError(e.message || 'Error desconocido al procesar el archivo.');
      setEstado('error');
      showToast('Error al importar Excel: ' + (e.message || 'Error desconocido'), 'error');
    }
  };

  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const cardStyle = { background: '#fff', borderRadius: 12, padding: 24, maxWidth: 480, width: '100%', margin: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📂 Importar Historia desde Excel</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}>×</button>
        </div>

        {estado === 'idle' && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current.click()}
              style={{ border: `2px dashed ${dragging ? '#16a34a' : '#d1d5db'}`, borderRadius: 10, padding: 32, textAlign: 'center', cursor: 'pointer', background: dragging ? '#f0fdf4' : '#fafafa', transition: 'all 0.2s' }}
            >
              <Upload size={32} color={dragging ? '#16a34a' : '#9ca3af'} style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: 14 }}>{archivo ? archivo.name : 'Arrastra tu archivo .xls aquí'}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>o haz clic para seleccionar</p>
              <input ref={inputRef} type="file" accept=".xls,.xlsx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</p>}
            {archivo && (
              <button onClick={procesar} style={{ marginTop: 14, width: '100%', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ✓ Procesar archivo
              </button>
            )}
          </>
        )}

        {estado === 'uploading' && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#374151', fontWeight: 600 }}>Procesando archivo Excel...</p>
            <p style={{ color: '#6b7280', fontSize: 13 }}>Extrayendo datos de la historia nutricional</p>
          </div>
        )}

        {estado === 'preview' && resultado && (
          <>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <CheckCircle size={18} color="#16a34a" />
                <span style={{ fontWeight: 700, color: '#15803d' }}>Importación exitosa</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#374151' }}>👤 <strong>{resultado.paciente_nombre}</strong></p>
              <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>📊 {resultado.campos_extraidos} campos extraídos</p>
            </div>
            {resultado.advertencias?.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>Advertencias ({resultado.advertencias.length})</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {resultado.advertencias.map((a, i) => <li key={i} style={{ fontSize: 12, color: '#92400e', marginBottom: 2 }}>{a}</li>)}
                </ul>
              </div>
            )}
            <button onClick={() => onSuccess(resultado.paciente_id)} style={{ width: '100%', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 8 }}>
              → Ver expediente del paciente
            </button>
            <button onClick={() => { setEstado('idle'); setArchivo(null); setResultado(null); }} style={{ width: '100%', padding: '8px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
              Importar otro archivo
            </button>
          </>
        )}

        {estado === 'error' && (
          <>
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>❌ Error al procesar el archivo</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7f1d1d' }}>{error}</p>
            </div>
            <button onClick={() => { setEstado('idle'); setError(''); }} style={{ width: '100%', padding: '8px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Intentar de nuevo
            </button>
          </>
        )}
      </div>
    </div>
  );
}