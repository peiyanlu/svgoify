import { StyleProvider, Themes } from '@varlet/ui'


export const changeTheme = (e: MediaQueryList | MediaQueryListEvent) => {
  StyleProvider({
    ...(e.matches ? Themes.md3Light : Themes.md3Dark),
  })
}

const themeMedia = window.matchMedia('(prefers-color-scheme: light)')
changeTheme(themeMedia)

themeMedia.addEventListener('change', changeTheme)
