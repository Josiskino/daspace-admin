/**
 * Downloads a file served by the authenticated API. A plain link would not
 * carry the bearer token, so the file is fetched and handed to the browser.
 */
export const downloadFile = async (path, fileName) => {
  const blob = await $api(path, { responseType: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
