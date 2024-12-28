export const createRTCConnectionManager = (socket, handler) => {
    const peerConnections = new Map();
    let localPeerConnection = null;
  
    // Peer Connection Configuration
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
  
    // Socket Listeners
    socket.on('sdp', handleSDP);
    socket.on('ice-candidate', handleICECandidate);
  
    async function connect(targetId, options = { enableDataChannel: false }) {
      const peerConnection = createPeerConnection(targetId);
      localPeerConnection = peerConnection;
  
      if (options.enableDataChannel) {
        const dataChannel = peerConnection.createDataChannel('main');
        setupDataChannel(targetId, dataChannel);
      }
  
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
  
      socket.emit('sdp', {
        targetId,
        sdp: peerConnection.localDescription
      });
    }
  
    function createPeerConnection(targetId) {
      const peerConnection = new RTCPeerConnection(configuration);
  
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetId,
            candidate: event.candidate
          });
        }
      };
  
      peerConnection.ondatachannel = (event) => {
        setupDataChannel(targetId, event.channel);
      };
  
      if (handler.onRTCPeerConnection) {
        handler.onRTCPeerConnection(targetId, peerConnection);
      }
  
      peerConnections.set(targetId, peerConnection);
      return peerConnection;
    }
  
    function setupDataChannel(targetId, dataChannel) {
      if (handler.onDataChannel) {
        handler.onDataChannel(targetId, dataChannel);
      }
    }
  
    async function handleSDP({ sourceId, sdp }) {
      let peerConnection = peerConnections.get(sourceId);
  
      if (!peerConnection) {
        peerConnection = createPeerConnection(sourceId);
      }
  
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  
      if (sdp.type === 'offer') {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('sdp', {
          targetId: sourceId,
          sdp: peerConnection.localDescription
        });
      }
    }
  
    async function handleICECandidate({ sourceId, candidate }) {
      const peerConnection = peerConnections.get(sourceId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
  
    return {
      connect,
      getPeerConnection: (targetId) => peerConnections.get(targetId)
    };
  };
  
  export const RTCConnectionHandler = {
    onDataChannel: (socketId, dataChannel) => {},
    onRTCPeerConnection: (socketId, rtcPeerConnection) => {}
  };