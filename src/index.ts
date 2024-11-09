import { Request, Response } from "express";
import dotenv from "dotenv";
import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import {
  AddPlayerIfNew,
  genId5,
  ParseToPlayer,
  RemovePlayer,
} from "./utils/helpers";
import ConnectDB from "./utils/mongodb";
import { JoinRoomObject, Player } from "./types/game";
import GamesModel from "./models/games";
import game from "./routes/games";
import PlayersModel from "./models/players";

export const app: Express = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});
dotenv.config();
const port = process.env.PORT || 8000;

ConnectDB();

io.on("connection", async (socket) => {
  console.log(`Successful connection with ${io.engine.clientsCount} users`);

  // listens for new users when they succesfully connect
  socket.on("iam", async (id: string) => {
    socket.join(id);
    await PlayersModel.findOneAndUpdate(
      { playerId: id },
      { socketId: socket.id, playerId: id },
      { upsert: true }
    ).exec();
  });
  // creates a room and add user id to it
  socket.on("create-room", async (createString: string) => {
    const createObject = JSON.parse(createString) as Player;
    const roomId = genId5();
    socket.join(roomId);
    const game = {
      gameId: roomId,
      creator: createObject.playerId,
      players: [createString],
    };
    const newGame = new GamesModel(game);
    await newGame.save();
    io.to(createObject.playerId).emit("room-id", roomId);
  });
  // join existing room using roomId and add user id to it
  socket.on("join-room", async (joinRoomString: string) => {
    const joinRoomObject = JSON.parse(joinRoomString) as JoinRoomObject;

    const currGame = await GamesModel.findOne({
      gameId: joinRoomObject.roomId,
    });

    if (!currGame) {
      io.to(joinRoomObject.player.playerId).emit("join-error", "Wrong game id");
      //console.error("Game not found:", joinRoomObject.roomId);
    } else {
      // add user to room
      socket.join(joinRoomObject.roomId);
      io.to(joinRoomObject.player.playerId).emit(
        "room-id",
        joinRoomObject.roomId
      );

      const game = {
        gameId: currGame.gameId,
        players: AddPlayerIfNew(joinRoomObject.player, currGame.players),
      };
      await currGame.updateOne(game);
      //emit new player arrival in game room
      io.to(joinRoomObject.roomId).emit(
        "room-in",
        JSON.stringify(joinRoomObject.player)
      );
    }
  });
  socket.on("player-out", async (gameId: string) => {
    const player = await PlayersModel.findOne({ socketId: socket.id })
      .select("playerId")
      .exec();
    if (!player) {
      return;
    }
    // find game
    const game = await GamesModel.findOne({ gameId }).exec();
    if (game && (game?.creator ?? "-1") === player.playerId) {
      // Send to all members that room is off
      io.to(game.gameId ?? "").emit("room-off");
      // delete the game from DB
      await game.deleteOne().exec();
    } else {
      // if not creator, just say player left
      await game?.updateOne({
        players: RemovePlayer(player.playerId ?? "", game.players),
      });
      io.to(game?.gameId ?? "").emit("player-out", player.playerId);
    }
  });

  socket.on("disconnect", async () => {
    const player = await PlayersModel.findOne({ socketId: socket.id })
      .select("playerId")
      .exec();
    if (!player) {
      return;
    }
    // find games player created
    const games = await GamesModel.find({ creator: player.playerId }).exec();
    for (let game of games) {
      // Send to all members that room is off
      io.to(game.gameId ?? "").emit("room-off");
      // delete the game from DB
      await game.deleteOne().exec();
    }

    // find games player is part of
    const playGames = await GamesModel.find({
      players: player.playerId,
    }).exec();
    for (let playGame of playGames) {
      await playGame.updateOne({
        players: RemovePlayer(player.playerId ?? "", playGame.players),
      });
      io.to(playGame.gameId ?? "").emit("player-out", player.playerId);
    }
    // delete the player from DB
    await player.deleteOne().exec();
    console.log("A client disconnected");
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/game", game);

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
