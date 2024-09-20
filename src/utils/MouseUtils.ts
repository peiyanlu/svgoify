export namespace MouseUtils {
  export const dragDelta = (element: HTMLElement, callback: (dx: number, dy: number) => void) => {
    let isDragging = false
    let startX = 0
    let startY = 0
    const userSelect = element.style.userSelect
    
    const mousemove = (event: MouseEvent) => {
      if (!isDragging) return
      
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      startX = event.clientX
      startY = event.clientY
      
      callback(dx, dy)
    }
    
    const mouseup = () => {
      isDragging = false
      element.style.userSelect = userSelect
      
      element.removeEventListener('mousemove', mousemove)
      element.removeEventListener('mouseup', mouseup)
    }
    
    const mousedown = (event: MouseEvent) => {
      isDragging = true
      startX = event.clientX
      startY = event.clientY
      element.style.userSelect = 'none'
      
      element.addEventListener('mousemove', mousemove)
      element.addEventListener('mouseup', mouseup)
    }
    
    element.addEventListener('mousedown', mousedown)
  }
}

