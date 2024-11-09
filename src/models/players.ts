import mongoose from "mongoose";

const PlayersSchema = new mongoose.Schema({
  playerId: String,
  socketId: String,
  // username: { type: String, default: undefined },
  // color: { type: String, default: undefined },
  // icon: { type: String, default: undefined },
});

const PlayersModel = mongoose.model("Players", PlayersSchema);
export default PlayersModel;

// const currPlayer = await PlayersModel.findOne({ playerId: id });
//     if (!currPlayer) {
//       const player = new PlayersModel({ playerId: id });
//       try {
//         await player.save();
//       } catch (error) {
//         console.error("Player save error: ", error);
//       }
//     }
