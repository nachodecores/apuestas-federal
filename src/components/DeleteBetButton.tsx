"use client";

import { useState } from "react";
import { DeleteBetButtonProps } from "@/types";

export default function DeleteBetButton({
  betId,
  userId,
  onDeleteSuccess,
  onDeleteError,
  size = 'md',
  variant = 'icon',
  className = ''
}: DeleteBetButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm('¿Eliminar esta apuesta?');
    if (!ok) return;
    setIsDeleting(true);

    try {
      const response = await fetch('/api/bets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar la apuesta');
      }

      // Dispatch custom event for MatchCard to listen
      const betDeletedEvent = new CustomEvent('betDeleted', {
        detail: {
          betId,
          refundAmount: result.refundAmount
        }
      });
      window.dispatchEvent(betDeletedEvent);

      // Call success callback
      onDeleteSuccess?.(betId, result.refundAmount);

      // Apuesta eliminada exitosamente

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al eliminar apuesta:', error);
      
      // Call error callback
      onDeleteError?.(errorMessage);
      
      // Error eliminado - solo se loguea en consola
    } finally {
      setIsDeleting(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-base',
    md: 'w-8 h-8 text-lg',
    lg: 'w-10 h-10 text-xl'
  };

  // Variant styles
  const variantStyles = {
    icon: 'rounded-lg hover:opacity-80 transition-opacity flex items-center justify-center font-bold',
    button: 'px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors text-sm font-medium'
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`${sizeClasses[size]} ${variantStyles[variant]} ${className} ${
          isDeleting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Eliminar apuesta"
      >
        <span style={{ color: 'rgb(55, 0, 60)' }}>{isDeleting ? '...' : '×'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`${variantStyles[variant]} ${className} ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isDeleting ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}
