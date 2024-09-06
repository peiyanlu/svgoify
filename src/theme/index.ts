import { StyleProvider, Themes } from '@varlet/ui'


const changeTheme = (e) => {
  if (e.matches) {
    console.log('浅色主题')
    StyleProvider(Themes.md3Light)
  } else {
    console.log('深色主题')
    StyleProvider(Themes.md3Dark)
  }
}

const themeMedia = window.matchMedia('(prefers-color-scheme: light)')
themeMedia.addEventListener('change', changeTheme)

changeTheme(themeMedia)


const rootStyleVars = {
  // '--tooltip-default-text-color': 'var(--color-on-surface-variant)',
}

// StyleProvider({
//   ...Themes.md3Dark,
//   ...rootStyleVars,
// })
