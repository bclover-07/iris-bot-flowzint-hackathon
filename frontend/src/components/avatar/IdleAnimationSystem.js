'use strict';

const IDLE_POSE_CYCLE = [
  'IdleWeightShiftLeft',
  'IdleWeightShiftRight',
  'IdleShoulderAdjust',
  'IdleNeckStretch',
  'IdleFingerFidget',
  'IdleLookAway',
  'HandOnHipLeft',
  'HandsInFront',
  'IdleSway',
  'HairTuck',
  'HandOnHipRight',
  'HandsBehindBack',
  'ShoulderRoll',
  'IdleArmCross',
  'IdleBreathing',
];

const TALKING_GESTURE_CYCLE = [
  'TalkNeutral',
  'TalkExcited',
  'TalkCalm',
  'TalkEmphatic',
  'TalkExplain',
  'TalkList',
  'TalkConclude',
  'TalkAgree',
  'Explain',
];

export class IdleAnimationSystem {
  constructor() {
    this.enabled = true;
    this.idlePoseEnabled = true;
    this.microMovementsEnabled = true;

    this.idlePoseTimer = 0;
    this.idlePoseInterval = 3 + Math.random() * 4; // Much faster idle shifting
    this.idlePoseCycleIndex = 0;
    this.currentIdlePose = null;
    this.idlePoseDuration = 0;

    this.talkingPoseTimer = 0;
    this.talkingPoseInterval = 2 + Math.random() * 3;

    this.headMicroTimer = 0;
    this.headMicroInterval = 2 + Math.random() * 3;
    this.headMicroTargetX = 0;
    this.headMicroTargetZ = 0;
    this.headMicroCurrentX = 0;
    this.headMicroCurrentZ = 0;

    this.gestureEngine = null;
    this.expressionController = null;
    this.isTalking = false;
    this.isDoingGesture = false;

    this._THREE = null;
    this._headMicroQ = null;
    this._tempQ = null;
  }

  init(gestureEngine, expressionController) {
    this.gestureEngine = gestureEngine;
    this.expressionController = expressionController;

    if (gestureEngine && gestureEngine.THREE) {
      this._THREE = gestureEngine.THREE;
      const Q = this._THREE.Quaternion;
      this._headMicroQ = new Q();
      this._tempQ = new Q();
    }
  }

  setTalking(talking) {
    this.isTalking = talking;
    if (talking) {
      this.currentIdlePose = null;
      this.talkingPoseTimer = this.talkingPoseInterval; // Trigger immediately
    } else {
      if (this.gestureEngine) this.gestureEngine.setGesture('IdleBreathing');
    }
  }

  setDoingGesture(doing) {
    this.isDoingGesture = doing;
  }

  update(delta, time) {
    if (!this.enabled || !this._THREE) return;

    if (this.isTalking) {
       this._updateTalkingPose(delta, time);
    } else if (!this.isDoingGesture) {
      if (this.idlePoseEnabled) {
        this._updateIdlePose(delta, time);
      }
    }
    
    // Always do micro movements
    if (this.microMovementsEnabled) {
      this._updateHeadMicroMovements(delta, time);
    }
  }

  _updateTalkingPose(delta, time) {
    this.talkingPoseTimer += delta;
    if (this.talkingPoseTimer >= this.talkingPoseInterval) {
      this.talkingPoseTimer = 0;
      this.talkingPoseInterval = 3 + Math.random() * 4;
      
      if (this.gestureEngine && !this.gestureEngine.isGestureActive() && this.gestureEngine.gestureQueue.length === 0) {
        const randomGesture = TALKING_GESTURE_CYCLE[Math.floor(Math.random() * TALKING_GESTURE_CYCLE.length)];
        this.gestureEngine.setGesture(randomGesture);
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
          this.gestureEngine.setGesture('IdleBreathing'); // Fallback to breathing
        }
      }
    }

    if (this.idlePoseTimer >= this.idlePoseInterval && !this.currentIdlePose) {
      this.idlePoseTimer = 0;
      this.idlePoseInterval = 4 + Math.random() * 5;

      const nextPose = IDLE_POSE_CYCLE[this.idlePoseCycleIndex % IDLE_POSE_CYCLE.length];
      this.idlePoseCycleIndex++;

      if (nextPose && this.gestureEngine && !this.gestureEngine.isGestureActive()) {
        this.currentIdlePose = nextPose;
        this.idlePoseDuration = 4 + Math.random() * 3;
        this.gestureEngine.setGesture(nextPose);
      }
    }
  }

  _updateHeadMicroMovements(delta, time) {
    this.headMicroTimer += delta;

    if (this.headMicroTimer >= this.headMicroInterval) {
      this.headMicroTimer = 0;
      this.headMicroInterval = 1.5 + Math.random() * 3;

      // More pronounced micro-movements
      this.headMicroTargetX = (Math.random() - 0.5) * 0.15;
      this.headMicroTargetZ = (Math.random() - 0.5) * 0.12;
    }

    const headLerp = Math.min(1, 3 * delta);
    this.headMicroCurrentX += (this.headMicroTargetX - this.headMicroCurrentX) * headLerp;
    this.headMicroCurrentZ += (this.headMicroTargetZ - this.headMicroCurrentZ) * headLerp;

    if (this.gestureEngine) {
      const headNode = this.gestureEngine.boneNodes.head;
      if (headNode) {
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
    this.talkingPoseTimer = 0;
  }
}
