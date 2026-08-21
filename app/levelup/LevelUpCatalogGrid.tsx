"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import styles from "./levelup.module.css";

type LevelUpGame = {
  id: string;
  title: string;
  kicker: string;
  skill: string;
  description: string;
  icon: string;
  accent: string;
  accentSoft: string;
  href: string;
};

type LevelUpCatalogGridProps = {
  games: LevelUpGame[];
  updateCounts: Record<string, number>;
};

const FAVORITES_STORAGE_KEY = "hitobito-levelup-favorites-v1";
const FAVORITES_CHANGE_EVENT = "hitobito-levelup-favorites-change";
const EMPTY_FAVORITES = "[]";
let fallbackFavorites = EMPTY_FAVORITES;

function getFavoritesSnapshot() {
  try {
    return window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? fallbackFavorites;
  } catch {
    return fallbackFavorites;
  }
}

function getServerFavoritesSnapshot() {
  return EMPTY_FAVORITES;
}

function subscribeFavorites(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_KEY) onStoreChange();
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(FAVORITES_CHANGE_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(FAVORITES_CHANGE_EVENT, handleLocalChange);
  };
}

function parseFavorites(snapshot: string): Set<string> {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

export default function LevelUpCatalogGrid({
  games,
  updateCounts,
}: LevelUpCatalogGridProps) {
  const favoritesSnapshot = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getServerFavoritesSnapshot,
  );
  const favorites = useMemo(() => parseFavorites(favoritesSnapshot), [favoritesSnapshot]);

  const orderedGames = useMemo(() => {
    const originalOrder = new Map(games.map((game, index) => [game.id, index]));

    return [...games].sort((a, b) => {
      const favoriteDifference = Number(favorites.has(b.id)) - Number(favorites.has(a.id));
      if (favoriteDifference !== 0) return favoriteDifference;

      const updateDifference = (updateCounts[b.id] ?? 1) - (updateCounts[a.id] ?? 1);
      if (updateDifference !== 0) return updateDifference;

      return (originalOrder.get(a.id) ?? 0) - (originalOrder.get(b.id) ?? 0);
    });
  }, [favorites, games, updateCounts]);

  const toggleFavorite = (gameId: string) => {
    const next = new Set(favorites);
    if (next.has(gameId)) {
      next.delete(gameId);
    } else {
      next.add(gameId);
    }

    const serialized = JSON.stringify([...next]);
    fallbackFavorites = serialized;

    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, serialized);
    } catch {
      // Keep the current session working even when browser storage is unavailable.
    }

    window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT));
  };

  return (
    <div className={styles.grid}>
      {orderedGames.map((game, index) => {
        const isFavorite = favorites.has(game.id);
        const cardStyle = {
          "--accent": game.accent,
          "--accent-soft": game.accentSoft,
        } as CSSProperties;

        return (
          <article className={styles.cardShell} id={game.id} key={game.id} style={cardStyle}>
            <a className={styles.card} href={game.href} aria-label={`${game.title}を遊ぶ`}>
              <div className={styles.cardTop}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.status}>UPDATE ×{updateCounts[game.id] ?? 1}</span>
              </div>
              <div className={styles.symbol} aria-hidden="true">
                {game.icon}
              </div>
              <div className={styles.cardCopy}>
                <h3
                  style={{
                    marginBottom: 0,
                    fontSize: "clamp(25px, 2.6vw, 36px)",
                    lineHeight: 1.08,
                    letterSpacing: "-0.045em",
                  }}
                >
                  {game.title}
                </h3>
                <p
                  style={{
                    margin: "16px 0 0",
                    color: game.accent,
                    fontSize: "13px",
                    lineHeight: 1.65,
                    fontWeight: 850,
                  }}
                >
                  {game.description}
                </p>
              </div>
            </a>
            <button
              className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ""}`}
              type="button"
              aria-label={`${game.title}を${isFavorite ? "お気に入りから外す" : "お気に入りに追加"}`}
              aria-pressed={isFavorite}
              title={isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
              onClick={() => toggleFavorite(game.id)}
            >
              <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
            </button>
          </article>
        );
      })}
    </div>
  );
}
