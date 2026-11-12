import { axiosInstance } from '@/lib/api/client'

export async function downloadAuthenticatedFile(path: string, filename: string) {
    const res = await axiosInstance.get(path, { responseType: 'blob' })
    const blob = res.data as Blob
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}
