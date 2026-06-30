/**
 * Lightweight per-page SEO for the marketing SPA. Imperatively manages the
 * document <head> (title, description, canonical, Open Graph, Twitter) on
 * mount — no dependency, works without SSR. Each marketing page renders one.
 */
import { useEffect } from 'react'

const SITE_URL = 'https://schedu.bhusku.com'
const OG_IMAGE = `${SITE_URL}/logo.svg`

interface SeoProps {
  title: string
  description: string
  path: string // route path, e.g. '/features'
  noindex?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function Seo({ title, description, path, noindex = false }: SeoProps) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`
    const fullTitle = title.includes('schedU') ? title : `${title} · schedU`

    document.title = fullTitle
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    upsertLink('canonical', url)

    // Open Graph
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'schedU')
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', OG_IMAGE)

    // Twitter
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', OG_IMAGE)
  }, [title, description, path, noindex])

  return null
}
