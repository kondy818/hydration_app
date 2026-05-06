// ============================================================
// 二日酔い防止 水分補給管理アプリ - データ構造定義
// ============================================================

/**
 * アルコール飲料の定義
 * 必要水分量の計算:
 *   pure_alcohol_ml = volume_ml × (abv / 100)
 *   required_water_ml = pure_alcohol_ml × 20
 */
export interface AlcoholicDrink {
  id: string;
  name: string;          // 表示名 (例: "ビール")
  emoji: string;         // アイコン絵文字
  abv: number;           // アルコール度数 (%) 例: 5
  volume_ml: number;     // 1杯あたりの量 (ml) 例: 350
  color: string;         // UIカラー (CSS色)
  category: "beer" | "wine" | "spirits" | "cocktail" | "sake";
}

/**
 * 水分飲料の定義（アルコールを含まないもの）
 */
export interface HydrationDrink {
  id: string;
  name: string;
  emoji: string;
  volume_ml: number;     // 1杯あたりの量 (ml)
  hydration_factor: number; // 水分補給係数 (水=1.0, お茶=0.9, など)
  color: string;
  category: "water" | "tea" | "sports_drink" | "juice";
}

/**
 * セッション中の飲酒ログエントリ
 */
export interface DrinkLog {
  id: string;
  timestamp: Date;
  type: "alcohol" | "hydration";
  drink_id: string;
  drink_name: string;
  drink_emoji: string;
  // アルコール飲料の場合
  pure_alcohol_ml?: number;
  water_required_ml?: number;
  // 水分飲料の場合
  hydration_ml?: number;
}

/**
 * セッション全体の状態
 */
export interface HydrationSession {
  id: string;
  started_at: Date;
  // 累計アルコール純量 (ml)
  total_pure_alcohol_ml: number;
  // 必要な水分量の合計 (ml) = total_pure_alcohol_ml × WATER_MULTIPLIER
  total_water_required_ml: number;
  // 実際に飲んだ水分量 (ml)
  total_water_consumed_ml: number;
  // 残り必要水分量 (ml) = total_water_required_ml - total_water_consumed_ml
  remaining_water_ml: number;
  // ログ
  logs: DrinkLog[];
}

// ============================================================
// 計算係数
// ============================================================

/** アルコール1mlあたり必要な水分量の係数 */
export const WATER_MULTIPLIER = 20;

/**
 * 純アルコール量を計算する
 * @param volume_ml 飲んだ量 (ml)
 * @param abv アルコール度数 (%)
 */
export function calcPureAlcohol(volume_ml: number, abv: number): number {
  return volume_ml * (abv / 100);
}

/**
 * 必要な水分量を計算する
 * @param pure_alcohol_ml 純アルコール量 (ml)
 */
export function calcRequiredWater(pure_alcohol_ml: number): number {
  return pure_alcohol_ml * WATER_MULTIPLIER;
}

/**
 * 実際に補給できる水分量を計算する
 * @param volume_ml 飲んだ量 (ml)
 * @param hydration_factor 水分補給係数
 */
export function calcEffectiveHydration(
  volume_ml: number,
  hydration_factor: number
): number {
  return volume_ml * hydration_factor;
}

// ============================================================
// マスターデータ
// ============================================================

export const ALCOHOLIC_DRINKS: AlcoholicDrink[] = [
  {
    id: "beer",
    name: "ビール",
    emoji: "🍺",
    abv: 5,
    volume_ml: 350,
    color: "#F59E0B",
    category: "beer",
  },
  {
    id: "highball",
    name: "ハイボール",
    emoji: "🥃",
    abv: 7,
    volume_ml: 350,
    color: "#D97706",
    category: "spirits",
  },
  {
    id: "wine_red",
    name: "赤ワイン",
    emoji: "🍷",
    abv: 12,
    volume_ml: 120,
    color: "#9B2335",
    category: "wine",
  },
  {
    id: "wine_white",
    name: "白ワイン",
    emoji: "🥂",
    abv: 12,
    volume_ml: 120,
    color: "#FCD34D",
    category: "wine",
  },
  {
    id: "sake",
    name: "日本酒",
    emoji: "🍶",
    abv: 15,
    volume_ml: 180,
    color: "#F3F4F6",
    category: "sake",
  },
  {
    id: "shochu",
    name: "焼酎",
    emoji: "🥃",
    abv: 25,
    volume_ml: 90,
    color: "#6B7280",
    category: "spirits",
  },
  {
    id: "chuhai",
    name: "チューハイ",
    emoji: "🧃",
    abv: 5,
    volume_ml: 350,
    color: "#10B981",
    category: "cocktail",
  },
  {
    id: "cocktail",
    name: "カクテル",
    emoji: "🍹",
    abv: 8,
    volume_ml: 200,
    color: "#EC4899",
    category: "cocktail",
  },
];

export const HYDRATION_DRINKS: HydrationDrink[] = [
  {
    id: "water",
    name: "水",
    emoji: "💧",
    volume_ml: 200,
    hydration_factor: 1.0,
    color: "#3B82F6",
    category: "water",
  },
  {
    id: "water_large",
    name: "水 (500ml)",
    emoji: "🚰",
    volume_ml: 500,
    hydration_factor: 1.0,
    color: "#2563EB",
    category: "water",
  },
  {
    id: "green_tea",
    name: "緑茶",
    emoji: "🍵",
    volume_ml: 200,
    hydration_factor: 0.9,
    color: "#059669",
    category: "tea",
  },
  {
    id: "sports",
    name: "スポーツドリンク",
    emoji: "⚡",
    volume_ml: 500,
    hydration_factor: 1.0,
    color: "#F59E0B",
    category: "sports_drink",
  },
  {
    id: "oolong",
    name: "ウーロン茶",
    emoji: "🫖",
    volume_ml: 200,
    hydration_factor: 0.85,
    color: "#78350F",
    category: "tea",
  },
  {
    id: "ginger_ale",
    name: "ジンジャーエール",
    emoji: "🥤",
    volume_ml: 350,
    hydration_factor: 0.8,
    color: "#D4AC0D",
    category: "juice",
  },
];
