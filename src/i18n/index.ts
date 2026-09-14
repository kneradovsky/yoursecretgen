import { createContext, useContext, type ReactNode } from 'react';
import en from './en';
import ru from './ru';

export const LANGS = ['en', 'ru'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const dictionaries: Record<Lang, typeof en> = { en, ru };

export type TranslationKey = Paths<typeof en>;

type Paths<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: Paths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
    }[keyof T & string];

type TranslateOptions = Record<string, ReactNode | ((children: ReactNode) => ReactNode)>;

const TAG_PATTERN = /<(\w+)>([\s\S]*?)<\/\1>/g;
const PARAM_PATTERN = /\{(\w+)\}/g;

function resolve(dict: typeof en, key: TranslationKey): string {
  let value: unknown = dict;
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown>)[part];
  }
  return value as string;
}

/**
 * Renders a translation string, interpolating {param} placeholders and
 * rendering <tag>…</tag> fragments through the matching option callback,
 * so strings can contain markup like <b>…</b>.
 */
function renderValue(value: string, options?: TranslateOptions): ReactNode {
  if (!options) return value;

  const withParams = value.replace(PARAM_PATTERN, (match, name: string) => {
    const option = options[name];
    if (option !== undefined && typeof option !== 'function') return String(option);
    return match;
  });

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  // matchAll clones the global regex per call, so the recursive renderValue
  // below cannot reset the outer loop's lastIndex mid-iteration.
  for (const match of withParams.matchAll(TAG_PATTERN)) {
    if (match.index > lastIndex) parts.push(withParams.slice(lastIndex, match.index));
    const renderTag = options[match[1]];
    const children: ReactNode = renderValue(match[2], options);
    parts.push(typeof renderTag === 'function' ? renderTag(children) : children);
    lastIndex = match.index + match[0].length;
  }
  if (parts.length === 0) return withParams;
  if (lastIndex < withParams.length) parts.push(withParams.slice(lastIndex));
  return parts;
}

export const LangContext = createContext<Lang>(DEFAULT_LANG);
export const LangProvider = LangContext.Provider;

export function useI18n() {
  const lang = useContext(LangContext);
  const dict = dictionaries[lang];

  function t(key: TranslationKey, options?: TranslateOptions): ReactNode {
    return renderValue(resolve(dict, key), options);
  }

  return { lang, t };
}

export function isLang(value: string | undefined): value is Lang {
  return value !== undefined && (LANGS as readonly string[]).includes(value);
}

/** Adds the language prefix to a section path: ('ru', '/uuid') -> '/ru/uuid'. */
export function localizedPath(lang: Lang, path: string): string {
  return lang === DEFAULT_LANG ? path : `/${lang}${path === '/' ? '' : path}`;
}

/** Removes the language prefix: ('/ru/uuid') -> '/uuid', ('/uuid') -> '/uuid'. */
export function stripLangPrefix(pathname: string): string {
  const segment = pathname.split('/')[1];
  if (isLang(segment)) return pathname.slice(segment.length + 1) || '/';
  return pathname || '/';
}

/**
 * Simple pluralization for the few count-dependent strings.
 * English picks one/other, Russian uses the standard one/few/many rule.
 */
export function plural(lang: Lang, n: number, one: string, few: string, many: string): string {
  if (lang === 'en') return n === 1 ? one : few;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
