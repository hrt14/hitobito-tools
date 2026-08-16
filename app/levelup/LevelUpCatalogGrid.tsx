"use client";

import { useEffect, useMemo, useState } from "react";
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

function readFavorites(): Set<string> {
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return new Set();

    const parsed: unknown = JSON.parse(stored);
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
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

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
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }

      try {
        window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Browsers can block storage; the current session still keeps the selection.
      }

      return next;
    });
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
                <p className={styles.kicker}>{game.kicker}</p>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <span className={styles.skill}>鍛えるもの：{game.skill}</span>
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
