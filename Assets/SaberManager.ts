// === SaberManager.ts ===
// Unified script for saber selection + motion controller + color changing

import { Slider } from 'SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider';
import { RoundButton } from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/RoundButton';

const MotionControllerModule = require('LensStudio:MotionControllerModule');

@component
export class SaberManager extends BaseScriptComponent {
  // === Saber References ===
  @input("SceneObject")
  motionSaber: SceneObject | undefined;

  @input("SceneObject[]")
  colorSabers: SceneObject[] = [];

  @input
  debugLog: boolean = true;

  // === Internal State ===
  private motionController: any = null;
  private currentControlledSaber: SceneObject | null = null;
  private motionTransform: any = null; // Pour tracker la dernière position
  
  // Public pour que ColorSpectrumSlider puisse le lire
  public selectedSaberIndex: number = 0;

  onAwake(): void {
    this.log("SaberManager initializing...");

    // 1) Setup motion controller
    this.setupMotionController();

    // 2) Setup saber selection UI (find RoundButtons automatically)
    this.setupSaberSelection();

    this.log("SaberManager ready! ✅");
  }

  // ============================================================
  // MOTION CONTROLLER SETUP
  // ============================================================

  private setupMotionController(): void {
    if (!this.motionSaber) {
      this.log("motionSaber not assigned in Inspector!", true);
      return;
    }

    try {
      const options = MotionController.Options.create();
      options.motionType = MotionController.MotionType.SixDoF;
      this.motionController = MotionControllerModule.getController(options);

      // Le motion controller update TOUJOURS le motionSaber
      const motionTransform = this.motionSaber.getTransform();
      this.motionTransform = motionTransform;
      
      this.motionController.onTransformEvent.add((worldPosition: vec3, worldRotation: quat) => {
        motionTransform.setWorldPosition(worldPosition);
        motionTransform.setWorldRotation(worldRotation);

        // ET on copie aussi au saber sélectionné
        if (this.currentControlledSaber && this.currentControlledSaber !== this.motionSaber) {
          const selectedTransform = this.currentControlledSaber.getTransform();
          selectedTransform.setWorldPosition(worldPosition);
          selectedTransform.setWorldRotation(worldRotation);
        }
      });

      this.log("Motion controller setup ✅");
      this.currentControlledSaber = this.motionSaber;
    } catch (e) {
      this.log("Error setting up motion controller: " + e, true);
    }
  }



  // ============================================================
  // SABER SELECTION SETUP - Find RoundButtons as direct children
  // ============================================================

  private setupSaberSelection(): void {
    const childCount = this.sceneObject.getChildrenCount();
    this.log(`Searching ${childCount} children for RoundButtons...`);

    for (let i = 0; i < childCount; i++) {
      const child = this.sceneObject.getChild(i);
      
      // Get RoundButton component
      const btn = child.getComponent(RoundButton.getTypeName()) as any;
      if (btn) {
        this.log(`Found RoundButton: "${child.name}" - Index ${i} ✅`);
        // Store button index on the button itself for callback access
        (btn as any).saberIndex = i;
      }
    }

    this.log(`Setup complete - buttons ready for callbacks`);
  }

  // Call these functions from the Button's Inspector callbacks
  public onButton0Triggered(): void {
    this.log("Button 0 callback triggered!");
    this.selectSaber(0);
  }

  public onButton1Triggered(): void {
    this.log("Button 1 callback triggered!");
    this.selectSaber(1);
  }

  public onButton2Triggered(): void {
    this.log("Button 2 callback triggered!");
    this.selectSaber(2);
  }

  public onButton3Triggered(): void {
    this.log("Button 3 callback triggered!");
    this.selectSaber(3);
  }

  public onButton4Triggered(): void {
    this.log("Button 4 callback triggered!");
    this.selectSaber(4);
  }

  // ============================================================
  // SABER SELECTION & MOTION CONTROLLER SWITCHING
  // ============================================================

  private selectSaber(index: number): void {
    this.selectedSaberIndex = index;
    this.log(`Selecting saber ${index}...`);

    // Disable all sabers first
    if (this.motionSaber) {
      this.motionSaber.enabled = false;
    }
    for (let i = 0; i < this.colorSabers.length; i++) {
      this.colorSabers[i].enabled = false;
    }

    // Enable only the selected saber
    let targetSaber: SceneObject | null = null;

    if (index === 0) {
      targetSaber = this.motionSaber || null;
    } else if (index > 0 && index <= this.colorSabers.length) {
      targetSaber = this.colorSabers[index - 1];
    }

    if (targetSaber) {
      targetSaber.enabled = true;
      this.currentControlledSaber = targetSaber;
      this.log(`Saber ${index} enabled ✅`);
    } else {
      this.log(`Invalid saber index: ${index}`, true);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private log(msg: string, isError: boolean = false): void {
    if (!this.debugLog && !isError) return;
    const prefix = isError ? "🔴 SaberManager" : "🟢 SaberManager";
    print(`${prefix}: ${msg}`);
  }
}