import React from 'react';
import ReactDom from 'react-dom';
import Main from './main';
import { getIceServers, IceServer } from './twilio';

interface IProp {

}

interface IState {
  iceServers: IceServer[];
  signalingServer: string;
  signalingServerSet: boolean;
  signalingServerError: string;
}

class App extends React.Component<IProp, IState> {

  constructor(props: any) {
    super(props);
    this.state = { iceServers: [], signalingServer: "", signalingServerSet: false, signalingServerError: ""};
  }

  componentDidMount() {
    getIceServers().then((iceServers) => {
      this.setState({ iceServers: iceServers });
    });
  }

  onSignalingServerChanged(url: string): void {
    this.setState({ signalingServer: url, signalingServerError: "", signalingServerSet: false })
  }

  onSignalingServerSet(): void {
    const url = this.state.signalingServer;
    if (url.length <= 0)
      return;
    if (!(url.startsWith('ws://') || url.startsWith('wss://'))) {
      this.setState({ signalingServerError: 'Signaling Server URL must start with ws:// or wss://'})
      return;
    }
    this.setState({ signalingServerSet: true })
  }

  render() {
    if (!this.state.signalingServerSet) {
      return (
        <div>
          <input id="url" onChange={event => this.onSignalingServerChanged(event.target.value)} placeholder="Signaling Server URL"></input>
          <button id="set" onClick={() => this.onSignalingServerSet()}>Play</button>
          <br/>
          <span id="error" style={{ color: 'red' }}>{this.state.signalingServerError}</span>
        </div>
      )
    } else {
      return <Main signalingServer={this.state.signalingServer} iceServers={this.state.iceServers}/>
    }
  }
}

ReactDom.render(
  <App />,
  document.getElementById("app"))
