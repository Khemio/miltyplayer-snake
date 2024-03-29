import { createServer } from "http";
import {Server}from "socket.io";
import { initGame, gameLoop, getUpdatedVelocity } from "./game.js";
import { FRAME_RATE } from "./constants.js";
import { makeid } from "./utils.js";

const state = {};
const clientRooms = {};

const httpServer = createServer()
const io = new Server( httpServer, {
    cors: {
        origin: '*'
    }
});

io.on('connection', client => {
    client.on('keydown', handleKeydown);
    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);

    function handleJoinGame(roomName) {
        const room = io.sockets.adapter.rooms.get(roomName);

        if(!room) return client.emit('unknownGame');
        if(room.size > 1) return client.emit('tooManyPlayers');

        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = 2;
        client.emit('init', 2);

        startGameInterval(roomName);
    }

    function handleNewGame() {
        let roomName = makeid(5);
        clientRooms[client.id] = roomName;
        client.emit('gameCode', roomName);

        state[roomName] = initGame();

        client.join(roomName);
        client.number = 1;
        client.emit('init', 1);
}

    function handleKeydown(keyCode) {
        const roomName = clientRooms[client.id];

        if(!roomName) return

        try {
            keyCode = parseInt(keyCode);
        } catch(err) {
            console.log(err);
            return;
        }

        const vel = getUpdatedVelocity(keyCode);

        if(vel) {
            state[roomName].players[client.number - 1].vel = vel;
        }
    }

})

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);

        if(!winner) {
            emitGameState(roomName, state[roomName]);
        } else {
            emitGameOver(roomName, winner);
            state[roomName] = null;
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE)
}

function emitGameState(roomName, state) {
    io.sockets.in(roomName).emit('gameState', JSON.stringify(state))
}

function emitGameOver(roomName, winner) {
    io.sockets.in(roomName).emit('gameOver', JSON.stringify({winner}))
}

io.listen(process.env.PORT || 3002);

