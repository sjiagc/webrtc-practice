import RtcPeer from "./peer";
import Signaling from "./signaling";

type OnReadyStateChange = (isReady: boolean) => void;
type OnMsg = (peerId: string, msg: string) => void;

class RtcEngine {
  private signaling: Signaling;
  private peers: {[key: string]: RtcPeer};
  private initialized: boolean;
  private signalingServer: string;
  private rtcConfig?: RTCConfiguration;
  private readyPeerCount: number;
  private onReadyStateChange: OnReadyStateChange;
  private onMsg: OnMsg;

  constructor() {
    let peerOp = {
      addPeer: (peerId: string): void => {
        this.addPeer(peerId)
      },
      welcomePeer: (peerId: string): void => {
        this.welcomePeer(peerId)
      },
      removePeer: (peerId: string): void => {
        this.removePeer(peerId)
      },
      processIceCandidate: (peerId: string, iceCandidate: RTCIceCandidate): void => {
        this.processIceCandidate(peerId, iceCandidate);
      },
      processOffer: (peerId: string, offer: RTCSessionDescriptionInit): void => {
        this.processOffer(peerId, offer);
      },
      processAnswer: (peerId: string, answer: RTCSessionDescriptionInit): void => {
        this.processAnswer(peerId, answer);
      }
    }
    this.signaling = new Signaling(peerOp);
    this.peers = {};
    this.initialized = false;
    this.signalingServer = 'ws://localhost:8514';
    this.rtcConfig = undefined;
    this.readyPeerCount = 0;
    this.onReadyStateChange = isReady => {}
    this.onMsg = (peerId, msg) => {}
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public init(signalingServer: string, rtcConfig: RTCConfiguration | undefined): void {
    if (this.initialized)
      return;
    this.initialized = true;
    this.signalingServer = signalingServer;
    this.rtcConfig = rtcConfig;
  }

  public start() {
    this.signaling.start(this.signalingServer);
  }

  public stop() {
    this.signaling.stop();
  }

  public setOnReadyStateChangeCallback(cb: OnReadyStateChange): void {
    this.onReadyStateChange = cb;
  }

  public setOnMsgCallback(cb: OnMsg): void {
    this.onMsg = cb;
  }

  public send(msg: string): void {
    Object.values(this.peers).forEach(peer => {
      peer.sendMsg(msg);
    });
  }

  private addPeer(peerId: string): void {
    console.log('addPeer: ', peerId);
    this._addPeer(peerId, false);
  }

  private welcomePeer(peerId: string): void {
    console.log('welcomePeer: ', peerId);
    this._addPeer(peerId, true);
  }

  private _addPeer(peerId: string, isOffering: boolean): void {
    let peer = new RtcPeer(peerId, this.signaling, isOffering);
    peer.setStateChangeCallback(isReady => {
      const oldCount = this.readyPeerCount;
      if (isReady)
        ++this.readyPeerCount;
      else
        --this.readyPeerCount;
      if (this.readyPeerCount < 0) {
        console.log('Oops! Negative readyPeerCount ', this.readyPeerCount);
        this.readyPeerCount = 0;
      }
      console.log('Ready peer count: ', this.readyPeerCount);
      if (!((oldCount > 0 && this.readyPeerCount > 0) || (oldCount === 0 && this.readyPeerCount === 0)))
        this.onReadyStateChange(this.readyPeerCount > 0);
    });
    peer.setOnMsgCallback(msg => {
      this.onMsg(peerId, msg);
    })
    peer.init(this.rtcConfig);
    this.peers[peerId] = peer;
    console.log(this.peers);
  }

  private removePeer(peerId: string): void {
    console.log('removePeer: ', peerId);
    const peer = this.peers[peerId];
    peer.destroy();
    delete this.peers[peerId]
    console.log(this.peers);
  }

  private processIceCandidate(peerId: string, iceCandidate: RTCIceCandidate): void {
    let peer = this.peers[peerId];
    if (!peer) {
      console.log(`processIceCandidate: peer ${peerId} not found`);
      return;
    }
    console.log('processIceCandidate: ', peerId);
    peer.addIceCandidate(iceCandidate);
  }

  private processOffer(peerId: string, offer: RTCSessionDescriptionInit): void {
    let peer = this.peers[peerId];
    if (!peer) {
      console.log(`processOffer: peer ${peerId} not found`);
      return;
    }
    peer.processOffer(offer);
  }

  private processAnswer(peerId: string, answer: RTCSessionDescriptionInit): void {
    let peer = this.peers[peerId];
    if (!peer) {
      console.log(`processAnswer: peer ${peerId} not found`);
      return;
    }
    peer.processAnswer(answer);
  }
}

const rtcEngine = new RtcEngine();

export default rtcEngine;
