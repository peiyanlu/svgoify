import { normalizePath } from '@peiyanlu/electron-ipc/backend'
import { readFileSync } from 'node:fs'
import { parse } from 'path'
import { CustomPlugin, optimize, PluginConfig } from 'svgo'
import svgpath from 'svgpath'
import { globSync } from 'tinyglobby'
import { OverrideConfig, SvgoIpcInterface, SvgoOptimizeResult } from './IpcInterface'


const cleanupFill: CustomPlugin = {
  name: 'cleanupFill',
  fn: () => {
    return {
      element: {
        enter: (node, _parentNode) => {
          if (node.name === 'svg') {
            node.attributes.fill = 'currentColor'
          } else {
            node.attributes.fill && (delete node.attributes.fill)
          }
        },
      },
    }
  },
}

const cleanupStroke: CustomPlugin = {
  name: 'cleanupStroke',
  fn: () => {
    return {
      element: {
        enter: (node, _parentNode) => {
          if (node.attributes.stroke) {
            node.attributes.stroke = 'currentColor'
          }
        },
      },
    }
  },
}

const resetViewBox: CustomPlugin = {
  name: 'resetViewBox',
  fn: () => {
    const size = 1024
    const target = `0 0 ${ size } ${ size }`
    let viewBox = ''
    let hasPath = false
    
    const getTranslate = (width: number, height: number) => {
      const xScale = size / width
      const yScale = size / height
      
      const percent = Math.min(xScale, yScale)
      
      const translateX = xScale > yScale
      
      const translate = Math.abs(width - height) / 2
      
      const tranX = translateX ? translate : 0
      const tranY = translateX ? 0 : translate
      
      return { percent, tranX, tranY }
    }
    
    return {
      element: {
        enter: (node, _parentNode) => {
          if (node.name === 'svg' && node.attributes.viewBox && !viewBox) {
            viewBox = node.attributes.viewBox
          }
          
          if (node.name === 'path') {
            hasPath = true
            
            const [ _x, _y, width, height ] = (viewBox ?? target).split(' ').map(Number)
            const { tranX, tranY, percent } = getTranslate(width, height)
            
            if (percent !== 1) {
              const d = node.attributes.d
              node.attributes.d = svgpath(d)
                .abs()
                .translate(-tranX, -tranY)
                .scale(percent)
                .rel()
                .round(4)
                .toString()
              
              if (node.attributes.strokeWidth) {
                const width = Number(node.attributes.strokeWidth)
                node.attributes.strokeWidth = (width * percent).toFixed(2)
              }
            }
          }
        },
        exit: (node, _parentNode) => {
          if (hasPath && node.name === 'svg') {
            node.attributes.viewBox = target
          }
        },
      },
    }
  },
}

const removeGroup: CustomPlugin = {
  name: 'removeGroup',
  fn: () => {
    const mergeAttrs = (parentAttrs: Record<string, string>, childAttrs: Record<string, string>) => {
      const result = { ...parentAttrs }
      for (const key in childAttrs) {
        if (key === 'transform' && parentAttrs.transform) {
          result.transform = parentAttrs.transform + ' ' + childAttrs.transform
        } else if (key === 'style' && parentAttrs.style) {
          result.style = parentAttrs.style + ';' + childAttrs.style
        } else {
          result[key] = childAttrs[key]
        }
      }
      return result
    }
    
    return {
      element: {
        exit: (node, parentNode) => {
          if (node.name === 'g' && parentNode && parentNode.children) {
            const index = parentNode.children.indexOf(node)
            console.log(node)
            node.children.forEach(child => {
              if (child.type === 'element') {
                child.attributes = mergeAttrs(node.attributes || {}, child.attributes || {})
              }
            })
            parentNode.children.splice(index, 1, ...node.children)
          }
        },
      },
    }
  },
}

const customPlugin: Record<string, PluginConfig> = {
  convertShapeToPath: {
    name: 'convertShapeToPath',
    params: {
      convertArcs: true,
    },
  },
  // 自定义插件
  cleanupFill,
  cleanupStroke,
  resetViewBox,
  removeGroup,
}


export class SvgoIpcImpl implements SvgoIpcInterface {
  static readonly instance = new SvgoIpcImpl()
  
  private static optimize(input: string, config?: OverrideConfig): Omit<SvgoOptimizeResult, 'parse'> {
    const { plugins: temp, ...others } = config ?? {}
    const defaults: PluginConfig[] = []
    const plugins = ([ ...temp, ...defaults ])
      .map((plugin) => (customPlugin[plugin as string] ?? plugin) as PluginConfig)
    
    const { data: output } = optimize(input, { plugins, ...others, multipass: true })
    const { data: base64 } = optimize(output, { plugins, ...others, datauri: 'base64' })
    const { data: enc } = optimize(output, { plugins, ...others, datauri: 'enc' })
    const { data: unenc } = optimize(output, { plugins, ...others, datauri: 'unenc' })
    
    const inputSize = Buffer.byteLength(input, 'utf8')
    const outputSize = Buffer.byteLength(output, 'utf8')
    
    return { input, output, base64, enc, unenc, inputSize, outputSize }
  }
  
  public async compressPaths(paths: string[], config?: OverrideConfig): Promise<SvgoOptimizeResult[]> {
    return paths.map(k => {
      const input = readFileSync(k).toString()
      return { ...SvgoIpcImpl.optimize(input, config), parse: parse(k) }
    })
  }
  
  public async compressStr(input: string, config?: OverrideConfig): Promise<SvgoOptimizeResult> {
    const parse = {
      root: '/',
      dir: '/',
      base: 'un-named.svg',
      ext: '.svg',
      name: 'un-named',
    }
    return { ...SvgoIpcImpl.optimize(input, config), parse }
  }
  
  public async compressDir(dir: string, config?: OverrideConfig): Promise<SvgoOptimizeResult[]> {
    return globSync(
      [ 'svg', 'svgz' ].map(ext => `**/*.${ ext }`),
      {
        cwd: normalizePath(dir),
        onlyFiles: true,
        ignore: [],
        dot: true,
        absolute: true,
      },
    ).map(fullPath => {
      const input = readFileSync(fullPath).toString()
      return { ...SvgoIpcImpl.optimize(input, config), parse: parse(fullPath) }
    })
  }
}
