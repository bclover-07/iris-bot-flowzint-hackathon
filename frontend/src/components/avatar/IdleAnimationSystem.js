'use strict';

const IDLE_POSE_CYCLE = [
  null,
  'IdleWeightShiftLeft',
  null,
  'IdleWeightShiftRight',
  null,
  'IdleShoulderAdjust',
  null,
  'IdleNeckStretch',
  null,
  'IdleFingerFidget',
  null,
  'IdleLookAway',
  null,
  'IdleArmCross',
  null,
  'IdleHandsBehindBack',
  null,
  'IdleHandsOnHips',
  null,
  'IdleSway',
];

export class IdleAnimationSystem {
  constructor() {
    this.enabled = true;
    this.breathingEnabled = true;
    this.idlePoseEnabled = true;
    this.microMovementsEnabled = true;

    this.breathPhase = 0;

    this.idlePoseTimer = 0;
    this.idlePoseInterval = 12 + Math.random() * 8;
    this.idlePoseCycleIndex = 0;
    this.currentIdlePose = null;
    this.idlePoseDuration = 0;

    this.headMicroTimer = 0;
    this.headMicroInterval = 3 + Math.random() * 4;
    this.headMicroTargetX = 0;
    this.headMicroTargetZ = 0;
    this.headMicroCurrentX = 0;
    this.headMicroCurrentZ = 0;

    this.gestureEngine = null;
    this.expressionController = null;
    this.isTalking = false;
    this.isDoingGesture = false;

    this._THREE = null;
    this._breathQ = null;
    this._headMicroQ = null;
    this._tempQ = null;
  }

  init(gestureEngine, expressionController) {
    this.gestureEngine = gestureEngine;
    this.expressionController = expressionController;

    if (gestureEngine && gestureEngine.THREE) {
      this._THREE = gestureEngine.THREE;
      const Q = this._THREE.Quaternion;
      this._breathQ = new Q();
      this._headMicroQ = new Q();
      this._tempQ = new Q();
    }
  }

  setTalking(talking) {
    this.isTalking = talking;
    if (talking) {
      this.currentIdlePose = null;
    }
  }

  setDoingGesture(doing) {
    this.isDoingGesture = doing;
  }

  update(delta, time) {
    if (!this.enabled || !this._THREE) return;

    if (this.breathingEnabled) {
      this._updateBreathing(delta, time);
    }

    if (!this.isTalking && !this.isDoingGesture) {
      if (this.idlePoseEnabled) {
        this._updateIdlePose(delta, time);
      }
      if (this.microMovementsEnabled) {
        this._updateHeadMicroMovements(delta, time);
      }
    }
  }

  _updateBreathing(delta, time) {
    this.breathPhase = time * 1.5;
    const breathVal = Math.sin(this.breathPhase);

    if (this.gestureEngine) {
      const V = this._THREE.Vector3;

      const chestNode = this.gestureEngine.boneNodes.chest;
      if (chestNode) {
        const breathAngle = breathVal * 0.012;
        this._breathQ.setFromAxisAngle(new V(1, 0, 0), breathAngle);
        this._tempQ.copy(chestNode.quaternion);
        chestNode.quaternion.copy(this._tempQ).multiply(this._breathQ);
        chestNode.quaternion.normalize();
      }

      const upperChestNode = this.gestureEngine.boneNodes.upperChest;
      if (upperChestNode) {
        const breathAngle2 = breathVal * 0.008;
        this._breathQ.setFromAxisAngle(new V(1, 0, 0), breathAngle2);
        this._tempQ.copy(upperChestNode.quaternion);
        upperChestNode.quaternion.copy(this._tempQ).multiply(this._breathQ);
        upperChestNode.quaternion.normalize();
      }
    }
  }

  _updateIdlePose(delta, time) {
    this.idlePoseTimer += delta;

    if (this.currentIdlePose) {
      this.idlePoseDuration -= delta;
      if (this.idlePoseDuration <= 0) {
        this.currentIdlePose = null;
        if (this.gestureEngine && !this.gestureEngine.isGestureActive()) {
          this.gestureEngine.setGesture(null);
        }
      }
    }

    if (this.idlePoseTimer >= this.idlePoseInterval && !this.currentIdlePose) {
      this.idlePoseTimer = 0;
      this.idlePoseInterval = 10 + Math.random() * 10;

      const nextPose = IDLE_POSE_CYCLE[this.idlePoseCycleIndex % IDLE_POSE_CYCLE.length];
      this.idlePoseCycleIndex++;

      if (nextPose && this.gestureEngine && !this.gestureEngine.isGestureActive()) {
        this.currentIdlePose = nextPose;
        this.idlePoseDuration = 3 + Math.random() * 3;
        this.gestureEngine.setGesture(nextPose);
      }
    }
  }

  _updateHeadMicroMovements(delta, time) {
    this.headMicroTimer += delta;

    if (this.headMicroTimer >= this.headMicroInterval) {
      this.headMicroTimer = 0;
      this.headMicroInterval = 3 + Math.random() * 5;

      this.headMicroTargetX = (Math.random() - 0.5) * 0.06;
      this.headMicroTargetZ = (Math.random() - 0.5) * 0.05;
    }

    const headLerp = Math.min(1, 2 * delta);
    this.headMicroCurrentX += (this.headMicroTargetX - this.headMicroCurrentX) * headLerp;
    this.headMicroCurrentZ += (this.headMicroTargetZ - this.headMicroCurrentZ) * headLerp;

    if (this.gestureEngine) {
      const headNode = this.gestureEngine.boneNodes.head;
      if (headNode && !this.isTalking) {
        const V = this._THREE.Vector3;
        this._headMicroQ.setFromAxisAngle(new V(1, 0, 0), this.headMicroCurrentX * 0.15);
        const zQ = this._tempQ.setFromAxisAngle(new V(0, 0, 1), this.headMicroCurrentZ * 0.15);
        this._headMicroQ.multiply(zQ);

        const baseQ = this._tempQ.copy(headNode.quaternion);
        headNode.quaternion.copy(baseQ).multiply(this._headMicroQ);
        headNode.quaternion.normalize();
      }
    }
  }

  reset() {
    this.idlePoseTimer = 0;
    this.idlePoseCycleIndex = 0;
    this.currentIdlePose = null;
    this.headMicroTimer = 0;
    this.headMicroCurrentX = 0;
    this.headMicroCurrentZ = 0;
  }
}
