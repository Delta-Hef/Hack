const MotionControllerModule = require('LensStudio:MotionControllerModule');
let options = MotionController.Options.create();
options.motionType = MotionController.MotionType.SixDoF;
const motionController = MotionControllerModule.getController(options);

const sceneObject = script.getSceneObject();
const transform = sceneObject.getTransform();

motionController.onTransformEvent.add((worldPosition, worldRotation) => {
  transform.setWorldPosition(worldPosition);
  transform.setWorldRotation(worldRotation);
});