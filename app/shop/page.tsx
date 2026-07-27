import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import SurveyForm from "./SurveyForm";
import VisualBand from "@/app/components/VisualBand";

export const metadata: Metadata = { title: "Shop" };
export const revalidate = 60;

const TYPE_LABELS: Record<string, string> = {
  giveaway: "배포용",
  apparel: "의류",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "기획중",
  survey: "수요조사",
  ordered: "발주완료",
  distributing: "배포중",
  closed: "종료",
};

type Product = {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  price_estimate: number | null;
  photo_urls: string[] | null;
  season: string | null;
};

type ProductSurvey = {
  id: string;
  product_id: string;
  title: string;
  notes: string | null;
  size_options: string[];
  closes_at: string | null;
  is_open: boolean;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const supabase = getSupabase();

  let products: Product[] | null = null;
  let surveys: ProductSurvey[] = [];

  if (!supabase) {
    console.error("[shop] Supabase env(NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) 미설정");
  } else {
    const [productsRes, surveysRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, type, status, description, price_estimate, photo_urls, season"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("product_surveys")
        .select("id, product_id, title, notes, size_options, closes_at, is_open")
        .eq("is_open", true),
    ]);
    if (productsRes.error)
      console.error("[shop] products 조회 실패:", productsRes.error.message);
    if (surveysRes.error)
      console.error("[shop] product_surveys 조회 실패:", surveysRes.error.message);
    products = (productsRes.data as Product[]) ?? null;
    surveys = (surveysRes.data as ProductSurvey[]) ?? [];
  }

  const surveyProducts = (products ?? []).filter((p) => p.status === "survey");
  const typeFilter =
    searchParams.type && TYPE_LABELS[searchParams.type]
      ? searchParams.type
      : null;
  const galleryProducts = (products ?? []).filter(
    (p) => !typeFilter || p.type === typeFilter
  );

  return (
    <div className="container">
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="hero__meta">GOODS</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(44px, 8vw, 88px)", marginTop: 12 }}
        >
          <span className="outline">DEVILS</span> SHOP
        </h1>
        <p className="hero__tagline">
          Utah Devils 굿즈 수요조사와 지금까지 만든 굿즈들의 아카이브입니다.
        </p>
      </section>
      <VisualBand image="/images/home/team-huddle.png" alt="Utah Devils 팀 사진" label="WEAR THE DEVILS" />

      {!supabase ? (
        <div className="notice">굿즈 데이터를 준비 중입니다.</div>
      ) : (
        <>
          <section style={{ marginBottom: 56 }}>
            <div className="section-head">
              <h2 className="section-title" style={{ fontSize: 32 }}>
                NOW <span className="outline">OPEN</span>
              </h2>
              <span className="pill">수요조사</span>
            </div>

            {surveyProducts.length === 0 ? (
              <div className="notice">
                지금 진행 중인 수요조사가 없습니다. 새 굿즈 수요조사가 열리면
                이곳에서 신청할 수 있습니다.
              </div>
            ) : (
              surveyProducts.map((p) => {
                const survey = surveys.find((s) => s.product_id === p.id);
                return (
                  <div key={p.id} className="card" style={{ marginBottom: 16 }}>
                    <div className="grid grid--2" style={{ alignItems: "start" }}>
                      <div>
                        {p.photo_urls?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photo_urls[0]}
                            alt={p.name}
                            style={{
                              width: "100%",
                              borderRadius: 10,
                              border: "1px solid var(--hairline)",
                            }}
                          />
                        ) : null}
                        <div className="product-card__name" style={{ marginTop: 12 }}>
                          {p.name}
                        </div>
                        <div className="product-card__meta">
                          <span>{TYPE_LABELS[p.type] ?? p.type}</span>
                          {p.season ? <span>{p.season}</span> : null}
                          {p.price_estimate != null ? (
                            <span>예상가 {p.price_estimate.toLocaleString()}원</span>
                          ) : null}
                        </div>
                        {p.description ? (
                          <p
                            style={{
                              marginTop: 12,
                              fontSize: 14,
                              color: "var(--text-muted)",
                            }}
                          >
                            {p.description}
                          </p>
                        ) : null}
                        {survey?.notes ? (
                          <p
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              color: "var(--text-muted)",
                            }}
                          >
                            {survey.notes}
                          </p>
                        ) : null}
                        {survey?.closes_at ? (
                          <p
                            className="product-card__meta"
                            style={{ marginTop: 8 }}
                          >
                            마감: {new Date(survey.closes_at).toLocaleString("ko-KR")}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        {survey ? (
                          <SurveyForm
                            surveyId={survey.id}
                            sizeOptions={survey.size_options ?? []}
                            closesAt={survey.closes_at}
                          />
                        ) : (
                          <div className="notice">
                            신청 폼이 아직 열리지 않았습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section>
            <div className="section-head">
              <h2 className="section-title" style={{ fontSize: 32 }}>
                GOODS <span className="outline">ARCHIVE</span>
              </h2>
            </div>

            <div className="tabs">
              <Link href="/shop" className={`tab${!typeFilter ? " active" : ""}`}>
                전체
              </Link>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/shop?type=${key}`}
                  className={`tab${key === typeFilter ? " active" : ""}`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {galleryProducts.length === 0 ? (
              <div className="notice">아직 등록된 굿즈가 없습니다.</div>
            ) : (
              <div className="grid grid--3">
                {galleryProducts.map((p) => (
                  <div key={p.id} className="card card--hover">
                    {p.photo_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="product-card__photo"
                        src={p.photo_urls[0]}
                        alt={p.name}
                      />
                    ) : null}
                    <div className="product-card__name">{p.name}</div>
                    <div className="product-card__meta">
                      <span>{TYPE_LABELS[p.type] ?? p.type}</span>
                      {p.season ? <span>{p.season}</span> : null}
                      <span className="pill pill--muted">
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </div>
                    {p.description ? (
                      <p
                        style={{
                          marginTop: 10,
                          fontSize: 13,
                          color: "var(--text-muted)",
                        }}
                      >
                        {p.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
