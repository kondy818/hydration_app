"use client";

import { ALCOHOLIC_DRINKS, HYDRATION_DRINKS, WATER_MULTIPLIER } from "@/types/drinks";
import { useHydrationSession } from "@/hooks/useHydrationSession";
import { useEffect, useRef, useState } from "react";

// ============================================================
// 進捗バーコンポーネント
// ============================================================
function ProgressRing({
  percentage,
  size = 180,
}: {
  percentage: number;
  size?: number;
}) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const clampedPct = Math.min(100, Math.max(0, percentage));

  const color =
    clampedPct >= 100
      ? "#10B981"
      : clampedPct >= 60
      ? "#F59E0B"
      : "#EF4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={10}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
      />
    </svg>
  );
}

// ============================================================
// トースト通知
// ============================================================
function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast" aria-live="polite">
      {message}
    </div>
  );
}

// ============================================================
// メインアプリ
// ============================================================
export default function Home() {
  const { session, dispatch } = useHydrationSession();
  const [activeTab, setActiveTab] = useState<"alcohol" | "water">("alcohol");
  const [toast, setToast] = useState<string | null>(null);
  const [rippleMap, setRippleMap] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => setToast(msg);
  const hideToast = () => setToast(null);

  const triggerRipple = (id: string) => {
    setRippleMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(
      () => setRippleMap((prev) => ({ ...prev, [id]: false })),
      600
    );
  };

  const pct =
    session.total_water_required_ml === 0
      ? 100
      : (session.total_water_consumed_ml /
          session.total_water_required_ml) *
        100;

  const isComplete =
    session.total_water_required_ml > 0 &&
    session.remaining_water_ml === 0;

  // 背景カラーフィードバック用ステータス
  const statusClass =
    session.total_water_required_ml === 0
      ? "status-neutral"
      : isComplete
      ? "status-complete"
      : "status-warning";

  const formatMl = (ml: number) =>
    ml >= 1000
      ? `${(ml / 1000).toFixed(1)}L`
      : `${Math.round(ml)}ml`;

  return (
    <main className={`app-container ${statusClass}`}>
      {/* ヘッダー */}
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
            <span className="title-icon">💊</span>
            二日酔い防止
          </h1>
          <p className="app-subtitle">水分補給トラッカー</p>
        </div>
      </header>

      {/* 進捗セクション */}
      <section className="progress-section" aria-label="水分補給の進捗">
        <div className="ring-wrapper">
          <ProgressRing percentage={pct} size={190} />
          <div className="ring-inner-text">
            {isComplete ? (
              <>
                <span className="ring-emoji">✅</span>
                <span className="ring-label">完了！</span>
              </>
            ) : session.total_water_required_ml === 0 ? (
              <>
                <span className="ring-emoji">🍶</span>
                <span className="ring-label">飲み始めよう</span>
              </>
            ) : (
              <>
                <span className="ring-remaining">
                  {formatMl(session.remaining_water_ml)}
                </span>
                <span className="ring-label">残り必要量</span>
              </>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-alcohol">
            <span className="stat-icon">🍺</span>
            <span className="stat-value">
              {formatMl(session.total_pure_alcohol_ml)}
            </span>
            <span className="stat-label">純アルコール</span>
          </div>
          <div className="stat-card stat-required">
            <span className="stat-icon">📋</span>
            <span className="stat-value">
              {formatMl(session.total_water_required_ml)}
            </span>
            <span className="stat-label">必要水分量</span>
          </div>
          <div className="stat-card stat-consumed">
            <span className="stat-icon">💧</span>
            <span className="stat-value">
              {formatMl(session.total_water_consumed_ml)}
            </span>
            <span className="stat-label">補給済み</span>
          </div>
        </div>
      </section>

      {/* タブ */}
      <div className="tab-bar" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "alcohol"}
          className={`tab-btn ${activeTab === "alcohol" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("alcohol")}
          id="tab-alcohol"
        >
          🍺 お酒を飲んだ
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "water"}
          className={`tab-btn ${activeTab === "water" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("water")}
          id="tab-water"
        >
          💧 水を飲んだ
        </button>
      </div>

      {/* 飲料グリッド */}
      <section
        className="drink-grid-section"
        aria-labelledby={
          activeTab === "alcohol" ? "tab-alcohol" : "tab-water"
        }
      >
        {activeTab === "alcohol" ? (
          <div className="drink-grid" role="list">
            {ALCOHOLIC_DRINKS.map((drink) => (
              <button
                key={drink.id}
                role="listitem"
                id={`btn-alcohol-${drink.id}`}
                className={`drink-card drink-card-alcohol ${
                  rippleMap[drink.id] ? "ripple" : ""
                }`}
                style={{ "--card-color": drink.color } as React.CSSProperties}
                onClick={() => {
                  dispatch({ type: "ADD_ALCOHOL", drink });
                  triggerRipple(drink.id);
                  showToast(
                    `${drink.emoji} ${drink.name} を追加 → 水 ${Math.round(
                      drink.volume_ml *
                        (drink.abv / 100) *
                        WATER_MULTIPLIER
                    )}ml 必要`
                  );
                }}
                aria-label={`${drink.name} を飲んだ (${drink.abv}% / ${drink.volume_ml}ml)`}
              >
                <span className="drink-emoji">{drink.emoji}</span>
                <span className="drink-name">{drink.name}</span>
                <span className="drink-info">
                  {drink.abv}% / {drink.volume_ml}ml
                </span>
                <span className="drink-water-badge">
                  +💧
                  {Math.round(
                    drink.volume_ml * (drink.abv / 100) * WATER_MULTIPLIER
                  )}
                  ml
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="drink-grid" role="list">
            {HYDRATION_DRINKS.map((drink) => (
              <button
                key={drink.id}
                role="listitem"
                id={`btn-hydration-${drink.id}`}
                className={`drink-card drink-card-hydration ${
                  rippleMap[drink.id] ? "ripple" : ""
                }`}
                style={{ "--card-color": drink.color } as React.CSSProperties}
                onClick={() => {
                  dispatch({ type: "ADD_HYDRATION", drink });
                  triggerRipple(drink.id);
                  showToast(
                    `${drink.emoji} ${drink.name} で ${Math.round(
                      drink.volume_ml * drink.hydration_factor
                    )}ml 補給`
                  );
                }}
                aria-label={`${drink.name} を飲んだ (${drink.volume_ml}ml)`}
              >
                <span className="drink-emoji">{drink.emoji}</span>
                <span className="drink-name">{drink.name}</span>
                <span className="drink-info">{drink.volume_ml}ml</span>
                <span className="drink-water-badge">
                  −💧
                  {Math.round(
                    drink.volume_ml * drink.hydration_factor
                  )}
                  ml
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ログ + 操作ボタン */}
      <section className="log-section" aria-label="飲み物の記録">
        <div className="log-header">
          <h2 className="log-title">📝 記録</h2>
          <div className="log-actions">
            {session.logs.length > 0 && (
              <button
                className="btn-undo"
                onClick={() => {
                  dispatch({ type: "UNDO" });
                  showToast("最後の操作を取り消しました");
                }}
                id="btn-undo"
                aria-label="最後の操作を取り消す"
              >
                ↩ 取り消し
              </button>
            )}
            <button
              className="btn-reset"
              onClick={() => {
                if (confirm("セッションをリセットしますか？")) {
                  dispatch({ type: "RESET" });
                  showToast("セッションをリセットしました");
                }
              }}
              id="btn-reset"
              aria-label="セッションをリセットする"
            >
              🔄 リセット
            </button>
          </div>
        </div>

        {session.logs.length === 0 ? (
          <div className="log-empty">
            <span className="log-empty-icon">🫗</span>
            <p>まだ記録がありません</p>
            <p className="log-empty-sub">上のボタンをタップしてください</p>
          </div>
        ) : (
          <ul className="log-list" aria-label="飲み物ログ">
            {session.logs.map((log) => (
              <li key={log.id} className={`log-item log-${log.type}`}>
                <span className="log-item-emoji">{log.drink_emoji}</span>
                <div className="log-item-body">
                  <span className="log-item-name">{log.drink_name}</span>
                  <span className="log-item-time">
                    {log.timestamp.toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="log-item-amount">
                  {log.type === "alcohol"
                    ? `+💧${Math.round(log.water_required_ml ?? 0)}ml`
                    : `-💧${Math.round(log.hydration_ml ?? 0)}ml`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 注意書き */}
      <footer className="app-footer">
        <p>⚠️ アルコールの分解に必要な水分の目安です。</p>
        <p>飲酒は適量を守り、体調に合わせて判断してください。</p>
      </footer>

      {/* トースト */}
      {toast && <Toast message={toast} onDone={hideToast} />}
    </main>
  );
}
