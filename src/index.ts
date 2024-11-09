import { Request, Response } from "express";
import dotenv from "dotenv";
import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { AddPlayerIfNew, genId5 } from "./utils/helpers";
import ConnectDB from "./utils/mongodb";
import { JoinRoomObject, Player } from "./types/game";
import GamesModel from "./models/games";
import game from "./routes/games";

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
  socket.on("iam", (id: string) => {
    socket.join(id);
  });
  // creates a room and add user id to it
  socket.on("create-room", async (createString: string) => {
    const createObject = JSON.parse(createString) as Player;
    const roomId = genId5();
    socket.join(roomId);
    const game = {
      gameId: roomId,
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
  socket.on("disconnect", () => {
    // leave rooms on disconnect
    socket.rooms.forEach((r) => socket.leave(r));
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
