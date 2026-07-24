#!/usr/bin/env node
/**
 * Utah Devils — 이미지 일괄 업로드 파이프라인 (Phase 6 Task 1)
 *
 * 사용법:
 *   SUPABASE_SERVICE_ROLE_KEY='sb_secret_...' node scripts/upload-images.mjs ~/devils-images
 *   node scripts/upload-images.mjs ~/devils-images --dry-run   (키 불필요, 최적화만 검증)
 *
 * 규칙:
 * - 키는 셸 환경변수로만 받는다. .env 저장 금지, 코드/커밋 포함 금지.
 * - logos/ 는 원본 유지(PNG 그대로), roster/·hof/ 는 최대 폭 800px,
 *   events/·games/ 는 최대 폭 1400px, JPEG 품질 82. WebP 변환은 next/image 몫.
 * - 업로드 경로는 로컬 구조 그대로 official-site 버킷에, upsert 모드.
 * - 결과 public URL 목록을 docs/uploaded_images.md 로 생성한다.
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { promises as fs } from "fs";
import { createReadStream, existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BUCKET = "official-site";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------- 인자/환경 검증 ----------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputDir = args.find((a) => !a.startsWith("--"));

if (!inputDir) {
  console.error("사용법: node scripts/upload-images.mjs <이미지 폴더> [--dry-run]");
  process.exit(1);
}
const root = path.resolve(inputDir.replace(/^~(?=$|\/)/, process.env.HOME ?? "~"));
if (!existsSync(root)) {
  console.error(`입력 폴더가 없습니다: ${root}`);
  process.exit(1);
}

// 키가 NEXT_PUBLIC_ 접두사로 잘못 들어오면 즉시 중단 — 클라이언트 노출 사고 방지
const leaked = Object.keys(process.env).filter(
  (k) => k.startsWith("NEXT_PUBLIC_") && /SERVICE_ROLE|SB_SECRET|SECRET/i.test(k)
);
if (leaked.length > 0) {
  console.error(
    `⛔ 중단: 시크릿 키가 NEXT_PUBLIC_ 환경변수로 설정되어 있습니다: ${leaked.join(", ")}\n` +
      "   NEXT_PUBLIC_ 접두사 변수는 클라이언트 번들에 노출됩니다. 변수명을 SUPABASE_SERVICE_ROLE_KEY로 바꾸세요."
  );
  process.exit(1);
}

function readEnvLocal(name) {
  try {
    const line = readFileSync(path.join(REPO_ROOT, ".env.local"), "utf8")
      .split("\n")
      .find((l) => l.startsWith(name + "="));
    return line ? line.slice(name.length + 1).trim() : null;
  } catch {
    return null;
  }
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? readEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

if (!dryRun) {
  if (!supabaseUrl) {
    console.error("⛔ NEXT_PUBLIC_SUPABASE_URL을 찾을 수 없습니다 (.env.local 또는 환경변수).");
    process.exit(1);
  }
  if (!serviceKey) {
    console.error(
      "⛔ SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.\n" +
        "   실행 예: SUPABASE_SERVICE_ROLE_KEY='sb_secret_...' node scripts/upload-images.mjs ~/devils-images"
    );
    process.exit(1);
  }
  if (serviceKey.startsWith("sb_publishable")) {
    console.error("⛔ 전달된 키가 anon(publishable) 키입니다. Storage 쓰기에는 service_role(sb_secret) 키가 필요합니다.");
    process.exit(1);
  }
}

// ---------- 카테고리별 최적화 규칙 ----------

function ruleFor(relPath) {
  const top = relPath.split(path.sep)[0];
  if (top === "logos") return { resize: null, keepOriginal: true };
  if (top === "roster" || top === "hof") return { resize: 800, keepOriginal: false };
  return { resize: 1400, keepOriginal: false }; // events, games, 기타
}

async function optimize(absPath, relPath) {
  const rule = ruleFor(relPath);
  if (rule.keepOriginal) {
    return { buffer: await fs.readFile(absPath), outPath: relPath, contentType: contentTypeOf(relPath) };
  }
  const image = sharp(absPath).rotate(); // EXIF 회전 보정
  const meta = await image.metadata();
  if (rule.resize && (meta.width ?? 0) > rule.resize) {
    image.resize({ width: rule.resize });
  }
  const buffer = await image.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const outPath = relPath.replace(/\.(png|webp|jpeg)$/i, ".jpg");
  return { buffer, outPath, contentType: "image/jpeg" };
}

function contentTypeOf(p) {
  const ext = path.extname(p).toLowerCase();
  return ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
}

// ---------- 파일 수집 ----------

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs)));
    else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) out.push(abs);
  }
  return out;
}

// ---------- 메인 ----------

const files = await walk(root);
if (files.length === 0) {
  console.error(`이미지 파일이 없습니다: ${root}`);
  process.exit(1);
}
console.log(`발견: ${files.length}개 이미지 (${dryRun ? "DRY RUN — 업로드 없음" : "업로드 모드"})`);

let supabase = null;
if (!dryRun) {
  supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  // 버킷이 없으면 public으로 생성
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.error("⛔ 버킷 목록 조회 실패:", bErr.message);
    process.exit(1);
  }
  if (!buckets.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) {
      console.error(`⛔ 버킷 생성 실패(${BUCKET}):`, error.message);
      process.exit(1);
    }
    console.log(`버킷 생성: ${BUCKET} (public)`);
  }
}

const uploaded = []; // { storagePath, publicUrl, bytes }
let failed = 0;

for (const abs of files) {
  const relPath = path.relative(root, abs);
  try {
    const { buffer, outPath, contentType } = await optimize(abs, relPath);
    const storagePath = outPath.split(path.sep).join("/");
    if (dryRun) {
      console.log(`  [dry] ${relPath} → ${BUCKET}/${storagePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
      uploaded.push({ storagePath, publicUrl: `(dry-run)`, bytes: buffer.length });
      continue;
    }
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { upsert: true, contentType });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    uploaded.push({ storagePath, publicUrl: data.publicUrl, bytes: buffer.length });
    console.log(`  ✓ ${storagePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${relPath}: ${e.message}`);
  }
}

console.log(`\n완료: 성공 ${uploaded.length} / 실패 ${failed}`);

// docs/uploaded_images.md 생성 (Task 2 입력) — dry-run에서는 만들지 않는다
if (!dryRun && uploaded.length > 0) {
  const byFolder = new Map();
  for (const u of uploaded) {
    const folder = u.storagePath.includes("/")
      ? u.storagePath.slice(0, u.storagePath.lastIndexOf("/"))
      : "(root)";
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(u);
  }
  const lines = [
    "# 업로드된 이미지 목록 (자동 생성 — scripts/upload-images.mjs)",
    "",
    `버킷: \`${BUCKET}\` · 총 ${uploaded.length}개`,
    "",
  ];
  for (const [folder, list] of Array.from(byFolder.entries()).sort()) {
    lines.push(`## ${folder}/`, "");
    for (const u of list.sort((a, b) => a.storagePath.localeCompare(b.storagePath))) {
      lines.push(`- \`${u.storagePath}\` → ${u.publicUrl}`);
    }
    lines.push("");
  }
  const outFile = path.join(REPO_ROOT, "docs", "uploaded_images.md");
  await fs.writeFile(outFile, lines.join("\n"));
  console.log(`목록 생성: ${outFile}`);
}
