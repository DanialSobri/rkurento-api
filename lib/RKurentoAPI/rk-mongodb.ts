// rk-room.js
// Example API Schema to be save in MangoDB
import kurento from 'kurento-client';
import { nanoid } from 'nanoid';
import { Schema, model, connect, disconnect, connection, Types, Model, ConnectionStates } from 'mongoose';


// Interface representing a document in MongoDB.
interface User {
  id: number
  mediaPipeline: kurento.MediaPipeline
  iceCandidates: Array<IceCandidate>
}

interface IceCandidate {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}

interface IRoom {
  roomid: string;
  name: string;
  status?: string;
  participants?: string[];
  mediaPipeline?: string;
  mediaElements?: string[];
}

// Schema corresponding to the document interface.
const roomSchema = new Schema<IRoom>({
  roomid: { type: String },
  name: { type: String },
  mediaPipeline: { type: String }, // kurento.MediaPipeline.id
  mediaElements: { type: [String] },// kurento.Media.id
  participants: { type: [String] } // kurento.WebrctEnpoint.id

});

// Model definitions
export const Room = model<IRoom>('Room', roomSchema);

// Function definitions
function isDbConnected(): boolean {
  return (connection.readyState == 1 ? true : false);
}

export const connectDB = async (): Promise<ConnectionStates> => {
  await connect('mongodb://localhost:27017/room')
  return connection.readyState
}

export const getConnectionDB = async (): Promise<ConnectionStates> => {
  return connection.readyState
}

export async function createRoomDB( pipelineID:string, name?:string ): Promise<Types.ObjectId | null | undefined> {
  // Create new room and return Room ID
  if (isDbConnected() === false) {
    await connect('mongodb://localhost:27017/room');
  }

  if (isDbConnected() === true) {
    const room = new Room({
      roomid: nanoid(5),
      name: "MyRoom",
      mediaPipeline: pipelineID,
    });
    await room.save().catch(err => { console.log(err); return undefined});
    return room.id;
  }
  return undefined
}

export async function removeRoomDB( id:Types.ObjectId | null | undefined ) {
  if (isDbConnected() === false) {
    await connect('mongodb://localhost:27017/room');
  }
  // Get Room from given ID
  if(id){
    const room = await Room.findByIdAndDelete(id).exec();
  }
}

export async function updateRoomDB( id:Types.ObjectId | null | undefined, participantId?:string[], mediaElement?:string[] ) {
  // Connect to MongoDB
  if (isDbConnected() === false) {
    await connect('mongodb://localhost:27017/room');
  }
  // Get Room from given ID
  const room = await Room.findById(id);
  // Update participants in DB 
  if(participantId){
    room!.participants = room?.participants?.concat(participantId);
  }
  // Update media server element
  if(mediaElement){
    room!.mediaElements = room?.mediaElements?.concat(mediaElement);
  }
  await room?.save();
}
