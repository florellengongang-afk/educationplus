import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { schema as s } from "@educationplus/db";
import { GRADE_LABELS, SUBJECT_LABELS } from "@educationplus/shared";
import { db } from "@/lib/db";
import { previewAllowed } from "@/lib/preview";

export default function PartnerPage() {
  if (!previewAllowed()) notFound();
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Partenaire">
        <span className="brand">
          Education<span>Plus</span>
        </span>
        <a href="/partenaire" aria-current="page">Mes enseignants</a>
        <a href="/admin">Vue administrateur</a>
      </nav>
      <main className="content">
        <h1 style={{ margin: 0, fontSize: 34 }}>Enseignants rattachés</h1>
        <p className="muted" style={{ margin: 0 }}>
          Aperçu de développement : l&apos;espace sera filtré sur le partenaire connecté dès la phase 1.
        </p>
        <section className="card">
          <Suspense fallback={<p className="muted">Chargement…</p>}>
            <Teachers />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

async function Teachers() {
  await connection();
  const rows = await db
    .select({
      id: s.teacherProfiles.id,
      name: s.users.name,
      partner: s.partners.name,
      subjects: s.teacherProfiles.subjects,
      grades: s.teacherProfiles.grades,
      zones: s.teacherProfiles.zones,
    })
    .from(s.teacherProfiles)
    .innerJoin(s.users, eq(s.users.id, s.teacherProfiles.userId))
    .innerJoin(s.partners, eq(s.partners.id, s.teacherProfiles.partnerId));

  if (rows.length === 0) return <p className="muted">Aucun enseignant rattaché.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Enseignant</th>
            <th>Réseau</th>
            <th>Matières</th>
            <th>Classes</th>
            <th>Quartiers</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>
                <span className="chip">{r.partner}</span>
              </td>
              <td>{r.subjects.map((x) => SUBJECT_LABELS[x]).join(", ")}</td>
              <td>{r.grades.map((g) => GRADE_LABELS[g]).join(", ")}</td>
              <td>{r.zones.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
