import { bcrypt_hash, bcrypt_verify } from '../wasm';

export type BcryptRequest =
  | { id: number; type: 'hash'; password: string; cost: number }
  | { id: number; type: 'verify'; password: string; hash: string };

export type BcryptResponse =
  | { id: number; ok: true; result: string | boolean }
  | { id: number; ok: false; error: string };

/** Messages the worker sends to the page: the readiness signal or a job result. */
export type BcryptWorkerEvent = BcryptResponse | { ready: true };

/**
 * Narrow view of the worker global scope. Declared locally instead of pulling
 * in `/// <reference lib="webworker" />`, which conflicts with the DOM lib the
 * rest of the app is compiled against.
 */
interface WorkerScope {
  onmessage: ((event: MessageEvent<BcryptRequest>) => void) | null;
  postMessage: (message: BcryptWorkerEvent) => void;
}

const scope = self as unknown as WorkerScope;

/**
 * bcrypt runs in a dedicated worker because the wasm implementation is
 * synchronous: at a high cost factor it would block the main thread for tens
 * of seconds (the tab freezes, the "Hashing..." state never paints).
 */
scope.onmessage = (event) => {
  const request = event.data;

  try {
    const result =
      request.type === 'hash'
        ? bcrypt_hash(request.password, request.cost)
        : bcrypt_verify(request.password, request.hash);
    scope.postMessage({ id: request.id, ok: true, result });
  } catch (error) {
    // wasm-bindgen rejects with the JsValue string, not an Error instance.
    scope.postMessage({ id: request.id, ok: false, error: String(error) });
  }
};

// Announce readiness only now. Importing ../wasm is a top-level await (the wasm
// is fetched and instantiated before this module body runs), and a message
// posted before the handler above exists is dropped by the browser rather than
// queued — the client would then wait forever. It buffers jobs until this
// signal instead.
scope.postMessage({ ready: true });
