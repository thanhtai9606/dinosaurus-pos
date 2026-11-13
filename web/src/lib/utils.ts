import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Area } from "react-easy-crop"

import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date | string | number) => {
  return format(new Date(date), 'd MMM yyyy')
}

export const formatDateTime = (date: Date | string | number) => {
  return format(new Date(date), 'd MMM yyyy HH:mm')
}

export const formatTime = (date: Date | string | number) => {
  return format(new Date(date), 'HH:mm')
}

export function readFile(file: File) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), false)
    reader.readAsDataURL(file)
  })
}


export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      resolve(blob)
    }, 'image/jpeg')
  })
}

const CURRENCY_LOCALE: Record<string, string> = {
  IDR: 'id-ID',
  USD: 'en-US',
  VND: 'vi-VN',
}

export const DEFAULT_APP_CURRENCY = 'VND'

/** Format amount using app financial settings currency (see MoneyProvider). */
export function formatMoney(
  amount: number,
  currency = DEFAULT_APP_CURRENCY,
  locale?: string,
  fractionDigits?: number,
) {
  const code = (currency || DEFAULT_APP_CURRENCY).toUpperCase()
  const loc = locale ?? CURRENCY_LOCALE[code] ?? 'en-US'
  const fd =
    fractionDigits ??
    (code === 'IDR' || code === 'VND' ? 0 : 2)
  const currencyCode = CURRENCY_LOCALE[code] ? code : DEFAULT_APP_CURRENCY
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  }).format(amount)
}

/** Currency glyph/symbol for input prefixes and chart axes (e.g. ₫, Rp). */
export function getCurrencySymbol(currency: string, locale?: string) {
  const code = (currency || DEFAULT_APP_CURRENCY).toUpperCase()
  const loc = locale ?? CURRENCY_LOCALE[code] ?? 'en-US'
  const currencyCode = CURRENCY_LOCALE[code] ? code : DEFAULT_APP_CURRENCY
  try {
    const parts = new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(1)
    const sym = parts.find((p) => p.type === 'currency')?.value
    if (sym) return sym
  } catch {
    /* fallback */
  }
  return code
}

/** Y-axis shorthand for charts (₫120k / Rp120k). */
export function formatMoneyAxisCompact(
  amount: number,
  currency: string,
  locale?: string,
) {
  const symbol = getCurrencySymbol(currency, locale)
  const n = Number(amount)
  if (!Number.isFinite(n)) return symbol
  if (Math.abs(n) >= 1_000_000) {
    return `${symbol}${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  }
  if (Math.abs(n) >= 1_000) {
    return `${symbol}${(n / 1_000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k`
  }
  return `${symbol}${n.toLocaleString()}`
}

/** @deprecated Prefer useFormatMoney() — always IDR */
export const formatRupiah = (number: number) => formatMoney(number, 'IDR')