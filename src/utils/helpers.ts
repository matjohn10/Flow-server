import { GameContent, Player } from "../types/game";

export const genId5 = (): string => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let passwordLength = 5;
  let password = "";
  while (passwordLength > 0) {
    const index = Math.floor(Math.random() * chars.length);
    password += chars.substring(index, index + 1);
    passwordLength--;
  }

  return password;
};

export const AddPlayerIfNew = (player: Player, arr: string[]): string[] => {
  const found = arr.find((p) => {
    const inPlayer = JSON.parse(p) as Player;
    return inPlayer.playerId === player.playerId;
  });
  if (!found) {
    return [...arr, JSON.stringify(player)];
  }
  return [...arr];
};

export const RemovePlayer = (playerId: string, arr: string[]): string[] => {
  return arr.filter((p) => {
    const inPlayer = JSON.parse(p) as Player;
    return inPlayer.playerId !== playerId;
  });
};

export const ParseToPlayer = (player: string): Player => {
  return JSON.parse(player) as Player;
};

export const CheckAllEntriesDone = (content: GameContent): boolean => {
  for (let playerContent of content) {
    if (playerContent.guesses.length === 0) return false;
  }
  return true;
};

function getNext(len: number, myIndex: number) {
  return (myIndex + 1) % len;
}

export const GetGameTemplate = (
  numPlayers: number
): { from: number; to: number }[] => {
  const template = [];
  for (let i = 0; i < numPlayers; i++) {
    template.push({ from: i, to: getNext(numPlayers, i) });
  }
  return template;
};

export const GetFromContent = (
  template: { from: number; to: number }[],
  ind: number
) => {
  const found = template.find((t) => t.to === ind);
  return found?.from;
};

export const GetNumEntries = (
  content: GameContent,
  kind: "guesses" | "drawings",
  round: number
) => {
  let count = 0;
  const roundIndex = kind === "guesses" ? Math.floor(round / 2) : round / 2 - 1;
  for (let i = 0; i < content.length; i++) {
    count += content[i][kind][roundIndex] !== undefined ? 1 : 0;
  }
  return count;
};

export const FindRankOfPlayer = (players: string[], id: string): number => {
  for (let i = 0; i < players.length; i++) {
    const player = ParseToPlayer(players[i]);
    if (player.playerId === id) return i;
  }
  return -1;
};
