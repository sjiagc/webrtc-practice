import RtcPeer from "./peer";

interface IPeerOp {
  addPeer(peerId: string): void;
  welcomePeer(peerId: string): void;
  removePeer(peerId: string): void;
  processIceCandidate(peerId: string, iceCandidate: RTCIceCandidate): void;
  processOffer(peerId: string, offer: RTCSessionDescriptionInit): void;
  processAnswer(peerId: string, answer: RTCSessionDescriptionInit): void;
}

interface Msg {
  type: string;
  src?: string;
  target?: string;
}

interface MsgWelcome extends Msg {
  id: string;
  peers: string[];
}

type MsgAddPeer = Msg;
type MsgRemovePeer = Msg;


interface MsgIce extends Msg {
  iceCandidate: RTCIceCandidate;
}

interface MsgOffer extends Msg {
  offer: RTCSessionDescriptionInit;
}

interface MsgAnswer extends Msg {
  answer: RTCSessionDescriptionInit;
}

class Signaling {
  private peerOp: IPeerOp;
  private ws: null | WebSocket;
  private peers: string[];

  constructor(peerOp: IPeerOp) {
    this.peerOp = peerOp;
    this.peers = [];
    this.ws = null;
  }

  public start(signalingServer: string) {
    this.ws = new WebSocket(signalingServer);
    this.ws.onopen = (ev: Event) => {
      console.log("ws openned");
    };
    this.ws.onclose = (ev: CloseEvent) => {
      console.log("ws closed");
    }
    this.ws.onerror = (ev: Event) => {
      console.log("ws error occurred");
    }
    this.ws.onmessage = (ev: MessageEvent) => {
      console.log("ws msg: ", ev.data);
      let msg: Msg = JSON.parse(ev.data);
      switch (msg.type) {
        case 'welcome': this.onWelcome(<MsgWelcome>msg); break;
        case 'addPeer': this.onAddPeer(<MsgAddPeer>msg); break;
        case 'removePeer': this.onRemovePeer(<MsgRemovePeer>msg); break;
        case 'ice': this.onIceCandidate(<MsgIce>msg); break;
        case 'offer': this.onOffer(<MsgOffer>msg); break;
        case 'answer': this.onAnswer(<MsgAnswer>msg); break;
        default:
          console.log('Unknown msg: ', msg); break;
      }
    }
  }

  public stop() {
    this.ws?.close();
  }

  public signalIceCandidate(peerId: string, iceCandidate: RTCIceCandidate): void {
    let jsonMsg = JSON.stringify({type: "ice", target: peerId, iceCandidate: iceCandidate})
    this.ws?.send(jsonMsg)
  }

  public signalOffer(peerId: string, offer: RTCSessionDescriptionInit): void {
    let jsonMsg = JSON.stringify({type: "offer", target: peerId, offer: offer})
    this.ws?.send(jsonMsg)
  }

  public signalAnswer(peerId: string, answer: RTCSessionDescriptionInit): void {
    let jsonMsg = JSON.stringify({type: "answer", target: peerId, answer: answer})
    this.ws?.send(jsonMsg)
  }

  private onWelcome(msg: MsgWelcome): void {
    let peers = msg.peers;
    peers.forEach(peerId => {
      this.peerOp.welcomePeer(peerId);
    })
  }

  private onAddPeer(msg: MsgAddPeer): void {
    if (!msg.src) {
      console.log("onAddPeer: No src");
      return;
    }
    let peerId = msg.src;
    this.peerOp.addPeer(peerId);
  }

  private onRemovePeer(msg: MsgRemovePeer): void {
    if (!msg.src) {
      console.log("onRemovePeer: No src");
      return;
    }
    let peerId = msg.src;
    this.peerOp.removePeer(peerId);
  }

  private onIceCandidate(msg: MsgIce): void {
    if (!msg.src) {
      console.log("onIceCandidate: No src");
      return;
    }
    let peerId: string = msg.src;
    let iceCandidate: RTCIceCandidate = msg.iceCandidate;
    this.peerOp.processIceCandidate(peerId, iceCandidate);
  }

  private onOffer(msg: MsgOffer): void {
    if (!msg.src) {
      console.log("onOffer: No src");
      return;
    }
    let peerId = msg.src;
    let offer: RTCSessionDescriptionInit = msg.offer;
    this.peerOp.processOffer(peerId, offer);
  }
  
  private onAnswer(msg: MsgAnswer): void {
    if (!msg.src) {
      console.log("onAnswer: No src");
      return;
    }
    let peerId = msg.src;
    let answer: RTCSessionDescriptionInit = msg.answer;
    this.peerOp.processAnswer(peerId, answer);
  }
}

export default Signaling;
