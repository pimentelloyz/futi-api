export enum AccessRole {
  MASTER = 'MASTER', // Super usuário com acesso total e irrestrito ao sistema
  ADMIN = 'ADMIN', // Acesso total ao sistema
  MANAGER = 'MANAGER', // Gerencia time: jogadores, convites, escalações
  ASSISTANT = 'ASSISTANT', // Auxiliar técnico: mesmos acessos do MANAGER mas somente leitura
  PLAYER = 'PLAYER', // Visualiza dados do próprio time
  LEAGUE_MANAGER = 'LEAGUE_MANAGER', // Gerencia liga: times, grupos, convites
  MATCH_MANAGER = 'MATCH_MANAGER', // Gerencia partida: gols, cartões, eventos
  REFEREE_COMMISSION = 'REFEREE_COMMISSION', // Visualiza calendário e questões disciplinares
  FAN = 'FAN', // Torcedor: visualiza ligas públicas (default quando não tem membership)
}

export const READ_ONLY_ROLES: AccessRole[] = [AccessRole.ASSISTANT, AccessRole.REFEREE_COMMISSION];

export const TEAM_SCOPED_ROLES: AccessRole[] = [
  AccessRole.PLAYER,
  AccessRole.MANAGER,
  AccessRole.ASSISTANT,
];

export const LEAGUE_SCOPED_ROLES: AccessRole[] = [
  AccessRole.LEAGUE_MANAGER,
  AccessRole.REFEREE_COMMISSION,
];

export const GLOBAL_ROLES: AccessRole[] = [AccessRole.MASTER, AccessRole.ADMIN];

// Hierarquia de permissões (role mais alto inclui permissões dos mais baixos)
export const ROLE_HIERARCHY: Record<AccessRole, number> = {
  [AccessRole.FAN]: 0,
  [AccessRole.PLAYER]: 10,
  [AccessRole.ASSISTANT]: 20,
  [AccessRole.MANAGER]: 30,
  [AccessRole.MATCH_MANAGER]: 35,
  [AccessRole.REFEREE_COMMISSION]: 40,
  [AccessRole.LEAGUE_MANAGER]: 50,
  [AccessRole.ADMIN]: 100,
  [AccessRole.MASTER]: 999, // Nível máximo de acesso
};

export function isReadOnlyRole(role: AccessRole): boolean {
  return READ_ONLY_ROLES.includes(role);
}

export function isTeamScopedRole(role: AccessRole): boolean {
  return TEAM_SCOPED_ROLES.includes(role);
}

export function isLeagueScopedRole(role: AccessRole): boolean {
  return LEAGUE_SCOPED_ROLES.includes(role);
}

export function isGlobalRole(role: AccessRole): boolean {
  return GLOBAL_ROLES.includes(role);
}

export function hasHigherOrEqualRole(userRole: AccessRole, requiredRole: AccessRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
