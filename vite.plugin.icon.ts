import fg from 'fast-glob'
import fs from 'node:fs'
import path, { join } from 'path'
import { optimize } from 'svgo'
import { normalizePath, Plugin } from 'vite'

const createSymbolCode = (iconDirs: string, symbolId?:string, domId?: string) => {
  const textArr = fg
    .sync(
      fg.convertPathToPattern(join(iconDirs, `/**/*.svg`)),
      {
        onlyFiles: true,
        objectMode: true,
        ignore: [],
        dot: true,
      },
    )
    .map(e => {
      const { name, dir } = path.parse(e.path)
      
      const dirName = path.normalize(dir) === path.normalize(iconDirs) ? '' : path.dirname(dir)
      
      const id = (symbolId ?? 'symbol-[dir]-[name]')
        .replace(/\[dir]/g, dirName)
        .replace('--', '-')
        .replace(/\[name]/g, name)
      
      const input = fs.readFileSync(e.path).toString()
      const { data: code } = optimize(input)
      return { code, id }
    })
    .map(e => {
      const { code, id } = e
      return code
        .replace(/(\r)|(\n)/g, '')
        .replace(/(width|height)="([^>+].*?)"/g, '')
        .replace(/<svg([^>+].*?)>/, ($1, $2: string) => {
          const formatId = (id: string) => {
            return id
              .replace(/\s|'|‘|’/g, '')
              .replace(/[(){}（）【】\[\]]/g, '_')
          }
          
          return `<symbol id="${ formatId(id) }" ${ $2.match(/(viewBox="[^>+].*?")/g)?.at(0) }>`
        })
        .replace('</svg>', '</symbol>')
    })
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">${ textArr.join('') }</svg>`
  
  return `
    if (typeof window !== 'undefined') {
      function loadSvg() {
        const body = document.body;
        const id = '${ domId }' ?? 'svg-icons-dom';
        let svgDom = document.getElementById(id);
        if(!svgDom) {
          svgDom = document.createElement('div');
          svgDom.id = id;
          document.body.appendChild(svgDom);
        }
        svgDom.innerHTML = '${ svg }';
        body.insertBefore(svgDom, body.lastChild);
      }
      if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSvg);
      } else {
        loadSvg()
      }
    }
  `
}


interface ViteSvgIconsPlugin {
  iconDirs: string;
  domId: string;
  symbolId: string;
}

export function createSvgIconsPlugin(opt: ViteSvgIconsPlugin): Plugin {
  const { iconDirs, symbolId, domId } = opt
  
  const SVG_ICONS_REGISTER_NAME = 'virtual:svg-icons-register'
  let isBuild = false
  let code = createSymbolCode(iconDirs,symbolId, domId)
  
  return {
    name: 'SvgIconsPlugin',
    configResolved({ command }) {
      isBuild = command === 'build'
    },
    resolveId(id) {
      if ([ SVG_ICONS_REGISTER_NAME ].includes(id)) {
        return id
      }
      return null
    },
    async load(id, ssr) {
      if (!isBuild && !ssr) return null
      const isRegister = id.endsWith(SVG_ICONS_REGISTER_NAME)
      
      if (ssr && !isBuild && isRegister) {
        return `export default {}`
      }
      
      if (isRegister) {
        return code
      }
    },
    configureServer: ({ middlewares }) => {
      middlewares.use(async (req, res, next) => {
        const url = normalizePath(req.url!)
        
        const registerId = `/@id/${ SVG_ICONS_REGISTER_NAME }`
        
        if ([ registerId ].some((item) => url.endsWith(item))) {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'no-cache')
          
          // res.setHeader('Etag', `W/ ${ code }`)
          res.statusCode = 200
          res.end(code)
        } else {
          next()
        }
      })
    },
  }
}
