// Formulierstructuur van het paneel (Turkse labels). Paden zijn relatief t.o.v. content[taal].
// type: text | textarea | list (lijst met tekst) | items (lijst met objecten)
// fixed: aantal ligt vast omdat de site er iconen/foto's per positie aan koppelt.

export const LANGS = [
  { code: "nl", label: "Felemenkçe (NL)", short: "NL" },
  { code: "fr", label: "Fransızca (FR)", short: "FR" },
  { code: "en", label: "İngilizce (EN)", short: "EN" },
  { code: "tr", label: "Türkçe (TR)", short: "TR" },
];

export const COMPANY_FIELDS = [
  { key: "name", label: "Firma adı (kısa)" },
  { key: "legal", label: "Resmî unvan", hint: "Sayfanın en altındaki telif satırında görünür." },
  { key: "contactPerson", label: "Yetkili kişi" },
  { key: "phone", label: "Telefon (arama ve WhatsApp için)", hint: "Ülke koduyla: +32 489 15 53 16" },
  { key: "phoneDisplay", label: "Telefon (sitede görünen hâli)" },
  { key: "email", label: "E-posta" },
  { key: "street", label: "Adres – sokak" },
  { key: "city", label: "Adres – posta kodu ve şehir" },
  { key: "mapQuery", label: "Harita için tam adres" },
];

export const IMAGE_SLOTS = [
  { key: "hero", label: "Ana bölüm arka planı", hint: "Karartılarak kullanılır." },
  { key: "service1", label: "Hizmet 1 fotoğrafı" },
  { key: "service2", label: "Hizmet 2 fotoğrafı" },
  { key: "service3", label: "Hizmet 3 fotoğrafı" },
  { key: "process", label: "Çalışma şekli fotoğrafı" },
  { key: "area", label: "Hizmet bölgesi arka planı" },
  { key: "faq", label: "SSS fotoğrafı" },
];

export const SECTIONS = [
  {
    id: "hero",
    title: "Ana bölüm (en üst)",
    fields: [
      { path: "hero.tag", label: "Üstteki küçük etiket" },
      { path: "hero.h1", label: "Büyük başlık satırları", type: "list", fixed: 3, hint: "3. satır turuncu görünür." },
      { path: "hero.sub", label: "Başlık altı metni", type: "textarea" },
      { path: "hero.cta1", label: "Turuncu buton" },
      { path: "hero.cta2", label: "İkinci buton" },
      { path: "hero.stats", label: "Alttaki 4 kutu", type: "items", fixed: 4, fields: [{ key: "v", label: "Büyük yazı" }, { key: "l", label: "Alt yazı" }] },
    ],
  },
  {
    id: "strip",
    title: "Turuncu kayan bant",
    fields: [{ path: "strip", label: "Bant yazıları", type: "list" }],
  },
  {
    id: "services",
    title: "Hizmetler",
    fields: [
      { path: "services.tag", label: "Küçük başlık" },
      { path: "services.h2", label: "Başlık" },
      { path: "services.p", label: "Açıklama", type: "textarea" },
      {
        path: "services.items",
        label: "Hizmet kartları",
        type: "items",
        fixed: 3,
        fields: [
          { key: "title", label: "Hizmet adı" },
          { key: "text", label: "Açıklama", type: "textarea" },
          { key: "points", label: "Maddeler", type: "list" },
        ],
      },
      { path: "services.more", label: "Kart altındaki bağlantı yazısı" },
    ],
  },
  {
    id: "fluvius",
    title: "Fluvius bölümü",
    fields: [
      { path: "fluvius.tag", label: "Küçük başlık" },
      { path: "fluvius.h2", label: "Başlık" },
      { path: "fluvius.p", label: "Açıklama", type: "textarea" },
      { path: "fluvius.points", label: "3 madde", type: "items", fixed: 3, fields: [{ key: "h", label: "Başlık" }, { key: "p", label: "Açıklama", type: "textarea" }] },
      { path: "fluvius.profileTitle", label: "Kanal çizimi başlığı" },
      { path: "fluvius.layers", label: "Kanal katmanları (yukarıdan aşağı)", type: "list", fixed: 5 },
      { path: "fluvius.profileNote", label: "Çizim altı notu", type: "textarea" },
    ],
  },
  {
    id: "process",
    title: "Çalışma şekli (adımlar)",
    fields: [
      { path: "process.tag", label: "Küçük başlık" },
      { path: "process.h2", label: "Başlık" },
      { path: "process.steps", label: "Adımlar", type: "items", fields: [{ key: "h", label: "Adım adı" }, { key: "p", label: "Açıklama", type: "textarea" }] },
    ],
  },
  {
    id: "why",
    title: "Neden ECRN?",
    fields: [
      { path: "why.tag", label: "Küçük başlık" },
      { path: "why.h2", label: "Başlık" },
      { path: "why.items", label: "4 kart", type: "items", fixed: 4, fields: [{ key: "h", label: "Başlık" }, { key: "p", label: "Açıklama", type: "textarea" }] },
    ],
  },
  {
    id: "area",
    title: "Hizmet bölgesi",
    fields: [
      { path: "area.tag", label: "Küçük başlık" },
      { path: "area.h2", label: "Başlık" },
      { path: "area.p", label: "Açıklama", type: "textarea" },
      { path: "area.regions", label: "Bölgeler", type: "list" },
      { path: "area.base", label: "Haritadaki alt yazı (Lokeren altında)" },
    ],
  },
  {
    id: "faq",
    title: "Sık sorulan sorular",
    fields: [
      { path: "faq.tag", label: "Küçük başlık" },
      { path: "faq.h2", label: "Başlık" },
      { path: "faq.items", label: "Sorular", type: "items", fields: [{ key: "q", label: "Soru" }, { key: "a", label: "Cevap", type: "textarea" }] },
    ],
  },
  {
    id: "contact",
    title: "İletişim ve teklif formu",
    fields: [
      { path: "contact.tag", label: "Küçük başlık" },
      { path: "contact.h2", label: "Başlık" },
      { path: "contact.lead", label: "Açıklama", type: "textarea" },
      { path: "contact.hours", label: "Çalışma saatleri" },
      { path: "contact.emailNote", label: "E-posta kutusundaki not" },
      { path: "contact.whatsappNote", label: "WhatsApp kutusundaki not" },
      { path: "contact.form.h3", label: "Form başlığı" },
      { path: "contact.form.infoPlaceholder", label: "Proje bilgisi kutusundaki örnek yazı" },
      { path: "contact.form.sendWa", label: "WhatsApp butonu" },
      { path: "contact.form.sendMail", label: "E-posta butonu" },
      { path: "contact.form.greeting", label: "Mesajın başındaki selam" },
      { path: "contact.form.closing", label: "Mesajın sonundaki cümle" },
      { path: "contact.form.error", label: "Eksik alan uyarısı" },
      { path: "contact.form.note", label: "Form altı notu", type: "textarea" },
    ],
  },
  {
    id: "general",
    title: "Genel: menü, alt bilgi, Google",
    fields: [
      { path: "tagline", label: "Logonun altındaki yazı" },
      { path: "nav.services", label: "Menü: Hizmetler" },
      { path: "nav.fluvius", label: "Menü: Fluvius" },
      { path: "nav.process", label: "Menü: Çalışma şekli" },
      { path: "nav.area", label: "Menü: Bölge" },
      { path: "nav.contact", label: "Menü: İletişim" },
      { path: "nav.cta", label: "Menüdeki turuncu buton" },
      { path: "footer.brand", label: "Alt bilgi açıklaması", type: "textarea" },
      { path: "footer.rights", label: "Telif yazısı" },
      { path: "waBubble", label: "WhatsApp balonundaki yazı" },
      { path: "waMessage", label: "WhatsApp'ta hazır gelen mesaj" },
      { path: "meta.title", label: "Google başlığı (sekme adı)", hint: "60 karakteri geçmemesi önerilir." },
      { path: "meta.description", label: "Google açıklaması", type: "textarea", hint: "150–160 karakter önerilir." },
    ],
  },
];
