export function shouldSkipTlsVerification(
  explicit?: boolean,
  widgetContext?: boolean,
): boolean {
  return explicit === true || widgetContext === true;
}
