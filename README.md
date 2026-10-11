# EducationPlus

Plateforme de **répétiteurs à domicile** au Cameroun, du SIL à la Terminale.
Les parents et les répétiteurs utilisent l'application mobile ; les partenaires et l'administration utilisent l'espace web.

| Dossier | Contenu |
| --- | --- |
| `apps/mobile` | Application Expo (React Native) — espaces Parent et Enseignant |
| `apps/web` | Next.js — espaces Partenaire et Admin, API (`/api`) |
| `packages/shared` | Règles métier, classes et matières, schémas Zod, tests |
| `packages/db` | Schéma PostgreSQL (Drizzle), migrations, données de démo |
| `packages/ui-tokens` | Couleurs, polices, espacements |
| `design/` | Maquettes des 60 écrans (référence visuelle, à ouvrir depuis le canvas Design) |
| `docs/` | Brief fonctionnel et journal des décisions |

## Démarrer

Prérequis : Node 22+, pnpm 10, Docker (ou PostgreSQL 16 installé).

```bash
pnpm install
docker compose up -d          # ou : pnpm db:up (PostgreSQL local, port 5433)
cp .env.example .env
pnpm db:migrate
pnpm db:seed:demo             # facultatif : comptes fictifs pour développer (mot de passe demo1234)
pnpm dev:web                  # http://localhost:3000  → /admin, /partenaire, /api/health
pnpm dev:mobile               # puis scanner le QR code avec Expo Go
```

## Vérifier

```bash
pnpm test        # règles métier
pnpm typecheck
pnpm lint
pnpm build
```

## Avancement

- [x] Phase 0 — socle technique (11/10/2026)
- [ ] Phase 1 — comptes, enfants, demandes, candidatures
- [ ] Phase 2 — calendrier et séances (appel, démarrer, terminer, hors ligne)
- [ ] Phase 3 — comptes rendus, notifications, corrections, réclamations
- [ ] Phase 4 — paiements (prestataire factice)
- [ ] Phase 5 — espaces partenaire et admin complets

Les décisions encore ouvertes (prestataire de paiement, base de la commission, remboursements…) sont listées dans `docs/DECISIONS.md`. Elles bloquent la mise en production des paiements.
