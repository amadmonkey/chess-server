var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, { origins: '*:*'});
var chess = require('./piece');

const _PORT = 8080;

app.set('port', process.env.PORT || _PORT);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    next();
});

const defNamespace = io.of('/');

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


let LOBBIES = {};

class LOBBY {
    constructor({host=null}){
        this.roomId = generateId(4);
        this.host = host;
        this.host.roomId = this.roomId;
        this.host.isLight = Math.random() > 0.5;
        this.guest = null;
        this.turn = true;
        this.chat = [{ type: 'START' }]
        this.set = {
            light: chess.SET({ isLight: true }),
            dark: chess.SET({ isLight: false })
        }
    }
    getId(){
        return this.roomId;
    }
    createGuest({guest=null}){
        this.guest = guest;
        this.guest.isLight = !this.host.isLight;
    }
}



io.on('connection', (socket) => {
    
    console.log('a user connected');

    socket.on('create-room-request', (params) => {
        console.log('create-room-request');
        const newLobby = new LOBBY({host: params});
        socket.user = params;
        socket.join(newLobby.getId());
        LOBBIES[newLobby.getId()] = newLobby;
        socket.emit('create-room-response', LOBBIES[newLobby.getId()]);
    });

    socket.on('join-room-request', (params) => {
        console.log('join-room-request');
        let LOBBY = LOBBIES[params.roomId];
        if(LOBBY){
            if(io.sockets.adapter.rooms[params.roomId].length < 2){
                socket.user = params;
                socket.join(params.roomId);
                LOBBY.createGuest({guest: params});
                io.in(params.roomId).emit('join-room-response', LOBBY);
            } else if(LOBBY.host.nickname === params.nickname || LOBBY.guest.nickname === params.nickname){
                socket.user = params;
                socket.join(params.roomId);
                io.in(params.roomId).emit('join-room-response', LOBBY);
            }
        } else {
            socket.emit('join-room-response', null); // send only to the one trying to join: either incorrect roomId or room already has 2 clients
        }
    })

    socket.on('leave-room', (params) => {
        console.log('leave-room');
        if(LOBBIES[params.roomId]) {
            console.log('canceled room ' + params.roomId);
            delete LOBBIES[params.roomId];
        }
        io.in(params.roomId).emit('logout-response', params);
    });

    socket.on('chat-request', (params) => {
        console.info('chat-request', params);
        params.type = null;
        LOBBIES[params.roomId].chat.push(params);
        socket.to(params.roomId).emit('chat-response', LOBBIES[params.roomId].chat);
    });

    socket.on('chat-typing', (params) => {
        console.log('chat-typing');
        console.info(params.nickname, 'is typing');
        socket.to(params.roomId).emit('chat-typing', `${params.nickname} is typing...`);
    });

    socket.on('chess-move-request', (params) => {
        if(LOBBIES[params.roomId]){

            let set, rook = null, done;
            set = LOBBIES[params.roomId].set[params.holdingPiece.isLight ? 'light':'dark'];

            // if move is a castle, move the rook
            // 1. if moving piece is king and is initial
            // 2. if moved on C8 or G8 if dark or C1 or G1 if light
            // 3. if rook on A8, H8, A1, H1 is initial
            if(params.holdingPiece.pieceName === chess.PIECE_NAMES.KING && params.holdingPiece.isInitial){
                let newRookPosition;
                switch(params.newPosition){
                    case 'C8': rook = 'A8'; newRookPosition = 'D8'; break;
                    case 'G8': rook = 'H8'; newRookPosition = 'F8'; break;
                    case 'C1': rook = 'A1'; newRookPosition = 'D1'; break;
                    case 'G1': rook = 'H1'; newRookPosition = 'F1'; break;
                    default: break;
                }
                // rook = set.filter(obj => obj.position === rook && obj.isInitial);
                // rook.fromPosition = rook.position;
                // rook.position = newRookPosition;
                // rook.isInitial = false;
                // params.type = 'CASTLE';
                for(let x = 0; x < set.length; x++){
                    if(set[x].position === rook){
                        set[x].fromPosition = set[x].position;
                        set[x].position = newRookPosition;
                        set[x].isInitial = false;
                        params.rook = set[x];
                        params.type = 'CASTLE';
                        break;
                    }
                }
            }

            // move / change position
            for(let x = 0; x < set.length; x++){
                if(set[x].id === params.holdingPiece.id){
                    params.type = params.type ? params.type : 'MOVE';
                    params.fromPosition = set[x].position;
                    set[x].position = params.newPosition;
                    set[x].isInitial = false;
                    break;
                }
            }

            // if eating update the opposing piece
            if(params.opponentPiece){ 
                if(params.opponentPiece.pieceName === chess.PIECE_NAMES.KING){ // if opponent piece is king game done. skip looping
                    done = socket.user;
                } else {
                    set = LOBBIES[params.roomId].set[!params.holdingPiece.isLight ? 'light':'dark'];
                    for(let x = 0; x < set.length; x++){
                        if(set[x].id === params.opponentPiece.id){
                            params.type = 'BATTLE';
                            set[x].active = false;
                            break;
                        }
                    }
                }
            }
    
            LOBBIES[params.roomId].chat.push(params);
            LOBBIES[params.roomId].turn = !params.holdingPiece.isLight;
            io.in(params.roomId).emit('chat-response', LOBBIES[params.roomId].chat, !params.holdingPiece.isLight, done);
            io.in(params.roomId).emit('chess-move-response', !params.holdingPiece.isLight, LOBBIES[params.roomId].set[params.holdingPiece.isLight ? 'light':'dark'], LOBBIES[params.roomId].set[params.holdingPiece.isLight ? 'dark':'light'], done);
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
        console.log('a user disconnected', params);
        socket.emit('chat message', 'a user disconnected');
    });

});

http.listen(_PORT, () => console.log(`listening on *:${_PORT}`));