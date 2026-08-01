import { readFileSync } from 'node:fs'
import { parse, relative, resolve, sep } from 'node:path'
import { optimize } from 'svgo'
import { globSync } from 'tinyglobby'
import { Plugin, ViteDevServer } from 'vite'


interface SvgIconsOptions {
  iconDirs: string[];
  domId?: string;
  symbolId?: string;
}

interface ScanResult {
  file: string;
  dir: string;
}

interface SpriteMeta {
  svg: string;
  ids: Set<string>;
  domId: string;
}


const viteHmr = () => {
  return `
    if (import.meta.hot) {
      import.meta.hot.on(
        'svg-icons:update',
        ({ domId, svg }) => loadSvg(domId, svg)
      )
    }
  `
}

const isInDir = (dir: string, path: string): boolean => {
  const r = relative(resolve(dir), resolve(path))
  return r !== '..' && !r.startsWith(`..${ sep }`)
}

const dedent = (str: string): string => {
  const lines = str.split('\n')
  
  const indent = lines
    .filter(line => line.trim())
    .reduce((min, line) => {
      const match = line.match(/^(\s*)/)
      return Math.min(min, match?.[1].length ?? 0)
    }, Infinity)
  
  return lines
    .map(line => line.slice(indent))
    .join('\n')
    .trim()
}

const scanFiles = (dirs: string[], patterns: string[]): ScanResult[] => {
  return dirs
    .map(d => resolve(d))
    .flatMap(
      dir => globSync(
        patterns,
        {
          cwd: dir,
          onlyFiles: true,
          absolute: true,
        },
      )
        .sort()
        .map(file => ({ file, dir })),
    )
}


// ------------


const normalizeSymbolId = (id: string): string => id
  .replace(/[\s'‘’]/g, '')
  .replace(/["&<>()[\]{}（）【】]/g, '_')

const generateSymbolId = (template: string, dir: string, name: string): string => {
  return template.replace(/\[dir]/g, dir)
    .replace(/-{2,}/g, '-')
    .replace(/\[name]/g, name)
}

const getAttribute = (str: string, attr: string, def: string): string => {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const reg = new RegExp(`\\b${ escaped }\\s*=\\s*["']([^"']*)["']`, 'i')
  const match = reg.exec(str)
  return match?.[1] ?? def
}

const normalizeDirName = (dir: string): string => {
  const name = dir.replaceAll(sep, '-')
  return name === '.' ? '' : name
}

const createRegisterCode = (svg: string, domId: string, hmrCode: string): string => {
  return dedent(`
    function loadSvg(domId, svg) {
      let svgDom = document.getElementById(domId)
      if(!svgDom) {
        svgDom = document.createElement('div')
        svgDom.id = domId
        document.body.appendChild(svgDom)
      }
      svgDom.innerHTML = svg
    }
    
    const handleLoad = () => loadSvg('${ domId }', ${ JSON.stringify(svg) })
    
    if(document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleLoad)
    } else {
      handleLoad()
    }
    
    ${ hmrCode }
    
    export default {}
  `)
}

const createNamesCode = (ids: Iterable<string>): string => {
  return `export default ${ JSON.stringify([ ...ids ]) }`
}

const isIconFile = (iconDirs: string[], file: string): boolean => {
  return file.endsWith('.svg') && iconDirs.some(iconDir => isInDir(iconDir, file))
}

const svg2Symbol = (svg: string, id: string): string => {
  const reg = /<svg\s*\b([^>]*)\s*>([\s\S]*?)<\/svg\s*>/i
  const match = svg.match(reg)
  
  if (!match) return ''
  
  const [ attrs, els ] = match.slice(1, 3)
  
  const width = getAttribute(attrs, 'width', '1024')
  const height = getAttribute(attrs, 'height', '1024')
  const viewBox = getAttribute(attrs, 'viewBox', `0 0 ${ width } ${ height }`)
  
  return `<symbol id="${ id }" viewBox="${ viewBox }">${ els }</symbol>`
}

const createSvgSprite = (iconDirs: string[], symbolId?: string, domId?: string): SpriteMeta => {
  const ids = new Set<string>()
  const idSources = new Map<string, string>()
  
  const symbols = scanFiles(iconDirs, [ '**/*.svg' ])
    .map(({ file, dir }) => {
      const { dir: fileDir, name: fileName } = parse(file)
      const dirName = normalizeDirName(relative(dir, fileDir))
      
      const idTpl = symbolId ?? 'symbol-[dir]-[name]'
      const id = normalizeSymbolId(generateSymbolId(idTpl, dirName, fileName))
      
      const previousSource = idSources.get(id)
      if (previousSource) {
        throw new Error(`Duplicate SVG symbol id "${ id }" generated from "${ previousSource }" and "${ file }"`)
      }
      idSources.set(id, file)
      
      const input = readFileSync(file, 'utf8')
      const { data: code } = optimize(input)
      return { code, id }
    })
    .map(({ code, id }) => {
      ids.add(id)
      
      return svg2Symbol(code, id)
    })
    .filter(Boolean)
    .join('')
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">${ symbols }</svg>`
  
  domId = domId ?? 'svg-icons-dom-3dc3f4ee'
  
  return { svg, ids, domId }
}

const resolved = (id: string): string => `\0${ id }`


export const createSvgIconsPlugin = (options: SvgIconsOptions): Plugin => {
  const { iconDirs, symbolId, domId: _domId } = options
  
  const SVG_ICONS_REGISTER = 'virtual:svg-icons-register'
  const SVG_ICONS_NAMES = 'virtual:svg-icons-names'
  
  const x = () => {
    const { svg, ids, domId } = createSvgSprite(iconDirs, symbolId, _domId)
    const code = createRegisterCode(svg, domId, viteHmr())
    const idSet = createNamesCode(ids)
    return { code, idSet, svg, domId }
  }
  
  let { code, idSet, svg, domId } = x()
  
  const onUpdate = (file: string, server: ViteDevServer) => {
    if (!isIconFile(iconDirs, file)) return
    
    ({ svg, domId } = x())
    
    server.ws.send({
      type: 'custom',
      event: 'svg-icons:update',
      data: { domId, svg },
    })
  }
  
  return {
    name: 'SvgIconsPlugin',
    configResolved(_cfg) {},
    resolveId(id) {
      const ids = [ SVG_ICONS_REGISTER, SVG_ICONS_NAMES ]
      if (ids.includes(id)) {
        return resolved(id)
      }
    },
    load(id, options) {
      const isSSR = options?.ssr
      
      if (id === resolved(SVG_ICONS_REGISTER)) {
        return isSSR ? 'export default {}' : code
      }
      
      if (id === resolved(SVG_ICONS_NAMES)) {
        return isSSR ? 'export default []' : idSet
      }
    },
    configureServer: (server) => {
      server.watcher.on('add', (file) => onUpdate(file, server))
      server.watcher.on('unlink', (file) => onUpdate(file, server))
    },
    handleHotUpdate({ file, server }) {
      onUpdate(file, server)
    },
  }
}
