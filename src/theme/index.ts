import { StyleProvider, Themes } from '@varlet/ui'


const rootStyleVars = {
  // '--tooltip-default-text-color': 'var(--color-on-surface-variant)',
}

export const changeTheme = (e, style?: Record<string, string>) => {
  StyleProvider({ ...(e.matches ? Themes.md3Light : Themes.md3Dark), ...style })
}

const themeMedia = window.matchMedia('(prefers-color-scheme: light)')
themeMedia.addEventListener('change', changeTheme)
changeTheme(themeMedia)
