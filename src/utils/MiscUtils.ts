export namespace Utils {
  export const toSelfClosing = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html
    
    function serialize(node: SVGSVGElement) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      
      const tag = node.tagName.toLowerCase()
      const attrs = [ ...node.attributes ].map(a => `${ a.name }="${ a.value }"`).join(' ')
      
      // ✔ 空标签 → 自闭合
      const targets = [ 'path', 'rect', 'circle', 'ellipse', 'line' ]
      const hasChildren = [ ...node.childNodes ].some(n => n.nodeType !== Node.TEXT_NODE)
      if (targets.includes(tag) && !hasChildren) {
        return `<${ tag }${ attrs ? ' ' + attrs : '' } />`
      }
      
      // ✔ 有子节点 → 保留正常结构
      const children: string = [ ...node.childNodes ].map(serialize).join('')
      return `<${ tag }${ attrs ? ' ' + attrs : '' }>${ children }</${ tag }>`
    }
    
    return [ ...div.childNodes ].map(serialize).join('')
  }
}
