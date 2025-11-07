// === SaberAudioManager.ts ===
// Manages ignition and loop sounds for sabers

import { SaberManager } from './SaberManager';

@component
export class SaberAudioManager extends BaseScriptComponent {
  @input("SceneObject")
  saberManagerObject: SceneObject | undefined;

  @input("string")
  ignitionSoundName: string = "lightsaber-ignition-6816";

  @input("string")
  loopSoundName: string = "swing3-94210";

  @input
  debugLog: boolean = true;

  private saberManager: any = null;
  private currentAudioComponent: any = null;
  private lastSelectedIndex: number = -1;

  onAwake(): void {
    if (this.saberManagerObject) {
      this.saberManager = this.saberManagerObject.getComponent(
        SaberManager.getTypeName()
      ) as any;
      
      if (!this.saberManager) {
        this.log("SaberManager not found!", true);
        return;
      }

      this.log("SaberManager found, setting callback...");

      // Subscribe to saber selection callback
      this.saberManager.onSaberSelectedCallback = () => {
        this.log("CALLBACK TRIGGERED! 🔊");
        this.playIgnitionSound();
      };
      this.log("Subscribed to saber selection ✅");
    } else {
      this.log("saberManagerObject not assigned!", true);
    }

    this.log("SaberAudioManager ready ✅");
  }

  onUpdate(): void {
    // No longer needed
  }

  private playIgnitionSound(): void {
    try {
      const sceneAny = this.sceneObject as any;
      sceneAny.playSound(this.ignitionSoundName, false);
      this.log(`Playing ignition: ${this.ignitionSoundName} ✅`);
      
      this.playLoopSound();
    } catch (e) {
      this.log(`Error playing ignition: ${e}`, true);
    }
  }

  private playLoopSound(): void {
    try {
      const sceneAny = this.sceneObject as any;
      sceneAny.playSound(this.loopSoundName, true);
      this.log(`Playing loop: ${this.loopSoundName} ✅`);
    } catch (e) {
      this.log(`Error playing loop: ${e}`, true);
    }
  }

  private log(msg: string, isError: boolean = false): void {
    if (!this.debugLog && !isError) return;
    const prefix = isError ? "🔴 SaberAudio" : "🔊 SaberAudio";
    print(`${prefix}: ${msg}`);
  }
}