import express from "express";
import { Request, Response } from "express";
import GamesModel from "../models/games";
import { isPlayerOfGame } from "../utils/helpers";
const game = express.Router();

game.get("/:id", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const game = await GamesModel.findOne({ gameId }).exec();
  if (!game) {
    res.status(404);
    return;
  }
  res.json({
    gameId: game.gameId,
    creator: game.creator,
    players: game.players,
    round: game.round,
  });
});
game.get("/full/:id", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const game = await GamesModel.findOne({ gameId }).exec();
  if (!game) {
    res.status(404);
    return;
  }
  res.json({
    gameId: game.gameId,
    creator: game.creator,
    players: game.players,
    round: game.round,
    content: game.content,
  });
});

game.get("/check/:id/:player", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const player = req.params.player;
  const game = await GamesModel.findOne({ gameId }).exec();

  if (!game) {
    res.json({
      status: !!game,
    });
  } else {
    res.json({
      status: isPlayerOfGame(game.players, player),
    });
  }
});

game.post("/entry/:id", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const game = await GamesModel.findOne({ gameId }).exec();
  if (!game) {
    res.status(404);
    return;
  }

  const upPlayerContent = {
    guesses: [...game.content[req.body.rank].guesses, req.body.entry],
    drawings: [...game.content[req.body.rank].drawings],
  };
  const gameContent = [
    ...game.content.slice(0, req.body.rank),
    upPlayerContent,
    ...game.content.slice(req.body.rank + 1),
  ];
  const upGame = await game.updateOne({ content: gameContent }).exec();
  res.json(upGame);
});

game.post("/drawing/:id", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const game = await GamesModel.findOne({ gameId }).exec();
  if (!game) {
    res.status(404);
    return;
  }

  const upPlayerContent = {
    guesses: [...game.content[req.body.rank].guesses],
    drawings: [...game.content[req.body.rank].drawings, req.body.entry],
  };
  const gameContent = [
    ...game.content.slice(0, req.body.rank),
    upPlayerContent,
    ...game.content.slice(req.body.rank + 1),
  ];
  const upGame = await game.updateOne({ content: gameContent }).exec();
  res.json(upGame);
});

export default game;
