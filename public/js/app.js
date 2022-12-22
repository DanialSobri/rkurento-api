mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));

ws = new WebSocket("wss://"+ location.host +"/rkapi");

document.querySelector('#mdl-card__rkapi').innerText = 'RKurento API Connection :🔘 '+ ws.url;
document.querySelector('#mdl-card__rkms').innerText = 'RKurento MS Connection 🔘';

ws.onclose = () => {
  if(ws.readyState === 3){
    document.querySelector('#mdl-card__rkapi').innerText = 'RKurento API Connection ❌ '+ ws.url;
    document.querySelector('#mdl-card__rkms').innerText = 'RKurento MS Connection ❌';
  }
}
ws.onopen = () => {
  if(ws.readyState === 1){
    document.querySelector('#mdl-card__rkapi').innerText = 'RKurento API Connection ✅ '+ ws.url;
    document.querySelector('#mdl-card__rkms').innerText = 'RKurento MS Connection ✅';
  }
}


const configuration = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection = null;
let localStream = null;
let remoteStream = null;
let roomDialog = null;
let roomId = null;

window.onload = function () {
  openUserMedia()
  document.querySelector('#cameraBtn').addEventListener('click', startUserMedia);
  document.querySelector('#hangupBtn').addEventListener('click', hangUp);
  document.querySelector('#createBtn').addEventListener('click', createRoom);
  document.querySelector('#joinBtn').addEventListener('click', joinRoom);
  roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));
}

window.onbeforeunload = function () {
  if (ws) {
    ws.close();
  }
}

ws.onmessage = function (message) {
  var parsedMessage = JSON.parse(message.data);
  console.log('Received message: ' + message.data);

  switch (parsedMessage.id) {
    case 'createdRoom':
      // Server sending roomID with sdpAnswer
      console.log(parsedMessage.roomId + "is created")
      roomId = parsedMessage.roomId;
      console.log(`New room created with SDP offer. Room ID: ${roomId}`);
      document.querySelector(
        '#currentRoom').innerText = `${roomId}`;
      startResponse(parsedMessage.sdpAnswer)
      break;

    case 'joinedRoom':
      // Server sending roomID with sdpAnswer
      console.log("Join Room with ID ", parsedMessage.roomId)
      roomId = parsedMessage.roomId;
      document.querySelector(
        '#currentRoom').innerText = `Current room joined ${roomId}`;
      startResponse(parsedMessage.sdpAnswer)
      break;

    case 'iceCandidate':
      if (peerConnection) {
        console.log(" Add remote iceCandidates")
        peerConnection.addIceCandidate(parsedMessage.candidate)//new RTCIceCandidate(parsedMessage.candidate)
      }
      break;

    case 'error':
      if (state == I_AM_STARTING) {
        setState(I_CAN_START);
      }
      onError('Error message from server: ' + parsedMessage.message);
      break;

    default:
      if (state == I_AM_STARTING) {
        setState(I_CAN_START);
      }
      onError('Unrecognized message', parsedMessage);
  }
}

async function createRoom() {
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = true;

  console.log('Create PeerConnection with configuration: ', configuration);
  peerConnection = new RTCPeerConnection(configuration);
  registerPeerConnectionListeners();

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  //  👉 Code for creating a room below ✅
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
    'offer': {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  // Send create room to Server via ws
  let message = {
    id: 'createRoom',
    sdpOffer: offer.sdp
  }
  sendMessage(message);
  //  👉 Code for creating a room above ✅  
  //  👉 Code for collecting ICE candidates below ✅
  peerConnection.addEventListener('icecandidate', event => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate, "for room", roomId);
    // Send local candidates to server
    let message = {
      id: 'onIceCandidate',
      candidate: event.candidate,
      roomId: roomId
    };
    sendMessage(message);
  });
  //  👉 Code for collecting ICE candidates above ✅
  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  });
}

async function startResponse(sdpAnswer) {
  //  👉 Listening for remote session description below ✅
  if (!peerConnection.currentRemoteDescription && sdpAnswer) {
    console.log('Got remote description: ', typeof sdpAnswer);
    const rtcSessionDescription = new RTCSessionDescription({ sdp: sdpAnswer, type: "answer" });
    await peerConnection.setRemoteDescription(rtcSessionDescription);
  }
  //  👉 Listening for remote session description above ✅
}

function joinRoom() {
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = true;

  document.querySelector('#confirmJoinBtn').
    addEventListener('click', async () => {
      roomId = document.querySelector('#room-id').value;
      console.log('Join room: ', roomId);
      document.querySelector(
        '#currentRoom').innerText = `Current room is ${roomId}`;
      await joinRoomById(roomId);
    }, { once: true });
  roomDialog.open();
}

async function joinRoomById(roomId) {
  console.log('Create PeerConnection with configuration: ', configuration);
  peerConnection = new RTCPeerConnection(configuration);
  registerPeerConnectionListeners();

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  //  👉 Code for joining a room below ✅
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
    'offer': {
      type: offer.type,
      sdp: offer.sdp,
    },
  };

  let message = {
    id: 'joinRoom',
    roomId: roomId,
    sdpOffer: offer.sdp
  };
  sendMessage(message);
  //  👉 Code for joining a room above ✅

  //  👉 Code for collecting ICE candidates below ✅
  peerConnection.addEventListener('icecandidate', event => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate, "for room", roomId);
    // Send local candidates to server
    let message = {
      id: 'onIceCandidate',
      candidate: event.candidate,
      roomId: roomId
    };
    sendMessage(message);
  });
  //  👉 Code for collecting ICE candidates above ✅

  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  });
}

async function hangUp(e) {
  const tracks = document.querySelector('#localVideo').srcObject.getTracks();
  tracks.forEach(track => {
    track.stop();
  });

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }

  if (peerConnection) {
    peerConnection.close();
  }

  document.querySelector('#localVideo').srcObject = null;
  document.querySelector('#remoteVideo').srcObject = null;
  document.querySelector('#cameraBtn').disabled = false;
  document.querySelector('#joinBtn').disabled = true;
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#hangupBtn').disabled = true;
  document.querySelector('#currentRoom').innerText = '';

  // Delete room on hangup
  if (roomId) {
    console.log("Hangup RoomID: ", roomId)
    // Send leaveRoom trigger to server
    let message = {
      id: 'leaveRoom',
      roomId: roomId
    };
    sendMessage(message);
  }

  document.location.reload(true);
}

async function startUserMedia(e) {
  await document.getElementById("localVideo").play();
  document.querySelector('#cameraBtn').disabled = true;
}

async function openUserMedia(e) {
  const stream = await navigator.mediaDevices.getUserMedia(
    { 
        "audio": true,
        "video": {
            "width": {
                "min": "640",
                "max": "1920"
            },
            "height": {
                "min": "360",
                "max": "1080"
            },
            "frameRate": {
                "min": "14",
                "max": "15"
            }
        }
    
    });
  document.querySelector('#localVideo').srcObject = stream;
  localStream = stream;
  remoteStream = new MediaStream();
  document.querySelector('#remoteVideo').srcObject = remoteStream;

  console.log('Stream:', document.querySelector('#localVideo').srcObject);
  document.querySelector('#cameraBtn').disabled = false;
  document.querySelector('#joinBtn').disabled = false;
  document.querySelector('#createBtn').disabled = false;
  document.querySelector('#hangupBtn').disabled = false;
}

function registerPeerConnectionListeners() {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
      `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
      `ICE connection state change: ${peerConnection.iceConnectionState}`);
  });
}

function sendMessage(message) {
  var jsonMessage = JSON.stringify(message);
  ws.send(jsonMessage);
}