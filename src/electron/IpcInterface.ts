import type { AsyncMethodsOf } from '@peiyanlu/ts-utils'
import type { ParsedPath } from 'node:path'
import type { DataUri, StringifyOptions } from 'svgo'


export const svgoChannel = 'electron-svgo'

export interface SvgoOptimizeResult {
  input: string
  output: string
  base64: string
  enc: string
  unenc: string
  inputSize: number
  outputSize: number
  parse: ParsedPath
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
  compressPaths(paths: string[], config?: OverrideConfig): Promise<SvgoOptimizeResult[]>;
  
  compressCodes(codes: string[][], config?: OverrideConfig): Promise<SvgoOptimizeResult[]>;
  
  compressDir(dir: string, config?: OverrideConfig): Promise<SvgoOptimizeResult[]>;
}

export type SvgoModuleMethod = AsyncMethodsOf<SvgoIpcInterface>;
