# Décisions — EducationPlus

Ce fichier trace les décisions prises et celles qui restent ouvertes. Une règle ouverte n'est **jamais** codée de façon définitive : elle vit dans `packages/shared/src/config.ts` (désactivée, `null` ou abstraite).

## Décisions prises

| Date | Décision | Effet dans le code |
| --- | --- | --- |
| 11/10/2026 | **Uniquement des répétiteurs à domicile.** Plus de centres de cours ni de cours collectifs en centre. | `productConfig.courseFormat = "HOME"` ; la demande porte un quartier + une ville ; aucun champ « centre ». |
| 11/10/2026 | **Classes couvertes : primaire (SIL → CM2) et secondaire (6e → Terminale).** | `packages/shared/src/levels.ts` |
| 11/10/2026 | **Primaire : toutes les matières.** Le parent ne choisit pas de matière. | `normalizeSubjects()` force `TOUTES_MATIERES` |
| 11/10/2026 | **Secondaire : le parent choisit une ou plusieurs matières.** | `subjectsForGrade()`, au moins une matière exigée |
| 11/10/2026 | ORM : **Drizzle** au lieu de Prisma (proposé dans le brief). | Pas de moteur binaire à télécharger ; migrations SQL lisibles dans `packages/db/migrations`. Réversible si besoin. |
| Cahier des charges | Commission 20 %, max 10 candidatures, cycle 30 jours, 3 modes de paiement, statuts de versement, autorisé ≠ payé. | Codé et testé dans `packages/shared` |

## Hypothèses à confirmer (prises pour avancer)

| Hypothèse | Où |
| --- | --- |
| La philosophie n'est proposée qu'en Terminale. | `SUBJECT_MIN_GRADE` dans `levels.ts` |
| Liste des matières du secondaire : Maths, Physique-Chimie, SVT, Français, Anglais, Histoire-Géographie, Philosophie, Informatique, Allemand, Espagnol. | `SECONDARY_SUBJECTS` |
| Une demande = un enfant. Frères et sœurs : une demande chacun (une séance peut ensuite regrouper plusieurs enfants d'une même famille). | `courseRequestSchema`, `SessionState.childIds` |
| Seul le sous-système francophone est couvert (pas Class 1–6 / Form 1–5 / Sixth Form). | `levels.ts` |
| Identifiant d'application `cm.educationplus.app` (provisoire). | `apps/mobile/app.json` |
| Réclamation d'un parent dont l'enseignant est indépendant : envoyée à l'administration (pas de partenaire). | `routeComplaint()` |

## Décisions ouvertes (cahier des charges §13)

1. Plateformes au lancement (Android seul ? iOS ? web ?) — Expo couvre Android et iOS.
2. Qui fixe les tarifs — `teacher_profiles.monthly_rate` nullable.
3. Moyens de paiement au Cameroun — aucun prestataire branché, `provider = "FAKE"`.
4. Base de calcul des 20 % — `productConfig.commissionBasis = null`.
5. Commission partenaire — `productConfig.partnerShareRate = null`.
6. Frais du prestataire — `teacher_payouts.provider_fee` nullable.
7. Retards de paiement — statut seulement, aucune pénalité.
8. Absences de l'enfant, annulations — aucun effet financier automatique.
9. Remboursements — traitement manuel admin.
10. Vérification des diplômes et de l'identité — statuts posés à la main.
11. « Pas d'avance après J20 » — flag `blockVoluntaryAdvanceAfterDay20` désactivé.
12. Séances reportées dans le cycle — cycle inchangé.
13. Avis des parents — flag `parentReviewsEnabled` désactivé.
14. Délais de traitement des réclamations — `complaints.due_at` nullable.
15. Géolocalisation / confirmation parentale — non implémenté.

Autres points : moment du partage des coordonnées de la famille avec l'enseignant ; délai minimal d'un report ; effet d'une absence de l'enseignant ; blocage automatique d'un versement par une réclamation (aujourd'hui manuel).

## À mettre à jour hors code

Les maquettes (`design/`) et le brief montrent encore des cours « en centre » et des cours collectifs : ces écrans sont à revoir pour le format domicile uniquement.
