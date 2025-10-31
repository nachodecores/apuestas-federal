/**
 * COMPONENTE: ChangePasswordModal
 *
 * PROPÓSITO:
 * Modal secundario para cambiar la contraseña del usuario.
 * Se muestra sobre el DashboardModal.
 *
 * PROPS:
 * - isOpen: Si el modal está visible
 * - onClose: Función para cerrar el modal
 */

"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { ChangePasswordModalProps } from "@/types";

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setChangingPassword(true);

    try {
      // Validaciones
      if (newPassword !== confirmNewPassword) {
        setPasswordError("The passwords do not match");
        setChangingPassword(false);
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError(
          "The new password must be at least 6 characters",
        );
        setChangingPassword(false);
        return;
      }

      // Cambiar contraseña en Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error changing password:", error);
        throw error;
      }

      if (!data.user) {
        console.error("No user was updated");
        throw new Error("Error: No se pudo actualizar el usuario");
      }

      // Éxito
      alert("Password changed successfully!");
      onClose();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Error changing password:", error);

      let errorMessage = "Error al cambiar contraseña";

      if (error instanceof Error) {
        // Mensajes de error más específicos y amigables
        if (error.message.includes("Password should be at least")) {
          errorMessage =
            "La contraseña debe tener al menos 6 caracteres (requerido por Supabase)";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage =
            "Credenciales inválidas. Por favor, volvé a iniciar sesión.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email no confirmado. Contactá al administrador.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage =
            "Demasiados intentos. Esperá unos minutos e intentá de nuevo.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setPasswordError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Change password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff2882]"
              placeholder="Your current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff2882]"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff2882]"
              placeholder="Repeat the new password (minimum 6 characters)"
            />
          </div>

          {passwordError && (
            <div className="text-red-500 text-sm">{passwordError}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changingPassword}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "rgb(150, 60, 255)" }}
            >
              {changingPassword ? "Changing..." : "Change"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

