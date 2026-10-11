import Link from "next/link";

export default function Home() {
  return (
    <main className="content" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 40, marginBottom: 0 }}>
        Education<span style={{ color: "var(--primary)" }}>Plus</span>
      </h1>
      <p className="muted" style={{ fontSize: 17 }}>
        Répétiteurs à domicile, du SIL à la Terminale. Les parents et les enseignants utilisent l&apos;application
        mobile ; cet espace web sert aux partenaires et à l&apos;administration.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="card" href="/admin" style={{ textDecoration: "none", color: "inherit", flex: "1 1 240px" }}>
          <strong>Espace Administrateur</strong>
          <p className="muted">Vue globale, utilisateurs, demandes, décisions à confirmer.</p>
        </Link>
        <Link className="card" href="/partenaire" style={{ textDecoration: "none", color: "inherit", flex: "1 1 240px" }}>
          <strong>Espace Partenaire</strong>
          <p className="muted">Enseignants rattachés et paiements à autoriser.</p>
        </Link>
      </div>
    </main>
  );
}
