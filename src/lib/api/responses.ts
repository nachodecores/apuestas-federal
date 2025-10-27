/**
 * RESPUESTAS ESTANDARIZADAS DE API
 * 
 * Este archivo contiene funciones helper para generar respuestas
 * consistentes en todos los endpoints de la API.
 * 
 * BENEFICIOS:
 * - Respuestas consistentes en toda la API
 * - Menos código repetitivo
 * - Fácil de mantener y actualizar
 */

import { NextResponse } from 'next/server';

/**
 * Respuesta de éxito genérica
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json({
    success: true,
    ...data
  }, { status });
}

/**
 * Respuesta de error genérica
 */
export function errorResponse(message: string, status: number = 500, details?: any) {
  return NextResponse.json({
    success: false,
    error: message,
    ...(details && { details })
  }, { status });
}

/**
 * Respuesta de error de autenticación (401)
 */
export function unauthorizedResponse(message: string = 'No autorizado') {
  return errorResponse(message, 401);
}

/**
 * Respuesta de error de permisos (403)
 */
export function forbiddenResponse(message: string = 'No tienes permisos para realizar esta acción') {
  return errorResponse(message, 403);
}

/**
 * Respuesta de error de validación (400)
 */
export function badRequestResponse(message: string, details?: any) {
  return errorResponse(message, 400, details);
}

/**
 * Respuesta de recurso no encontrado (404)
 */
export function notFoundResponse(message: string = 'Recurso no encontrado') {
  return errorResponse(message, 404);
}

