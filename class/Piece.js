const {PIECE_NAMES, CONDITION, SIDE, CASTLING_POSITION} = require('../Constants');

class Piece {
    constructor({ index = "", isLight = "", pieceName = "", position = "" }){
        this.id = `${isLight ? SIDE.light : SIDE.dark}-${pieceName}-${index}`;
        this.isLight = isLight;
        this.pieceName = pieceName;
        this.isInitial = true;
        this.position = position;
        this.previousPosition = position;
        this.rules = getPieceRules(pieceName);
        this.validTiles = [];
        this.active = true;
    }
    setPosition({newPosition = ""}){
        this.previousPosition = this.position;
        this.position = newPosition;
        this.isInitial = false;
    }
    setMyValidTiles(set){
        let tiles = [];
        this.rules.forEach(ruleObj => {
            let ra = ruleObj.rule.split(/(:|=)/g);
            let ruleX = ra[0].split('x')[1], ruleY = ra[2].split('y')[1], x, y, tileObj;
            if (ra[1] === ':') { // all tiles along x axis
                if (ruleX === '*') { // all tiles along x axis
                    for(let isUp = 0; isUp < 2; isUp++){ // loop for both vertical tiles from piece; i.e up and down / left and right
                        for (let i = 0; i < 8; i++) { // get new x and y values from origin
                            let x = eval(`${this.position.substring(1,2)}${this.isLight ? (isUp ? '+' : '-') : (isUp ? '-' : '+')}${i+1}`);
                            let y = String.fromCharCode(eval(this.position.substring(0,1).charCodeAt(0) + (ruleY.length > 1 ? ruleY : "+0")));
                            tileObj = testConditions(this, ruleObj.conditions, x, y, set);
                            if(tileObj.valid) tiles.push({ tile: `${y}${x}`, castle: tileObj.castling});
                            if(tileObj.stop) {break;}
                        }
                    }
                } else if (ruleY === "*") { // all tiles along y axis
                    for(let isLeft = 0; isLeft < 2; isLeft++){ // loop for both horizontal tiles from piece
                        for (let i = 0; i < 8; i++) { // get new x and y values from origin
                            let x = this.position.substring(1,2);
                            let y = String.fromCharCode(eval(`${this.position.substring(0,1).charCodeAt(0)}${this.isLight ? (isLeft ? '+' : '-') : (isLeft ? '-' : '+')}${i+1}`));
                            tileObj = testConditions(this, ruleObj.conditions, x, y, set);
                            if(tileObj.valid) tiles.push({ tile: `${y}${x}`, castle: tileObj.castling});
                            if(tileObj.stop) {break;}
                        }
                    }
                } else { // specific tile
                    let x = eval(`${this.position.substring(1,2)}${this.isLight ? (ruleX.substring(0,1) === '-' ? '+':'-') : ''}${this.isLight ? Math.abs(ruleX) : ruleX.length > 1 ? ruleX : "+0"}`);
                    let y = String.fromCharCode(eval(this.position.substring(0,1).charCodeAt(0) + (ruleY.length > 1 ? ruleY : "+0")));
                    if(this.pieceName === 'PAWN'){
                        // debugger
                    }
                    tileObj = testConditions(this, ruleObj.conditions, x, y, set);
                    if(tileObj.valid) tiles.push({ tile: `${y}${x}`, castle: tileObj.castling});
                }
            } else {
                for(let z = 0; z < 4; z++){
                    let axis;
                    switch(z){
                        case 0: axis = {x: '-', y: '-'}; break;
                        case 1: axis = {x: '-', y: '+'}; break;
                        case 2: axis = {x: '+', y: '-'}; break;
                        case 3: axis = {x: '+', y: '+'}; break;
                        default: break;
                    }
                    for(let i = 0; i < 8; i++){
                        let x = eval(`${this.position.substring(1,2)}${this.isLight ? axis.x : axis.y}${i+1}`);
                        let y = String.fromCharCode(eval(`${this.position.substring(0,1).charCodeAt(0)}${this.isLight ? axis.y : axis.x }${i+1}`));
                        if(this.pieceName === 'QUEEN'){
                            let test = "test";
                        }

                        tileObj = testConditions(this, ruleObj.conditions, x, y, set);
                        if(tileObj.valid) tiles.push({ tile: `${y}${x}`, castle: tileObj.castling});
                        if(tileObj.stop) {
                            break;
                        }
                    }
                }
            }
        })
        this.validTiles = tiles;
    }
    capture(){
        this.active = false;
    }
}

const testConditions = (piece, conditions, x, y, set) => { // class tile with each rule. tile is valid until proven otherwise
    if(['A','B','C','D','E','F','G','H'].includes(y) && x >=1 && x <= 8){
        let res = { valid: true, castling: false, stop: false };
        let hasAlly = set[piece.isLight ? SIDE.light : SIDE.dark].filter(obj => obj.position === `${y}${x}` && obj.active).length;
        let hasOpponent = set[piece.isLight ? SIDE.dark : SIDE.light].filter(obj => obj.position === `${y}${x}` && obj.active).length;
    
        // since no one piece can capture an allied piece, check for this first before looping through conditions
        if(hasAlly) return { valid: false, castling: false, stop: true }; 
    
        // loop through conditions
        conditions.forEach((condition) => {
            switch(condition){
                case CONDITION.initial:
                    if(!piece.isInitial) res.valid = false; 
                    break;
                case CONDITION.no_piece:
                    if(hasOpponent) res.valid = false;
                    break;
                case CONDITION.no_before:
                    let enPassantHasLightBetween = set[SIDE.light].filter(obj => obj.position === `${y}${piece.isLight ? (x-1) : (x+1)}` && obj.active).length;
                    let enPassantHasDarkBetween = set[SIDE.dark].filter(obj => obj.position === `${y}${piece.isLight ? (x-1) : (x+1)}` && obj.active).length;
                    if(enPassantHasLightBetween || enPassantHasDarkBetween) res.valid = false;
                    break;
                case CONDITION.has_opponent:
                    if(!hasOpponent) res.valid = false;
                    break
                case CONDITION.until_opponent:
                    if(hasOpponent) res.stop = true;
                    break;
                case CONDITION.castling:
                    if(piece.isInitial){
                        let castleHasLightBetween = set[SIDE.light].filter(obj => CASTLING_POSITION[`${y}${x}`].no.includes(obj.position) && obj.active).length;
                        let castleHasDarkBetween = set[SIDE.dark].filter(obj => CASTLING_POSITION[`${y}${x}`].no.includes(obj.position) && obj.active).length;
                        res.valid = !castleHasLightBetween && !castleHasDarkBetween;
                    }
                    res.castling = res.valid;
                    break;
                default:
                    break;
            }
        });
        return res;
    } else {
        return { valid: false, castling: false, stop: true }; 
    }
}

const getPieceRules = (pieceName) => {

    //  LEGEND
    //    xn[:,=]yn
    //       - [:] means both conditions for each axis must be fulfilled, i.e: [x-1:y+2] -1x +2y from the piece's current coords
    //       - [=] means both nodes with equal value regardless if negative or positive returns true, e.g: -2x +2y is true, +2x +2y is true, +1x +2y is false. for diagonal paths
    //    x[n]:y[n]
    //       - [n] says how much distance from the selected piece in each axis, i.e: [x-2] is -2 numbers from the piece's current x
    //       - [*] means every node in that axis, i.e: [x*] any value in x axis. for diagonal paths

    switch(pieceName){
        case PIECE_NAMES.pawn:
            return [
                {
                    rule:'x-1:y0',
                    conditions: [CONDITION.no_piece]
                },
                {
                    rule: 'x-2:y0',
                    conditions: [CONDITION.initial, CONDITION.no_piece, CONDITION.no_before]
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
        case PIECE_NAMES.rook:
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
        case PIECE_NAMES.knight:
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
        case PIECE_NAMES.bishop:
            return [
                {
                    rule: 'x*=y*',
                    conditions: [CONDITION.until_opponent]
                }
            ];
        case PIECE_NAMES.queen:
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
        case PIECE_NAMES.king:
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

module.exports = Piece