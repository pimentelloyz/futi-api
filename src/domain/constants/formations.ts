/**
 * Formações táticas disponíveis por modalidade
 */

export type MatchFormat = 'FUTSAL' | 'FUT7' | 'FUT11';

export interface FormationPosition {
  position: string; // GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
  label: string;
  x: number; // Posição no campo (0-100)
  y: number; // Posição no campo (0-100)
}

export interface Formation {
  id: string;
  name: string;
  format: MatchFormat;
  totalPlayers: number;
  positions: FormationPosition[];
}

// ===================== FUTSAL (5 jogadores) =====================

export const FUTSAL_FORMATIONS: Formation[] = [
  {
    id: 'futsal-2-2',
    name: '2-2 (Quadrado)',
    format: 'FUTSAL',
    totalPlayers: 5,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 10 },
      { position: 'LB', label: 'Fixo Esquerdo', x: 30, y: 40 },
      { position: 'RB', label: 'Fixo Direito', x: 70, y: 40 },
      { position: 'LW', label: 'Ala Esquerdo', x: 30, y: 75 },
      { position: 'RW', label: 'Ala Direito', x: 70, y: 75 },
    ],
  },
  {
    id: 'futsal-3-1',
    name: '3-1 (Pirâmide)',
    format: 'FUTSAL',
    totalPlayers: 5,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 10 },
      { position: 'CB', label: 'Fixo', x: 50, y: 35 },
      { position: 'LW', label: 'Ala Esquerdo', x: 25, y: 60 },
      { position: 'RW', label: 'Ala Direito', x: 75, y: 60 },
      { position: 'ST', label: 'Pivô', x: 50, y: 85 },
    ],
  },
  {
    id: 'futsal-1-2-1',
    name: '1-2-1 (Losango)',
    format: 'FUTSAL',
    totalPlayers: 5,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 10 },
      { position: 'CB', label: 'Fixo', x: 50, y: 30 },
      { position: 'LCM', label: 'Ala Esquerdo', x: 35, y: 55 },
      { position: 'RCM', label: 'Ala Direito', x: 65, y: 55 },
      { position: 'ST', label: 'Pivô', x: 50, y: 80 },
    ],
  },
];

// ===================== FUT7 (7 jogadores) =====================

export const FUT7_FORMATIONS: Formation[] = [
  {
    id: 'fut7-2-3-1',
    name: '2-3-1',
    format: 'FUT7',
    totalPlayers: 7,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 10 },
      { position: 'LB', label: 'Zagueiro Esquerdo', x: 35, y: 30 },
      { position: 'RB', label: 'Zagueiro Direito', x: 65, y: 30 },
      { position: 'LM', label: 'Meio Esquerdo', x: 25, y: 55 },
      { position: 'CM', label: 'Meio Central', x: 50, y: 55 },
      { position: 'RM', label: 'Meio Direito', x: 75, y: 55 },
      { position: 'ST', label: 'Atacante', x: 50, y: 80 },
    ],
  },
  {
    id: 'fut7-3-2-1',
    name: '3-2-1',
    format: 'FUT7',
    totalPlayers: 7,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 10 },
      { position: 'LCB', label: 'Zagueiro Esquerdo', x: 30, y: 30 },
      { position: 'CB', label: 'Zagueiro Central', x: 50, y: 30 },
      { position: 'RCB', label: 'Zagueiro Direito', x: 70, y: 30 },
      { position: 'LCM', label: 'Meio Esquerdo', x: 35, y: 60 },
      { position: 'RCM', label: 'Meio Direito', x: 65, y: 60 },
      { position: 'ST', label: 'Atacante', x: 50, y: 85 },
    ],
  },
  {
    id: 'fut7-2-2-2',
    name: '2-2-2',
    format: 'FUT7',
    totalPlayers: 7,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 10 },
      { position: 'LB', label: 'Zagueiro Esquerdo', x: 35, y: 30 },
      { position: 'RB', label: 'Zagueiro Direito', x: 65, y: 30 },
      { position: 'LCM', label: 'Meio Esquerdo', x: 35, y: 55 },
      { position: 'RCM', label: 'Meio Direito', x: 65, y: 55 },
      { position: 'LST', label: 'Atacante Esquerdo', x: 35, y: 80 },
      { position: 'RST', label: 'Atacante Direito', x: 65, y: 80 },
    ],
  },
];

// ===================== FUT11 (11 jogadores) =====================

export const FUT11_FORMATIONS: Formation[] = [
  {
    id: 'fut11-4-4-2',
    name: '4-4-2 (Clássico)',
    format: 'FUT11',
    totalPlayers: 11,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 5 },
      { position: 'LB', label: 'Lateral Esquerdo', x: 20, y: 25 },
      { position: 'LCB', label: 'Zagueiro Esquerdo', x: 40, y: 20 },
      { position: 'RCB', label: 'Zagueiro Direito', x: 60, y: 20 },
      { position: 'RB', label: 'Lateral Direito', x: 80, y: 25 },
      { position: 'LM', label: 'Meio Esquerdo', x: 20, y: 50 },
      { position: 'LCM', label: 'Meio Central Esquerdo', x: 40, y: 50 },
      { position: 'RCM', label: 'Meio Central Direito', x: 60, y: 50 },
      { position: 'RM', label: 'Meio Direito', x: 80, y: 50 },
      { position: 'LST', label: 'Atacante Esquerdo', x: 40, y: 80 },
      { position: 'RST', label: 'Atacante Direito', x: 60, y: 80 },
    ],
  },
  {
    id: 'fut11-4-3-3',
    name: '4-3-3 (Ofensivo)',
    format: 'FUT11',
    totalPlayers: 11,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 5 },
      { position: 'LB', label: 'Lateral Esquerdo', x: 20, y: 25 },
      { position: 'LCB', label: 'Zagueiro Esquerdo', x: 40, y: 20 },
      { position: 'RCB', label: 'Zagueiro Direito', x: 60, y: 20 },
      { position: 'RB', label: 'Lateral Direito', x: 80, y: 25 },
      { position: 'CDM', label: 'Volante', x: 50, y: 40 },
      { position: 'LCM', label: 'Meio Esquerdo', x: 35, y: 55 },
      { position: 'RCM', label: 'Meio Direito', x: 65, y: 55 },
      { position: 'LW', label: 'Ponta Esquerda', x: 20, y: 80 },
      { position: 'ST', label: 'Centroavante', x: 50, y: 85 },
      { position: 'RW', label: 'Ponta Direita', x: 80, y: 80 },
    ],
  },
  {
    id: 'fut11-4-2-3-1',
    name: '4-2-3-1 (Equilíbrio)',
    format: 'FUT11',
    totalPlayers: 11,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 5 },
      { position: 'LB', label: 'Lateral Esquerdo', x: 20, y: 25 },
      { position: 'LCB', label: 'Zagueiro Esquerdo', x: 40, y: 20 },
      { position: 'RCB', label: 'Zagueiro Direito', x: 60, y: 20 },
      { position: 'RB', label: 'Lateral Direito', x: 80, y: 25 },
      { position: 'LCDM', label: 'Volante Esquerdo', x: 40, y: 40 },
      { position: 'RCDM', label: 'Volante Direito', x: 60, y: 40 },
      { position: 'LAM', label: 'Meia Esquerdo', x: 25, y: 65 },
      { position: 'CAM', label: 'Meia Ofensivo', x: 50, y: 65 },
      { position: 'RAM', label: 'Meia Direito', x: 75, y: 65 },
      { position: 'ST', label: 'Centroavante', x: 50, y: 85 },
    ],
  },
  {
    id: 'fut11-3-5-2',
    name: '3-5-2 (Controle)',
    format: 'FUT11',
    totalPlayers: 11,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 5 },
      { position: 'LCB', label: 'Zagueiro Esquerdo', x: 30, y: 20 },
      { position: 'CB', label: 'Zagueiro Central', x: 50, y: 20 },
      { position: 'RCB', label: 'Zagueiro Direito', x: 70, y: 20 },
      { position: 'LWB', label: 'Ala Esquerdo', x: 15, y: 50 },
      { position: 'LCM', label: 'Meio Esquerdo', x: 35, y: 50 },
      { position: 'CM', label: 'Meio Central', x: 50, y: 50 },
      { position: 'RCM', label: 'Meio Direito', x: 65, y: 50 },
      { position: 'RWB', label: 'Ala Direito', x: 85, y: 50 },
      { position: 'LST', label: 'Atacante Esquerdo', x: 40, y: 80 },
      { position: 'RST', label: 'Atacante Direito', x: 60, y: 80 },
    ],
  },
  {
    id: 'fut11-5-3-2',
    name: '5-3-2 (Defensivo)',
    format: 'FUT11',
    totalPlayers: 11,
    positions: [
      { position: 'GK', label: 'Goleiro', x: 50, y: 5 },
      { position: 'LWB', label: 'Ala Esquerdo', x: 15, y: 25 },
      { position: 'LCB', label: 'Zagueiro Esquerdo', x: 35, y: 20 },
      { position: 'CB', label: 'Zagueiro Central', x: 50, y: 20 },
      { position: 'RCB', label: 'Zagueiro Direito', x: 65, y: 20 },
      { position: 'RWB', label: 'Ala Direito', x: 85, y: 25 },
      { position: 'LCM', label: 'Meio Esquerdo', x: 35, y: 55 },
      { position: 'CM', label: 'Meio Central', x: 50, y: 55 },
      { position: 'RCM', label: 'Meio Direito', x: 65, y: 55 },
      { position: 'LST', label: 'Atacante Esquerdo', x: 40, y: 80 },
      { position: 'RST', label: 'Atacante Direito', x: 60, y: 80 },
    ],
  },
];

// ===================== Helper Functions =====================

export function getAllFormations(): Formation[] {
  return [...FUTSAL_FORMATIONS, ...FUT7_FORMATIONS, ...FUT11_FORMATIONS];
}

export function getFormationsByFormat(format: MatchFormat): Formation[] {
  switch (format) {
    case 'FUTSAL':
      return FUTSAL_FORMATIONS;
    case 'FUT7':
      return FUT7_FORMATIONS;
    case 'FUT11':
      return FUT11_FORMATIONS;
    default:
      return [];
  }
}

export function getFormationById(formationId: string): Formation | undefined {
  return getAllFormations().find((f) => f.id === formationId);
}

export function getPlayersCountByFormat(format: MatchFormat): number {
  switch (format) {
    case 'FUTSAL':
      return 5;
    case 'FUT7':
      return 7;
    case 'FUT11':
      return 11;
    default:
      return 11;
  }
}

export function validateFormation(formationId: string, format: MatchFormat): boolean {
  const formation = getFormationById(formationId);
  if (!formation) return false;
  return formation.format === format;
}
