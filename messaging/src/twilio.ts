import axios from 'axios';

const TWILLO_AUTH_SID = 'Invalid';
const TWILLO_AUTH_TOKEN = 'Invalid';
const TWILIO_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILLO_AUTH_SID}/Tokens.json`;

export interface IceServer {
  url: string;
  urls: string;
  username?: string;
  credential?: string;
}

export async function getIceServers(): Promise<IceServer[]> {
  let response = await axios.post(TWILIO_URL,
    {},
    {
      auth: {
        username: TWILLO_AUTH_SID,
        password: TWILLO_AUTH_TOKEN
      }
    }
  );
  let iceServers: IceServer[] = response.data['ice_servers'];
  return iceServers;
}

