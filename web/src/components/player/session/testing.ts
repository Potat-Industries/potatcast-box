/** A stand-in for RTCDataChannel that tests can open, close and push messages through. */
export class FakeDataChannel extends EventTarget {
  readyState: RTCDataChannelState = "connecting";
  readonly sent: string[] = [];
  failNextSend = false;

  send(data: string): void {
    if (this.failNextSend) {
      this.failNextSend = false;
      throw new Error("send failed");
    }

    this.sent.push(data);
  }

  open(): void {
    this.readyState = "open";
    this.dispatchEvent(new Event("open"));
  }

  close(): void {
    this.readyState = "closed";
    this.dispatchEvent(new Event("close"));
  }

  receive(payload: unknown): void {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    this.dispatchEvent(new MessageEvent("message", { data }));
  }

  lastSent<T>(): T {
    return JSON.parse(this.sent[this.sent.length - 1]) as T;
  }

  asDataChannel(): RTCDataChannel {
    return this as unknown as RTCDataChannel;
  }
}
