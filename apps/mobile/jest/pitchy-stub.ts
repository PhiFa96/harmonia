/** UI-Tests prüfen Berechtigung und Bedienung; Detektor-Signale werden separat injiziert. */
export class PitchDetector {
  minVolumeDecibels = 0;
  clarityThreshold = 0;
  static forFloat32Array() {
    return new PitchDetector();
  }
  findPitch(): [number, number] {
    return [0, 0];
  }
}
