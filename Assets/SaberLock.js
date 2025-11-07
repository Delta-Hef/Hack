// // Lock the saber to an anchor and allow external reset via api.resetToAnchor(worldPos, worldRot)
// // @input SceneObject anchorObject     // optional: anchor (if empty uses script.sceneObject)
// // @input SceneObject targetObject     // required: the saber (child of the anchor)
// // @input bool autoLock = true
// // @input float smoothing = 0.0
// // @input bool log = true

// (function() {
//     if (script.log) print("[SaberLock] init");

//     script.anchor = script.anchorObject ? script.anchorObject.getTransform() : script.sceneObject.getTransform();
//     if (!script.targetObject) {
//         if (script.log) print("[SaberLock] ERROR: assign targetObject (the saber) in Inspector.");
//         return;
//     }

//     var childT = script.targetObject.getTransform();
//     var savedLocalPos = childT.getLocalPosition();
//     var savedLocalRot = childT.getLocalRotation();

//     var smoothing = Math.max(0, Math.min(0.9, script.smoothing ? script.smoothing : 0.0));
//     var alpha = smoothing;

//     script._locked = false;
//     script.api.lock = function() { script._locked = true; if (script.log) print("[SaberLock] locked"); };
//     script.api.unlock = function() { script._locked = false; if (script.log) print("[SaberLock] unlocked"); };
//     script.api.toggle = function() { script._locked = !script._locked; if (script.log) print("[SaberLock] toggled locked=" + script._locked); };

//     // external reset API: snap anchor to given world pose and restore child's saved local pose
//     script.api.resetToAnchor = function(worldPos, worldRot) {
//         try {
//             if (!script.anchor) {
//                 if (script.log) print("[SaberLock] resetToAnchor: no anchor.");
//                 return;
//             }
//             if (!worldPos || !worldRot) {
//                 if (script.log) print("[SaberLock] resetToAnchor: invalid pose.");
//                 return;
//             }
//             // Basic shape checks (vec3/quaternion objects)
//             // Accept either {x,y,z} and {x,y,z,w} or Lens Studio vec3/quat types.
//             script.anchor.setWorldPosition(worldPos);
//             script.anchor.setWorldRotation(worldRot);
//             // restore child's saved local pose instantly
//             childT.setLocalPosition(savedLocalPos);
//             childT.setLocalRotation(savedLocalRot);
//             script.api.lock();
//             if (script.log) print("[SaberLock] resetToAnchor called & locked");
//         } catch (e) {
//             print("[SaberLock] ERROR in resetToAnchor: " + e);
//         }
//     };

//     // auto lock when visible
//     function tryAutoLock() {
//         if (script.autoLock && !script._locked && script.targetObject.enabled) {
//             script.api.lock();
//         }
//     }

//     var updateEvent = script.createEvent("UpdateEvent");
//     updateEvent.bind(function() {
//         tryAutoLock();
//         if (!script._locked) return;
//         // enforce saved local pose while locked
//         try {
//             if (alpha <= 0) {
//                 childT.setLocalPosition(savedLocalPos);
//                 childT.setLocalRotation(savedLocalRot);
//             } else {
//                 var curPos = childT.getLocalPosition();
//                 var curRot = childT.getLocalRotation();
//                 var pos = vec3.lerp(curPos, savedLocalPos, alpha);
//                 var rot = quat.slerp(curRot, savedLocalRot, alpha);
//                 childT.setLocalPosition(pos);
//                 childT.setLocalRotation(rot);
//             }
//         } catch (e) {
//             print("[SaberLock] ERROR enforcing local pose: " + e);
//         }
//     });

//     if (script.log) print("[SaberLock] ready (autoLock=" + !!script.autoLock + ", smoothing=" + smoothing + ")");
// })();



//@input Component.DeviceTracking deviceTracking

const saber = script.getSceneObject();
const saberTransform = saber.getTransform();

// Adjust how far/where the saber sits relative to the phone
// z = forward, x = left/right, y = up/down (in centimeters)
const offset = new vec3(0, -5, -20);

function onUpdate() {
    if (!script.deviceTracking) return;

    // Get camera transform from DeviceTracking
    const deviceTransform = script.deviceTracking.getTransform();
    const camPos = deviceTransform.getWorldPosition();
    const camRot = deviceTransform.getWorldRotation();

    // Offset the saber in front of the camera
    const finalPos = camPos.add(camRot.multiplyVec3(offset));

    // Apply position and rotation
    saberTransform.setWorldPosition(finalPos);
    saberTransform.setWorldRotation(camRot);
}

script.createEvent("UpdateEvent").bind(onUpdate);
