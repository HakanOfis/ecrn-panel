// Automatische vertaling van TR-wijzigingen naar NL/FR/EN via MyMemory (gratis, geen sleutel, CORS).
// Limiet zonder account: ±5000 tekens per dag; alleen gewijzigde velden worden vertaald.
import { SECTIONS } from "@/schema";

export const SOURCE = "tr";
export const TARGETS = ["nl", "fr", "en"];

export class TranslateError extends Error {}

const cache = new Map();

function chunks(text, max = 450) {
  if (text.length <= max) return [text];
  const parts = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length > max && cur) {
      out.push(cur);
      cur = "";
    }
    cur += p;
  }
  if (cur) out.push(cur);
  return out;
}

async function translateOne(text, target) {
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${SOURCE}|${target}`);
  if (!res.ok) throw new TranslateError(`Çeviri servisi yanıt vermedi (${res.status}).`);
  const j = await res.json();
  const out = j?.responseData?.translatedText ?? "";
  if (Number(j.responseStatus) !== 200 || /MYMEMORY WARNING|QUOTA/i.test(out)) {
    throw new TranslateError("Günlük ücretsiz çeviri sınırı doldu. Yarın tekrar deneyin ya da diğer dilleri elle düzenleyin.");
  }
  return out;
}

// Vakjargon: de automatische vertaling maakt van "(kablo) kanalı" vaak "kanaal/channel"; voor ECRN is dat een sleuf.
const GLOSSARY = {
  nl: [[/\bkanalen\b/gi, "sleuven"], [/\bkanaal\b/gi, "sleuf"], [/\bkabelkanalen\b/gi, "kabelsleuven"], [/\bkabelkanaal\b/gi, "kabelsleuf"]],
  fr: [[/\bcanaux\b/gi, "tranchées"], [/\bcanal\b/gi, "tranchée"], [/\bconduits\b/gi, "tranchées"]],
  en: [[/\bchannels\b/gi, "trenches"], [/\bchannel\b/gi, "trench"], [/\bduct excavation\b/gi, "trenching"], [/\bditch(es)?\b/gi, (m) => (m.endsWith("es") ? "trenches" : "trench")]],
};

function applyGlossary(text, target) {
  return (GLOSSARY[target] ?? []).reduce((t, [re, rep]) => t.replace(re, (m, ...a) => {
    const r = typeof rep === "function" ? rep(m, ...a) : rep;
    return m[0] === m[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
  }), text);
}

export async function translate(text, target) {
  if (!text || !text.trim()) return text;
  const key = `${target}\u0000${text}`;
  if (cache.has(key)) return cache.get(key);
  const pieces = [];
  for (const c of chunks(text)) pieces.push(await translateOne(c.trim(), target));
  const result = applyGlossary(pieces.join(" ").replace(/\s+/g, " ").trim(), target);
  cache.set(key, result);
  return result;
}

/* ───── wijzigingen zoeken ───── */

const getAt = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function setAt(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k];
  o[keys.at(-1)] = value;
}

// Verdeelt een vertaalde zin over n regels (voor de grote titel).
// Kiest de verdeling waarbij de langste regel zo kort mogelijk is.
function splitLines(text, n) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= n) return [...words, ...Array(n - words.length).fill("")];
  let best = null;
  const walk = (start, parts) => {
    if (parts.length === n - 1) {
      const lines = [...parts, words.slice(start).join(" ")];
      const score = Math.max(...lines.map((l) => l.length));
      if (!best || score < best.score) best = { score, lines };
      return;
    }
    for (let end = start + 1; end <= words.length - (n - 1 - parts.length); end++) {
      walk(end, [...parts, words.slice(start, end).join(" ")]);
    }
  };
  walk(0, []);
  return best.lines;
}

/**
 * Vertaalt de TR-wijzigingen (draft t.o.v. original) naar NL/FR/EN en geeft een nieuwe draft terug.
 * Velden die de gebruiker in een doeltaal zelf heeft aangepast, worden niet overschreven.
 */
export async function applyTranslations(draft, original, onProgress) {
  const next = structuredClone(draft);
  const jobs = [];

  for (const section of SECTIONS) {
    for (const f of section.fields) {
      const path = f.path;
      const now = getAt(draft, `content.${SOURCE}.${path}`);
      const was = getAt(original, `content.${SOURCE}.${path}`);
      if (same(now, was)) continue;

      for (const t of TARGETS) {
        const tPath = `content.${t}.${path}`;
        if (!same(getAt(draft, tPath), getAt(original, tPath))) continue; // handmatig aangepast

        if (path === "hero.h1") {
          jobs.push(async () => setAt(next, tPath, splitLines(await translate(now.join(" "), t), now.length)));
        } else if (!f.type || f.type === "textarea") {
          jobs.push(async () => setAt(next, tPath, await translate(now, t)));
        } else if (f.type === "list") {
          const tCur = getAt(draft, tPath) ?? [];
          if (Array.isArray(was) && was.length === now.length && tCur.length === now.length) {
            now.forEach((v, i) => {
              if (v !== was[i]) jobs.push(async () => setAt(next, `${tPath}.${i}`, await translate(v, t)));
            });
          } else {
            jobs.push(async () => setAt(next, tPath, await Promise.all(now.map((v) => translate(v, t)))));
          }
        } else if (f.type === "items") {
          const tCur = getAt(draft, tPath) ?? [];
          const sameShape = Array.isArray(was) && was.length === now.length && tCur.length === now.length;
          // structuur gewijzigd (toegevoegd/verwijderd/verplaatst): doellijst eerst gelijkzetten, daarna alles vertalen
          if (!sameShape) jobs.push(async () => setAt(next, tPath, structuredClone(now)));
          now.forEach((item, i) => {
            for (const sub of f.fields) {
              const v = item[sub.key];
              const old = sameShape ? was[i]?.[sub.key] : undefined;
              if (sameShape && same(v, old)) continue;
              const p = `${tPath}.${i}.${sub.key}`;
              if (Array.isArray(v)) {
                jobs.push(async () => setAt(next, p, await Promise.all(v.map((x) => translate(x, t)))));
              } else {
                jobs.push(async () => setAt(next, p, await translate(v, t)));
              }
            }
          });
        }
      }
    }
  }

  let done = 0;
  for (const job of jobs) {
    await job();
    onProgress?.(++done, jobs.length);
  }
  return { draft: next, count: jobs.length };
}
