import { OverrideConfig, SvgoIpcInterface, SvgoOptimizeResult } from '../common/ElectronIpcInterface'
import fg from 'fast-glob'
import * as fs from 'node:fs'
import path from 'path'
import { CustomPlugin, optimize, PluginConfig } from 'svgo'
import svgpath from 'svgpath'


export const cleanupFill: CustomPlugin = {
  name: 'cleanupFill',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
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

export const cleanupStroke: CustomPlugin = {
  name: 'cleanupStroke',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
          if (node.attributes.stroke) {
            node.attributes.stroke = 'currentColor'
          }
        },
      },
    }
  },
}

export const resetViewBox: CustomPlugin = {
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
        enter: (node, parentNode) => {
          if (node.name === 'svg' && node.attributes.viewBox && !viewBox) {
            viewBox = node.attributes.viewBox
          }
          
          if (node.name === 'path') {
            hasPath = true
            
            const [ x, y, width, height ] = (viewBox ?? target).split(' ').map(Number)
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
        exit: (node, parentNode) => {
          if (hasPath && node.name === 'svg') {
            node.attributes.viewBox = target
          }
        },
      },
    }
  },
}

export const convertStrokeToFill: CustomPlugin = {
  name: 'convertStrokeToFill',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
          if (node.name === 'path') {
            const d = node.attributes.d
            
            Object
              .keys(node.attributes)
              .forEach((key) => {
                if (/^stroke(?=.*)/g.test(key)) {
                  const strokeWidth = node.attributes.strokeWidth
                  
                  if (strokeWidth) {
                    const outerPathData = svgpath(d)
                      .translate(Number(strokeWidth) / 2)
                      .toString()
                    
                    const innerPathData = svgpath(d)
                      .translate(-Number(strokeWidth) / 2)
                      .toString()
                    
                    const combinedPathData = outerPathData + ' ' + innerPathData
                    node.attributes.d = combinedPathData
                    
                    
                    // if (Object.keys(node.attributes).length !== 0) {
                    //   return
                    // }
                    
                    // parentNode.children = parentNode.children.filter(
                    //   (child) => child !== node,
                    // )
                  }
                }
              })
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
      convertArcs: true
    }
  },
  // 自定义插件
  cleanupFill,
  cleanupStroke,
  resetViewBox,
}


export class SvgoIpcImpl implements SvgoIpcInterface {
  static readonly instance = new SvgoIpcImpl()
  
  private static optimize(input: string, config?: OverrideConfig): Omit<SvgoOptimizeResult, 'parse'> {
    const { plugins: temp, ...others } = config ?? {}
    const plugins = temp?.map((plugin) => customPlugin[plugin as string] ?? plugin)
    
    plugins?.push(convertStrokeToFill)
    
    const inputSize = Buffer.byteLength(input, 'utf8')
    
    const { data: output } = optimize(input, { plugins, ...others, multipass: true })
    const { data: base64 } = optimize(output, { plugins, ...others, datauri: 'base64' })
    const { data: enc } = optimize(output, { plugins, ...others, datauri: 'enc' })
    const { data: unenc } = optimize(output, { plugins, ...others, datauri: 'unenc' })
    
    const outputSize = Buffer.byteLength(output, 'utf8')
    
    return { input, output, base64, enc, unenc, inputSize, outputSize }
  }
  
  public async compressPaths(paths: string[], config?: OverrideConfig): Promise<SvgoOptimizeResult[]> {
    return paths.map(k => {
      const input = fs.readFileSync(k).toString()
      return { ...SvgoIpcImpl.optimize(input, config), parse: path.parse(k) }
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
    return fg.sync(
        [ 'svg', 'svgz' ].map(ext => fg.convertPathToPattern(path.join(dir, `/**/*.${ ext }`))),
        {
          onlyFiles: true,
          objectMode: true,
          ignore: [],
          dot: true,
        },
      )
      .map(e => {
        const input = fs.readFileSync(e.path).toString()
        return { ...SvgoIpcImpl.optimize(input, config), parse: path.parse(e.path) }
      })
  }
}
