import { Router } from 'express';

import { AuditController } from '../controllers/audit-controller.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { AccessRole } from '../../domain/constants/access-roles.js';

const router = Router();
const auditController = new AuditController();

/**
 * Rotas de auditoria RBAC
 * Todas as rotas requerem role ADMIN
 */

// GET /api/admin/audit/stats - Estatísticas agregadas
router.get('/stats', requireRole([AccessRole.ADMIN]), (req, res) =>
  auditController.getStats(req, res),
);

// GET /api/admin/audit/logs - Logs recentes
router.get('/logs', requireRole([AccessRole.ADMIN]), (req, res) =>
  auditController.getRecentLogs(req, res),
);

// GET /api/admin/audit/user/:userId - Logs de usuário específico
router.get('/user/:userId', requireRole([AccessRole.ADMIN]), (req, res) =>
  auditController.getUserLogs(req, res),
);

// GET /api/admin/audit/export - Exportar todos os logs
router.get('/export', requireRole([AccessRole.ADMIN]), (req, res) =>
  auditController.exportLogs(req, res),
);

// DELETE /api/admin/audit/old - Limpar logs antigos
router.delete('/old', requireRole([AccessRole.ADMIN]), (req, res) =>
  auditController.clearOldLogs(req, res),
);

export { router as auditRouter };
