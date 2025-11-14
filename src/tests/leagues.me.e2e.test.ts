import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';

let app: Express;

describe('GET /api/leagues/me', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const mod = await import('../main/app.js');
    app = mod.app;
  });

  it('should list my leagues minimally and fetch details via /me/:id', async () => {
    // 1) Authenticate and get access token
    const exchange = await request(app)
      .post('/api/auth/firebase/exchange')
      .send({ idToken: 'fake-id-token-leagues' });
    expect(exchange.status).toBe(200);
    const accessToken = exchange.body.accessToken as string;

    // 2) Create a team
    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'My Team' });
    expect(teamRes.status).toBe(201);
    const teamId = teamRes.body?.id as string;
    expect(teamId).toBeTruthy();

    // 3) Create my player profile
    const mePlayerCreate = await request(app)
      .post('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Player' });
    expect(mePlayerCreate.status).toBe(201);

    // 4) Read my player id
    const mePlayerRead = await request(app)
      .get('/api/players/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(mePlayerRead.status).toBe(200);
    const playerId = mePlayerRead.body?.id as string;
    expect(playerId).toBeTruthy();

    // 5) Link my player to the team
    const linkRes = await request(app)
      .post(`/api/teams/${teamId}/players`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ playerId });
    expect(linkRes.status).toBe(204);

    // 6) Create a league
    const leagueCreate = await request(app)
      .post('/api/leagues')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Futi Cup E2E', slug: `futi-cup-e2e-${Date.now()}` });
    expect(leagueCreate.status).toBe(201);
    const leagueId = leagueCreate.body?.id as string;
    expect(leagueId).toBeTruthy();

    // 7) Add the team to the league
    const addTeam = await request(app)
      .post(`/api/leagues/${leagueId}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ teamId });
    expect(addTeam.status).toBe(201);

    // 8) Now, GET /api/leagues/me and expect the league with minimal fields (no teams)
    const myLeagues = await request(app)
      .get('/api/leagues/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(myLeagues.status).toBe(200);
    type MyLeague = { id: string; name: string; slug: string };
    const arr = myLeagues.body as MyLeague[];
    expect(Array.isArray(arr)).toBe(true);
    const found = arr.find((l) => l.id === leagueId);
    expect(found).toBeTruthy();

    // 9) Fetch detailed league via /api/leagues/me/:id and expect teams included
    const myLeagueDetails = await request(app)
      .get(`/api/leagues/me/${leagueId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(myLeagueDetails.status).toBe(200);
    const league = myLeagueDetails.body as { teams?: Array<{ team?: { id: string } }> };
    expect(Array.isArray(league.teams)).toBe(true);
    const teamFound = (league.teams || []).some((t) => t.team && t.team.id === teamId);
    expect(teamFound).toBe(true);
  });
});
