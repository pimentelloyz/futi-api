import { PrismaClient } from '@prisma/client';

// Prefer DIRECT_URL (5432) for seed to avoid PgBouncer issues on pooled port (6543)
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

// Seed an admin user using Firebase data provided
// You can override via env if needed
const SEED_EMAIL = process.env.SEED_EMAIL ?? 'andre.loyz@gmail.com';
const SEED_DISPLAY_NAME = process.env.SEED_DISPLAY_NAME ?? 'André Pimentel';
const SEED_TEAM_NAME = process.env.SEED_TEAM_NAME ?? 'Futi FC';
const SEED_TEAM_ICON = process.env.SEED_TEAM_ICON || undefined;
const SEED_TEAM_DESCRIPTION = process.env.SEED_TEAM_DESCRIPTION || undefined;

// Support either a plain Firebase UID (SEED_FIREBASE_UID) or a Firebase ID token (SEED_FIREBASE_ID_TOKEN)
const RAW_SEED_FIREBASE_UID = process.env.SEED_FIREBASE_UID ??
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4MDI5MzRmZTBlZWM0NmE1ZWQwMDA2ZDE0YTFiYWIwMWUzNDUwODMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQW5kcsOpIFBpbWVudGVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pUNGRwbS0wZDRaRnFBQmk5RHhqSC1uWDJuWmQ4MWFUNkJ5bXFieEFILTBoVWlrZzJ1Wnc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZnV0aS1kZXYtMThhY2QiLCJhdWQiOiJmdXRpLWRldi0xOGFjZCIsImF1dGhfdGltZSI6MTc2Mjk3NjE5OCwidXNlcl9pZCI6IlhVaFdHUEVKUnllcTJUcHVaUTlLcjgwU2x6RzIiLCJzdWIiOiJYVWhXR1BFSlJ5ZXEyVHB1WlE5S3I4MFNsekcyIiwiaWF0IjoxNzYyOTc2MTk4LCJleHAiOjE3NjI5Nzk3OTgsImVtYWlsIjoiYW5kcmUubG95ekBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExNzQ5NTYzOTg5NTM0NTExMzc5NyJdLCJlbWFpbCI6WyJhbmRyZS5sb3l6QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.TXterPhnSEs1bgxEmUhXk-wUsOjuvbYmEtenKzgB_kiTWXiFll6zRa2S57mBUfcc7-hTV3YJdF8VZZs-igPL8cFg0qGN_zDWiIolGGmzNcphMrjbBwZHiTwyko9S8ZbCJcPLa6SvV0j-SXybMHVDoITEntYNstRAAku4_ZIoVlocPTEA4gOje17RZUiq6lBjwEo3iO24sfxKfQInefpoCiy6l6F0qFDmhFjaUzHiWKkiLQDy8TiMROHzs3x5xMoRAsMMqBinRP0nIXoxvYX5uEMN9xIXpfm0dd0LGcQJGW8Csu_sZeKIlljd2byV90wZoh7IUvJdWiSZMpLzDgZWCQ';
const RAW_SEED_FIREBASE_ID_TOKEN = process.env.SEED_FIREBASE_ID_TOKEN;

function extractUidFromJwt(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    return obj.user_id || obj.sub || undefined;
  } catch {
    return undefined;
  }
}

function resolveFirebaseUid(): string {
  // Priority: explicit UID env -> ID token env -> RAW default (may be UID or token)
  if (process.env.SEED_FIREBASE_UID) return process.env.SEED_FIREBASE_UID;
  if (RAW_SEED_FIREBASE_ID_TOKEN) {
    const fromToken = extractUidFromJwt(RAW_SEED_FIREBASE_ID_TOKEN);
    if (fromToken) return fromToken;
  }
  // If RAW uid looks like a JWT (has dots), try to extract; else use as-is
  if (RAW_SEED_FIREBASE_UID && RAW_SEED_FIREBASE_UID.includes('.')) {
    const fromRaw = extractUidFromJwt(RAW_SEED_FIREBASE_UID);
    if (fromRaw) return fromRaw;
  }
  return RAW_SEED_FIREBASE_UID;
}

const SEED_FIREBASE_UID = resolveFirebaseUid();

async function main() {
  // Ensure user exists (by email or firebaseUid)
  let user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (!user) {
    const byUid = await prisma.user.findUnique({ where: { firebaseUid: SEED_FIREBASE_UID } });
    if (byUid) user = byUid;
  }

  if (!user) {
    user = await prisma.user.create({
      data: { email: SEED_EMAIL, firebaseUid: SEED_FIREBASE_UID, displayName: SEED_DISPLAY_NAME },
    });
    console.log('[seed] created user:', { id: user.id, email: user.email });
  } else {
    // keep email/displayName/firebaseUid fresh
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email: SEED_EMAIL, displayName: SEED_DISPLAY_NAME, firebaseUid: SEED_FIREBASE_UID },
    });
    console.log('[seed] user exists/updated:', { id: user.id, email: user.email });
  }

  // Ensure ADMIN global access (teamId = null)
  const existingAdmin = await prisma.accessMembership.findFirst({
    where: { userId: user.id, teamId: null, role: 'ADMIN' },
  });
  if (!existingAdmin) {
    await prisma.accessMembership.create({ data: { userId: user.id, teamId: null, role: 'ADMIN' } });
    console.log('[seed] granted ADMIN (global)');
  } else {
    console.log('[seed] ADMIN already granted (global)');
  }

  // Ensure a default team exists
  let team = await prisma.team.findFirst({ where: { name: SEED_TEAM_NAME } });
  if (!team) {
    team = await prisma.team.create({
      data: { name: SEED_TEAM_NAME, icon: SEED_TEAM_ICON, description: SEED_TEAM_DESCRIPTION },
    });
    console.log('[seed] created team:', { id: team.id, name: team.name });
  } else {
    // keep metadata fresh
    team = await prisma.team.update({
      where: { id: team.id },
      data: { icon: SEED_TEAM_ICON, description: SEED_TEAM_DESCRIPTION },
    });
    console.log('[seed] team exists/updated:', { id: team.id, name: team.name });
  }

  // Ensure MANAGER access for this team
  const existingTeamAccess = await prisma.accessMembership.findFirst({
    where: { userId: user.id, teamId: team.id },
  });
  if (!existingTeamAccess) {
    await prisma.accessMembership.create({
      data: { userId: user.id, teamId: team.id, role: 'MANAGER' },
    });
    console.log('[seed] granted MANAGER for team', { teamId: team.id });
  } else if (existingTeamAccess.role !== 'MANAGER') {
    await prisma.accessMembership.update({
      where: { id: existingTeamAccess.id },
      data: { role: 'MANAGER' },
    });
    console.log('[seed] updated role to MANAGER for team', { teamId: team.id });
  } else {
    console.log('[seed] MANAGER already granted for team', { teamId: team.id });
  }
}

main()
  .catch((e) => {
    console.error('[seed-error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
