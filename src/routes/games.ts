import express from "express";
import { Request, Response } from "express";
import GamesModel from "../models/games";
const game = express.Router();

game.get("/:id", async (req: Request, res: Response) => {
  const gameId = req.params.id;
  const game = await GamesModel.findOne({ gameId }).exec();
  if (!game) {
    res.status(404);
    return;
  }
  res.json(game);
});

export default game;
