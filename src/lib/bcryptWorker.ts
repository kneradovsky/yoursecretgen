import { bcrypt_hash, bcrypt_verify } from '../wasm';
import type {
  BcryptRequest,
  BcryptResponse,
  BcryptWorkerEvent,
} from '../workers/bcrypt.worker';

/** Distributes over the request union, so each variant keeps its own fields. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type BcryptJob = DistributiveOmit<BcryptRequest, 'id'>;

interface Pending {
  resolve: (value: string | boolean) => void;
  reject: (error: Error) => void;
}

/**
 * How long to wait for the worker's readiness signal before giving up on it.
 * Only a safety net: a worker that cannot start reports an error event, and
 * this cover exists so a lost signal can never leave the UI waiting forever.
 */
const READY_TIMEOUT_MS = 30_000;

let worker: Worker | null = null;
let workerUnavailable = false;
let workerReady = false;
let readyTimer: ReturnType<typeof setTimeout> | null = null;
let nextId = 1;

const pending = new Map<number, Pending>();
const queued: { job: BcryptJob; entry: Pending }[] = [];

/**
 * Last resort: run the job on the main thread. Correct, but blocking — that is
 * exactly what the worker exists to avoid, so this only happens when the
 * browser refuses to create a module worker (or it never becomes ready).
 */
function runOnMainThread(job: BcryptJob): Promise<string | boolean> {
  return Promise.resolve().then(() =>
    job.type === 'hash'
      ? bcrypt_hash(job.password, job.cost)
      : bcrypt_verify(job.password, job.hash)
  );
}

function post(target: Worker, job: BcryptJob, entry: Pending) {
  const id = nextId++;
  pending.set(id, entry);
  target.postMessage({ ...job, id } satisfies BcryptRequest);
}

function clearReadyTimer() {
  if (readyTimer !== null) {
    clearTimeout(readyTimer);
    readyTimer = null;
  }
}

function handleMessage(response: BcryptResponse) {
  const entry = pending.get(response.id);
  if (!entry) return;
  pending.delete(response.id);

  if (response.ok) entry.resolve(response.result);
  else entry.reject(new Error(response.error));
}

function flushQueue() {
  clearReadyTimer();

  while (queued.length > 0) {
    const { job, entry } = queued.shift()!;
    if (worker) post(worker, job, entry);
    else runOnMainThread(job).then(entry.resolve, entry.reject);
  }
}

function abandonWorker(error: Error) {
  workerUnavailable = true;
  worker = null;
  workerReady = false;
  clearReadyTimer();

  for (const entry of pending.values()) entry.reject(error);
  pending.clear();

  // Nothing is in flight yet for the buffered jobs; run them the slow way
  // rather than leaving the caller hanging.
  while (queued.length > 0) {
    const { job, entry } = queued.shift()!;
    runOnMainThread(job).then(entry.resolve, entry.reject);
  }
}

function getWorker(): Worker | null {
  if (workerUnavailable) return null;
  if (worker) return worker;

  let created: Worker;
  try {
    created = new Worker(new URL('../workers/bcrypt.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch (error) {
    workerUnavailable = true;
    console.warn('[bcrypt] Web Worker unavailable, using the main thread:', error);
    return null;
  }

  worker = created;
  created.onmessage = (event: MessageEvent<BcryptWorkerEvent>) => {
    const data = event.data;
    if ('ready' in data) {
      workerReady = true;
      flushQueue();
      return;
    }
    handleMessage(data);
  };
  created.onerror = (event) =>
    abandonWorker(new Error(event.message || 'bcrypt worker failed'));

  return created;
}

function run(job: BcryptJob): Promise<string | boolean> {
  const target = getWorker();
  if (!target) return runOnMainThread(job);

  return new Promise<string | boolean>((resolve, reject) => {
    const entry: Pending = { resolve, reject };

    if (workerReady) {
      post(target, job, entry);
      return;
    }

    // The worker is still loading its wasm module; jobs are held here until it
    // signals readiness. Posting earlier loses them: the worker assigns its
    // message handler only after the wasm top-level await resolves.
    queued.push({ job, entry });
    if (readyTimer === null) {
      readyTimer = setTimeout(
        () => abandonWorker(new Error('bcrypt worker did not start')),
        READY_TIMEOUT_MS
      );
    }
  });
}

export async function bcryptHash(password: string, cost: number): Promise<string> {
  return (await run({ type: 'hash', password, cost })) as string;
}

export async function bcryptVerify(password: string, hash: string): Promise<boolean> {
  return (await run({ type: 'verify', password, hash })) as boolean;
}
