import { randomUUID } from "crypto";
import { GameContent, Player } from "../types/game";
import {
  genId5,
  GetFromContent,
  GetGameTemplate,
  ParseToPlayer,
} from "../utils/helpers";
import * as fs from "node:fs";

type Game = {
  players: string[];
  creator: string;
  round: number; //
  gameId?: string | null | undefined; //
  content: GameContent; //
};

function generate_player(name: number): string {
  const playerId = randomUUID();
  const username = "" + name;
  const player: Player = {
    playerId,
    username,
    color: "#ff0000",
    icon: "lion",
  };
  return JSON.stringify(player);
}

export function generate_game(numPlayers: number): Game {
  const gameId = genId5();
  const content: GameContent = [];
  const players: string[] = [];
  for (let i = numPlayers; i > 0; i--) {
    content.push({ drawings: [], guesses: [] });
    players.push(generate_player(numPlayers - i + 1));
  }
  const creator = ParseToPlayer(players[0]).playerId;
  const game = {
    gameId,
    content,
    players,
    creator,
    round: 1,
  };
  fs.writeFileSync("./game.json", JSON.stringify(game), "utf8");
  return game;
}

export function simulate_game(numPlayers: number) {
  const game = generate_game(numPlayers);
  const gameTemplate = GetGameTemplate(numPlayers);
  while (game.round <= numPlayers) {
    for (let i = 0; i < numPlayers; i++) {
      if (game.round % 2 === 0) {
        // drawing round
        const from = GetFromContent(gameTemplate, i);
        game.content[i].drawings.push(`drawing the guess of ${from}`);
      } else {
        // guessing round
        const from = GetFromContent(gameTemplate, i);
        game.content[i].guesses.push(
          game.round === 1 ? "init guess" : `guessing drawing of ${from}`
        );
      }
    }
    game.round += 1;
  }
  fs.writeFileSync("./game.json", JSON.stringify(game), "utf8");
  console.log("DONE");
}

const EXPECTED_RESULTS = [
  [
    "init guess",
    "drawing the guess of 0",
    "guessing drawing of 1",
    "drawing the guess of 2",
  ],
  [
    "init guess",
    "drawing the guess of 1",
    "guessing drawing of 2",
    "drawing the guess of 3",
  ],
  [
    "init guess",
    "drawing the guess of 2",
    "guessing drawing of 3",
    "drawing the guess of 0",
  ],
  [
    "init guess",
    "drawing the guess of 3",
    "guessing drawing of 0",
    "drawing the guess of 1",
  ],
];
// FUNCTION successfully gets the initial guess to its last drawing/guess
export function getFullPlayerTelestration(playerRank: number): string {
  const file = fs.readFileSync("./game.json", "utf8");
  const game = JSON.parse(file) as Game;
  let rounds = "Start\n";
  for (let i = 1; i < game.round; i++) {
    const index = i % 2 !== 0 ? Math.floor(i / 2) : i / 2 - 1;
    const step = i % 2 !== 0 ? "guesses" : "drawings";
    const data =
      game.content[(playerRank + i - 1) % game.players.length][step][index];
    rounds += `\tRound ${i}: ${data}\n`;
    console.log(EXPECTED_RESULTS[playerRank][i - 1] === data);
  }
  return rounds + "END";
}
