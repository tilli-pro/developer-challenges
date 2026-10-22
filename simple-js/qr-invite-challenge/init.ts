import QRCode from "qrcode";

/**
 * Renders `text` as a QR code drawn with block characters for the terminal.
 *
 * Example:
 *   console.log(await renderQr("https://example.com"));
 *
 * @param text The text to encode. Shorter text gives a smaller code.
 */
export const renderQr = (text: string): Promise<string> =>
  QRCode.toString(text, { type: "terminal", small: true });
