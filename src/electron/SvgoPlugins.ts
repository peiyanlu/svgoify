import { CustomPlugin, PluginConfig, XastElement } from 'svgo'
import svgpath from 'svgpath'


const cleanupFill: CustomPlugin = {
  name: 'cleanupFill',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
          if (node.name === 'svg') {
            node.attributes.fill = 'currentColor'
          } else {
            const stroke = node.attributes.stroke
            if (!stroke) {
              const fill = node.attributes.fill
              if ('none' === fill) {
                const index = parentNode.children.indexOf(node)
                parentNode.children.splice(index, 1)
              } else {
                delete node.attributes.fill
              }
            }
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
    
    const getTrans = (vw: number, vh: number) => {
      const scale = size / Math.max(vw, vh)
      const tranX = vw > vh ? 0 : (size - vw * scale) / 2
      const tranY = vh > vw ? 0 : (size - vh * scale) / 2
      return { scale, tranX, tranY }
    }
    
    return {
      element: {
        enter: (node, _parentNode) => {
          if (node.name === 'svg' && node.attributes.viewBox && !viewBox) {
            viewBox = node.attributes.viewBox
          }
          
          if (node.name === 'path' && viewBox) {
            hasPath = true
            
            const [ vx, vy, vw, vh ] = viewBox.split(/[\s,]+/).map(Number)
            const { tranX, tranY, scale } = getTrans(vw, vh)
            
            if (scale !== 1) {
              const d = node.attributes.d
              node.attributes.d = svgpath(d)
                .abs()
                .translate(-vx, -vy)
                .scale(scale)
                .translate(tranX, tranY)
                .rel()
                .round(4)
                .toString()
              
              if (node.attributes['stroke']) {
                const width = parseFloat(node.attributes['stroke-width'] ?? '1')
                node.attributes['stroke-width'] = (width * scale).toFixed(4)
                
                if (node.attributes['stroke-dasharray']) {
                  node.attributes['stroke-dasharray'] = node.attributes['stroke-dasharray']
                    .split(' ')
                    .map(x => parseFloat(x) * scale)
                    .join(' ')
                }
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
          if (node.name === 'g') {
            const index = parentNode.children.indexOf(node)
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

const removeRootStyle: CustomPlugin = {
  name: 'removeRootStyle',
  fn: () => {
    const del = (node: XastElement) => {
      const attrs = [ 'class', 'style', 'xml:space', 'display' ]
      attrs.forEach(attr => {
        delete node.attributes[attr]
      })
    }
    
    return {
      element: {
        exit: (node, _parentNode) => {
          if (node.name === 'svg') {
            del(node)
            node.children.forEach(child => {
              if (child.type === 'element') {
                del(child)
              }
            })
          }
        },
      },
    }
  },
}


export const customPlugins: Record<string, PluginConfig> = {
  convertShapeToPath: {
    name: 'convertShapeToPath',
    params: {
      convertArcs: true,
    },
  },
  // 自定义插件
  cleanupFill,
  cleanupStroke,
  removeGroup,
  removeRootStyle,
  resetViewBox,
}

