import {useState} from 'react'

const loadedCardAssets = new Set<string>()

export function useAwakenerCardImage(cardAsset: string | undefined) {
  const [loadedCardAsset, setLoadedCardAsset] = useState<string | undefined>(() =>
    cardAsset && loadedCardAssets.has(cardAsset) ? cardAsset : undefined,
  )

  const cardImageLoaded =
    !cardAsset || loadedCardAsset === cardAsset || loadedCardAssets.has(cardAsset)

  function handleCardImageError() {
    setLoadedCardAsset(cardAsset)
  }

  function handleCardImageLoad() {
    if (!cardAsset) {
      return
    }

    loadedCardAssets.add(cardAsset)
    setLoadedCardAsset(cardAsset)
  }

  return {cardImageLoaded, handleCardImageError, handleCardImageLoad}
}
