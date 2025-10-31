/**
 * COMPONENTE: PasswordModal
 *
 * PROPÓSITO:
 * Modal para ingresar contraseña al seleccionar un participante.
 * Maneja la validación de contraseña y el proceso de login.
 *
 * PROPS:
 * - isOpen: Si el modal está abierto
 * - participant: Participante seleccionado
 * - password: Contraseña ingresada
 * - loggingIn: Estado de carga durante el login
 * - onPasswordChange: Callback cuando cambia la contraseña
 * - onConfirm: Callback para confirmar login
 * - onCancel: Callback para cancelar
 */

"use client";

import Image from "next/image";
import { PasswordModalProps } from "@/types";

export default function PasswordModal({
  isOpen,
  participant,
  password,
  loggingIn,
  onPasswordChange,
  onConfirm,
  onCancel,
  loginError,
}: PasswordModalProps) {
  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar del participante */}
          {participant.team_logo ? (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-gray-200 flex-shrink-0">
              <Image
                src={`/assets/${participant.team_logo}`}
                alt={participant.teamName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2882] to-[#37003c] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {participant.teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{participant.teamName}</h3>
            <p className="text-sm text-gray-600">{participant.name}</p>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onConfirm();
              }
            }}
            placeholder="Ingresá la contraseña"
            aria-invalid={!!loginError}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              loginError
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                : 'border-gray-300 focus:ring-[#953bff] focus:border-transparent'
            }`}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">Contraseña por defecto: 123456</p>
        </div>

        {loginError && (
          <div role="alert" aria-live="polite" className="text-red-600 text-xs mb-3">
            {loginError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loggingIn || !password.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#953bff] to-[#02efff] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loggingIn ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  );
}


