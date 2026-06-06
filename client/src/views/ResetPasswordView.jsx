import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api/client';

const schema = yup.object({
  new_password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Contraseña requerida'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('new_password'), null], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

export default function ResetPasswordView() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ new_password }) => {
    try {
      await api.post('/auth/password-reset-confirm/', {
        uidb64,
        token,
        new_password,
      });
      // Redirigir al login con mensaje de éxito
      navigate('/login', {
        state: { message: 'Contraseña actualizada. Puedes iniciar sesión.' },
      });
    } catch (err) {
      setError('El enlace es inválido o ha expirado. Solicita uno nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-green-700 text-center mb-1">Nueva Contraseña</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Ingresa tu nueva contraseña
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              autoFocus
              {...register('new_password')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.new_password && (
              <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              {...register('confirm_password')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
