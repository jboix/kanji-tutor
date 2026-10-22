/** Kuromoji's self-contained browserify build (bundles its `path` and `zlib` shims). */
declare module 'kuromoji/build/kuromoji.js' {
  import kuromoji = require('kuromoji');
  export = kuromoji;
}
