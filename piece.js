const PieceNames = {
    PAWN: "PAWN",
    ROOK: "ROOK",
    KNIGHT: "KNIGHT",
    BISHOP: "BISHOP",
    QUEEN: "QUEEN",
    KING: "KING"
}

class Piece {
    constructor({ index = "", isLight = "", pieceName = "", position = "", rules = "" }){
        this.id = `${isLight ? 'light' : 'dark'}-${pieceName}-${index}`;
        this.isLight = isLight;
        this.pieceName = pieceName;
        this.position = position;
        this.rules = rules;
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

const getPieceRules = (pieceName) => {
    switch(pieceName){
        case PieceNames.PAWN:
            return [
                'x-1:y0',
                'x-2:y0',
                {
                    rule: 'x-1:y-1',
                    condition: 'HAS_OPPONENT'
                },
                {
                    rule: 'x-1:y+1',
                    condition: 'HAS_OPPONENT'
                }
            ];
        case PieceNames.ROOK:
            return [
                'x*:y0',
                'x0:y*'
            ];
        case PieceNames.KNIGHT:
            return [
                'x-2:y-1',
                'x-2:y+1',
                'x-1:y-2',
                'x-1:y+2',
                'x+1:y-2',
                'x+1:y+2',
                'x+2:y-1',
                'x+2:y+2',
            ];
        case PieceNames.BISHOP:
            return [
                'x*=y*'
            ];
        case PieceNames.QUEEN:
            return [
                'x*:y0',
                'x0:y*',
                'x*=y*'
            ];
        case PieceNames.KING:
            return [
                'x-1:y-1',
                'x-1:y0',
                'x-1:y+1',
                'x0:y-1',
                'x0:y+1',
                'x+1:y-1',
                'x+1:y0',
                'x+1:y+1',
                {
                    rule: 'x-2:y0',
                    condition: 'CASTLING'
                },
                {
                    rule: 'x+2:y0',
                    condition: 'CASTLING'
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
                attr.rules = getPieceRules(PieceNames.PAWN);
                pieces.push(new Piece(attr));
            }
            return pieces;
        case PieceNames.ROOK:
            attr1 = {...attr, position: attr.isLight ? 'A1' : 'H8', rules: getPieceRules(PieceNames.ROOK), index: 0};
            attr2 = {...attr, position: attr.isLight ? 'H1' : 'A8', rules: getPieceRules(PieceNames.ROOK), index: 1};
            return [
                new Piece(attr1),
                new Piece(attr2)
            ]
        case PieceNames.KNIGHT:
            attr1 = {...attr, position: attr.isLight ? 'B1' : 'G8', rules: getPieceRules(PieceNames.KNIGHT), index: 0};
            attr2 = {...attr, position: attr.isLight ? 'G1' : 'B8', rules: getPieceRules(PieceNames.KNIGHT), index: 1};
            return [
                new Piece(attr1),
                new Piece(attr2)
            ]
        case PieceNames.BISHOP:
            attr1 = {...attr, position: attr.isLight ? 'C1' : 'F8', rules: getPieceRules(PieceNames.BISHOP), index: 0};
            attr2 = {...attr, position: attr.isLight ? 'F1' : 'C8', rules: getPieceRules(PieceNames.BISHOP), index: 1};
            return [
                new Piece(attr1),
                new Piece(attr2)
            ]
        case PieceNames.QUEEN:
            attr.position = attr.isLight ? 'D1' : 'D8';
            attr.index = 0;
            attr.rules = getPieceRules(PieceNames.QUEEN);
            return [
                new Piece(attr)
            ]
        case PieceNames.KING:
            attr.position = attr.isLight ? 'E1' : 'E8';
            attr.index = 0;
            attr.rules = getPieceRules(PieceNames.KING);
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
    SET: getSet
}