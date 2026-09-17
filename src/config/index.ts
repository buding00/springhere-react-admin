import type { LocaleCode } from '@/store/locale.ts'

/** 随语言切换的文案。 */
export type LocaleText = Record<LocaleCode, string>

export type FooterLink = {
  /** 链接文字。 */
  label: LocaleText
  /** 打开地址。 */
  href: string
}

/**
 * 站点品牌、登录页展示和页脚。
 * 换名称、占位符或备案信息时只改这一份配置。
 */
export const appConfig = {
  /** 系统名称，登录卡片、侧栏、浏览器标题都会用。 */
  name: 'SpringHere',
  /** 登录卡片和侧栏上的单字标记。 */
  mark: 'S',
  /** 名称下方的副标题。 */
  subtitle: {
    'zh-CN': '管理服务',
    'en-US': 'Admin',
  } satisfies LocaleText,
  /** 浏览器标签标题。 */
  documentTitle: {
    'zh-CN': 'SpringHere 管理服务',
    'en-US': 'SpringHere Admin',
  } satisfies LocaleText,
  login: {
    /** 邮箱输入框占位。 */
    emailPlaceholder: 'admin@example.com',
    /** 登录页左侧说明，最多一两句。 */
    lead: {
      'zh-CN': '会话、用户和权限在这里处理。',
      'en-US': 'Sessions, users, and access live here.',
    } satisfies LocaleText,
  },
  footer: {
    /** 版权行。 */
    copyright: {
      'zh-CN': '© 2026 SpringHere',
      'en-US': '© 2026 SpringHere',
    } satisfies LocaleText,
    /** 备案号，空字符串则不显示。 */
    icp: '',
    /** 备案号点击跳转。 */
    icpHref: 'https://beian.miit.gov.cn/',
    /** 页脚附加说明，空字符串则不显示。 */
    note: {
      'zh-CN': '',
      'en-US': '',
    } satisfies LocaleText,
    /** 页脚链接，没有则留空数组。 */
    links: [] as FooterLink[],
  },
} as const

export function localeText(value: LocaleText, locale: LocaleCode) {
  return value[locale] || value['zh-CN']
}
