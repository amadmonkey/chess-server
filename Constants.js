const PIECE_NAMES = {
    pawn: "PAWN",
    rook: "ROOK",
    knight: "KNIGHT",
    bishop: "BISHOP",
    queen: "QUEEN",
    king: "KING"
}

const CONDITION = {
    initial: 'INITIAL', // has to be the first move they make
    no_piece: 'NO_PIECE', // no piece regardless of side
    has_opponent: 'HAS_OPPONENT', // has opposing piece
    until_opponent: 'UNTIL_OPPONENT', // for loops. keep getting next tile (horizontally/vertically/diagonally) until found an opponent 
    castling: 'CASTLING', // special condition,
    no_before: 'NO_BEFORE'
}

const MOVE_TYPE = {
    move: "MOVE",
    battle: "BATTLE",
    castle: "CASTLE",
    self: "SELF"
}

const CASTLING_POSITION = {
    C8: {
        at: 'A8',
        new: 'D8',
        no: ['B8', 'D8']
    },
    G8: {
        at: 'H8',
        new: 'F8',
        no: ['F8']
    },
    C1: {
        at: 'A1',
        new: 'D1',
        no: ['B1', 'D1']
    },
    G1: {
        at: 'H1',
        new: 'F1',
        no: ['F1']
    }
}

const SIDE = {
    light: 'LIGHT',
    dark: 'DARK'
}

module.exports = {
    CONDITION: CONDITION,
    PIECE_NAMES: PIECE_NAMES,
    MOVE_TYPE: MOVE_TYPE,
    CASTLING_POSITION: CASTLING_POSITION,
    SIDE: SIDE
};