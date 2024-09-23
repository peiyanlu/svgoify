import path from 'path'
import type { DataUri, StringifyOptions } from 'svgo/lib/types'
import type { AsyncMethodsOf } from '../frontend/UtilityTypes'


export const dialogChannel = 'electron-dialog'
export type DialogModuleMethod = AsyncMethodsOf<Electron.Dialog>;

export const svgoChannel = 'electron-svgo'

export interface SvgoOptimizeResult {
  input: string
  output: string
  base64: string
  enc: string
  unenc: string
  inputSize: number
  outputSize: number
  parse: path.ParsedPath
}

export interface OverrideConfig {
  path?: string;
  multipass?: boolean;
  floatPrecision?: number;
  js2svg?: StringifyOptions;
  datauri?: DataUri;
  plugins: string[]
}


export interface SvgoIpcInterface {
  /** 压缩 SVG */
  compressPaths(paths: string[], config?: OverrideConfig): Promise<SvgoOptimizeResult[]>;
  
  compressStr(str: string, config?: OverrideConfig): Promise<SvgoOptimizeResult>;
  
  compressDir(dir: string, config?: OverrideConfig): Promise<SvgoOptimizeResult[]>;
}

export type SvgoModuleMethod = AsyncMethodsOf<SvgoIpcInterface>;
