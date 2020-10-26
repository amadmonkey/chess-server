const PieceNames = {
    PAWN: "PAWN",
    ROOK: "ROOK",
    KNIGHT: "KNIGHT",
    BISHOP: "BISHOP",
    QUEEN: "QUEEN",
    KING: "KING"
}

class Piece {
    constructor({ index = "", isLight = "", pieceName = "", position = "" }){
        this.id = `${isLight ? 'light' : 'dark'}-${pieceName}-${index}`;
        this.isLight = isLight;
        this.pieceName = pieceName;
        this.isInitial = true;
        this.position = position;
        this.rules = getPieceRules(pieceName);
        this.active = true;
    }
    setPosition({position = ""}){
        this.position = position;
    }
}

//
//  RULES
//    xn[:/=]yn
//       - [:] means both conditions must be fulfilled, i.e: [x-1:y+2] -1 x +2 y from the piece's current coords
//       - [=] means both nodes has to have equal digits regardless if negative or positive, e.g: [x-2:+2] is true
//    x[n]:y[n]
//       - [n] says how much distance from the selected piece in each axis, i.e: [x-2] is -2 numbers from the piece's current x
//       - [*] means every node in that axis, i.e: [x*] any value in x axis
//

const CONDITION = {
    initial: 'INITIAL', // has to be the first move they make
    no_piece: 'NO_PIECE', // no piece regardless of side
    has_opponent: 'HAS_OPPONENT', // has opposing piece
    until_opponent: 'UNTIL_OPPONENT', // for loops. keep getting next tile (horizontally/vertically/diagonally) until found an opponent 
    castling: 'CASTLING' // special condition
}

const getPieceRules = (pieceName) => {
    switch(pieceName){
        case PieceNames.PAWN:
            return [
                {
                    rule:'x-1:y0',
                    conditions: [CONDITION.no_piece]
                },
                {
                    rule: 'x-2:y0',
                    conditions: [CONDITION.initial, CONDITION.no_piece]
                },
                {
                    rule: 'x-1:y-1',
                    conditions: [CONDITION.has_opponent]
                },
                {
                    rule: 'x-1:y+1',
                    conditions: [CONDITION.has_opponent]
                }
            ];
        case PieceNames.ROOK:
            return [
                {
                    rule: 'x*:y0',
                    conditions: [CONDITION.until_opponent]
                },
                {
                    rule: 'x0:y*',
                    conditions: [CONDITION.until_opponent]
                }
            ];
        case PieceNames.KNIGHT:
            return [
                {
                    rule:'x-2:y-1',
                    conditions: []
                },
                {
                    rule:'x-2:y+1',
                    conditions: []
                },
                {
                    rule:'x-1:y-2',
                    conditions: []
                },
                {
                    rule:'x-1:y+2',
                    conditions: []
                },
                {
                    rule:'x+1:y-2',
                    conditions: []
                },
                {
                    rule:'x+1:y+2',
                    conditions: []
                },
                {
                    rule:'x+2:y-1',
                    conditions: []
                },
                {
                    rule:'x+2:y+1',
                    conditions: []
                }
            ];
        case PieceNames.BISHOP:
            return [
                {
                    rule: 'x*=y*',
                    conditions: [CONDITION.until_opponent]
                }
            ];
        case PieceNames.QUEEN:
            return [
                {
                    rule: 'x*:y0',
                    conditions: [CONDITION.until_opponent]
                },
                {
                    rule: 'x0:y*',
                    conditions: [CONDITION.until_opponent]
                },
                {
                    rule: 'x*=y*',
                    conditions: [CONDITION.until_opponent]
                }
            ];
        case PieceNames.KING:
            return [
                {
                    rule:'x-1:y-1',
                    conditions: []
                },
                {
                    rule:'x-1:y0',
                    conditions: []
                },
                {
                    rule:'x-1:y+1',
                    conditions: []
                },
                {
                    rule:'x0:y-1',
                    conditions: []
                },
                {
                    rule:'x0:y+1',
                    conditions: []
                },
                {
                    rule:'x+1:y-1',
                    conditions: []
                },
                {
                    rule:'x+1:y0',
                    conditions: []
                },
                {
                    rule:'x+1:y+1',
                    conditions: []
                },
                {
                    rule: 'x0:y-2',
                    conditions: [CONDITION.initial, CONDITION.castling]
                },
                {
                    rule: 'x0:y+2',
                    conditions: [CONDITION.initial, CONDITION.castling]
                }
            ];
    }
}

const getPiece = (pieceName, attr) => {
    let attr1;
    let attr2;
    attr.pieceName = pieceName;
    switch (pieceName) {
        default:
        case PieceNames.PAWN:
            let pieces = [];
            for(let x = 0; x < 8; x++){
                let charCode = attr.isLight ? (65 + x) : (72 - x);
                attr.index = x;
                attr.position = `${String.fromCharCode(charCode)}${attr.isLight ? 2 : 7}`;
                pieces.push(new Piece(attr));
            }
            return pieces;
        case PieceNames.ROOK:
            attr1 = {...attr, position: attr.isLight ? 'A1' : 'H8', index: 0};
            attr2 = {...attr, position: attr.isLight ? 'H1' : 'A8', index: 1};
            return [
                new Piece(attr1),
                new Piece(attr2)
            ]
        case PieceNames.KNIGHT:
            attr1 = {...attr, position: attr.isLight ? 'B1' : 'G8', index: 0};
            attr2 = {...attr, position: attr.isLight ? 'G1' : 'B8', index: 1};
            return [
                new Piece(attr1),
                new Piece(attr2)
            ]
        case PieceNames.BISHOP:
            attr1 = {...attr, position: attr.isLight ? 'C1' : 'F8', index: 0};
            attr2 = {...attr, position: attr.isLight ? 'F1' : 'C8', index: 1};
            return [
                new Piece(attr1),
                new Piece(attr2)
            ]
        case PieceNames.QUEEN:
            attr.position = attr.isLight ? 'D1' : 'D8';
            attr.index = 0;
            return [
                new Piece(attr)
            ]
        case PieceNames.KING:
            attr.position = attr.isLight ? 'E1' : 'E8';
            attr.index = 0;
            return [
                new Piece(attr)
            ]
    }
        
}

const getSet = (attr) => {
    return [
        ...getPiece(PieceNames.PAWN, attr),
        ...getPiece(PieceNames.ROOK, attr),
        ...getPiece(PieceNames.KNIGHT, attr),
        ...getPiece(PieceNames.BISHOP, attr),
        ...getPiece(PieceNames.QUEEN, attr),
        ...getPiece(PieceNames.KING, attr)
    ];
}

module.exports = {
    SET: getSet,
    PIECE_NAMES: PieceNames
}