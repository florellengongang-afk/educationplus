# EducationPlus — Brief de développement

Version du 11/10/2026. Source vivante : le doc « EducationPlus — Brief de développement (React Native + Next.js) » sur claude.ai. Les décisions récentes sont dans `docs/DECISIONS.md` et priment sur ce brief.

> **Mises à jour du 11/10/2026**
> - Uniquement des **répétiteurs à domicile** : plus de centres de cours, plus de cours collectifs en centre.
> - Classes : **primaire SIL → CM2** (toutes les matières, pas de choix) et **secondaire 6e → Terminale** (le parent choisit les matières).
> - ORM : Drizzle au lieu de Prisma.

## 1. Objet

EducationPlus met en relation des parents avec des répétiteurs qui viennent au domicile de l'enfant, et permet aux parents de suivre chaque séance à distance (appel, début, fin, compte rendu), de payer sur des cycles de 30 jours et de déposer des réclamations. Marché initial : Cameroun. Interface en français, montants en FCFA (entiers), fuseau Africa/Douala.

Règle absolue : une règle financière, de remboursement, d'annulation ou de vérification de présence non définie n'est pas inventée ; elle est ajoutée à `docs/DECISIONS.md`.

## 2. Stack

| Brique | Choix |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Mobile (Parent, Enseignant) | Expo SDK 57, Expo Router, TypeScript strict |
| Web (Partenaire, Admin) + API | Next.js 16 App Router, route handlers dans `apps/web/src/app/api` |
| Base de données | PostgreSQL 16 + Drizzle ORM, migrations SQL versionnées |
| Règles métier | `packages/shared` : fonctions pures + Zod + Vitest |
| Auth (phase 1) | Téléphone + mot de passe (scrypt), code SMS (fournisseur à choisir), sessions courtes + refresh |
| Fichiers | Stockage compatible S3, URL signées (phase 1+) |
| Notifications | Expo Push + SMS (à choisir) + table `notifications` consultable |
| Paiements | Interface `PaymentProvider`, prestataire factice tant que rien n'est décidé |
| Hors ligne | L'appel, le démarrage et la fin d'une séance fonctionnent sans réseau : heure appareil conservée, action mise en file, heure serveur ajoutée à la réception |

Les apps n'accèdent jamais directement à la base : tout passe par l'API, qui applique les rôles et écrit le journal d'audit.

## 3. Rôles et sécurité

| Rôle | App | Voit | Ne voit jamais |
| --- | --- | --- | --- |
| Parent | Mobile | Ses enfants, demandes, séances, présences, comptes rendus, paiements, réclamations | Les données d'un autre enfant |
| Enseignant | Mobile | Demandes compatibles, candidatures, ses séances et élèves, ses revenus | Les paiements des parents, les autres élèves |
| Partenaire | Web | Ses enseignants rattachés, leurs séances, présences, versements à autoriser, réclamations reçues | Tout ce qui sort de son réseau |
| Admin | Web | Toute la plateforme, journal d'audit | — |

- Vérification des permissions côté serveur à chaque requête.
- Un parent peut toujours écrire directement à l'administration.
- Audit obligatoire : corrections de présence, statuts de paiement, autorisations partenaire, décisions sur réclamations, changements de rôle.
- Collecte minimale sur les enfants : prénom et classe.
- Géolocalisation : non implémentée (décision ouverte).

## 4. Classes et matières

- Primaire : SIL, CP, CE1, CE2, CM1, CM2 → la demande couvre **toutes les matières**.
- Secondaire : 6e, 5e, 4e, 3e, 2nde, 1re, Terminale → le parent choisit au moins une matière parmi Maths, Physique-Chimie, SVT, Français, Anglais, Histoire-Géographie, Philosophie (Terminale), Informatique, Allemand, Espagnol.
- Référentiel exposé par `GET /api/referentiel`.

## 5. Modèle de données

Défini dans `packages/db/src/schema.ts` : users, partners, children, teacher_profiles, diplomas, availabilities, course_requests (quartier + ville du domicile), applications (max 10 par demande), bookings, sessions (heures appareil + serveur), attendances, session_reports, correction_requests, billing_cycles, parent_payments, teacher_payouts, complaints, complaint_messages, notifications, audit_logs.

Une présence ou un horaire passé n'est jamais écrasé : toute modification passe par `correction_requests` puis `audit_logs`.

## 6. Règles métier (codées dans `packages/shared`)

**Recherche.** Max 10 candidatures par demande ; seuls les enseignants compatibles (classe, matière, quartier, disponibilités) voient la demande ; profils présentés un par un ou deux par deux ; le choix ferme la demande et les autres candidatures ; un créneau confirmé bloque tout chevauchement ; un diplôme non vérifié s'affiche « déclaré ».

**Séance à domicile.** Appel → démarrer → terminer, horodatés ; « Démarrer » bloqué tant que chaque enfant n'a pas de statut ; notification au parent pour son enfant uniquement ; compte rendu visible à la clôture ; mention « déclaré par l'enseignant », jamais présenté comme preuve de présence physique ; corrections motivées, décidées par l'admin, historisées.

**Paiements.** Cycle de 30 jours depuis la date de démarrage ; modes intégral (J30), 50/50 (J15 + J30), flexible ; commission 20 % (50 000 → 10 000 → 40 000), base de calcul à confirmer ; versements : TO_COMPUTE → PENDING_VALIDATION → AUTHORIZED → PROCESSING → PAID (+ FAILED, BLOCKED_DISPUTE, CANCELLED) ; PAID seulement avec confirmation du prestataire ; enseignant indépendant validé par l'admin, rattaché autorisé par son partenaire.

**Réclamations.** Destinataire partenaire, admin ou les deux ; numéro, catégorie, responsable, statut, historique ; rejet toujours motivé ; « sécurité de l'enfant » toujours à l'admin en priorité haute.

## 7. Écrans

Les maquettes sont dans `design/` (ouvrir les `.dc.html` dans un navigateur). Les écrans qui montrent un « centre » ou un cours collectif sont à adapter au format domicile.

- Parent : Bienvenue, Inscription, Connexion, Code SMS, Mot de passe oublié, Accueil vide, Tableau de bord, Enfants, Fiche enfant, Nouvelle demande, Mes demandes, Profils candidats, Profil détaillé, Confirmation, Calendrier, Suivi de séance, Présences, Notifications, Réservation, Report, Annulation, Avis (flag), Paiements, Payer, Reçus, Réclamations (liste, nouvelle, détail), Compte, pages de réussite.
- Enseignant : Inscription, Vérification, Profil, Disponibilités, Compte, Accueil, Demandes, Détail demande, Candidatures, Conditions, Notifications, Calendrier, Séance, Appel, Compte rendu, Correction, Empêchement, Historique, Revenus, Détail paiement, pages de réussite.
- Partenaire (web) : paiements à valider ; à concevoir : tableau de bord, enseignants, code de rattachement, séances, réclamations, rapports.
- Admin (web) : vue globale ; à concevoir : utilisateurs, partenaires, demandes, séances et corrections, paiements, litiges, statistiques, audit.

Navigation mobile : onglets Parent (Accueil, Calendrier, Paiements, Réclamations) et Enseignant (Accueil, Demandes, Calendrier, Revenus, Profil).

## 8. Plan

0. **Socle** — monorepo, apps qui démarrent, base + migrations + seed, règles métier testées, CI. *(fait le 11/10/2026)*
1. **Comptes et recherche** — inscription/connexion + OTP, rôles, enfants, demandes, candidatures, présentation, choix.
2. **Calendrier et séances** — réservation, génération des séances, conflits, appel/démarrer/terminer, hors ligne.
3. **Suivi et réclamations** — comptes rendus, notifications, corrections + audit, réclamations.
4. **Paiements (sans argent réel)** — cycles, modes, reçus, commission, versements.
5. **Partenaires et admin** — autorisations, litiges, statistiques, audit.
6. **Améliorations** — après décisions.

Chaque phase se termine par une démo sur les données de seed, des tests verts, et une validation avant la suivante.
