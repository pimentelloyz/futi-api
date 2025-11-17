import { z } from 'zod';

import { Controller, HttpRequest, HttpResponse } from '../protocols/http.js';
import { prisma } from '../../infra/prisma/client.js';
import { ERROR_CODES } from '../../domain/constants.js';

const schema = z.object({ code: z.string().min(3), teamId: z.string().min(1) });

export class AcceptLeagueInvitationController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const user = request.user as { id: string } | undefined;
    if (!user) return { statusCode: 401, body: { error: ERROR_CODES.UNAUTHORIZED } };
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return { statusCode: 400, body: { error: 'invalid_body' } };
    const { code, teamId } = parsed.data;

    // Verify that user has managerial access to the team
    const access = await prisma.accessMembership.findFirst({
      where: { userId: user.id, teamId, role: { in: ['ADMIN', 'MANAGER'] } },
    });
    if (!access) return { statusCode: 403, body: { error: 'not_team_manager' } };

    const invite = await prisma.leagueInvitation.findFirst({ where: { code } });
    if (!invite) return { statusCode: 404, body: { error: 'invite_not_found' } };
    const now = new Date();
    if (!invite.isActive || (invite.expiresAt && invite.expiresAt <= now))
      return { statusCode: 400, body: { error: 'invite_expired' } };
    if (invite.uses >= invite.maxUses) return { statusCode: 400, body: { error: 'invite_maxed' } };

    // Check if team already linked
    const existing = await prisma.leagueTeam.findFirst({
      where: { leagueId: invite.leagueId, teamId },
    });
    if (existing) return { statusCode: 409, body: { error: 'team_already_in_league' } };

    // Create link and increment uses atomically
    await prisma.$transaction([
      prisma.leagueTeam.create({ data: { leagueId: invite.leagueId, teamId } }),
      prisma.leagueInvitation.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      }),
    ]);

    const updated = await prisma.leagueInvitation.findUnique({ where: { id: invite.id } });
    if (updated && updated.uses >= updated.maxUses) {
      await prisma.leagueInvitation.update({ where: { id: invite.id }, data: { isActive: false } });
    }

    return { statusCode: 200, body: { message: 'team_linked', leagueId: invite.leagueId } };
  }
}
