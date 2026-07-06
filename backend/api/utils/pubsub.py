import queue
import json
from typing import Dict, List, Any

class PubSubManager:
    def __init__(self):
        self.listeners: Dict[str, List[queue.Queue]] = {}

    def subscribe(self, session_id: str) -> queue.Queue:
        q = queue.Queue(maxsize=100)
        if session_id not in self.listeners:
            self.listeners[session_id] = []
        self.listeners[session_id].append(q)
        return q

    def unsubscribe(self, session_id: str, q: queue.Queue):
        if session_id in self.listeners:
            if q in self.listeners[session_id]:
                self.listeners[session_id].remove(q)
            if not self.listeners[session_id]:
                del self.listeners[session_id]

    def publish(self, session_id: str, event_type: str, data: Any):
        if session_id in self.listeners:
            message = json.dumps({"type": event_type, "data": data})
            for q in self.listeners[session_id]:
                try:
                    q.put_nowait(message)
                except queue.Full:
                    pass

pubsub = PubSubManager()
