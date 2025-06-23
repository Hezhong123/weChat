'use strict';

// Set up media stream constant and parameters.

// In this codelab, you will be streaming video only: "video: true".
// Audio will not be streamed because it is set to "audio: false" by default.
const mediaStreamConstraints = {
    video: true,
    // audio: true
};

// Set up to exchange only video.
const offerOptions = {
    offerToReceiveVideo: 1,
};

// Define initial start time of the call (defined as connection between peers).
let startTime = null;

// Define peer connections, streams and video elements.
// 本地视频流
const localVideo = document.getElementById('localVideo');
// 远端视频流
const remoteVideo = document.getElementById('remoteVideo');
const webm = document.getElementById('webm');


let localStream;  //本地流
let remoteStream; //远端流

let localPeerConnection;    //本地链接
let remotePeerConnection;   //远端链接


// Define MediaStreams callbacks.

// Sets the MediaStream as the video element src.
function gotLocalMediaStream(mediaStream) {
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace(`获取本地流。Received local stream.`);
    callButton.disabled = false;  // Enable call button.
}

// Handles error by logging a message to the console.
function handleLocalMediaStreamError(error) {
    trace(`链接设备错误 navigator.getUserMedia error: ${error.toString()}.`);
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace('收到远端流 Remote peer connection received remote stream.');
}


// Add behavior for video streams.

// Logs a message with the id and size of a video element.
function logVideoLoaded(event) {
    const video = event.target;
    trace(`视频流 ${video.id} videoWidth: ${video.videoWidth}px, ` +
        `videoHeight: ${video.videoHeight}px.`);
}

// Logs a message with the id and size of a video element.
// This event is fired when video begins streaming.
function logResizedVideo(event) {
    logVideoLoaded(event);

    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        startTime = null;
        trace(`Setup time: ${elapsedTime.toFixed(3)}ms.`);
    }
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);


// Define RTC peer connection behavior.

// Connects with new peer candidate.
function handleConnection(event) {
    trace('建立链接',event);
    const peerConnection = event.target;
    const iceCandidate = event.candidate;
    console.log('建立链接',event)
    if (iceCandidate) {
        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        const otherPeer = getOtherPeer(peerConnection);

        otherPeer.addIceCandidate(newIceCandidate)
            .then(() => {
                handleConnectionSuccess(peerConnection);
            }).catch((error) => {
            handleConnectionFailure(peerConnection, error);
        });

        trace(`${getPeerName(peerConnection)} ICE candidate:\n` +
            `${event.candidate.candidate}.`);
    }
}

// Logs that the connection succeeded.
function handleConnectionSuccess(peerConnection) {
    trace(`链接成功 ${getPeerName(peerConnection)} addIceCandidate success.`);
};

// Logs that the connection failed.
function handleConnectionFailure(peerConnection, error) {
    trace(`链接失败 ${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+
        `${error.toString()}.`);
}

// Logs changes to the connection state.
function handleConnectionChange(event) {
    const peerConnection = event.target;
    console.log('ICE状态改变, ICE state change event: ', event);
    trace(`${getPeerName(peerConnection)} ICE state: ` +
        `${peerConnection.iceConnectionState}.`);
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error) {
    trace(`日志创建失败 Failed to create session description: ${error.toString()}.`);
}

// Logs success when setting session description.
function setDescriptionSuccess(peerConnection, functionName) {
    const peerName = getPeerName(peerConnection);
    trace(`链接状态 ${peerName} ${functionName} complete. `);
}

// Logs success when localDescription is set.
function setLocalDescriptionSuccess(peerConnection) {
    setDescriptionSuccess(peerConnection, 'setLocalDescription');
}

// Logs success when remoteDescription is set.
function setRemoteDescriptionSuccess(peerConnection) {
    setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

// Logs offer creation and sets peer connection session descriptions.
function createdOffer(description) {
    trace(`Offer from localPeerConnection:\n${description.sdp}`);

    trace('本地推流开会时 localPeerConnection setLocalDescription start.');
    localPeerConnection.setLocalDescription(description)
        .then(() => {
            setLocalDescriptionSuccess(localPeerConnection);
        }).catch(setSessionDescriptionError);

    trace('remotePeerConnection setRemoteDescription start.');
    remotePeerConnection.setRemoteDescription(description)
        .then(() => {
            setRemoteDescriptionSuccess(remotePeerConnection);
        }).catch(setSessionDescriptionError);

    trace('remotePeerConnection createAnswer start.');
    remotePeerConnection.createAnswer()
        .then(createdAnswer)
        .catch(setSessionDescriptionError);
}

// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description) {
    trace(`远端链接 Answer from remotePeerConnection:\n${description.sdp}.`);

    trace('远端链接成功 remotePeerConnection setLocalDescription start.');
    remotePeerConnection.setLocalDescription(description)
        .then(() => {
            setLocalDescriptionSuccess(remotePeerConnection);
        }).catch(setSessionDescriptionError);

    trace('localPeerConnection setRemoteDescription start.');
    localPeerConnection.setRemoteDescription(description)
        .then(() => {
            setRemoteDescriptionSuccess(localPeerConnection);
        }).catch(setSessionDescriptionError);
}


// Define and add behavior to buttons.

// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;


// Handles start button action: creates local MediaStream.
function startAction() {
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
    trace('请求本地流,Requesting local stream.');
}

//通过视频转为原端流
const webmVideo = document.getElementById('webmVideo');
webmVideo.addEventListener('play',()=>{
    let stream;
    const fps = 0;
    if (webmVideo.captureStream) {
        stream = webmVideo.captureStream(fps);
    } else if (webmVideo.mozCaptureStream) {
        stream = webmVideo.mozCaptureStream(fps);
    } else {
        console.error('Stream capture is not supported');
        stream = null;
    }
    remoteVideo.srcObject = stream;
})


// Handles call button action: creates peer connection.
function callAction() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    trace('开始请求远端流 Starting call.');
    startTime = window.performance.now();
    // Get local media stream tracks.
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
        trace(`视频输出设备 Using video device: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
        trace(`音频输出设备 Using audio device: ${audioTracks[0].label}.`);
    }
    const servers = null // Allows for RTC server configuration.
    // Create peer connections and add behavior.
    localPeerConnection = new RTCPeerConnection(servers);
    trace('创建本地链接对象 Created local peer connection object localPeerConnection.');
    localPeerConnection.addEventListener('icecandidate', handleConnection);
    localPeerConnection.addEventListener(
        'iceconnectionstatechange', handleConnectionChange);
    remotePeerConnection = new RTCPeerConnection(servers);
    trace('创建远端链接对象 Created remote peer connection object remotePeerConnection.');
    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    remotePeerConnection.addEventListener(
        'iceconnectionstatechange', handleConnectionChange);
    remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);
    // Add local stream to connection and create offer to connect.
    localPeerConnection.addStream(localStream);
    trace('增加本地流, Added local stream to localPeerConnection.');
    trace('启动本地流 localPeerConnection createOffer start.');
    localPeerConnection.createOffer(offerOptions)
        .then(createdOffer).catch(setSessionDescriptionError);
}

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
    webm.style.display = 'block'
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
    trace('关闭链接 Ending call.');
}

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

// Define helper functions.

// Gets the "other" peer connection.
function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        remotePeerConnection : localPeerConnection;
}

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        'localPeerConnection' : 'remotePeerConnection';
}

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
}