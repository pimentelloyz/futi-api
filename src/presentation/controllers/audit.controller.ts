import type { Request, Response } from 'express';

import { RBACAuditLogger } from '../../domain/services/rbac-audit-logger.js';

const auditLogger = RBACAuditLogger.getInstance();

/**
 * Controller para visualização de logs de auditoria RBAC
 * Endpoints acessíveis apenas por ADMIN
 */
export class AuditController {
  /**
   * GET /api/admin/audit/stats
   * Retorna estatísticas agregadas de acessos
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = auditLogger.getStats();
      return res.json(stats);
    } catch (error) {
      console.error('[Audit Stats Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao obter estatísticas de auditoria',
      });
    }
  }

  /**
   * GET /api/admin/audit/logs?limit=100
   * Retorna logs recentes de acesso
   */
  async getRecentLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = auditLogger.getRecentLogs(limit);
      return res.json({
        total: logs.length,
        logs,
      });
    } catch (error) {
      console.error('[Audit Logs Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao obter logs de auditoria',
      });
    }
  }

  /**
   * GET /api/admin/audit/user/:userId?limit=50
   * Retorna logs de acesso de um usuário específico
   */
  async getUserLogs(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = auditLogger.getLogsByUser(userId, limit);
      return res.json({
        userId,
        total: logs.length,
        logs,
      });
    } catch (error) {
      console.error('[Audit User Logs Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao obter logs do usuário',
      });
    }
  }

  /**
   * GET /api/admin/audit/export
   * Exporta todos os logs de auditoria
   */
  async exportLogs(req: Request, res: Response) {
    try {
      const logs = auditLogger.exportLogs();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.json"`);
      return res.json(logs);
    } catch (error) {
      console.error('[Audit Export Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao exportar logs de auditoria',
      });
    }
  }

  /**
   * DELETE /api/admin/audit/old?days=30
   * Remove logs antigos
   */
  async clearOldLogs(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const removedCount = auditLogger.clearOldLogs(days);
      return res.json({
        message: `${removedCount} logs antigos removidos`,
        days,
        removedCount,
      });
    } catch (error) {
      console.error('[Audit Clear Error]', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao limpar logs antigos',
      });
    }
  }
}
