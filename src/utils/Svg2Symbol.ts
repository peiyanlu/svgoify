const prefix = 'symbol'

// 识别svg标签的属性
const svgTitle = /<svg([^>+].*?)>/

// 有一些svg文件的属性会定义height和width，要把它清除掉
const clearHeightWidth = /(width|height)="([^>+].*?)"/g

// 没有viewBox的话就利用height和width来新建一个viewBox
const hasViewBox = /(viewBox="[^>+].*?")/g

// 清除换行符
const clearReturn = /(\r)|(\n)/g

interface DataInfo {
  code: string
  id: string
}

const formatId = (id: string) => {
  return [ prefix, id ].join('-')
    .replace(/\s|'|‘|’/g, '')
    .replace(/[(){}（）【】\[\]]/g, '_')
}

export const Svg2Symbol = (data: DataInfo[]) => {
  const text = data.map(({ code, id }) => code
    .replace(clearReturn, '')
    .replace(clearHeightWidth, '')
    .replace(svgTitle, ($1, $2: string) => {
      return `<symbol id="${ formatId(id) }" ${ $2.match(hasViewBox)?.at(0) }>`
    })
    .replace('</svg>', '</symbol>'))
  
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">${ text.join('') }</svg>`
}
