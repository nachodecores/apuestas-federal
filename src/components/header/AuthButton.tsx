/**
 * COMPONENTE: AuthButton
 *
 * PROPÓSITO:
 * Botón de "Iniciar sesión" con dropdown de participantes para usuarios no autenticados.
 * Maneja la selección de usuario y apertura del modal de contraseña.
 *
 * PROPS:
 * - participants: Array de participantes disponibles
 * - loggingIn: Estado de carga durante el login
 * - onSelectUser: Callback cuando se selecciona un participante
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { AuthButtonProps } from "@/types";

export default function AuthButton({
  participants,
  loggingIn,
  onSelectUser,
}: AuthButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loggingIn}
        className="px-3 py-1.5 text-sm rounded-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.75)', 
          color: 'rgb(55, 0, 60)' 
        }}
      >
        {loggingIn ? "Ingresando..." : "Iniciar sesión"}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[9999]"
          style={{ display: 'block' }}
        >
          <div className="max-h-[70vh] overflow-y-auto">
            {participants.map((participant, index) => (
              <div key={participant.fpl_entry_id}>
                <button
                  onClick={() => {
                    onSelectUser(participant);
                    setShowDropdown(false);
                  }}
                  disabled={loggingIn}
                  className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{participant.teamName}</div>
                    <div className="text-xs text-gray-500 truncate">{participant.name}</div>
                  </div>
                  <div className="text-[#00ff87] opacity-0 group-hover:opacity-100 transition-opacity text-lg ml-3">
                    →
                  </div>
                </button>
                {index < participants.length - 1 && (
                  <div className="mx-4 border-b border-gray-100"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


