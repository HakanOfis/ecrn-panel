import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Trash2,
  Type,
  Upload,
} from "lucide-react";

import logo from "@/logo.webp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_PATH, IMG_DIR, OWNER, PANEL_CONFIG_PATH, RAW_BASE, REPO, SITE_URL } from "@/config";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { checkToken, commitFiles, latestDeploy, loadContent, loadPanelConfig, putFile, utf8ToBase64 } from "@/lib/github";
import { prepareImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { COMPANY_FIELDS, IMAGE_SLOTS, LANGS, SECTIONS } from "@/schema";

const SESSION_KEY = "ecrn.panel.session";

/* ───────── hulpfuncties ───────── */

const getAt = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

function setAt(obj, path, value) {
  const copy = structuredClone(obj);
  const keys = path.split(".");
  let o = copy;
  for (const k of keys.slice(0, -1)) o = o[k];
  o[keys.at(-1)] = value;
  return copy;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function readSession() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(token) {
  try {
    if (token) window.sessionStorage.setItem(SESSION_KEY, token);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessie niet beschikbaar
  }
}

/* ───────── gedeelde opmaak ───────── */

function Shell({ children, wide = false }) {
  return (
    <div className="min-h-svh bg-[radial-gradient(ellipse_at_top,#1b2d52,#0a1222_60%)] px-4 py-10">
      <div className={cn("mx-auto", wide ? "max-w-2xl" : "max-w-sm")}>
        <div className="mb-8 flex items-center justify-center gap-3 text-white">
          <span className="grid size-12 place-items-center rounded-xl bg-white p-1">
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </span>
          <span>
            <span className="block font-heading text-2xl font-black">ECRN</span>
            <span className="block text-xs tracking-widest text-white/60 uppercase">Yönetim paneli</span>
          </span>
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}

function Notice({ tone = "info", children }) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-sm",
        tone === "error" && "bg-red-50 text-red-700",
        tone === "ok" && "bg-emerald-50 text-emerald-800",
        tone === "info" && "bg-accent text-foreground/80",
      )}
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}

/* ───────── inloggen ───────── */

function Login({ onLoggedIn }) {
  const [config, setConfig] = useState(undefined);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPanelConfig()
      .then(setConfig)
      .catch(() => setConfig(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!config) return;
    setBusy(true);
    setError(null);
    const token = await decryptToken(config, user, pass);
    if (!token) {
      setBusy(false);
      setError("Kullanıcı adı veya şifre hatalı.");
      return;
    }
    writeSession(token);
    onLoggedIn(token);
  };

  return (
    <Shell>
      <h1 className="text-2xl font-black text-navy">Giriş yap</h1>
      {config === undefined ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Yükleniyor…
        </p>
      ) : config === null ? (
        <div className="mt-6 space-y-4">
          <Notice>Panel henüz kurulmamış. İlk kurulumu yapmak için aşağıdaki bağlantıyı kullanın.</Notice>
          <a href="#kurulum" className="inline-flex items-center gap-2 text-sm font-semibold text-navy underline">
            <KeyRound className="size-4" /> İlk kurulum
          </a>
        </div>
      ) : config === false ? (
        <div className="mt-6">
          <Notice tone="error">GitHub'a ulaşılamadı. İnternet bağlantınızı kontrol edip sayfayı yenileyin.</Notice>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="user">Kullanıcı adı</Label>
            <Input id="user" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pass">Şifre</Label>
            <Input id="pass" type="password" inputMode="numeric" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} className="h-12 rounded-xl" />
          </div>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Button type="submit" disabled={busy || !user || !pass} className="h-12 rounded-xl text-base">
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Kontrol ediliyor…
              </>
            ) : (
              "Giriş"
            )}
          </Button>
          {busy ? <p className="text-center text-xs text-muted-foreground">Güvenlik için bu işlem birkaç saniye sürebilir.</p> : null}
        </form>
      )}
    </Shell>
  );
}

/* ───────── eerste installatie ───────── */

function Setup() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState("Hidayet");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (pass !== pass2) return setMsg({ tone: "error", text: "Şifreler aynı değil." });
    if (!token.trim().startsWith("github_pat_"))
      return setMsg({ tone: "error", text: "Lütfen “Fine-grained” türünde bir anahtar kullanın (github_pat_ ile başlar). Klasik anahtarlar tüm depolara erişebildiği için kabul edilmiyor." });
    setBusy(true);
    try {
      const t = token.trim();
      const check = await checkToken(t);
      if (!check.canPush) throw new Error(`Bu anahtarın ${REPO} deposuna yazma izni yok (Contents: Read and write gerekli).`);
      if (check.otherRepos.length)
        throw new Error(`Bu anahtar başka gizli depolara da erişebiliyor (${check.otherRepos.join(", ")}). Güvenlik için “Only select repositories” ile sadece ${REPO} seçilmeli.`);
      setMsg({ tone: "info", text: "Anahtar şifreleniyor… (birkaç saniye)" });
      const config = await encryptToken(t, user, pass);
      await putFile(t, PANEL_CONFIG_PATH, utf8ToBase64(JSON.stringify(config, null, 2) + "\n"), "Panel: şifreli anahtar kaydedildi");
      setToken("");
      setPass("");
      setPass2("");
      setMsg({ tone: "ok", text: "Kurulum tamamlandı. Artık kullanıcı adı ve şifreyle giriş yapılabilir." });
    } catch (err) {
      setMsg({ tone: "error", text: err.message || "Bir hata oluştu." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell wide>
      <h1 className="text-2xl font-black text-navy">İlk kurulum</h1>
      <p className="mt-2 text-sm text-muted-foreground">Bu işlem bir kez yapılır. Anahtar, kullanıcı adı ve şifreyle kilitlenip {REPO} deposuna kaydedilir.</p>

      <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-foreground/80">
        <li>
          GitHub'da{" "}
          <a className="font-semibold text-navy underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">
            yeni fine-grained anahtar
          </a>{" "}
          oluşturun.
        </li>
        <li>
          <b>Repository access:</b> “Only select repositories” → sadece <b>{OWNER}/{REPO}</b>.
        </li>
        <li>
          <b>Permissions:</b> Contents → <b>Read and write</b>; Actions → <b>Read-only</b> (yayın durumunu göstermek için).
        </li>
        <li>Oluşan anahtarı (github_pat_…) aşağıya yapıştırın.</li>
      </ol>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tok">GitHub anahtarı</Label>
          <Input id="tok" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" className="h-11 rounded-xl font-mono" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="su">Kullanıcı adı</Label>
            <Input id="su" value={user} onChange={(e) => setUser(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sp">Şifre</Label>
            <Input id="sp" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sp2">Şifre (tekrar)</Label>
            <Input id="sp2" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
        {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !token || !user || !pass} className="h-11 rounded-xl px-5">
            {busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Kontrol et ve kaydet
          </Button>
          <a href="#" className="text-sm font-semibold text-navy underline">
            Girişe dön
          </a>
        </div>
      </form>
    </Shell>
  );
}

/* ───────── velden ───────── */

function Hint({ children }) {
  return children ? <p className="text-xs text-muted-foreground">{children}</p> : null;
}

function Reference({ value }) {
  if (typeof value !== "string" || !value) return null;
  return <p className="text-xs text-muted-foreground/80 italic">NL: {value}</p>;
}

function TextInput({ id, value, onChange, multiline, changed }) {
  const cls = cn("rounded-xl bg-white", changed && "border-orange ring-2 ring-orange/25");
  return multiline ? (
    <Textarea id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cn(cls, "min-h-24")} />
  ) : (
    <Input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={cn(cls, "h-11")} />
  );
}

function ListEditor({ value = [], onChange, fixed, original }) {
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs font-semibold text-muted-foreground">{i + 1}</span>
          <Input
            value={v}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
            className={cn("h-10 rounded-xl bg-white", original?.[i] !== v && "border-orange ring-2 ring-orange/25")}
          />
          {!fixed ? (
            <div className="flex shrink-0">
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Yukarı">
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Aşağı">
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Sil">
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ) : null}
        </div>
      ))}
      {!fixed ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])} className="rounded-lg">
          <Plus /> Satır ekle
        </Button>
      ) : null}
    </div>
  );
}

function ItemsEditor({ field, value = [], onChange, original }) {
  const blank = Object.fromEntries(field.fields.map((f) => [f.key, f.type === "list" ? [] : ""]));
  const update = (i, key, v) => onChange(value.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-2xl border border-border bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-navy">#{i + 1}</span>
            {!field.fixed ? (
              <div className="flex">
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Yukarı">
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Aşağı">
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Sil">
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ) : null}
          </div>
          <div className="grid gap-3">
            {field.fields.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label className="text-xs">{f.label}</Label>
                {f.type === "list" ? (
                  <ListEditor value={item[f.key]} onChange={(v) => update(i, f.key, v)} original={original?.[i]?.[f.key]} />
                ) : (
                  <TextInput value={item[f.key]} onChange={(v) => update(i, f.key, v)} multiline={f.type === "textarea"} changed={original?.[i]?.[f.key] !== item[f.key]} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!field.fixed ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, blank])} className="rounded-lg">
          <Plus /> Ekle
        </Button>
      ) : null}
    </div>
  );
}

/* ───────── tabbladen ───────── */

function TextsTab({ draft, original, setDraft }) {
  const [lang, setLang] = useState("tr");
  const [sectionId, setSectionId] = useState(SECTIONS[0].id);
  const section = SECTIONS.find((s) => s.id === sectionId);
  const base = `content.${lang}`;

  const sectionChanged = (s, l) => s.fields.some((f) => !same(getAt(draft, `content.${l}.${f.path}`), getAt(original, `content.${l}.${f.path}`)));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {LANGS.map((l) => {
          const changed = SECTIONS.some((s) => sectionChanged(s, l.code));
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={cn(
                "relative rounded-full border px-4 py-2 text-sm font-semibold transition",
                lang === l.code ? "border-navy bg-navy text-white" : "border-border bg-white text-foreground/75 hover:border-navy/40",
              )}
            >
              {l.label}
              {changed ? <span className="absolute -top-1 -right-1 size-3 rounded-full bg-orange" /> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Her dil ayrı düzenlenir. Bir dilde yaptığınız değişiklik diğer dillere otomatik geçmez.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav className="hidden flex-col gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionId(s.id)}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                s.id === sectionId ? "bg-white font-semibold text-navy shadow-sm" : "text-foreground/70 hover:bg-white/60",
              )}
            >
              {s.title}
              {sectionChanged(s, lang) ? <span className="size-2 rounded-full bg-orange" /> : null}
            </button>
          ))}
        </nav>
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="h-11 rounded-xl border border-input bg-white px-3 text-sm font-semibold lg:hidden"
          aria-label="Bölüm"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black text-navy">{section.title}</h2>
          <div className="mt-6 grid gap-6">
            {section.fields.map((f) => {
              const path = `${base}.${f.path}`;
              const value = getAt(draft, path);
              const orig = getAt(original, path);
              const set = (v) => setDraft((d) => setAt(d, path, v));
              const id = `f-${f.path}`;
              return (
                <div key={f.path} className="grid gap-2">
                  <Label htmlFor={id}>{f.label}</Label>
                  {f.type === "list" ? (
                    <ListEditor value={value} onChange={set} fixed={f.fixed} original={orig} />
                  ) : f.type === "items" ? (
                    <ItemsEditor field={f} value={value} onChange={set} original={orig} />
                  ) : (
                    <TextInput id={id} value={value} onChange={set} multiline={f.type === "textarea"} changed={!same(value, orig)} />
                  )}
                  <Hint>{f.hint}</Hint>
                  {lang !== "nl" ? <Reference value={getAt(draft, `content.nl.${f.path}`)} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyTab({ draft, original, setDraft }) {
  return (
    <div className="max-w-2xl rounded-3xl bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-black text-navy">Firma bilgileri</h2>
      <p className="mt-1 text-sm text-muted-foreground">Bu bilgiler bütün dillerde aynı görünür.</p>
      <div className="mt-6 grid gap-5">
        {COMPANY_FIELDS.map((f) => (
          <div key={f.key} className="grid gap-2">
            <Label htmlFor={`c-${f.key}`}>{f.label}</Label>
            <TextInput
              id={`c-${f.key}`}
              value={draft.company[f.key]}
              onChange={(v) => setDraft((d) => setAt(d, `company.${f.key}`, v))}
              changed={draft.company[f.key] !== original.company[f.key]}
            />
            <Hint>{f.hint}</Hint>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagesTab({ draft, original, setDraft, uploads, setUploads, recent }) {
  const inputs = useRef({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const pick = async (slot, file) => {
    if (!file) return;
    setError(null);
    setBusy(slot);
    try {
      const img = await prepareImage(file);
      const name = `${slot}-${Date.now()}.${img.ext}`;
      setUploads((u) => ({ ...u, [slot]: { ...img, name } }));
      setDraft((d) => setAt(d, `images.${slot}`, name));
    } catch {
      setError("Bu dosya okunamadı. Lütfen JPG, PNG veya WebP formatında bir fotoğraf seçin.");
    } finally {
      setBusy(null);
    }
  };

  const undo = (slot) => {
    setUploads((u) => {
      const { [slot]: _, ...rest } = u;
      return rest;
    });
    setDraft((d) => setAt(d, `images.${slot}`, original.images[slot]));
  };

  return (
    <div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {IMAGE_SLOTS.map((s) => {
          const up = uploads[s.key];
          const src = up?.previewUrl ?? recent[draft.images[s.key]] ?? `${RAW_BASE}/${IMG_DIR}/${draft.images[s.key]}`;
          return (
            <div key={s.key} className={cn("overflow-hidden rounded-3xl bg-white shadow-sm", up && "ring-2 ring-orange")}>
              <div className="relative aspect-[16/10] bg-muted">
                <img src={src} alt={s.label} className="h-full w-full object-cover" />
                {busy === s.key ? (
                  <div className="absolute inset-0 grid place-items-center bg-white/70">
                    <Loader2 className="size-6 animate-spin text-navy" />
                  </div>
                ) : null}
                {up ? <span className="absolute top-3 left-3 rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-ink">Yeni</span> : null}
              </div>
              <div className="p-4">
                <div className="font-semibold text-navy">{s.label}</div>
                <Hint>{up ? `${up.width}×${up.height}, ${Math.round(up.size / 1024)} KB – yayınlanınca sitede görünür.` : s.hint}</Hint>
                <div className="mt-3 flex gap-2">
                  <input
                    ref={(el) => (inputs.current[s.key] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      pick(s.key, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => inputs.current[s.key]?.click()} className="rounded-lg">
                    <Upload /> Değiştir
                  </Button>
                  {up ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => undo(s.key)} className="rounded-lg">
                      <RotateCcw /> Geri al
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── editor ───────── */

const TABS = [
  { id: "texts", label: "Metinler", icon: Type },
  { id: "images", label: "Fotoğraflar", icon: ImageIcon },
  { id: "company", label: "Firma bilgileri", icon: Building2 },
];

function Editor({ token, onLogout }) {
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState(null);
  const [uploads, setUploads] = useState({});
  // Net gepubliceerde foto's: lokale voorvertoning tonen tot GitHub ze levert.
  const [recent, setRecent] = useState({});
  const [tab, setTab] = useState("texts");
  const [error, setError] = useState(null);
  const [publish, setPublish] = useState({ state: "idle" });

  const load = useCallback(async () => {
    try {
      const data = await loadContent(token);
      setOriginal(data);
      setDraft(structuredClone(data));
      setUploads({});
    } catch (e) {
      if (e.status === 401) onLogout();
      else setError("İçerik yüklenemedi: " + e.message);
    }
  }, [token, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const changes = useMemo(() => {
    if (!draft || !original) return 0;
    let n = Object.keys(uploads).length;
    for (const l of LANGS) for (const s of SECTIONS) if (s.fields.some((f) => !same(getAt(draft, `content.${l.code}.${f.path}`), getAt(original, `content.${l.code}.${f.path}`)))) n++;
    if (!same(draft.company, original.company)) n++;
    return n;
  }, [draft, original, uploads]);

  useEffect(() => {
    if (!changes) return;
    const warn = (e) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changes]);

  const doPublish = async () => {
    setPublish({ state: "saving" });
    try {
      const files = [
        { path: CONTENT_PATH, base64: utf8ToBase64(JSON.stringify(draft, null, 2) + "\n") },
        ...Object.values(uploads).map((u) => ({ path: `${IMG_DIR}/${u.name}`, base64: u.base64 })),
      ];
      const sha = await commitFiles(token, files, `Panel: içerik güncellendi (${changes} değişiklik)`);
      setOriginal(structuredClone(draft));
      setRecent((r) => ({ ...r, ...Object.fromEntries(Object.values(uploads).map((u) => [u.name, u.previewUrl])) }));
      setUploads({});
      setPublish({ state: "building", sha });
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 6000));
        const run = await latestDeploy(token);
        if (!run) return setPublish({ state: "done-unknown" });
        if (run.sha === sha && run.status === "completed") {
          return setPublish(run.conclusion === "success" ? { state: "live" } : { state: "failed", url: run.url });
        }
      }
      setPublish({ state: "done-unknown" });
    } catch (e) {
      if (e.status === 401 || e.status === 403) setPublish({ state: "error", text: "GitHub anahtarı geçersiz veya süresi dolmuş. Yöneticinize haber verin (ilk kurulum yeniden yapılmalı)." });
      else setPublish({ state: "error", text: "Yayınlanamadı: " + e.message });
    }
  };

  if (error) {
    return (
      <Shell>
        <Notice tone="error">{error}</Notice>
        <Button className="mt-4" onClick={onLogout}>
          Çıkış
        </Button>
      </Shell>
    );
  }
  if (!draft) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh pb-28">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-white p-0.5">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="hidden sm:block">
              <span className="block font-heading text-lg leading-none font-black">ECRN paneli</span>
              <span className="text-xs text-white/55">Hoş geldiniz</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 px-3 text-sm font-semibold hover:bg-white/10">
              <ExternalLink className="size-4" /> Siteyi aç
            </a>
            <button type="button" onClick={onLogout} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white/75 hover:bg-white/10">
              <LogOut className="size-4" /> Çıkış
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition",
                tab === t.id ? "border-orange text-white" : "border-transparent text-white/60 hover:text-white",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "texts" ? <TextsTab draft={draft} original={original} setDraft={setDraft} /> : null}
        {tab === "images" ? <ImagesTab draft={draft} original={original} setDraft={setDraft} uploads={uploads} setUploads={setUploads} recent={recent} /> : null}
        {tab === "company" ? <CompanyTab draft={draft} original={original} setDraft={setDraft} /> : null}
      </main>

      {/* Publicatiebalk */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm">
            {publish.state === "saving" ? (
              <span className="flex items-center gap-2 font-semibold text-navy">
                <Loader2 className="size-4 animate-spin" /> Kaydediliyor…
              </span>
            ) : publish.state === "building" ? (
              <span className="flex items-center gap-2 font-semibold text-navy">
                <Loader2 className="size-4 animate-spin" /> Kaydedildi. Site güncelleniyor (1–2 dakika)…
              </span>
            ) : publish.state === "live" ? (
              <span className="flex items-center gap-2 font-semibold text-emerald-700">
                <Check className="size-4" /> Yayında! Siteyi yenileyince değişiklikleri görürsünüz.
              </span>
            ) : publish.state === "done-unknown" ? (
              <span className="font-semibold text-emerald-700">Kaydedildi. Site birkaç dakika içinde güncellenir.</span>
            ) : publish.state === "failed" ? (
              <span className="font-semibold text-destructive">
                Site güncellenemedi.{" "}
                <a href={publish.url} target="_blank" rel="noopener noreferrer" className="underline">
                  Ayrıntılar
                </a>
              </span>
            ) : publish.state === "error" ? (
              <span className="font-semibold text-destructive">{publish.text}</span>
            ) : changes ? (
              <span className="font-semibold text-navy">
                {changes} bölümde kaydedilmemiş değişiklik var.
              </span>
            ) : (
              <span className="text-muted-foreground">Değişiklik yok.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!changes || publish.state === "saving"}
              onClick={() => {
                setDraft(structuredClone(original));
                setUploads({});
                setPublish({ state: "idle" });
              }}
              className="h-11 rounded-xl"
            >
              <RotateCcw /> Vazgeç
            </Button>
            <Button
              disabled={!changes || publish.state === "saving"}
              onClick={doPublish}
              className="h-11 rounded-xl bg-orange px-6 text-base font-bold text-ink hover:bg-[#ffb840]"
            >
              Yayınla
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── app ───────── */

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [token, setToken] = useState(readSession);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setToken(null);
  }, []);

  if (hash === "#kurulum") return <Setup />;
  if (!token) return <Login onLoggedIn={setToken} />;
  return <Editor token={token} onLogout={logout} />;
}
