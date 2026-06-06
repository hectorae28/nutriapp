// client/src/api/documentos.js

const BASE_URL = '/api';

function getCookie(name) {
  return (
    document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.split('=')?.[1] ?? ''
  );
}

/**
 * Generar documento y descargar PDF directamente
 * @param {number} pacienteId - ID del paciente
 * @param {string} tipo - Tipo de documento: "receta" | "orden_laboratorio" | "orden_imagenologia" | "constancia"
 * @param {object} contenido - Contenido del documento según tipo
 * @returns {Promise<{blob: Blob, documentoId: string}>}
 */
export async function generarDocumento(pacienteId, tipo, contenido) {
  const response = await fetch(`${BASE_URL}/documentos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
    },
    credentials: 'include',
    body: JSON.stringify({ paciente: pacienteId, tipo, contenido }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al generar el documento');
  }
  const blob = await response.blob();
  const documentoId = response.headers.get('X-Documento-Id');
  return { blob, documentoId };
}

/**
 * Descargar PDF de un documento existente
 * @param {number} documentoId - ID del documento
 * @returns {Promise<Blob>}
 */
export async function descargarPDF(documentoId) {
  const response = await fetch(`${BASE_URL}/documentos/${documentoId}/pdf/`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error al descargar PDF');
  return await response.blob();
}

/**
 * Listar documentos de un paciente
 * @param {number} pacienteId - ID del paciente
 * @returns {Promise<Array>}
 */
export async function listarDocumentos(pacienteId) {
  const response = await fetch(`${BASE_URL}/documentos/?paciente=${pacienteId}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error al cargar documentos');
  return await response.json();
}

/**
 * Función helper para trigger de descarga desde blob
 * @param {Blob} blob - Blob del archivo
 * @param {string} filename - Nombre del archivo
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const documentosApi = {
  generar: generarDocumento,
  descargar: descargarPDF,
  listar: listarDocumentos,
  triggerDownload,
};
