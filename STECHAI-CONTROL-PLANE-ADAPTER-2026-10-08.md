# STECHAI — Senatech Control Plane Adapter

Project ID: `stechai`
Branch: `codex/k7-stech-control-plane-adapter-20261008`

## Yerel kapsam

- `backend/app/services/senatech_control_plane_adapter.py` eklendi.
- Adapter mevcut chat, rezervasyon ve ödeme yollarına varsayılan olarak bağlanmaz.
- Transport yalnız trusted caller tarafından açıkça inject edilir.
- Tenant/request-id doğrulanır ve proje kimliği `stechai` olarak sabitlenir.
- `local_only=true`, `allow_cloud=false`, `shadow_only=true` zorunludur.
- Rezervasyon, satın alma, finansal ve trading eylemleri ağ/transport çağrısından önce reddedilir.
- Mismatched request ID ve tamamlanmamış response fail-closed reddedilir.

## Kirli ana çalışma alanı politikası

Ana `STECHAİ\stech-ai` çalışma ağacındaki mevcut rezervasyon/ödeme değişikliklerine dokunulmadı. Adapter ayrı bir worktree’de yalnız mevcut HEAD üzerine hazırlanmıştır. Merge, push ve canlı endpoint bağlantısı yapılmamıştır.

## Yerel kabul

- Adapter testleri: 4 test.
- Gerçek DB, payment provider, reservation provider, Control Plane ve production auth kabulü bu commit ile iddia edilmez.
