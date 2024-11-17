export type Player = {
  playerId: string;
  username: string;
  color: string;
  icon: string;
};

export type JoinRoomObject = {
  roomId: string;
  player: Player;
};

type PlayerContent = {
  guesses: string[];
  drawings: string[];
};
export type GameContent = PlayerContent[];
