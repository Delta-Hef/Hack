// === LightColorSlider.ts ===
// Changes the color of Material on selected saber using mainPass

import { Slider } from 'SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider';
import { SaberManager } from './SaberManager';

@component
export class LightColorSlider extends BaseScriptComponent {
  @input("SceneObject")
  saberManagerObject: SceneObject | undefined;

  @input("SceneObject")
  motionSaber: SceneObject | undefined;

  @input("SceneObject[]")
  colorSabers: SceneObject[] = [];

  @input
  debugLog: boolean = true;

  private slider: Slider | null = null;
  private saberManager: any = null;

  onAwake(): void {
    // Get SaberManager component
    if (this.saberManagerObject) {
      this.saberManager = this.saberManagerObject.getComponent(
        SaberManager.getTypeName()
      ) as any;
      if (!this.saberManager) {
        this.log("SaberManager component not found!", true);
      } else {
        this.log("SaberManager component found ✅");
      }
    }

    // 1) Get Slider component on this object
    const comp = this.sceneObject.getComponent(
      Slider.getTypeName()
    ) as unknown as Slider | null;

    if (!comp) {
      this.log("No UI Kit Slider found on this SceneObject.", true);
      return;
    }

    this.slider = comp;
    this.log("Slider component found ✅");

    // 2) Ensure slider is initialized
    const anySlider = this.slider as any;
    try {
      anySlider.initialize && anySlider.initialize();
      this.log("Slider initialized.");
    } catch (e) {
      this.log("Error calling slider.initialize(): " + e, true);
    }

    // 3) Subscribe to slider events
    let hooked = false;

    if (anySlider.onValueChange && anySlider.onValueChange.add) {
      anySlider.onValueChange.add((value: number) => {
        this.log(`onValueChange -> ${value}`);
        this.updateColor(value);
      });
      hooked = true;
    }

    if (!hooked && anySlider.onValueUpdate && anySlider.onValueUpdate.add) {
      anySlider.onValueUpdate.add((value: number) => {
        this.log(`onValueUpdate -> ${value}`);
        this.updateColor(value);
      });
      hooked = true;
    }

    if (!hooked) {
      this.log("Slider has no onValueChange/onValueUpdate event.", true);
      return;
    }

    this.log("Subscribed to slider value events ✅");

    // 4) Apply initial color
    const initialValue =
      typeof anySlider.value === "number"
        ? anySlider.value
        : (typeof anySlider.defaultValue === "number"
            ? anySlider.defaultValue
            : 0.5);

    this.updateColor(initialValue);
  }

  // === Core: slider value [0..1] → HSV spectrum → material color ===

  private updateColor(rawValue: number): void {
    const t = this.clamp01(rawValue);
    const color = this.hsvToRgb(t, 1.0, 1.0);

    // Get selected saber index from SaberManager
    const selectedIndex = this.saberManager?.selectedSaberIndex ?? 0;
    this.log(`Selected saber index: ${selectedIndex}`);

    // Get target saber
    let targetSaber: SceneObject | null = null;

    if (selectedIndex === 0) {
      targetSaber = this.motionSaber || null;
    } else if (selectedIndex > 0 && selectedIndex <= this.colorSabers.length) {
      targetSaber = this.colorSabers[selectedIndex - 1];
    }

    if (!targetSaber) {
      this.log(`No saber at index ${selectedIndex}`, true);
      return;
    }

    this.log(`Updating color on saber: "${targetSaber.name}"`);

    // Find material on saber and update it
    this.updateSaberMaterial(targetSaber, color);
  }

  private updateSaberMaterial(saberObject: SceneObject, color: vec4): void {
    // Change la couleur de TOUS les enfants Saber_X_light
    const childCount = saberObject.getChildrenCount();
    this.log(`Updating ${childCount} saber lights...`);

    let updated = 0;
    for (let i = 0; i < childCount; i++) {
      const child = saberObject.getChild(i);
      this.log(`Processing child: "${child.name}"`);
      
      // Cherche le composant RenderMaterial/RenderMeshVisual
      const comps = ["RenderMaterial", "RenderMeshVisual", "MeshRenderer"];
      
      for (const compName of comps) {
        const renderComp = (child as any).getComponent(compName);
        if (renderComp && renderComp.getMaterial) {
          this.log(`  → Found ${compName} ✅`);
          this.applyColorToMaterial(renderComp, color);
          updated++;
          break;
        }
      }
    }

    if (updated === 0) {
      this.log("Warning: No materials updated!", true);
    } else {
      this.log(`Successfully updated ${updated} materials ✅`);
    }
  }

  private applyColorToMaterial(renderComp: any, color: vec4): void {
    this.log(`applyColorToMaterial called`);
    
    // Essaie Material 0 d'abord
    let material = renderComp.getMaterial(0);
    
    this.log(`getMaterial(0) returned: ${material ? "material found" : "null"}`);
    
    if (!material) {
      this.log("Material 0 not found", true);
      return;
    }

    this.updateMaterialColor(material, color);
  }

  private updateMaterialColor(material: any, color: vec4): void {
    this.log(`updateMaterialColor called`);
    
    const mp = material.mainPass;
    
    this.log(`mainPass: ${mp ? "found" : "null"}`);
    
    if (!mp) {
      this.log("mainPass not found on material", true);
      return;
    }

    this.log(`Attempting to set color...`);
    
    if (mp.baseColor !== undefined) {
      mp.baseColor = color;
      this.logColor("baseColor", color);
    } else if (mp.baseColorTint !== undefined) {
      mp.baseColorTint = color;
      this.logColor("baseColorTint", color);
    } else {
      this.log("No baseColor/baseColorTint on material mainPass.", true);
    }
  }

  // === Helpers ===

  private hsvToRgb(h: number, s: number, v: number): vec4 {
    const hh = (h - Math.floor(h)) * 6.0;
    const c = v * s;
    const x = c * (1.0 - Math.abs((hh % 2.0) - 1.0));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (hh >= 0 && hh < 1) {
      r = c; g = x; b = 0;
    } else if (hh >= 1 && hh < 2) {
      r = x; g = c; b = 0;
    } else if (hh >= 2 && hh < 3) {
      r = 0; g = c; b = x;
    } else if (hh >= 3 && hh < 4) {
      r = 0; g = x; b = c;
    } else if (hh >= 4 && hh < 5) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return new vec4(r + m, g + m, b + m, 1.0);
  }

  private clamp01(v: number): number {
    return v < 0 ? 0 : (v > 1 ? 1 : v);
  }

  private log(msg: string, isError: boolean = false): void {
    if (!this.debugLog && !isError) return;
    const prefix = "LightColorSlider";
    if (isError) {
      print(`${prefix} ❌ ${msg}`);
    } else {
      print(`${prefix} ▶ ${msg}`);
    }
  }

  private logColor(prop: string, c: vec4): void {
    if (!this.debugLog) return;
    print(
      `LightColorSlider 🎨 ${prop}=(${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)}, ${c.w.toFixed(2)}) ✅`
    );
  }
}