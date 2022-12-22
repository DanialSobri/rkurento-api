mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));

ws = new WebSocket("wss://35.233.76.248:4040/rkapi");

let resolutions = {
  UHD: { width: "3840", height: "2160" },
  QHD: { width: "2560", height: "1440" },
  FHD: { width: "1920", height: "1080" },
  HD : { width: "1280", height: "720" },
  SD: { width: "640", height: "480" },
}

let default_resolution = resolutions.HD;
let default_fps = "30";

document.querySelector('#mdl-card__rkapi').innerText = 'rkapi connecting :🔘 '+ ws.url;

ws.onclose = () => {
  if(ws.readyState === 3){
    document.querySelector('#mdl-card__rkapi').innerText = 'rkapi not connected ❌ '+ ws.url;
  }
}
ws.onopen = () => {
  if(ws.readyState === 1){
    document.querySelector('#mdl-card__rkapi').innerText = 'rkapi connected ✅ '+ ws.url;
  }
}


const configuration = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:34.79.126.145:3478?transport=tcp",
      username: "1666202498",
      credential: "03tfHpPDiqvfsnQdTPy+woNv5hY=",
    },
  ],
  // iceCandidatePoolSize: 10,
};

let peerConnection = null;
let localStream = null;
let remoteStream = null;
let roomDialog = null;
let roomId = null;

window.onload = function () {
  openUserMedia()
  document.querySelector('#menu-resolution .material-icons').innerText = "hd";
  document.querySelector('#menu-fps .mdl_fps').innerText = default_fps;
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
      console.warn('Error message from server: ' + parsedMessage.message);
      break;

    default:
      console.warn('Unrecognized message',parsedMessage);
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
  // document.querySelector('#createBtn').disabled = true;
  // document.querySelector('#joinBtn').disabled = true;

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
  // document.querySelector('#cameraBtn').disabled = false;
  // document.querySelector('#joinBtn').disabled = true;
  // document.querySelector('#createBtn').disabled = true;
  // document.querySelector('#hangupBtn').disabled = true;
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
        "video":
        {           
            "width": {
                "exact": default_resolution.width
            },
            "height": {
                "exact": default_resolution.height
            },
            "frameRate": {
                "exact": default_fps
            }
        }
    
    });
    
  document.querySelector('#localVideo').srcObject = stream;
  localStream = stream;
  remoteStream = new MediaStream();
  document.querySelector('#remoteVideo').srcObject = remoteStream;

  console.log('Stream:', document.querySelector('#localVideo').srcObject);
  // document.querySelector('#cameraBtn').disabled = false;
  // document.querySelector('#joinBtn').disabled = false;
  // document.querySelector('#createBtn').disabled = false;
  // document.querySelector('#hangupBtn').disabled = false;
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

document.querySelector('#expandBtn').addEventListener('click', () => {
  // Expand the debug card
  if (document.querySelector('#expandBtnIcon').innerText == 'expand_less') {
    document.querySelector('#expandBtnIcon').innerText = 'expand_more';
    document.querySelector('#debugCard').hidden = true;
  } else {
    document.querySelector('#expandBtnIcon').innerText = 'expand_less';
    document.querySelector('#debugCard').hidden = false;
  }
});

document.querySelector('#dropdownMenuRes').addEventListener('click', (e) => {
  console.log("Debug: ", e.target.innerText);
  selected_logo = e.target.innerText.split(" ").slice(-1).pop().toLowerCase();
  document.querySelector('#menu-resolution .material-icons').innerText = selected_logo;
  selected = e.target.innerText.split(" ")[0].toUpperCase();
  console.log("Selected resolution: ", selected);
  default_resolution = resolutions[selected];
  console.log("Default resolution: ", default_resolution);
  // hangUp();
  openUserMedia();
});

document.querySelector('#dropdownMenuFPS').addEventListener('click', (e) => {
  selected = e.target.innerText.split(" ").slice(-1).pop().toLowerCase();
  console.log("Selected fps: ", selected);
  document.querySelector('#menu-fps .mdl_fps').innerText = selected;
  default_fps = selected;
  console.log("Default fps: ", default_fps);
  // console.log("Resolution: ", document.querySelector('#dropdownMenuRes'),e.target.innerText);  
    // hangUp();
    openUserMedia();
});