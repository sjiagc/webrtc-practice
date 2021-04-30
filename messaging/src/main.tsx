import React, { useState } from 'react';
import AutoScrollingTextarea from './AutoScrollingTextarea';
import rtcEngine from './engine';
import RtcPeer from './peer';
import { IceServer } from "./twilio";

interface IProps {
  signalingServer: string;
  iceServers: IceServer[];
}


const Main = (props: IProps) => {
  const [ready, setReady] = useState(false);
  const [textToSend, setTextToSend] = useState("");
  const [textReceived, setTextReceived] = useState("");
  let signalingServer = props.signalingServer;
  let iceServers = props.iceServers;
  let rtcConfig: RTCConfiguration | undefined = undefined;

  if (iceServers.length <= 0) {
    return <div>'No ICE servers got'</div>
  }

  if (!rtcEngine.isInitialized()) {
    rtcConfig = {iceServers: iceServers};
    rtcEngine.init(signalingServer, rtcConfig);
    rtcEngine.start();
  }
  rtcEngine.setOnReadyStateChangeCallback(isReady => setReady(isReady));
  rtcEngine.setOnMsgCallback((peerId, msg) => {
    setTextReceived((textReceived.length > 0 ?  textReceived + '\n' : '') + peerId + ':\n' + msg);
  });

  return (
    <div>
      <AutoScrollingTextarea id="recvText" disabled placeholder="Text received." rows={20} cols={200} value={textReceived}/>
      <br/>
      <textarea id="sendText" disabled={!ready} placeholder="Text to send." rows={4} cols={200}
        value={textToSend}
        onChange={(event) => setTextToSend(event.target.value)}>
      </textarea>
      <br/>
      <button id="sendButton" disabled={!ready}
        onClick={() => {
          rtcEngine.send(textToSend);
          setTextReceived((textReceived.length > 0 ?  textReceived + '\n' : '') + 'Me:\n' + textToSend)
          setTextToSend("")
        }}>
        Send
      </button>
      <br/>
      {!ready &&<span style={{ color: 'purple' }}>Waiting for other peers to join</span>}
    </div>
  );
}

export default Main;
