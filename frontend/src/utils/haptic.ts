const tg = () => (window as any).Telegram?.WebApp?.HapticFeedback

export const haptic = {
  light:     () => { try { tg()?.impactOccurred('light') } catch {} },
  medium:    () => { try { tg()?.impactOccurred('medium') } catch {} },
  heavy:     () => { try { tg()?.impactOccurred('heavy') } catch {} },
  success:   () => { try { tg()?.notificationOccurred('success') } catch {} },
  error:     () => { try { tg()?.notificationOccurred('error') } catch {} },
  selection: () => { try { tg()?.selectionChanged() } catch {} },
}
