const ALERT_NAME_PREFIX_RE = /^(?:Alert|Threat Level)\s+/i

export function getDzoneAlertShortName(alertName: string): string {
  return alertName.replace(ALERT_NAME_PREFIX_RE, '').trim() || alertName
}

export function toDZoneAccessibleText(text: string): string {
  return (
    text
      .replace(/@[1-4]\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim() || text
  )
}
