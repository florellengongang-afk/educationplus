import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { schema as s } from "@educationplus/db";
import { GRADE_LABELS, SUBJECT_LABELS, productConfig } from "@educationplus/shared";
import { db } from "@/lib/db";
import { previewAllowed } from "@/lib/preview";

export default function AdminPage() {
  if (!previewAllowed()) notFound();
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Administration">
        <span className="brand">
          Education<span>Plus</span>
        </span>
        <a href="/admin" aria-current="page">Vue globale</a>
        <a href="/partenaire">Espace partenaire</a>
      </nav>
      <main className="content">
        <div>
          <p className="muted" style={{ margin: 0 }}>Répétiteurs à domicile · Cameroun</p>
          <h1 style={{ margin: "4px 0 0", fontSize: 34 }}>Vue globale</h1>
        </div>
        <Suspense fallback={<p className="muted">Chargement des indicateurs…</p>}>
          <Kpis />
        </Suspense>
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>Demandes ouvertes</h2>
          <Suspense fallback={<p className="muted">Chargement…</p>}>
            <OpenRequests />
          </Suspense>
        </section>
        <Decisions />
      </main>
    </div>
  );
}

async function Kpis() {
  await connection();
  const [[parents], [teachers], [open], [apps]] = await Promise.all([
    db.select({ n: count() }).from(s.users).where(eq(s.users.role, "PARENT")),
    db.select({ n: count() }).from(s.teacherProfiles),
    db.select({ n: count() }).from(s.courseRequests).where(eq(s.courseRequests.status, "OPEN")),
    db.select({ n: count() }).from(s.applications),
  ]);
  const items = [
    { label: "Parents inscrits", value: parents?.n ?? 0 },
    { label: "Enseignants", value: teachers?.n ?? 0 },
    { label: "Demandes ouvertes", value: open?.n ?? 0 },
    { label: "Candidatures reçues", value: apps?.n ?? 0 },
  ];
  return (
    <div className="kpis">
      {items.map((k) => (
        <div className="card" key={k.label}>
          <div className="muted">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

async function OpenRequests() {
  await connection();
  const rows = await db
    .select({
      id: s.courseRequests.id,
      grade: s.courseRequests.grade,
      subjects: s.courseRequests.subjects,
      neighbourhood: s.courseRequests.neighbourhood,
      city: s.courseRequests.city,
      startDate: s.courseRequests.startDate,
      child: s.children.firstName,
    })
    .from(s.courseRequests)
    .innerJoin(s.children, eq(s.children.id, s.courseRequests.childId))
    .where(eq(s.courseRequests.status, "OPEN"))
    .orderBy(desc(s.courseRequests.createdAt))
    .limit(20);

  if (rows.length === 0) return <p className="muted">Aucune demande ouverte.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Enfant</th>
            <th>Classe</th>
            <th>Matières</th>
            <th>Domicile</th>
            <th>Début</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.child}</td>
              <td>{GRADE_LABELS[r.grade]}</td>
              <td>{r.subjects.map((x) => SUBJECT_LABELS[x]).join(", ")}</td>
              <td>
                {r.neighbourhood}, {r.city}
              </td>
              <td>{r.startDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Decisions() {
  const open = [
    productConfig.commissionBasis === null && "Base de calcul de la commission de 20 %",
    productConfig.partnerShareRate === null && "Rémunération éventuelle du partenaire",
    !productConfig.blockVoluntaryAdvanceAfterDay20 && "Règle des avances après le jour 20 (désactivée)",
    "Absences, annulations et remboursements",
    "Prestataire de paiement et moyens acceptés",
  ].filter(Boolean) as string[];
  return (
    <section className="decisions">
      <h2 style={{ marginTop: 0, fontSize: 20 }}>Décisions à confirmer</h2>
      <p style={{ margin: 0 }}>Ces règles ne sont pas programmées tant qu&apos;elles ne sont pas validées.</p>
      <ul>
        {open.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </section>
  );
}
