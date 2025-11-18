import { AccessRole } from '../constants/access-roles.js';

export interface RBACAccessLog {
  timestamp: Date;
  userId: string;
  userEmail?: string;
  endpoint: string;
  method: string;
  requiredRoles: AccessRole[];
  userRole?: AccessRole;
  action: 'GRANTED' | 'DENIED';
  reason?: string;
  context?: {
    teamId?: string;
    leagueId?: string;
    matchId?: string;
  };
  ip?: string;
  userAgent?: string;
}

/**
 * Serviço de Auditoria RBAC
 *
 * Registra todos os acessos (permitidos e negados) para fins de:
 * - Auditoria de segurança
 * - Análise de comportamento
 * - Debugging de permissões
 * - Compliance
 */
export class RBACAuditLogger {
  private static instance: RBACAuditLogger;
  private logs: RBACAccessLog[] = [];
  private readonly MAX_LOGS = 10000; // Limitar memória
  private readonly LOG_TO_CONSOLE = process.env.NODE_ENV !== 'production';

  private constructor() {}

  static getInstance(): RBACAuditLogger {
    if (!RBACAuditLogger.instance) {
      RBACAuditLogger.instance = new RBACAuditLogger();
    }
    return RBACAuditLogger.instance;
  }

  /**
   * Registra acesso negado
   */
  logDenied(params: {
    userId: string;
    userEmail?: string;
    endpoint: string;
    method: string;
    requiredRoles: AccessRole[];
    userRole?: AccessRole;
    reason: string;
    context?: {
      teamId?: string;
      leagueId?: string;
      matchId?: string;
    };
    ip?: string;
    userAgent?: string;
  }): void {
    const log: RBACAccessLog = {
      timestamp: new Date(),
      action: 'DENIED',
      ...params,
    };

    this.addLog(log);

    // Log no console em desenvolvimento
    if (this.LOG_TO_CONSOLE) {
      console.warn('🚫 RBAC Access DENIED:', {
        user: params.userId,
        endpoint: `${params.method} ${params.endpoint}`,
        reason: params.reason,
        required: params.requiredRoles,
        userRole: params.userRole || 'NONE',
      });
    }

    // Em produção, você pode enviar para:
    // - Sistema de logs (Winston, Pino)
    // - Serviço de monitoramento (Datadog, New Relic)
    // - Banco de dados de auditoria
    this.persistLog(log);
  }

  /**
   * Registra acesso permitido
   */
  logGranted(params: {
    userId: string;
    userEmail?: string;
    endpoint: string;
    method: string;
    requiredRoles: AccessRole[];
    userRole: AccessRole;
    context?: {
      teamId?: string;
      leagueId?: string;
      matchId?: string;
    };
    ip?: string;
    userAgent?: string;
  }): void {
    const log: RBACAccessLog = {
      timestamp: new Date(),
      action: 'GRANTED',
      ...params,
    };

    this.addLog(log);

    // Log apenas em modo verbose
    if (process.env.RBAC_VERBOSE_LOGS === 'true') {
      console.log('✅ RBAC Access GRANTED:', {
        user: params.userId,
        endpoint: `${params.method} ${params.endpoint}`,
        role: params.userRole,
      });
    }
  }

  private addLog(log: RBACAccessLog): void {
    this.logs.push(log);

    // Limitar tamanho do array (FIFO)
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  private persistLog(log: RBACAccessLog): void {
    // Persistência assíncrona em arquivo (não bloqueante)
    (async () => {
      try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const dir = path.resolve(process.cwd(), 'logs');
        await fs.mkdir(dir, { recursive: true });
        await fs.appendFile(path.join(dir, 'rbac-audit.log'), JSON.stringify(log) + '\n', {
          encoding: 'utf8',
        });
      } catch (e) {
        console.warn('[RBACAuditLogger persist warn]', (e as Error).message);
      }
    })();
  }

  /**
   * Retorna logs recentes (para debugging)
   */
  getRecentLogs(limit = 100): RBACAccessLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Retorna logs filtrados
   */
  getLogsByUser(userId: string, limit = 100): RBACAccessLog[] {
    return this.logs.filter((log) => log.userId === userId).slice(-limit);
  }

  /**
   * Retorna estatísticas de acesso
   */
  getStats(): {
    total: number;
    granted: number;
    denied: number;
    deniedReasons: Record<string, number>;
    topDeniedEndpoints: Array<{ endpoint: string; count: number }>;
  } {
    const denied = this.logs.filter((log) => log.action === 'DENIED');
    const granted = this.logs.filter((log) => log.action === 'GRANTED');

    // Agrupar razões de negação
    const deniedReasons: Record<string, number> = {};
    denied.forEach((log) => {
      const reason = log.reason || 'UNKNOWN';
      deniedReasons[reason] = (deniedReasons[reason] || 0) + 1;
    });

    // Top endpoints negados
    const endpointCounts: Record<string, number> = {};
    denied.forEach((log) => {
      const key = `${log.method} ${log.endpoint}`;
      endpointCounts[key] = (endpointCounts[key] || 0) + 1;
    });

    const topDeniedEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: this.logs.length,
      granted: granted.length,
      denied: denied.length,
      deniedReasons,
      topDeniedEndpoints,
    };
  }

  /**
   * Limpa logs antigos (manutenção)
   */
  clearOldLogs(olderThanDays = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    this.logs = this.logs.filter((log) => log.timestamp > cutoffDate);
    console.log(`🧹 Cleared logs older than ${olderThanDays} days`);
  }

  /**
   * Exporta logs para análise
   */
  exportLogs(): RBACAccessLog[] {
    return [...this.logs];
  }
}
