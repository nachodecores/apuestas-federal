-- Tabla para almacenar odds pre-calculadas por gameweek
CREATE TABLE IF NOT EXISTS gameweek_odds (
  id SERIAL PRIMARY KEY,
  gameweek INTEGER NOT NULL,
  league_entry_1 INTEGER NOT NULL,
  league_entry_2 INTEGER NOT NULL,
  home_odds DECIMAL(4,2) NOT NULL,
  draw_odds DECIMAL(4,2) NOT NULL,
  away_odds DECIMAL(4,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Índices para optimizar consultas
  UNIQUE(gameweek, league_entry_1, league_entry_2),
  INDEX idx_gameweek_active (gameweek, is_active),
  INDEX idx_league_entries (league_entry_1, league_entry_2)
);

-- Comentarios para documentación
COMMENT ON TABLE gameweek_odds IS 'Odds pre-calculadas para cada gameweek, calculadas cuando se cierra la fecha anterior';
COMMENT ON COLUMN gameweek_odds.gameweek IS 'Número del gameweek';
COMMENT ON COLUMN gameweek_odds.league_entry_1 IS 'ID del equipo local';
COMMENT ON COLUMN gameweek_odds.league_entry_2 IS 'ID del equipo visitante';
COMMENT ON COLUMN gameweek_odds.home_odds IS 'Odds para victoria del equipo local';
COMMENT ON COLUMN gameweek_odds.draw_odds IS 'Odds para empate';
COMMENT ON COLUMN gameweek_odds.away_odds IS 'Odds para victoria del equipo visitante';
COMMENT ON COLUMN gameweek_odds.calculated_at IS 'Timestamp cuando se calcularon las odds';
COMMENT ON COLUMN gameweek_odds.is_active IS 'Si las odds están activas (no han sido reemplazadas)';
