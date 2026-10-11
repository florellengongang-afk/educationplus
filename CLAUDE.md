# EducationPlus — consignes pour l'agent

Plateforme camerounaise de **répétiteurs à domicile** (SIL → Terminale). Parents et enseignants sur mobile (Expo), partenaires et administration sur le web (Next.js).

À lire avant toute tâche : `docs/BRIEF.md` (fonctionnel), `docs/DECISIONS.md` (ce qui est tranché ou non), maquettes `design/*.dc.html` (ouvrir dans un navigateur).

## Structure

- `apps/mobile` — Expo SDK 57, Expo Router (`src/app`), espaces Parent et Enseignant. Lire `apps/mobile/AGENTS.md`.
- `apps/web` — Next.js 16 (App Router, Cache Components) : espaces Partenaire, Admin et API (`src/app/api`). Lire `apps/web/AGENTS.md` : la doc de cette version est dans `node_modules/next/dist/docs/`.
- `packages/shared` — règles métier pures + schémas Zod + tests Vitest. Toute règle métier vit ici.
- `packages/db` — schéma Drizzle, migrations SQL, seed, hachage des mots de passe.
- `packages/ui-tokens` — couleurs, polices, rayons.

## Commandes

```bash
pnpm install
pnpm db:up            # PostgreSQL local sur le port 5433 (ou: docker compose up -d)
pnpm db:migrate && pnpm db:seed:demo   # données fictives, développement uniquement
pnpm dev:web          # http://localhost:3000 (admin : /admin, partenaire : /partenaire)
pnpm dev:mobile       # Expo
pnpm test && pnpm typecheck && pnpm lint
pnpm --filter @educationplus/db generate   # nouvelle migration après modification de schema.ts
```

## Règles

1. Les permissions se vérifient côté serveur. Un parent ne voit jamais les données d'un autre enfant.
2. Ne jamais inventer une règle listée comme ouverte dans `docs/DECISIONS.md` : paramètre, interface ou flag désactivé.
3. Uniquement le format domicile. Primaire = toutes les matières ; secondaire = choix des matières.
4. Une présence ou un horaire passé ne s'écrase jamais : demande de correction + journal d'audit.
5. « Autorisé » n'est jamais « Payé ». Aucun paiement réel (prestataire factice).
6. Textes en français, montants entiers en FCFA, fuseau Africa/Douala.
7. Avancer phase par phase (`docs/BRIEF.md`, Plan) et s'arrêter pour validation à la fin de chaque phase.
8. Avant de déclarer une tâche finie : `pnpm test`, `pnpm typecheck`, `pnpm lint`.
