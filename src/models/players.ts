import mongoose from "mongoose";

const PlayersSchema = new mongoose.Schema({
  playerId: String,
  socketId: String,
  games: { type: [String], default: [] },
});

const PlayersModel = mongoose.model("Players", PlayersSchema);
export default PlayersModel;

export const updatePlayerGames = async (id: string, room: string) => {
  const player = await PlayersModel.findOne({ playerId: id }).exec();
  if (!player) return;
  const newGames = [...player.games, room];
  await player.updateOne({ games: newGames }).exec();
};

export const removePlayerGame = async (id: string, room: string) => {
  const player = await PlayersModel.findOne({ playerId: id }).exec();
  if (!player) return;
  const newGames = player.games.filter((g) => g !== room);
  await player.updateOne({ games: newGames }).exec();
};
