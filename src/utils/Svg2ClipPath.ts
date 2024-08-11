const prefix = 'clipPath'

// 识别svg标签的属性
const svgTitle = /<svg([^>+].*?)>/

// 有一些svg文件的属性会定义height和width，要把它清除掉
const clearHeightWidth = /^(width|height)="([^>+].*?)"/g

// 识别path标签的属性
const nodeTitle = /<(path|rect|circle|ellipse|line)([^>+].*?)/gi

// 清除换行符
const clearReturn = /(\r)|(\n)/g

// 清理以下属性
const clearViewBox = /(viewBox="([^>+].*?)")/g

interface DataInfo {
  code: string
  id: string
}

const formatId = (id: string) => {
  return [ prefix, id ].join('-')
    .replace(/\s|'|‘|’/g, '')
    .replace(/[(){}（）【】\[\]]/g, '_')
}

export const Svg2ClipPath = (data: DataInfo[], iconWidth: number, iconHeight: number) => {
  const text = data.map(({ code, id }) => {
    let width = 300
    let height = 150
    
    let scaleX = 1
    let scaleY = 1
    
    return code
      .replace(clearReturn, '')
      .replace(
        clearHeightWidth,
        (s1: string, s2: string, s3: string) => {
          const numS3 = Number(s3.replace(/\D/g, ''))
          if (s2 === 'width') {
            width = numS3
          }
          if (s2 === 'height') {
            height = numS3
          }
          return ''
        },
      )
      .replace(
        clearViewBox,
        (s1: string, s2: string, s3: string) => {
          if (width === 300 || height === 150) {
            const [ _a, _b, w, h ] = s3.split(' ').map(Number)
            if (w && width === 300) {
              width = w
            }
            if (h && height === 150) {
              height = h
            }
          }
          return ''
        },
      )
      .replace(svgTitle, ($1, $2: string) => {
        const u = 1e6
        scaleX = Math.round(u * iconWidth / width) / u
        scaleY = Math.round(u * iconHeight / height) / u
        
        const n = /<svg[\w\W]*?fill="none"[\w\W]*?>/.test($2)
        
        return `<clipPath id="${ formatId(id) }" ${ n ? 'fill="none"' : '' }>`
      })
      .replace(nodeTitle, `<$1 transform="scale(${ scaleX }, ${ scaleY })" `)
      .replace(/fill="(?:#?\w+|url\(#(?:\w|-)+\))"/g, '')
      .replace('</svg>', '</clipPath>')
  })
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;">${ text.join('') }</svg>`
}
