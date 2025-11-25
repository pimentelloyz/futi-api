-- Criar enum MatchFormat
CREATE TYPE "MatchFormat" AS ENUM ('FUTSAL', 'FUT7', 'FUT11');

-- Adicionar campo matchFormat na tabela League
ALTER TABLE "League" ADD COLUMN "matchFormat" "MatchFormat" NOT NULL DEFAULT 'FUT11';

-- Adicionar campo position na tabela MatchLineupEntry
ALTER TABLE "MatchLineupEntry" ADD COLUMN "position" VARCHAR(10);

-- Comentários explicativos
COMMENT ON COLUMN "League"."matchFormat" IS 'Modalidade da liga: FUTSAL (5 jogadores), FUT7 (7 jogadores), FUT11 (11 jogadores)';
COMMENT ON COLUMN "MatchLineupEntry"."position" IS 'Posição na formação tática: GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST';
