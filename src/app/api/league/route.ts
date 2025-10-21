// API Route: Este archivo corre en el SERVIDOR (Node.js), no en el navegador
// Por eso puede hacer requests a cualquier API sin problemas de CORS

import { NextResponse } from 'next/server';
import { getGameweekOdds } from '@/lib/odds/odds-calculator';

// GET /api/league
// Esta función se ejecuta cuando alguien hace un request a /api/league
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameweek = searchParams.get('gameweek');
    const upcoming = searchParams.get('upcoming');
    
    // 1. Desde el servidor de Next.js, llamamos a la API de Draft FPL
    const response = await fetch('https://draft.premierleague.com/api/league/1651/details');
    
    // 2. Verificamos que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error('Error al obtener datos de la liga');
    }
    
    // 3. Obtenemos los datos en formato JSON
    const data = await response.json();
    
    // 4. OPTIMIZACIÓN: Si se solicitan solo próximos partidos
    if (upcoming === 'true') {
      
      // Filtrar solo partidos próximos
      const upcomingMatches = data.matches.filter((match: any) => !match.finished);
      
      if (upcomingMatches.length === 0) {
        return NextResponse.json({
          error: 'No hay partidos próximos'
        }, { status: 404 });
      }
      
      const nextGW = upcomingMatches[0].event;
      const nextGWMatches = upcomingMatches.filter((match: any) => match.event === nextGW);
      
      // Obtener solo los equipos que participan en los próximos partidos
      const participatingTeamIds = new Set();
      nextGWMatches.forEach((match: any) => {
        participatingTeamIds.add(match.league_entry_1);
        participatingTeamIds.add(match.league_entry_2);
      });
      
      const relevantEntries = data.league_entries.filter((entry: any) => 
        participatingTeamIds.has(entry.id)
      );
      
      // Obtener odds pre-calculadas
      let gameweekOdds = null;
      try {
        gameweekOdds = await getGameweekOdds(nextGW);
      } catch (oddsError) {
        console.warn('⚠️ Error obteniendo odds:', oddsError);
      }
      
      // Devolver solo los datos necesarios (reducción de ~95% en payload)
      const optimizedData = {
        gameweek: nextGW,
        matches: nextGWMatches, // Solo 5 partidos en lugar de 190
        league_entries: relevantEntries, // Solo equipos relevantes
        standings: data.standings, // Mantener standings para compatibilidad
        gameweek_odds: gameweekOdds
      };
      
      return NextResponse.json(optimizedData);
    }
    
    // 5. Verificar si se solicitan odds para un gameweek específico
    if (gameweek) {
      try {
        // Obtener odds pre-calculadas para el gameweek
        const odds = await getGameweekOdds(parseInt(gameweek));
        
        if (odds) {
          // Agregar odds a la respuesta
          return NextResponse.json({
            ...data,
            gameweek_odds: odds
          });
        } else {
          // Si no hay odds pre-calculadas, devolver datos sin odds
          console.warn(`⚠️ No se encontraron odds pre-calculadas para GW${gameweek}`);
          return NextResponse.json({
            ...data,
            gameweek_odds: null
          });
        }
      } catch (oddsError) {
        console.error('Error obteniendo odds:', oddsError);
        // Continuar sin odds si hay error
        return NextResponse.json({
          ...data,
          gameweek_odds: null
        });
      }
    }
    
    // 6. Devolvemos los datos completos al cliente (navegador)
    // NextResponse.json() automáticamente agrega los headers de CORS necesarios
    return NextResponse.json(data);
    
  } catch (error) {
    // Si hay error, devolvemos un error 500
    console.error('Error en API route:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la liga' },
      { status: 500 }
    );
  }
}

