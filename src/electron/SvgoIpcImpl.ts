import { normalizePath } from '@peiyanlu/electron/backend'
import { readFileSync } from 'node:fs'
import { parse } from 'path'
import { optimize, type PluginConfig } from 'svgo'
import { globSync } from 'tinyglobby'
import type { OverrideConfig, SvgoIpcInterface, SvgoOptimizeResult } from './IpcInterface'
import { customPlugins } from './SvgoPlugins'


export class SvgoIpcImpl implements SvgoIpcInterface {
  static readonly instance = new SvgoIpcImpl()
  
  private static optimize(input: string, config?: OverrideConfig): Omit<SvgoOptimizeResult, 'parse'> {
    const { plugins: temp = [], ...others } = config ?? {}
    const defaults: PluginConfig[] = []
    const plugins = ([ ...temp, ...defaults ])
      .map((plugin) => (customPlugins[plugin as string] ?? plugin) as PluginConfig)
    
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
  
  public async compressCodes(codes: string[][], config?: OverrideConfig): Promise<SvgoOptimizeResult[]> {
    return codes.map(([ code, name ]) => {
      return { ...SvgoIpcImpl.optimize(code, config), parse: parse(name) }
    })
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
