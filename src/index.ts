import { Request, Response } from "express";
import dotenv from "dotenv";
import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import { randomUUID } from "crypto";
import { genId5 } from "./utils/helpers";

export const app: Express = express();
app.use(cors());
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

io.on("connection", async (socket) => {
  console.log(`Successful connection with ${io.engine.clientsCount} users`);

  // listens for new users when they succesfully connect
  socket.on("iam", (id: string) => socket.join(id));
  // creates a room and add user id to it
  socket.on("create-room", (id: string) => {
    const roomId = genId5();
    socket.join(roomId);
    io.to(id).emit("room-id", roomId);
  });
  // join existing room using roomId and add user id to it
  socket.on("join-room", (id: string, roomId: string) => {
    // add user to room
    socket.join(roomId);
    io.to(id).emit("room-id", roomId);
    io.to(roomId).emit("room-in", "New arrival in room!!");
    //socket.to(id).emit("room", "Success");
  });
  socket.on("disconnect", () => {
    // leave rooms on disconnect
    console.log("ROOMS:", socket.rooms);
    socket.rooms.forEach((r) => socket.leave(r));
    console.log("A client disconnected");
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
