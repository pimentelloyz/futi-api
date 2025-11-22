import express from 'express';

import {
  makeCreateInvitationCodeController,
  makeAcceptInvitationCodeController,
  makeListInvitationCodesController,
  makeRevokeInvitationCodeController,
} from '../../main/factories/make-invitation-code-controllers.js';
import {
  makeCreateLeagueInvitationController,
  makeListLeagueInvitationsController,
  makeRevokeLeagueInvitationController,
  makeAcceptLeagueInvitationController,
} from '../../main/factories/make-league-invitation-controllers.js';
import { requireManager } from '../middlewares/authorize.js';
import { jwtAuth } from '../middlewares/jwt-auth.js';
import type { HttpRequest } from '../protocols/http.js';

export const invitationCodesRouter = express.Router();

const createController = makeCreateInvitationCodeController();
const listController = makeListInvitationCodesController();
const revokeController = makeRevokeInvitationCodeController();
const acceptController = makeAcceptInvitationCodeController();
const createLeagueInvite = makeCreateLeagueInvitationController();
const listLeagueInvites = makeListLeagueInvitationsController();
const revokeLeagueInvite = makeRevokeLeagueInvitationController();
const acceptLeagueInvite = makeAcceptLeagueInvitationController();

invitationCodesRouter.post('/', jwtAuth, requireManager(), async (req, res) => {
  try {
    const request: HttpRequest = {
      body: req.body,
      query: req.query as Record<string, unknown>,
      params: req.params,
      cookies: req.cookies,
    };
    const httpRes = await createController.handle(request);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[invites_create_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

invitationCodesRouter.get('/', jwtAuth, requireManager(), async (req, res) => {
  try {
    const request: HttpRequest = {
      body: undefined,
      query: req.query as Record<string, unknown>,
      params: req.params,
      cookies: req.cookies,
    };
    const httpRes = await listController.handle(request);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[invites_list_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

invitationCodesRouter.delete('/:id', jwtAuth, requireManager(), async (req, res) => {
  try {
    const request: HttpRequest = {
      body: undefined,
      query: req.query as Record<string, unknown>,
      params: req.params,
      cookies: req.cookies,
    };
    const httpRes = await revokeController.handle(request);
    return res.status(httpRes.statusCode).send();
  } catch (e) {
    console.error('[invites_revoke_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

invitationCodesRouter.post('/accept', jwtAuth, async (req, res) => {
  try {
    const request: HttpRequest & { user?: { id: string } } = {
      body: req.body,
      params: req.params,
      query: req.query as Record<string, unknown>,
      cookies: req.cookies,
    };
    request.user = req.user as { id: string } | undefined;
    const httpRes = await acceptController.handle(request);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[invites_accept_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// League invites management (admin/manager)
invitationCodesRouter.post('/league', jwtAuth, requireManager(), async (req, res) => {
  try {
    const request: HttpRequest = {
      body: req.body,
      query: req.query as Record<string, unknown>,
      params: req.params,
      cookies: req.cookies,
    };
    const httpRes = await createLeagueInvite.handle(request);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[league_invite_create_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

invitationCodesRouter.get('/league', jwtAuth, requireManager(), async (req, res) => {
  try {
    const request: HttpRequest = {
      body: undefined,
      query: req.query as Record<string, unknown>,
      params: req.params,
      cookies: req.cookies,
    };
    const httpRes = await listLeagueInvites.handle(request);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[league_invite_list_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

invitationCodesRouter.delete('/league/:id', jwtAuth, requireManager(), async (req, res) => {
  try {
    const request: HttpRequest = {
      body: undefined,
      query: req.query as Record<string, unknown>,
      params: req.params,
      cookies: req.cookies,
    };
    const httpRes = await revokeLeagueInvite.handle(request);
    return res.status(httpRes.statusCode).send();
  } catch (e) {
    console.error('[league_invite_revoke_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Team manager accepts league invite
invitationCodesRouter.post('/league/accept', jwtAuth, async (req, res) => {
  try {
    const request: HttpRequest & { user?: { id: string } } = {
      body: req.body,
      params: req.params,
      query: req.query as Record<string, unknown>,
      cookies: req.cookies,
    };
    request.user = req.user as { id: string } | undefined;
    const httpRes = await acceptLeagueInvite.handle(request);
    return res.status(httpRes.statusCode).json(httpRes.body);
  } catch (e) {
    console.error('[league_invite_accept_error]', (e as Error).message);
    return res.status(500).json({ error: 'internal_error' });
  }
});
