import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
export function loadTs({ env = {}, mocks = {}, globals = {} } = {}) {
  const cache = new Map();
  const load = (file) => {
    const path = resolve(root, file);
    const relative = path.slice(root.length + 1).replaceAll('\\', '/');
    if (mocks[relative]) return mocks[relative];
    if (cache.has(path)) return cache.get(path);
    const exports = {};
    cache.set(path, exports);
    const source = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const require = (name) => {
      if (mocks[name]) return mocks[name];
      if (name === 'server-only') return {};
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/')
          ? resolve(root, name.slice(2))
          : resolve(dirname(path), name);
        return load(existsSync(base) ? base : `${base}.ts`);
      }
      return nativeRequire(name);
    };
    vm.runInNewContext(
      source,
      {
        module: { exports },
        exports,
        require,
        process: {
          env: {
            NODE_ENV: 'test',
            AUTH_SESSION_SECRET: 'synthetic-test-secret-with-more-than-32-characters',
            ...env,
          },
        },
        Buffer,
        Request,
        Response,
        Headers,
        URL,
        URLSearchParams,
        AbortSignal,
        FormData,
        File,
        Blob,
        ReadableStream,
        TextEncoder,
        TextDecoder,
        structuredClone,
        setTimeout,
        clearTimeout,
        console,
        crypto: globalThis.crypto,
        ...globals,
      },
      { filename: path },
    );
    return exports;
  };
  return load;
}

/** Serialized transactional fixture; this is not a live Firestore emulator. */
export function fakeDb(initial = {}) {
  const data = new Map(Object.entries(structuredClone(initial)));
  const snapshot = (path) => ({
    id: path.split('/').at(-1),
    exists: data.has(path),
    data: () => structuredClone(data.get(path)),
  });
  const ref = (path) => ({
    path,
    get: async () => snapshot(path),
    update: async (values) => {
      if (!data.has(path)) throw Error('Missing document');
      data.set(path, { ...data.get(path), ...structuredClone(values) });
    },
  });
  let tail = Promise.resolve();
  return {
    data,
    collection(name) {
      const state = { uid: null, max: Infinity, cursor: null };
      const query = {
        doc: (id) => ref(`${name}/${id}`),
        where: (_field, _operator, uid) => {
          state.uid = uid;
          return query;
        },
        orderBy: () => query,
        limit: (value) => {
          state.max = value;
          return query;
        },
        startAfter: (value) => {
          state.cursor = value.id;
          return query;
        },
        get: async () => {
          let entries = [...data].filter(
            ([path, value]) =>
              path.startsWith(`${name}/`) && (state.uid === null || value.userId === state.uid),
          );
          entries.sort((a, b) => (b[1].updatedAt || '').localeCompare(a[1].updatedAt || ''));
          if (state.cursor)
            entries = entries.slice(
              entries.findIndex(([path]) => path.split('/').at(-1) === state.cursor) + 1,
            );
          return { docs: entries.slice(0, state.max).map(([path]) => snapshot(path)) };
        },
      };
      return query;
    },
    runTransaction(operation) {
      const task = tail
        .catch(() => {})
        .then(async () => {
          const writes = [];
          const result = await operation({
            get: async (document) => snapshot(document.path),
            set: (document, value, options) =>
              writes.push(() =>
                data.set(
                  document.path,
                  options?.merge
                    ? { ...data.get(document.path), ...structuredClone(value) }
                    : structuredClone(value),
                ),
              ),
            update: (document, value) =>
              writes.push(() =>
                data.set(document.path, { ...data.get(document.path), ...structuredClone(value) }),
              ),
            create: (document, value) =>
              writes.push(() => {
                if (data.has(document.path)) throw Error('Already exists');
                data.set(document.path, structuredClone(value));
              }),
            delete: (document) => writes.push(() => data.delete(document.path)),
          });
          writes.forEach((write) => write());
          return result;
        });
      tail = task;
      return task;
    },
  };
}
