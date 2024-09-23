export enum Platform {
  Aix = 'aix',
  Android = 'android',
  Darwin = 'darwin',
  Freebsd = 'freebsd',
  Haiku = 'haiku',
  Linux = 'linux',
  Openbsd = 'openbsd',
  Sunos = 'sunos',
  Win32 = 'win32',
  Cygwin = 'cygwin',
  Nygwin = 'netbsd',
}


export class PlatformDetector {
  static get isWin() {
    return process.platform === Platform.Win32;
  }
  
  static get isMac() {
    return process.platform === Platform.Darwin;
  }
  
  static get isLinux() {
    return process.platform === Platform.Linux;
  }
}
