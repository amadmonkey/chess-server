var Piece = require('./class/Piece.js');
const { PIECE_NAMES } = require('./Constants'); 

const getPiece = (pieceName, attr) => {
    attr.pieceName = pieceName;
    switch (pieceName) {
        default:
        case PIECE_NAMES.pawn:
            let pieces = [];
            for(let x = 0; x < 8; x++) pieces.push(new Piece({...attr, index: x, position: `${String.fromCharCode(attr.isLight ? (65 + x) : (72 - x))}${attr.isLight ? 2 : 7}`}));
            return pieces;
        case PIECE_NAMES.rook:
            return [ new Piece({...attr, position: attr.isLight ? 'A1' : 'H8', index: 0}), new Piece({...attr, position: attr.isLight ? 'H1' : 'A8', index: 1}) ]
        case PIECE_NAMES.knight:
            return [ new Piece({...attr, position: attr.isLight ? 'B1' : 'G8', index: 0}), new Piece({...attr, position: attr.isLight ? 'G1' : 'B8', index: 1}) ]
        case PIECE_NAMES.bishop:
            return [ new Piece({...attr, position: attr.isLight ? 'C1' : 'F8', index: 0}), new Piece({...attr, position: attr.isLight ? 'F1' : 'C8', index: 1}) ]
        case PIECE_NAMES.queen:
            return [ new Piece({...attr, index: 0, position: attr.isLight ? 'D1' : 'D8'}) ]
        case PIECE_NAMES.king:
            return [ new Piece({...attr, index: 0, position: attr.isLight ? 'E1' : 'E8'}) ]
    }
}

const getSet = (attr) => {
    return [
        ...getPiece(PIECE_NAMES.pawn, attr),
        ...getPiece(PIECE_NAMES.rook, attr),
        ...getPiece(PIECE_NAMES.knight, attr),
        ...getPiece(PIECE_NAMES.bishop, attr),
        ...getPiece(PIECE_NAMES.queen, attr),
        ...getPiece(PIECE_NAMES.king, attr)
    ];
}

module.exports = {
    SET: getSet
}