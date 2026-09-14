import type { RefObject } from 'react'
import type { LoadingBarRef } from 'react-top-loading-bar'

let pending = 0
let bar: RefObject<LoadingBarRef | null> | null = null

export function bindLoadingBar(ref: RefObject<LoadingBarRef | null> | null) {
  bar = ref
  if (bar?.current && pending > 0) bar.current.continuousStart()
}

export function beginRequest() {
  pending += 1
  if (pending === 1) bar?.current?.continuousStart()
}

export function endRequest() {
  if (pending === 0) return
  pending -= 1
  if (pending === 0) bar?.current?.complete()
}

export function getPendingRequestCount() {
  return pending
}

export function resetRequestProgressForTests() {
  pending = 0
  bar = null
}
