import mongoose from "mongoose";

const PlayerContentSchema = new mongoose.Schema({
  guesses: { type: [String], default: [] },
  drawings: { type: [String], default: [] },
});

const GamesSchema = new mongoose.Schema({
  gameId: String,
  creator: String,
  status: {
    type: String,
    enum: ["wait", "play", "end"],
    default: "wait",
  },
  round: { type: Number, default: 1 },
  // players are stringified PLAYERMODELS
  players: { type: [String], default: [] },
  content: { type: [PlayerContentSchema], default: [] },
});

const GamesModel = mongoose.model("Games", GamesSchema);
export default GamesModel;
