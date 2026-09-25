import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="container">
      <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", gap: 16, flexGrow: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Stech AI</div>
        <div style={{ fontSize: 16, color: "#6b6560" }}>
          Türkçe konuşan, sohbetten belge analizine, yemek ve otelden acil
          duruma kadar günlük hayatına hazır tek asistan.
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <Link href="/register" className="btn-primary" style={{ textDecoration: "none", flexGrow: 1, textAlign: "center" }}>
            Ücretsiz başla
          </Link>
          <Link href="/login" style={{ padding: "14px", textAlign: "center", flexGrow: 1 }}>
            Giriş yap
          </Link>
        </div>
      </div>
    </main>
  );
}
