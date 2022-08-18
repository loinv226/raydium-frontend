import { useEffect } from 'react'

import useToken from '@/application/token/useToken'
import { isMintEqual } from '@/functions/judgers/areEqual'
import useAsyncEffect from '@/hooks/useAsyncEffect'

import useConcentrated from './useConcentrated'

/** coin1 coin2 ammId */
export default function useConcentratedAmmSelector() {
  const coin1 = useConcentrated((s) => s.coin1)
  const coin2 = useConcentrated((s) => s.coin2)
  const ammId = useConcentrated((s) => s.ammId)
  const currentJsonInfo = useConcentrated((s) => s.currentJsonInfo)

  /** update `coin1` and `coin2` (to match `ammId`) */
  useEffect(() => {
    if (!ammId) return
    const { coin1, coin2, jsonInfos } = useConcentrated.getState()
    const targetInfo = jsonInfos.find((info) => info.id === ammId)
    // current is right, no need to sync again
    if (isMintEqual(coin1?.mint, targetInfo?.baseMint) && isMintEqual(coin2?.mint, targetInfo?.quoteMint)) return
    if (isMintEqual(coin1?.mint, targetInfo?.quoteMint) && isMintEqual(coin2?.mint, targetInfo?.baseMint)) return

    const { getToken } = useToken.getState()
    const baseCoin = getToken(jsonInfos.find((i) => i.id === ammId)?.baseMint)
    const quoteCoin = getToken(jsonInfos.find((i) => i.id === ammId)?.quoteMint)
    useConcentrated.setState({
      coin1: baseCoin,
      coin2: quoteCoin
    })
  }, [ammId])

  /** update `ammId` (to match `coin1` and `coin2`) */
  useAsyncEffect(async () => {
    if (!coin1 || !coin2) return
    const { findConcentratedInfoByTokenMint, ammId } = useConcentrated.getState()

    const computeResult = await findConcentratedInfoByTokenMint(coin1?.mint, coin2?.mint)

    const resultPool = ammId
      ? computeResult.availables.find((p) => p.id === ammId) || computeResult.best
      : computeResult.best
    if (resultPool) {
      // current is right, no need to sync again
      if (ammId === resultPool?.id) return
      useConcentrated.setState({
        ammId: resultPool?.id,
        currentJsonInfo: resultPool
      })
    } else {
      // should clear ammId and currentJsonInfo
      useConcentrated.setState({
        ammId: undefined,
        currentJsonInfo: undefined
      })
    }
  }, [coin1, coin2])

  // update `currentJsonInfo` (to match `ammId`)
  useEffect(() => {
    if (!ammId) return
    const { jsonInfos, currentJsonInfo } = useConcentrated.getState()

    const alreadyMatched = currentJsonInfo?.id === ammId
    if (alreadyMatched) return

    const matchedInfo = jsonInfos.find((i) => i.id === ammId)
    useConcentrated.setState({ currentJsonInfo: matchedInfo })
  }, [ammId])

  // update `ammId` (to match `currentJsonInfo`)
  useEffect(() => {
    const { currentJsonInfo } = useConcentrated.getState()
    if (!currentJsonInfo) return
    const { ammId: currentAmmId } = useConcentrated.getState()

    const alreadyMatched = currentJsonInfo?.id === currentAmmId
    if (alreadyMatched) return

    const ammId = currentJsonInfo?.id
    useConcentrated.setState({ ammId })
  }, [currentJsonInfo])
}
