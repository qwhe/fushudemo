export function findImageFile(files?: ArrayLike<File> | null): File | null {
  if (!files) return null

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    if (file?.type.startsWith('image/')) return file
  }

  return null
}
