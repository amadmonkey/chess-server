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

let LOBBIES = {};

defNamespace.on('connection', (socket) => {
    
    console.log('a user connected');

    socket.on('cancel-room', (params) => {
        console.log('canceled room ' + params.roomId);
        delete LOBBIES[params.roomId];
    });

    socket.on('create-room-request', (params) => {
        socket.userDetails = params;
        LOBBIES[params.roomId] = {
            host: params,
            roomId: params.roomId,
            chat: [],
            turn: null,
            set: {
                light: chess.SET({ isLight: true }),
                dark: chess.SET({ isLight: false })
            }
        }
        socket.join(params.roomId);
        let set = {
            user: LOBBIES[params.roomId].set[params.isLight ? 'light' : 'dark'],
            opponent: LOBBIES[params.roomId].set[!params.isLight ? 'light' : 'dark']
        }
        socket.emit('create-room-response', {userDetails: params, set: set});
    });

    socket.on('join-room-request', (params) => {
        if(LOBBIES[params.roomId] && io.sockets.adapter.rooms[params.roomId].length < 2){
            params.isLight = !LOBBIES[params.roomId].host.isLight;
            socket.userDetails = params;
            socket.join(params.roomId);
            let set = {
                host: LOBBIES[params.roomId].set[LOBBIES[params.roomId].host.isLight ? 'light' : 'dark'],
                guest: LOBBIES[params.roomId].set[params.isLight ? 'light' : 'dark']
            }
            LOBBIES[params.roomId].turn = 'light';
            defNamespace.in(params.roomId).emit('join-room-response', {hostDetails: LOBBIES[params.roomId].host, turn: true, guestDetails: params, set: set});
        } else {
            // send only to the one trying to join: either incorrect roomId or room already has 2 clients
            socket.emit('join-room-response', null);
        }
    })

    socket.on('chat-request', (params) => {
        const user = socket.userDetails 
        params.type = null;
        params.nickname = user.nickname;
        console.log(socket.userDetails);
        LOBBIES[user.roomId].chat.push(params);
        // params.chat = LOBBIES[user.roomId].chat;
        socket.to(user.roomId).emit('chat-response', params, LOBBIES[user.roomId].chat);
    });

    socket.on('chat-typing', (params) => {
        console.info(params.nickname, 'is typing');
        socket.to(params.roomId).emit('chat-typing', `${params.nickname} is typing...`);
    });

    socket.on('chess-move-request', (params) => {
        console.log('chess-move-request');
        let set, set_opponent;
        if(socket.userDetails.isLight){
            set = LOBBIES[socket.userDetails.roomId].set['light'];
            set_opponent = LOBBIES[socket.userDetails.roomId].set['dark'];
        } else {
            set = LOBBIES[socket.userDetails.roomId].set['dark'];
            set_opponent = LOBBIES[socket.userDetails.roomId].set['light'];
        }

        params.nickname = 'game';
        params.type = "game";
        for(let x = 0; x < set.length; x++){
            if(set[x].id === params.id) {
                params.message = `${set[x].pieceName}:${set[x].position} to ${params.position}`;
                set[x].position = params.position;
                break;
            }
        }

        LOBBIES[socket.userDetails.roomId].chat.push(params);
        defNamespace.in(socket.userDetails.roomId).emit('chat-response', params, LOBBIES[socket.userDetails.roomId].chat);
        defNamespace.in(socket.userDetails.roomId).emit('chess-move-response', !socket.userDetails.isLight, set, set_opponent);
    });

    socket.on('validate-session', (params) => {
        if(params){
            if(LOBBIES[params.roomId]) {
                // exists: rejoin room
                socket.userDetails = params;
                socket.join(params.roomId);
                socket.emit('chat-list', LOBBIES[params.roomId].chat);
            } else {
                // room doesnt exist. log user out
                socket.emit('logout');
            }
        } else {
            socket.emit('logout');
        }
    });

    socket.on('logout-request', (params) => {
        if(LOBBIES[params.roomId]) {
            console.log('canceled room ' + params.roomId);
            delete LOBBIES[params.roomId];
        }
        defNamespace.in(socket.userDetails.roomId).emit('logout-response');
        socket.emit('chat message', 'a user disconnected');
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