/**
 * Lets `bun test` import the `.png`/`.css` files that Vite resolves at build
 * time. Bun's runtime has no built-in loader for either, so without this
 * plugin any test that transitively imports a component with an asset import
 * (e.g. MuteButton importing `../assets/icons8-mute-48.png`) fails to even
 * load the module.
 *
 * Assets resolve to their own path as the default export, which is enough for
 * tests: nothing asserts on image bytes, only that the module graph resolves.
 * Stylesheets resolve to an empty module since a stylesheet having side effects
 * is unobservable from a test.
 */
import { plugin } from 'bun'

function asModuleSource(path: string): string {
  return `export default ${JSON.stringify(path)}`
}

plugin({
  name: 'stub-static-assets',
  setup(build) {
    build.onResolve({ filter: /\.(css|scss|sass|less)$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-css',
    }))
    build.onLoad({ filter: /.*/, namespace: 'stub-css' }, () => ({
      contents: '',
      loader: 'js',
    }))

    build.onResolve({ filter: /\.(png|jpg|jpeg|gif|svg|webp|avif)$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-asset',
    }))
    build.onLoad({ filter: /.*/, namespace: 'stub-asset' }, (args) => ({
      contents: asModuleSource(args.path),
      loader: 'js',
    }))
  },
})