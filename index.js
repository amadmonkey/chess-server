
var app = require('express')();
app.use((req, res, next) => { // needs to be applies to app before being used
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    next();
});
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var PIECE_HELPER = require('./piece_helper');
const Lobby = require('./class/Lobby');
const {PIECE_NAMES, CHAT_TYPE, CASTLING_POSITION, SIDE} = require('./Constants');
const Constants = require('./Constants');

let LOBBIES = {};

io.on('connection', (socket) => {
    
    console.info('---- Client Connected', new Date());

    socket.on('create-room-request', (params) => {
        console.info('create-room-request', params);
        if(params.nickname.length > 0 && params.nickname.length < 11){
            const newLobby = new Lobby({host: params});
            LOBBIES[newLobby.getId()] = newLobby;
            socket.user = params;
            socket.join(newLobby.getId());
            socket.emit('create-room-response', LOBBIES[newLobby.getId()]);
        }
    });

    socket.on('join-room-request', (params) => {
        console.info('join-room-request', params);
        let Lobby = LOBBIES[params.roomId];
        if(Lobby && params.nickname.length > 0 && params.nickname.length < 11 && params.roomId.length === 4){
            if(Lobby.host.nickname !== params.nickname){
                if(io.sockets.adapter.rooms[params.roomId].length < 2) {
                    socket.user = params;
                    socket.join(params.roomId);
                    Lobby.createGuest({guest: params});
                    io.in(params.roomId).emit('join-room-response', Lobby);
                }
            } else {
                socket.emit('join-room-response', 'Nickname already being used'); // send only to the one trying to join: either incorrect roomId or room already has 2 clients
                console.info('join-room-response', 'Nickname already being used');
            }
        } else {
            socket.emit('join-room-response', 'Room does not exist'); // send only to the one trying to join: either incorrect roomId or room already has 2 clients
            console.info('join-room-response', 'Room does not exist');
        }
    })

    socket.on('leave-room', (params) => {
        console.info('leave-room', params);
        LOBBIES[params.roomId] && delete LOBBIES[params.roomId]
        console.info('Canceled', params.roomId);
        io.in(params.roomId).emit('logout-response', params);
        console.info('logout-response', params);
    });

    socket.on('chat-request', (params) => {
        console.info(`${new Date()}-chat-request:`, params);
        if(params.message.length > 0 && params.message.length < 51){
            LOBBIES[params.roomId].chat.push({...params, type: null});
            socket.to(params.roomId).emit('chat-response', LOBBIES[params.roomId].chat);
        }
    });

    socket.on('chat-typing', (params) => { socket.to(params.roomId).emit('chat-typing', `${params.nickname} is typing...`)});

    socket.on('chess-move-request', (params) => {
        console.info('chess-move-request', params);
        let Lobby = LOBBIES[params.roomId];
        if(Lobby){
            let set, done, chatObj = {...params, type: CHAT_TYPE.move};
            set = Lobby.set[params.holdingPiece.isLight ? SIDE.light : SIDE.dark]; // get moving side set

            // if the move is a castle, move the rook first
            if(params.holdingPiece.pieceName === PIECE_NAMES.king && params.holdingPiece.isInitial && params.newPosition in CASTLING_POSITION) {
                let i = set.findIndex(obj => obj.position === CASTLING_POSITION[params.newPosition].at && obj.isInitial);
                set[i].setPosition({newPosition: CASTLING_POSITION[params.newPosition].new});
                chatObj = { ...chatObj, rook: set[i], type: CHAT_TYPE.castle }
            }

            // move / change moving piece's position
            set.find(obj => obj.id === params.holdingPiece.id );
            let i = set.findIndex(obj => obj.id === params.holdingPiece.id);
            chatObj.fromPosition = set[i].position;
            set[i].setPosition(params);

            // if the move was a capture update the opposing piece
            if(params.opponentPiece) {
                if(params.opponentPiece.pieceName === PIECE_NAMES.king) { // if opponent piece is a king game done. skip looping
                    done = socket.user;
                } else { // else normal capture process
                    set = Lobby.set[!params.holdingPiece.isLight ? SIDE.light : SIDE.dark];
                    let i = set.findIndex(obj => obj.id === params.opponentPiece.id);
                    chatObj.type = CHAT_TYPE.battle;
                    set[i].capture();
                }
            }

            Lobby.setValidTiles();

            Lobby.chat.push(chatObj); // push new game chat into chat
            Lobby.turn = !params.holdingPiece.isLight;
            io.in(params.roomId).emit('chat-response', Lobby.chat, !params.holdingPiece.isLight, done);
            !done && io.in(params.roomId).emit('chess-move-response', !params.holdingPiece.isLight, Lobby.set[params.holdingPiece.isLight ? SIDE.light : SIDE.dark], Lobby.set[params.holdingPiece.isLight ? SIDE.dark : SIDE.light]);
        } else {
            socket.emit('logout');
        }
    });

    socket.on('validate-session', (params) => {
        console.info('validate-session', params);
        if(params){
            if(LOBBIES[params.roomId]) {
                // exists: rejoin room
                socket.user = params.user;
                socket.join(params.roomId);
                socket.emit('validate-response', LOBBIES[params.roomId]);
            } else {
                // room doesnt exist. log user out
                socket.emit('logout');
            }
        } else {
            socket.emit('logout');
        }
    });

    socket.on('disconnect', (params) => {
        console.info('---- Client Disconnected', params);
    });

});

const _PORT = process.env.PORT || 8080;
http.listen(_PORT, () => console.log(`listening on *:${_PORT}`));