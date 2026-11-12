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

/** Format amount using app financial settings currency (see MoneyProvider). */
export function formatMoney(
  amount: number,
  currency = 'IDR',
  locale?: string,
  fractionDigits?: number,
) {
  const code = (currency || 'IDR').toUpperCase()
  const loc = locale ?? CURRENCY_LOCALE[code] ?? 'en-US'
  const fd =
    fractionDigits ??
    (code === 'IDR' || code === 'VND' ? 0 : 2)
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: CURRENCY_LOCALE[code] ? code : 'IDR',
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  }).format(amount)
}

/** @deprecated Prefer useFormatMoney() — always IDR */
export const formatRupiah = (number: number) => formatMoney(number, 'IDR')