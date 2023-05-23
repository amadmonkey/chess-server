const PieceHelper = require('../piece_helper');
const Constants = require('../Constants');
const { SIDE } = require('../Constants');

class LOBBY {
    constructor({host=null,chat=null}){
        this.roomId = this.generateId(4);
        this.host = host;
        this.host.roomId = this.roomId;
        this.host.isLight = Math.random() > 0.5;
        this.guest = null;
        this.turn = true;
        this.chat = null;
        this.set = {
            LIGHT: PieceHelper.SET({ isLight: true }),
            DARK: PieceHelper.SET({ isLight: false })
        }
        this.constants = Constants;
        this.setValidTiles();
    }
    getId(){
        return this.roomId;
    }
    createGuest({guest=null}){
        this.guest = guest;
        this.guest.isLight = !this.host.isLight;
    }
    generateId({length = 4}){
        // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        let result = '', characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', charactersLength = characters.length;
        for (let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    setValidTiles(){
        for(let key in this.set){
            let set = this.set[key];
            set.forEach((piece) => {
                piece.setMyValidTiles(this.set);
            });
        }
    }
}

module.exports = LOBBY;