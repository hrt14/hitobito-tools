"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./othello-puzzle.module.css";

type Cell = "black" | "white" | null;
type Stone = Exclude<Cell, null>;

type Stage = {
  name: string;
  initial: Array<{ row: number; col: number; stone: Stone }>;
};

const SIZE = 6;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],            [0, 1],
  [1, -1],  [1, 0],  [1, 1],
] as const;

const STAGES: Stage[] = [
  { name: "STAGE 1", initial: [] },
  { name: "STAGE 2", initial: [{ row: 2, col: 2, stone: "black" }] },
  {
    name: "STAGE 3",
    initial: [
      { row: 1, col: 2, stone: "black" },
      { row: 4, col: 3, stone: "black" },
    ],
  },
];

function makeBoard(stage: Stage): Cell[][] {
  const board = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
  stage.initial.forEach(({ row, col, stone }) => {
    board[row][col] = stone;
  });
  return board;
}

function opposite(stone: Stone): Stone {
  return stone === "black" ? "white" : "black";
}

function inBounds(row: number, col: number) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function placeStone(board: Cell[][], row: number, col: number, stone: Stone) {
  if (board[row][col]) return board;

  const next = board.map((line) => [...line]);
  next[row][col] = stone;
  const enemy = opposite(stone);

  for (const [dr, dc] of DIRECTIONS) {
    const candidates: Array<[number, number]> = [];
    let r = row + dr;
    let c = col + dc;

    while (inBounds(r, c) && next[r][c] === enemy) {
      candidates.push([r, c]);
      r += dr;
      c += dc;
    }

    if (candidates.length > 0 && inBounds(r, c) && next[r][c] === stone) {
      candidates.forEach(([fr, fc]) => {
        next[fr][fc] = stone;
      });
    }
  }

  return next;
}

function boardStatus(board: Cell[][]) {
  const flat = board.flat();
  const filled = flat.every(Boolean);
  const black = flat.filter((cell) => cell === "black").length;
  const white = flat.filter((cell) => cell === "white").length;
  const winner = filled && (black === SIZE * SIZE || white === SIZE * SIZE)
    ? (black ? "black" : "white")
    : null;

  return { filled, black, white, winner };
}

export default function OthelloPuzzlePage() {
  const [stageIndex, setStageIndex] = useState(0);
  const [board, setBoard] = useState<Cell[][]>(() => makeBoard(STAGES[0]));
  const [turn, setTurn] = useState<Stone>("black");
  const [moves, setMoves] = useState(0);

  const status = useMemo(() => boardStatus(board), [board]);
  const stage = STAGES[stageIndex];

  function reset(nextStageIndex = stageIndex) {
    setStageIndex(nextStageIndex);
    setBoard(makeBoard(STAGES[nextStageIndex]));
    setTurn("black");
    setMoves(0);
  }

  function handleCell(row: number, col: number) {
    if (board[row][col] || status.winner) return;
    setBoard((current) => placeStone(current, row, col, turn));
    setTurn((current) => opposite(current));
    setMoves((value) => value + 1);
  }

  const failed = status.filled && !status.winner;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>← hitobito Tools</Link>
        <span className={styles.kicker}>ONE COLOR PUZZLE</span>
      </header>

      <section className={styles.gameWrap}>
        <div className={styles.copy}>
          <p className={styles.stage}>{stage.name}</p>
          <h1>全部、<br />一色に。</h1>
          <p className={styles.description}>
            黒と白を交互に置きます。相手の石を挟むと、オセロのようにひっくり返ります。
            盤面36マスをすべて黒か白にできたらクリア。
          </p>

          <div className={styles.turnCard}>
            <span>次の石</span>
            <div className={`${styles.turnStone} ${turn === "black" ? styles.black : styles.white}`} />
            <strong>{turn === "black" ? "BLACK" : "WHITE"}</strong>
          </div>

          <div className={styles.stats}>
            <span><i className={`${styles.dot} ${styles.black}`} /> {status.black}</span>
            <span><i className={`${styles.dot} ${styles.white}`} /> {status.white}</span>
            <span>{moves} moves</span>
          </div>

          <button className={styles.reset} onClick={() => reset()}>やり直す</button>
        </div>

        <div className={styles.boardArea}>
          <div className={styles.board} aria-label="6×6 オセロパズル盤面">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={styles.cell}
                  onClick={() => handleCell(rowIndex, colIndex)}
                  aria-label={`${rowIndex + 1}行${colIndex + 1}列${cell ? ` ${cell}` : " 空き"}`}
                >
                  {cell && <span className={`${styles.stone} ${cell === "black" ? styles.black : styles.white}`} />}
                </button>
              )),
            )}
          </div>

          {(status.winner || failed) && (
            <div className={styles.result}>
              {status.winner ? (
                <>
                  <span className={`${styles.bigStone} ${status.winner === "black" ? styles.black : styles.white}`} />
                  <p>CLEAR!</p>
                  <h2>{status.winner === "black" ? "BLACK" : "WHITE"} COMPLETE</h2>
                  {stageIndex < STAGES.length - 1 ? (
                    <button onClick={() => reset(stageIndex + 1)}>次のステージ →</button>
                  ) : (
                    <button onClick={() => reset(0)}>最初から遊ぶ</button>
                  )}
                </>
              ) : (
                <>
                  <p>ONE MORE TRY</p>
                  <h2>一色にならなかった。</h2>
                  <button onClick={() => reset()}>もう一度</button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
