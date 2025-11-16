export type AppNotificationPayload = {
  type: 'update' | 'error'
  message: string
}

export const APP_NOTIFICATION_EVENT = 'app-notification'

export function sendNotification(payload: AppNotificationPayload) {
  window.dispatchEvent(
    new CustomEvent<AppNotificationPayload>(APP_NOTIFICATION_EVENT, {
      detail: payload,
    }),
  )
}
