import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api/client';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
});

export default function RecuperarPasswordView() {
  const [enviado, setEnviado] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/password-reset/', { email });
      setEnviado(true);
    } catch (error) {
      // No revelar si el email existe, siempre mostrar mensaje de éxito
      setEnviado(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-green-700 text-center mb-1">Recuperar Contraseña</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Ingresa tu email para recibir un enlace de recuperación
        </p>

        {enviado ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800 font-medium mb-1">✓ Enlace enviado</p>
              <p className="text-xs text-green-700">
                Si el email existe en nuestro sistema, recibirás un enlace de recuperación en breve.
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                autoFocus
                placeholder="correo@ejemplo.com"
                {...register('email')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <Link
              to="/login"
              className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
            >
              ← Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
