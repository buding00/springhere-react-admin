import { useEffect, useRef } from 'react'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'
import { bindLoadingBar } from '@/api/client/index.ts'

export function RequestProgressBar() {
  const ref = useRef<LoadingBarRef>(null)

  useEffect(() => {
    bindLoadingBar(ref)
    return () => bindLoadingBar(null)
  }, [])

  return (
    <LoadingBar
      ref={ref}
      color="#1a7a6d"
      height={2}
      shadow={false}
      waitingTime={200}
      transitionTime={200}
      containerClassName="request-progress-bar"
    />
  )
}
