type BannerActions = { resume: () => void; cancel: () => void }

let bannerActions: BannerActions | null = null

export function registerBookingBannerActions(actions: BannerActions) {
  bannerActions = actions
  return () => {
    bannerActions = null
  }
}

export function bookingBannerResume() {
  bannerActions?.resume()
}

export function bookingBannerCancel() {
  bannerActions?.cancel()
}
