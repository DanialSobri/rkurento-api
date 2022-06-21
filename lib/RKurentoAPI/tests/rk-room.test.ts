import Room from '../rk-room';
import { expect } from 'chai';

describe('RKurento Room Test', function() {
    const option = {
        log : false,
    }

    it('Add new Room', function() {
        let room = new Room();
        expect(room.updateRoomdb()).equal(true);
        option.log? console.log("Room with ID",room.roomId):{};
    });
});