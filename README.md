# ECRN yönetim paneli

https://hakanofis.github.io/Ecrn-v2/ sitesinin metinlerini, fotoğraflarını ve firma bilgilerini düzenlemek için panel.

- Adres: https://hakanofis.github.io/ecrn-panel/
- Giriş: kullanıcı adı ve şifre (yöneticiden alınır).
- "Yayınla" değişiklikleri `HakanOfis/Ecrn-v2` deposuna tek commit olarak yazar; site 1–2 dakika içinde güncellenir.

## Nasıl çalışır

- İçerik: `Ecrn-v2/src/content/site.json`, fotoğraflar: `Ecrn-v2/src/assets/img/`.
- Panelin GitHub anahtarı kullanıcı adı + şifreyle (PBKDF2-SHA256, 2.000.000 tur → AES-256-GCM) kilitlenip `Ecrn-v2/cms/panel-config.json` dosyasında saklanır. Şifre kodda yoktur.
- Anahtar sadece `Ecrn-v2` deposuna yetkili bir **fine-grained** anahtar olmalıdır (Contents: Read and write, Actions: Read-only).

## İlk kurulum / anahtar yenileme

1. https://github.com/settings/personal-access-tokens/new → sadece `HakanOfis/Ecrn-v2`, izinler yukarıdaki gibi.
2. Panelde `#kurulum` sayfasını açın: https://hakanofis.github.io/ecrn-panel/#kurulum
3. Anahtarı, kullanıcı adını ve şifreyi girip "Kontrol et ve kaydet".

Anahtarın süresi dolarsa ya da şifre değişecekse aynı adımları tekrarlayın.

## Geliştirme

```bash
npm install
npm run dev
npm run build
```
