import { useEffect, useReducer, useRef } from "react";
import {
  AlcoholicDrink,
  DrinkLog,
  HydrationDrink,
  HydrationSession,
  calcEffectiveHydration,
  calcPureAlcohol,
  calcRequiredWater,
} from "@/types/drinks";

// ============================================================
// アクション定義
// ============================================================
type Action =
  | { type: "ADD_ALCOHOL"; drink: AlcoholicDrink }
  | { type: "ADD_HYDRATION"; drink: HydrationDrink }
  | { type: "RESET" }
  | { type: "UNDO" }
  | { type: "LOAD"; session: HydrationSession };

// ============================================================
// セッション初期状態
// ============================================================
function createInitialSession(): HydrationSession {
  return {
    id: crypto.randomUUID(),
    started_at: new Date(),
    total_pure_alcohol_ml: 0,
    total_water_required_ml: 0,
    total_water_consumed_ml: 0,
    remaining_water_ml: 0,
    logs: [],
  };
}

// ============================================================
// Reducer
// ============================================================
function sessionReducer(
  state: HydrationSession,
  action: Action
): HydrationSession {
  switch (action.type) {
    case "LOAD":
      return action.session;

    case "ADD_ALCOHOL": {
      const { drink } = action;
      const pure_alcohol_ml = calcPureAlcohol(drink.volume_ml, drink.abv);
      const water_required_ml = calcRequiredWater(pure_alcohol_ml);

      const log: DrinkLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "alcohol",
        drink_id: drink.id,
        drink_name: drink.name,
        drink_emoji: drink.emoji,
        pure_alcohol_ml,
        water_required_ml,
      };

      const newRequired = state.total_water_required_ml + water_required_ml;
      const remaining = Math.max(0, newRequired - state.total_water_consumed_ml);

      return {
        ...state,
        total_pure_alcohol_ml: state.total_pure_alcohol_ml + pure_alcohol_ml,
        total_water_required_ml: newRequired,
        remaining_water_ml: remaining,
        logs: [log, ...state.logs],
      };
    }

    case "ADD_HYDRATION": {
      const { drink } = action;
      const hydration_ml = calcEffectiveHydration(
        drink.volume_ml,
        drink.hydration_factor
      );

      // 事前に水を稼ぐことはできないため、現在の残り必要水分量が上限
      const effective_hydration = Math.min(hydration_ml, state.remaining_water_ml);

      const log: DrinkLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type: "hydration",
        drink_id: drink.id,
        drink_name: drink.name,
        drink_emoji: drink.emoji,
        hydration_ml: effective_hydration,
      };

      const newConsumed = state.total_water_consumed_ml + effective_hydration;
      const remaining = Math.max(
        0,
        state.total_water_required_ml - newConsumed
      );

      return {
        ...state,
        total_water_consumed_ml: newConsumed,
        remaining_water_ml: remaining,
        logs: [log, ...state.logs],
      };
    }

    case "UNDO": {
      if (state.logs.length === 0) return state;
      const [lastLog, ...restLogs] = state.logs;

      if (lastLog.type === "alcohol") {
        const newRequired =
          state.total_water_required_ml - (lastLog.water_required_ml ?? 0);
        return {
          ...state,
          total_pure_alcohol_ml:
            state.total_pure_alcohol_ml - (lastLog.pure_alcohol_ml ?? 0),
          total_water_required_ml: newRequired,
          remaining_water_ml: Math.max(
            0,
            newRequired - state.total_water_consumed_ml
          ),
          logs: restLogs,
        };
      } else {
        const newConsumed =
          state.total_water_consumed_ml - (lastLog.hydration_ml ?? 0);
        return {
          ...state,
          total_water_consumed_ml: newConsumed,
          remaining_water_ml: Math.max(
            0,
            state.total_water_required_ml - newConsumed
          ),
          logs: restLogs,
        };
      }
    }

    case "RESET":
      return createInitialSession();

    default:
      return state;
  }
}

// ============================================================
// ローカルストレージキー
// ============================================================
const STORAGE_KEY = "hangover_prevention_session";

function loadFromStorage(): HydrationSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSession();
    const parsed = JSON.parse(raw);
    // DateオブジェクトをDeserialize
    parsed.started_at = new Date(parsed.started_at);
    parsed.logs = parsed.logs.map((log: DrinkLog) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
    // 8時間以上前のセッションはリセット
    const elapsed = Date.now() - new Date(parsed.started_at).getTime();
    if (elapsed > 8 * 60 * 60 * 1000) return createInitialSession();
    return parsed;
  } catch {
    return createInitialSession();
  }
}

// ============================================================
// カスタムフック
// ============================================================
export function useHydrationSession() {
  // SSR安全：サーバーでは常に空セッションで初期化する
  const [session, dispatch] = useReducer(
    sessionReducer,
    undefined,
    createInitialSession
  );

  // クライアントマウント後にlocalStorageから読み込む
  useEffect(() => {
    const saved = loadFromStorage();
    dispatch({ type: "LOAD", session: saved });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // セッション変化をlocalStorageに保存（debounce）
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }, 300);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [session]);

  return { session, dispatch };
}

