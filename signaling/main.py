import asyncio
import json
from typing import Dict, Optional

import websockets


class PeerManager:
    def __init__(self):
        self.next_peer_id: int = 1
        self.peers: Dict[str: websockets.WebSocketServerProtocol] = {}

    def gen_peer_id(self):
        peer_id = self.next_peer_id
        self.next_peer_id += 1
        return peer_id

    def add_peer(self, peer_id: str, ws: websockets.WebSocketServerProtocol):
        self.peers[peer_id] = ws
        print("peers: {}".format(self.peers))

    def remove_peer(self, peer_id: str):
        self.peers.pop(peer_id, None)
        print("peers: {}".format(self.peers))

    def get_all_peer_ids(self) -> [str]:
        return list(self.peers.keys())

    def get_peer_ws(self, peer_id: str) -> Optional[websockets.WebSocketServerProtocol]:
        if peer_id not in self.peers:
            return None
        return self.peers[peer_id]

    def get_all_peer_ws(self) -> [websockets.WebSocketServerProtocol]:
        return list(self.peers.values())


peer_mgr = PeerManager()


async def peer_handler(ws: websockets.WebSocketServerProtocol, path: str):
    peer_id = str(peer_mgr.gen_peer_id())
    existing_peer_ids = peer_mgr.get_all_peer_ids()
    peer_mgr.add_peer(peer_id, ws)
    msg_welcome_body = {"type": "welcome", "id": peer_id, "peers": existing_peer_ids}
    print("existing_peer_ids: {}".format(msg_welcome_body))
    await ws.send(json.dumps(msg_welcome_body))
    for other_peer_id in existing_peer_ids:
        other_ws = peer_mgr.get_peer_ws(other_peer_id)
        await other_ws.send(json.dumps({"type": "addPeer", "src": peer_id}))
    try:
        while True:
            msg = await ws.recv()
            if msg is None:
                break
            msg_obj: dict = json.loads(msg)
            print("msg[{}]: {}".format(peer_id, msg_obj))
            msg_target_peer: str = msg_obj["target"]
            target_peer = peer_mgr.get_peer_ws(msg_target_peer)
            msg_type = msg_obj["type"]
            if target_peer is None:
                print("Failed to find target peer {} from {} for msg {}".format(msg_target_peer, peer_id, msg_type))
            msg_obj["src"] = peer_id
            msg_obj.pop("target", None)
            await target_peer.send(json.dumps(msg_obj))
    except Exception as e:
        print("Peer {} lost: {}".format(peer_id, e))
    finally:
        print("Peer {} disconnected".format(peer_id))
        peer_mgr.remove_peer(peer_id)
        other_peer_ids = peer_mgr.get_all_peer_ids()
        for other_peer_id in other_peer_ids:
            other_ws = peer_mgr.get_peer_ws(other_peer_id)
            await other_ws.send(json.dumps({"type": "removePeer", "src": peer_id}))

start_server = websockets.serve(peer_handler, "localhost", 8514)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
