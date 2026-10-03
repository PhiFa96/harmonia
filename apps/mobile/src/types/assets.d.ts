// Schrift- und Klangdateien werden von Metro als Asset eingebunden (Ergebnis: Asset-Kennung).
declare module '*.otf' {
  const asset: number;
  export default asset;
}

declare module '*.mp3' {
  const asset: number;
  export default asset;
}
