export namespace Utils {
  export const fadeText = (x: number, y: number, text: string, color?: string) => {
    const span = document.createElement('span')
    span.innerHTML = text
    const style: CSSStyleDeclaration = span.style
    style.zIndex = '9999'
    style.userSelect = 'none'
    style.pointerEvents = 'none'
    style.animation = 'fade-out .2s'
    style.opacity = '0'
    style.fontSize = '14px'
    style.color = color ?? 'white'
    document.body.appendChild(span)
    
    const { width, height } = span.getBoundingClientRect()
    const top = y - height
    style.position = 'absolute'
    style.top = `${ top }px`
    style.left = `${ x - width / 2 }px`
    
    let i = 0
    const timer = setInterval(() => {
      if (i < 40) {
        i++
        style.top = `${ top - i }px`
        style.opacity = String(1 - i / 40)
      } else {
        span.remove()
        clearInterval(timer)
      }
    }, 50 / 3)
  }
}
