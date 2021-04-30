import Signaling from "./signaling";

type OnIceCandidate = (conn: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any;

type OnPeerStateChange = (isReady: boolean) => void;
type OnMsg = (msg: string) => void;

class RtcPeer {
  private id: string;
  private isOffering: boolean;
  private signaling: Signaling | null;
  private conn: RTCPeerConnection | null;
  private dataChannel: RTCDataChannel | null;
  private ready: boolean;
  private onStateChange: OnPeerStateChange;
  private onMsg: OnMsg;

  constructor(id: string, signaling: Signaling, isOffering: boolean) {
    this.id = id;
    this.isOffering = isOffering;
    this.signaling = signaling;
    this.conn = null;
    this.dataChannel = null;
    this.ready = false;
    this.onStateChange = isReady => {};
    this.onMsg = msg => {};
  }

  public getId(): string {
    return this.id;
  }

  public init(connConfig?: RTCConfiguration): void {
    if (!connConfig)
      return;
    console.log(connConfig);
    this.conn = new RTCPeerConnection(connConfig);
    this.conn.onicecandidate = (ev: RTCPeerConnectionIceEvent): any => {
      if (!ev.candidate)
        return null;
      //console.log(this.id, 'pub.onIceCandidate: ', ev.candidate);
      this.signaling?.signalIceCandidate(this.id, ev.candidate);
      return null;
    };
    this.conn.onicegatheringstatechange = (ev: Event): any => {
      console.log(this.id, 'conn.onicegatheringstatechange: ', this.conn?.iceGatheringState);
    };
    this.conn.oniceconnectionstatechange = (ev: Event): any => {
      console.log(this.id, 'oniceconnectionstatechange: ', this.conn?.iceConnectionState);
    }
    if (this.isOffering) {
      this.dataChannel = this.conn.createDataChannel('data');
      this.dataChannel.onopen = () => {
        console.log(this.id, 'dataChannel.onopen');
        this.callOnStateChange(true);
      };
      this.dataChannel.onclose = () => {
        console.log(this.id, "dataChannel.onclose")
        this.callOnStateChange(false);
      };
      this.dataChannel.onmessage = (ev: MessageEvent) => {
        const msg = ev.data;
        console.log(this.id, "dataChannel.onmessage: ", msg);
        this.onMsg(msg)
      };
      this.createOffer();
    } else {
      this.conn.ondatachannel = (ev: RTCDataChannelEvent) => {
        console.log(this.id, "conn.ondatachannel")
        this.dataChannel = ev.channel;
        this.dataChannel.onopen = () => {
          console.log(this.id, "dataChannel.onopen");
          this.callOnStateChange(true);
        };
        this.dataChannel.onclose = () => {
          console.log(this.id, "dataChannel.onclose")
          this.callOnStateChange(false);
        };
        this.dataChannel.onmessage = (ev: MessageEvent) => {
          const msg = ev.data;
          console.log(this.id, "dataChannel.onmessage: ", msg);
          this.onMsg(msg)
        };
      }
    }
  }

  public destroy(): void {
    this.conn?.close();
    this.callOnStateChange(false);
  }

  public addIceCandidate(iceCandidate: RTCIceCandidate): void {
    if (!iceCandidate || !this.conn)
      return;
    console.log(this.id, 'addIceCandidate: ', iceCandidate);
    this.conn.addIceCandidate(iceCandidate);
  }

  public processOffer(offer: RTCSessionDescriptionInit): void {
    if (!this.conn)
      return;
    console.log(this.id, 'processOffer: ', offer);
    this.conn.setRemoteDescription(offer);
    this.conn.createAnswer().then((answer: RTCSessionDescriptionInit) => {
      this.conn?.setLocalDescription(answer);
      this.signaling?.signalAnswer(this.id, answer);
    });
  }
  
  public processAnswer(answer: RTCSessionDescriptionInit): void {
    console.log(this.id, 'processAnswer: ', answer);
    this.conn?.setRemoteDescription(answer);
  }

  public setStateChangeCallback(cb: OnPeerStateChange): void {
    this.onStateChange = cb;
  }

  public setOnMsgCallback(cb: OnMsg): void {
    this.onMsg = cb;
  }

  public sendMsg(msg: string): void {
    this.dataChannel?.send(msg);
  }

  private callOnStateChange(isReady: boolean): void {
    if (isReady === this.ready)
      return;
    this.ready = isReady;
    this.onStateChange(this.ready);
  }

  private createOffer(): void {
    if (!this.conn || !this.signaling)
      return;
    this.conn.createOffer().then(
      (offer: RTCSessionDescriptionInit) => {
        console.log(this.id, "type: ", offer.type, "sdp: ", offer.sdp);
        this.conn?.setLocalDescription(offer);
        this.signaling?.signalOffer(this.id, offer);
      },
      (error: any) => {
        console.log(this.id, "createOffer failed: ", error);
      }
    );
  }
}

export default RtcPeer;
