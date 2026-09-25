"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.register(email, password, name);
      setToken(access_token);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Hesap oluştur</div>
        <input className="input" placeholder="Ad" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" type="email" placeholder="E-posta" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Şifre (en az 8 karakter)" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div style={{ color: "#d6362b", fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Oluşturuluyor…" : "Kayıt ol"}
        </button>
      </form>
    </main>
  );
}
