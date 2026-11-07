import { generate } from '@peiyanlu/icon-builder'
import { join } from 'path'


const j = (path: string) => join(process.cwd(), path)


for (const type of [ 'prod', 'dev' ]) {
  const input = j(`public/icon-${ type }.svg`)
  const output = j(`resources/icons/${ type }`)
  
  generate(input, output).then(_ => {
    console.log(`✨ ${ type } icons generated: ${ input } -> ${ output }`)
  })
}
