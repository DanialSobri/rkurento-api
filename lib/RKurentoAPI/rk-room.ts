// rk-room.js
import kurento from 'kurento-client';
import { nanoid } from 'nanoid';

interface Room {
  id: string;
  mediaPipeline?: kurento.MediaPipeline;
  participants?: Participant[];
  compositeHub?: kurento.Composite;
  [key: string]: any; // extandable
}

interface Participant {
  wsid?: string;
  webRtcEndpoint?: kurento.WebRtcEndpoint;
  candidatesQueue?: RTCIceCandidate[];
  [key: string]: any; // extandable
}

/**
 * The RoomsManager class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export class RoomsManager {
  private static instance: RoomsManager;
  private static rooms: Room[] = [];

  /**
   * The RoomsManager's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() { }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the RoomsManager class while keeping
   * just one instance of each subclass around.
   */
  public static getSingleton(): RoomsManager {
    if (!RoomsManager.instance) {
      RoomsManager.instance = new RoomsManager();
    }

    return RoomsManager.instance;
  }

  /**
   * Return all session
   */
  public getAllSessions() {
    // Return all active session
    return RoomsManager.rooms
  }

  /**
   * Registering Room by adding and saving it in an Array
   */
  public registerRoom(pipeline: kurento.MediaPipeline,
    websocketId: string,
    webRtcEndpoint?: kurento.WebRtcEndpoint,
    compositeHub?: kurento.Composite,
    outputAudioPort?: kurento.HubPort,
    outputVideoPort?: kurento.HubPort) {
    // Register new room
    const roomId = nanoid(5);
    // Update Array with basic media object
    RoomsManager.rooms.push({
      id: roomId,
      mediaPipeline: pipeline,
      compositeHub: compositeHub,
      outputAudioPort: outputAudioPort,
      outputVideoPort: outputVideoPort,
      participants: []
    })
    // Update participants endpoints
    this.updateParticipants(roomId, websocketId, webRtcEndpoint)
    return roomId;
  }

  public registerRoomP2P(wsId: string, sdpAnswer?: string, sdpOffer?: string) {
    // Register new room
    const roomId = nanoid(5);
    // Update Array with basic media object
    RoomsManager.rooms.push({
      id: roomId,
      participants: []
    })
    // Update participants endpoints
    this.getRoom(roomId)?.participants?.push({
      wsid: wsId,
      sdpAnswer: sdpAnswer, 
      sdpOffer: sdpOffer,
      candidatesQueue: []
    })
    return roomId;
  }

  /**
   * ### UpdateParticipants
   * Update Participants by adding and saving it in an Array
   */
  public updateParticipants(roomId: string, wsid: string, webRtcEndpoint?: kurento.WebRtcEndpoint) {
    // Update participants endpoints
    if (webRtcEndpoint) {
      this.getRoom(roomId)?.participants?.push({
        wsid: wsid,
        webRtcEndpoint: webRtcEndpoint,
        candidatesQueue: []
      })
      return true;
    }
    return false;
  }

  /**
   * ### UpdateIceCandidate
   * Registering Room by adding and saving it in an Array
   */
  public updateIceCandidateQueue(roomId: string, wsid: string, iceCandidate: RTCIceCandidate) {
    // Return all active session
    // console.info("Get Room", RoomsManager.rooms)
    const participant = this.getParticipant(roomId, wsid);
    participant?.candidatesQueue?.push(iceCandidate)
    return RoomsManager.rooms
  }

  /**
   * ### getRoom
   * Registering Room by adding and saving it in an Array
   */
  public getRoom(roomId: string | undefined) {
    // Return room with entered Id
    const result = RoomsManager.rooms.find(
      room => {
        return room.id === roomId
      }
    )
    return result
  }

  /**
   * ### getParticipant
   * Registering Room by adding and saving it in an Array
   */
  public getParticipant(roomId: string | undefined, participantWsId: string | undefined): Participant | undefined {
    // Return room with entered Id
    const myRoom = this.getRoom(roomId);
    const myParticipant = myRoom?.participants?.find(
      element => {
        return element.wsid === participantWsId;
      }
    )
    return myParticipant;
  }
  
  /**
   * ### getParticipants
   * Return participants from roomID in an Array
   */
   public getParticipants(roomId: string | undefined): Participant[] | undefined {
    // Return room with entered Id
    const myRoom = this.getRoom(roomId);
    return myRoom?.participants
  }

  /**
   * ### getIceCandidates
   * Registering Room by adding and saving it in an Array
   */
  public getIceCandidatesQueue(roomId: string | undefined, websocketId: string) {
    const iceCandidates = this.getParticipant(roomId, websocketId)?.candidatesQueue
    return iceCandidates
  }
}
