import { Request, Response } from "express";
import dotenv from "dotenv";
import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import {
  AddPlayerIfNew,
  FindRankOfPlayer,
  genId5,
  GetFromContent,
  GetGameTemplate,
  GetNumEntries,
  RemovePlayer,
} from "./utils/helpers";
import ConnectDB from "./utils/mongodb";
import { GameContent, JoinRoomObject, Player } from "./types/game";
import GamesModel from "./models/games";
import game from "./routes/games";
import PlayersModel from "./models/players";
import tests from "./routes/tests";

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
      round: 1,
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
      return;
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

  socket.on("game-started", async (gameId: string) => {
    const game = await GamesModel.findOne({ gameId }).exec();
    if (!game) return;
    const content: GameContent = game.players.map((p) => {
      return {
        guesses: [],
        drawings: [],
      };
    });
    await game.updateOne({ content }).exec();

    io.to(gameId).emit("game-started");
  });

  socket.on(
    "init-entry",
    async (gameId: string, kind: "guesses" | "drawings") => {
      const game = await GamesModel.findOne({ gameId }).exec();
      if (!game) return;
      const numDone = GetNumEntries(game.content, kind, game.round);
      io.in(gameId).emit("num-entry", numDone);
    }
  );

  socket.on("ready", async (gameId: string, round: number) => {
    const game = await GamesModel.findOne({ gameId }).exec();
    if (!game) return;
    const currRound = game.round;
    const currPlayer = await PlayersModel.findOne({
      socketId: socket.id,
    }).exec();
    if (!currPlayer) return; // TODO: should notify everyone and if creator, kick everyone off game
    // if creator, update game rounds + 1
    if (currPlayer.playerId === game.creator) {
      await game.updateOne({ round: currRound + 1 }).exec();
      // Does not update right away even with queryInvalidation, try emitting round #
      io.in(gameId).emit("round-update");
    }

    const template = GetGameTemplate(game.players.length);
    const from = GetFromContent(
      template,
      FindRankOfPlayer(game?.players ?? [], currPlayer?.playerId ?? "")
    );
    if (from === null || from === undefined) {
      console.log("NO FROM:", currPlayer?.playerId);
      // tell clients someone left current game, kick everyone out (unplayable)
      io.in(gameId).emit("player-out");
      return;
    }
    // content sent is drawing if new round odd, guesses if even
    // console.log("Round:", round, currRound, currPlayer?.playerId);
    const roundIndex =
      currRound % 2 !== 0 ? Math.floor(currRound / 2) : currRound / 2 - 1;
    const content =
      currRound % 2 !== 0
        ? game.content[from].guesses[roundIndex]
        : game.content[from].drawings[roundIndex];

    // console.log("READY:", currPlayer.playerId, content);
    io.in(currPlayer.playerId ?? "").emit(
      "round-content",
      JSON.stringify({
        content,
        kind: currRound % 2 !== 0 ? "guesses" : "drawings",
      })
    );
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
      console.log("LEFT GAME:", playGame.gameId, player.playerId);
      await playGame.updateOne({
        players: RemovePlayer(player.playerId ?? "", playGame.players),
      });
      io.in(playGame.gameId ?? "").emit("player-out", player.playerId);
    }
    // delete the player from DB
    await player.deleteOne().exec();
    console.log("A client disconnected -", player.playerId);
  });
});

io.engine.on("connection_error", (err) => {
  console.error("ERROR (req): ", err.req); // the request object
  console.error("ERROR (code): ", err.code); // the error code, for example 1
  console.error("ERROR (msg): ", err.message); // the error message, for example "Session ID unknown"
  console.error("ERROR (ctx): ", err.context); // some additional error context
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
app.use("/tests", tests);

app.use("/game", game);

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
