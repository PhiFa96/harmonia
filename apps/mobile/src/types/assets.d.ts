// Schriftdateien werden von Metro als Asset eingebunden (Ergebnis: Asset-Kennung).
declare module '*.otf' {
  const asset: number;
  export default asset;
}
