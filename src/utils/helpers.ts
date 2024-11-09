import { Player } from "../types/game";

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
