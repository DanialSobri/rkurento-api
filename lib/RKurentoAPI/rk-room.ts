// rk-room.js
import kurento from 'kurento-client';
import { nanoid } from 'nanoid';

export default class Room {

    roomId: string;
    mediaPipeline ?: kurento.MediaPipeline;
    participants ?: Array<kurento.MediaElement>;
    host ?: kurento.MediaElement;
  
    constructor(mediaPipeline?:kurento.MediaPipeline, host?:kurento.WebRtcEndpoint) {
      this.roomId = nanoid(5);
      this.mediaPipeline = mediaPipeline;
      this.host = host;
      this.participants = [];
    }

    initHost() : boolean {
      return true
    }
  
    addParticipant(){

    }

    leaveRoom(){

    }

    removeRoom(){

    }

    updateRoomdb() {
      return true;
    }
}
