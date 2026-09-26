import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Stech AI</h1>
        <p className="text-xl text-slate-300 mb-8">
          Türkçe konuşan kullanıcılar için AI asistan platformu
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-slate-700 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">💬 Sohbet</h2>
            <p className="text-slate-300">AI asistanınız ile Türkçe sohbet edin</p>
          </div>

          <div className="bg-slate-700 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">🍽️ Rezervasyon</h2>
            <p className="text-slate-300">Masa rezervasyonu yapın</p>
          </div>

          <div className="bg-slate-700 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">📦 Ön Sipariş</h2>
            <p className="text-slate-300">Önceden sipariş verin</p>
          </div>
        </div>

        <div className="mt-16">
          <a href="/chat" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg mr-4">
            Başlayın
          </a>
          <a href="/waitlist" className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg">
            Bekleme Listesine Katılın
          </a>
        </div>
      </div>
    </main>
  );
}
