type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(nextHandler: SessionExpiredHandler | null) {
  handler = nextHandler;
}

export function notifySessionExpired() {
  handler?.();
}