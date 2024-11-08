export enum Kind {
  connection,
  disconnection,

  createRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
}

export type Message = {
  kind: Kind;
  message: string;
};

export type Client = {
  id: string;
};

export type Room = {
  id: string;
  members: Client[];
};
