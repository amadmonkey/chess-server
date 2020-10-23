var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
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
// const chat = io.of('/chat-namespace');
// const chess = io.of('/chess-namespace');

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
        this.host.isLight = Math.random() > 0.5;
        this.guest = null;
        this.turn = true;
        this.chat = []
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



defNamespace.on('connection', (socket) => {
    
    console.log('a user connected');

    socket.on('create-room-request', (params) => {
        console.log('create-room-request');
        const newLobby = new LOBBY({host: params});
        socket.userDetails = params;
        socket.join(newLobby.getId());
        LOBBIES[newLobby.getId()] = newLobby;
        socket.emit('create-room-response', LOBBIES[newLobby.getId()]);
    });

    socket.on('join-room-request', (params) => {
        console.log('join-room-request');
        let LOBBY = LOBBIES[params.roomId];
        if(LOBBY && io.sockets.adapter.rooms[params.roomId].length < 2){ // if lobby exists && has no more than 1 clients connected
            socket.userDetails = params;
            socket.join(params.roomId);
            LOBBY.createGuest({guest: params});
            defNamespace.in(params.roomId).emit('join-room-response', LOBBY);
        } else {
            // send only to the one trying to join: either incorrect roomId or room already has 2 clients
            socket.emit('join-room-response', null);
        }
    })

    socket.on('leave-room', (params) => {
        console.log('leave-room');
        if(LOBBIES[params.roomId]) {
            console.log('canceled room ' + params.roomId);
            delete LOBBIES[params.roomId];
        }
        defNamespace.in(socket.userDetails.roomId).emit('logout-response');
    });

    socket.on('chat-request', (params) => {
        console.log('chat-request');
        const user = socket.userDetails 
        params.type = null;
        params.nickname = user.nickname;
        console.log(socket.userDetails);
        LOBBIES[user.roomId].chat.push(params);
        // params.chat = LOBBIES[user.roomId].chat;
        socket.to(user.roomId).emit('chat-response', params, LOBBIES[user.roomId].chat);
    });

    socket.on('chat-typing', (params) => {
        console.log('chat-typing');
        console.info(params.nickname, 'is typing');
        socket.to(params.roomId).emit('chat-typing', `${params.nickname} is typing...`);
    });

    socket.on('chess-move-request', (params) => {
        console.log('chess-move-request');
        let set, message;

        if(params.opponentPiece){ // if eating update the opposing piece
            set = LOBBIES[params.roomId].set[!params.holdingPiece.isLight ? 'light':'dark'];
            for(let x = 0; x < set.length; x++){
                if(set[x].id === params.opponentPiece.id){
                    set[x].active = false;
                    break;
                }
            }
        }

        set = LOBBIES[params.roomId].set[params.holdingPiece.isLight ? 'light':'dark'];
        for(let x = 0; x < set.length; x++){
            if(set[x].id === params.holdingPiece.id){
                message = `${set[x].pieceName}:${set[x].position} to ${params.position}`;
                set[x].position = params.newPosition;
                break;
            }
        }

        // if(params.holdingPiece.isLight){
        //     set = LOBBIES[params.roomId].set['light'];
        //     set_opponent = LOBBIES[params.roomId].set['dark'];
        // } else {
        //     set = LOBBIES[params.roomId].set['dark'];
        //     set_opponent = LOBBIES[params.roomId].set['light'];
        // }

        // params.nickname = 'game';
        // params.type = "game";
        // for(let x = 0; x < set.length; x++){
        //     set[x].isInitial = false;
        //     if(set[x].id === params.id) {
        //         params.message = `${set[x].pieceName}:${set[x].position} to ${params.position}`;
        //         set[x].setPosition({position: params.position});
        //         break;
        //     }
        // }
        LOBBIES[params.roomId].chat.push(params);
        defNamespace.in(params.roomId).emit('chat-response', { nickname: params.user.nickname, type: 'game', message: message }, LOBBIES[params.roomId].chat);
        defNamespace.in(params.roomId).emit('chess-move-response', !params.holdingPiece.isLight, LOBBIES[params.roomId].set[params.holdingPiece.isLight ? 'light':'dark'], LOBBIES[params.roomId].set[params.holdingPiece.isLight ? 'dark':'light']);
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
        console.log('a user disconnected');
        socket.emit('chat message', 'a user disconnected');
    });

});

defNamespace.on('error', (reason) => {
    console.log(reason);
});

http.listen(_PORT, () => console.log(`listening on *:${_PORT}`));