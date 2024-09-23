interface DataInfo {
  code: string
  id: string
}

const formatId = (id: string) => {
  return id
    .replace(/\s|'|‘|’/g, '')
    .replace(/[(){}（）【】\[\]]/g, '_')
}

export const Svg2CSSVar = (data: DataInfo[]) => {
  const res = data.map(({ code, id }) => {
    return `\u00A0\u00A0--${ formatId(id) }: url("${ code }");`
  })
  
  return `:root {
    ${ res.join('\n') }
  }`
}
