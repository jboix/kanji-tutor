/// <reference lib="webworker" />
/** Web Worker entry: runs kuromoji's browser build off the main thread. */
import kuromoji from 'kuromoji/build/kuromoji.js';
import { buildWith, serveTokenizer, type WorkerScope } from './tokenizer-protocol.ts';

serveTokenizer(self as unknown as WorkerScope, buildWith(kuromoji.builder));
