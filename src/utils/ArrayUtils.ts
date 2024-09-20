export namespace ArrayUtils {
  export const chunk = <T>(arr: T[], size: number): T[][] => arr
    .reduce<T[][]>((res, v, i) => {
      (res[Math.floor(i / size)] ??= []).push(v)
      return res
    }, [])
  
  export const replace = <T, V = T>(arr: T[], step: number, val: V): (T | V)[] => arr
    .map((v, i) => (i + 1) % step === 0 ? val : v)
  
}
