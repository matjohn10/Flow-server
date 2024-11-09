import mongoose from "mongoose";

const GamesSchema = new mongoose.Schema({
  gameId: String,
  // players are stringified PLAYERMODELS
  players: { type: [String], default: [] },
});

const GamesModel = mongoose.model("Games", GamesSchema);
export default GamesModel;
