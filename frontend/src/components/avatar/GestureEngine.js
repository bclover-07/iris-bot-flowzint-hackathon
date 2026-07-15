'use strict';

const GESTURE_CATEGORIES = {
  CONVERSATIONAL: 'conversational',
  EMOTIONAL: 'emotional',
  INTERACTION: 'interaction',
  IDLE: 'idle',
  TALKING: 'talking',
};

const BONE_LIMITS = {
  head:          { minX: -0.35, maxX: 0.35, minY: -0.45, maxY: 0.45, minZ: -0.25, maxZ: 0.25 },
  neck:          { minX: -0.25, maxX: 0.25, minY: -0.35, maxY: 0.35, minZ: -0.15, maxZ: 0.15 },
  spine:         { minX: -0.15, maxX: 0.15, minY: -0.10, maxY: 0.10, minZ: -0.08, maxZ: 0.08 },
  chest:         { minX: -0.12, maxX: 0.12, minY: -0.08, maxY: 0.08, minZ: -0.06, maxZ: 0.06 },
  upperChest:    { minX: -0.10, maxX: 0.10, minY: -0.06, maxY: 0.06, minZ: -0.05, maxZ: 0.05 },
  leftUpperArm:  { minX: -0.8,  maxX: 1.2,  minY: -0.6,  maxY: 0.6,  minZ: -1.8,  maxZ: 0.5 },
  rightUpperArm: { minX: -0.8,  maxX: 1.2,  minY: -0.6,  maxY: 0.6,  minZ: -0.5,  maxZ: 1.8 },
  leftLowerArm:  { minX: -0.1,  maxX: 0.1,  minY: -0.1,  maxY: 2.6,  minZ: -0.1,  maxZ: 0.1 },
  rightLowerArm: { minX: -0.1,  maxX: 0.1,  minY: -2.6,  maxY: 0.1,  minZ: -0.1,  maxZ: 0.1 },
  leftHand:      { minX: -0.6,  maxX: 0.6,  minY: -0.4,  maxY: 0.4,  minZ: -0.8,  maxZ: 0.8 },
  rightHand:     { minX: -0.6,  maxX: 0.6,  minY: -0.4,  maxY: 0.4,  minZ: -0.8,  maxZ: 0.8 },
  hips:          { minX: -0.08, maxX: 0.08, minY: -0.06, maxY: 0.06, minZ: -0.05, maxZ: 0.05 },
};

function createGestureDefinitions() {
  return {
    PalmUpOpen: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.8,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.65 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.9 },
        rightHand:     { axis: [1, 0, 0], angle: -0.35 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.65 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.9 },
        leftHand:      { axis: [1, 0, 0], angle: -0.35 },
      },
      oscillation: {
        rightUpperArm: { axis: [1, 0, 0], amplitude: 0.04, frequency: 1.8 },
        leftUpperArm:  { axis: [1, 0, 0], amplitude: 0.04, frequency: 1.6 },
      },
    },

    PalmDown: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.5,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.55 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.7 },
        rightHand:     { axis: [1, 0, 0], angle: 0.3 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.55 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.7 },
        leftHand:      { axis: [1, 0, 0], angle: 0.3 },
      },
    },

    PointForward: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 2.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.3 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.2 },
        rightHand:     { axis: [0, 0, 1], angle: 0.0 },
      },
      fingers: {
        rightIndexProximal:       { axis: [1, 0, 0], angle: 0.0 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 1.2 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.2 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.2 },
        rightThumbProximal:       { axis: [0, 0, 1], angle: 0.4 },
        rightMiddleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
        rightRingIntermediate:    { axis: [1, 0, 0], angle: 1.0 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    CountOne: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.5,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.45 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [1, 0, 0], angle: -0.1 },
      },
      fingers: {
        rightIndexProximal:       { axis: [1, 0, 0], angle: 0.0 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.3 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightThumbProximal:       { axis: [0, 0, 1], angle: 0.5 },
        rightMiddleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
        rightRingIntermediate:    { axis: [1, 0, 0], angle: 1.0 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    CountTwo: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.5,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.45 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [1, 0, 0], angle: -0.1 },
      },
      fingers: {
        rightIndexProximal:       { axis: [1, 0, 0], angle: 0.0 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 0.0 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.3 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightThumbProximal:       { axis: [0, 0, 1], angle: 0.5 },
        rightRingIntermediate:    { axis: [1, 0, 0], angle: 1.0 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    CountThree: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.5,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.45 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [1, 0, 0], angle: -0.1 },
      },
      fingers: {
        rightIndexProximal:       { axis: [1, 0, 0], angle: 0.0 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 0.0 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 0.0 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightThumbProximal:       { axis: [0, 0, 1], angle: 0.5 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    ChopMotion: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.2,
      transitionSpeed: 10,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.1 },
        rightHand:     { axis: [1, 0, 0], angle: 0.0 },
      },
      oscillation: {
        rightHand: { axis: [1, 0, 0], amplitude: 0.3, frequency: 5.0 },
      },
    },

    HandsClasp: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 3.0,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.85 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.4 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.85 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.4 },
        rightHand:     { axis: [0, 1, 0], angle: -0.2 },
        leftHand:      { axis: [0, 1, 0], angle: 0.2 },
      },
    },

    ArmSweep: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 2.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.2 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.6 },
        rightHand:     { axis: [1, 0, 0], angle: -0.2 },
      },
      oscillation: {
        rightUpperArm: { axis: [0, 1, 0], amplitude: 0.25, frequency: 1.2 },
      },
    },

    ChinTap: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 2.5,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.6 },
        rightLowerArm: { axis: [0, 1, 0], angle: -2.1 },
        rightHand:     { axis: [1, 0, 0], angle: -0.15 },
        head:          { axis: [0, 1, 0], angle: 0.12 },
      },
      fingers: {
        rightIndexProximal: { axis: [1, 0, 0], angle: 0.3 },
        rightThumbProximal: { axis: [0, 0, 1], angle: 0.3 },
      },
    },

    PresentBothHands: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 3.5,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { euler: [0, 0.4, 0.8] },
        rightLowerArm: { euler: [0, -1.0, 0] },
        rightHand:     { euler: [-1.2, 0, 0] },
        leftUpperArm:  { euler: [0, -0.4, -0.8] },
        leftLowerArm:  { euler: [0, 1.0, 0] },
        leftHand:      { euler: [1.2, 0, 0] },
        spine:         { euler: [0.05, 0, 0] },
        chest:         { euler: [0.02, 0, 0] },
      }
    },


    HoldVirtualObject: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 2.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.65 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.3 },
        rightHand:     { axis: [1, 0, 0], angle: 0.2 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.65 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.3 },
        leftHand:      { axis: [1, 0, 0], angle: 0.2 },
      },
      fingers: {
        rightIndexProximal:  { axis: [1, 0, 0], angle: 0.5 },
        rightMiddleProximal: { axis: [1, 0, 0], angle: 0.5 },
        rightRingProximal:   { axis: [1, 0, 0], angle: 0.5 },
        leftIndexProximal:   { axis: [1, 0, 0], angle: 0.5 },
        leftMiddleProximal:  { axis: [1, 0, 0], angle: 0.5 },
        leftRingProximal:    { axis: [1, 0, 0], angle: 0.5 },
      },
    },

    WritingMotion: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 2.5,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.7 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.5 },
        rightHand:     { axis: [1, 0, 0], angle: 0.25 },
      },
      fingers: {
        rightIndexProximal: { axis: [1, 0, 0], angle: 0.5 },
        rightThumbProximal: { axis: [0, 0, 1], angle: 0.3 },
      },
      oscillation: {
        rightHand: { axis: [0, 0, 1], amplitude: 0.12, frequency: 4.0 },
      },
    },

    OpenFolder: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 1.8,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.1 },
        rightHand:     { axis: [1, 0, 0], angle: -0.5 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.5 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.1 },
        leftHand:      { axis: [1, 0, 0], angle: 0.1 },
      },
    },

    HandOverHeart: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.5,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.8 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.8 },
        rightHand:     { axis: [1, 0, 0], angle: 0.1 },
        head:          { axis: [1, 0, 0], angle: 0.08 },
      },
    },

    ThumbsUp: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [0, 0, 1], angle: 0.1 },
      },
      fingers: {
        rightThumbProximal:       { axis: [0, 0, 1], angle: -0.3 },
        rightIndexProximal:       { axis: [1, 0, 0], angle: 1.3 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.3 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightIndexIntermediate:   { axis: [1, 0, 0], angle: 1.0 },
        rightMiddleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
        rightRingIntermediate:    { axis: [1, 0, 0], angle: 1.0 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    Shrug: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.0,
      transitionSpeed: 7,
      bones: {
        leftShoulder:  { axis: [0, 0, 1], angle: -0.2 },
        rightShoulder: { axis: [0, 0, 1], angle: 0.2 },
        rightUpperArm: { axis: [0, 0, 1], angle: 0.6 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.0 },
        rightHand:     { axis: [1, 0, 0], angle: -0.3 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.6 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.0 },
        leftHand:      { axis: [1, 0, 0], angle: -0.3 },
        head:          { axis: [0, 0, 1], angle: 0.1 },
      },
    },

    SlowNod: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.0,
      transitionSpeed: 5,
      bones: {
        head: { axis: [1, 0, 0], angle: 0.0 },
        neck: { axis: [1, 0, 0], angle: 0.0 },
      },
      oscillation: {
        head: { axis: [1, 0, 0], amplitude: 0.15, frequency: 2.0 },
        neck: { axis: [1, 0, 0], amplitude: 0.05, frequency: 2.0 },
      },
    },

    HeadTilt: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.5,
      transitionSpeed: 5,
      bones: {
        head: { axis: [0, 0, 1], angle: 0.18 },
        neck: { axis: [0, 0, 1], angle: 0.06 },
      },
    },

    HeadShake: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 1.8,
      transitionSpeed: 7,
      bones: {
        head: { axis: [0, 1, 0], angle: 0.0 },
      },
      oscillation: {
        head: { axis: [0, 1, 0], amplitude: 0.2, frequency: 4.5 },
      },
    },

    Clapping: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 3.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.6 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.5 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.6 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.5 },
      },
      oscillation: {
        rightLowerArm: { axis: [0, 1, 0], amplitude: 0.25, frequency: 5.5 },
        leftLowerArm:  { axis: [0, 1, 0], amplitude: -0.25, frequency: 5.5 },
      },
    },

    WipeBrow: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.0,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.35 },
        rightLowerArm: { axis: [0, 1, 0], angle: -2.2 },
        rightHand:     { axis: [1, 0, 0], angle: -0.2 },
        head:          { axis: [0, 0, 1], angle: -0.05 },
      },
    },

    ThumbsDown: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.0,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.3 },
        rightHand:     { axis: [0, 0, 1], angle: 3.14 },
      },
      fingers: {
        rightThumbProximal:       { axis: [0, 0, 1], angle: -0.3 },
        rightIndexProximal:       { axis: [1, 0, 0], angle: 1.3 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.3 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
      },
    },

    PeaceSign: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 2.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.45 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [0, 0, 1], angle: 0.0 },
      },
      fingers: {
        rightIndexProximal:       { axis: [1, 0, 0], angle: 0.0 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 0.0 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.3 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightThumbProximal:       { axis: [0, 0, 1], angle: 0.5 },
        rightRingIntermediate:    { axis: [1, 0, 0], angle: 1.0 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    WaveHello: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.5,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.3 },
        rightLowerArm: { axis: [0, 1, 0], angle: -2.0 },
      },
      oscillation: {
        rightHand: { axis: [0, 0, 1], amplitude: 0.6, frequency: 8.0 },
      },
    },

    WaveGoodbye: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 3.0,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.25 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.8 },
      },
      oscillation: {
        rightHand: { axis: [0, 0, 1], amplitude: 0.5, frequency: 5.0 },
      },
    },

    Beckon: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.0,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.55 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.4 },
        rightHand:     { axis: [1, 0, 0], angle: -0.2 },
      },
      fingers: {
        rightIndexProximal: { axis: [1, 0, 0], angle: 0.0 },
      },
      oscillation: {
        rightHand: { axis: [1, 0, 0], amplitude: 0.35, frequency: 3.5 },
      },
    },

    StopHalt: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.0,
      transitionSpeed: 9,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.2 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [1, 0, 0], angle: -0.5 },
      },
    },

    AfterYou: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.8 },
        rightHand:     { axis: [1, 0, 0], angle: -0.4 },
        chest:         { axis: [0, 1, 0], angle: 0.06 },
        head:          { axis: [1, 0, 0], angle: 0.08 },
      },
    },

    CheckWatch: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.0,
      transitionSpeed: 7,
      bones: {
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.7 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.8 },
        leftHand:      { axis: [1, 0, 0], angle: -0.3 },
        head:          { axis: [1, 0, 0], angle: 0.2 },
        neck:          { axis: [1, 0, 0], angle: 0.08 },
      },
    },

    AdjustLapel: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 1.8,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.85 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [0, 1, 0], angle: -0.15 },
      },
    },

    EarTouch: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.3 },
        rightLowerArm: { axis: [0, 1, 0], angle: -2.3 },
        rightHand:     { axis: [1, 0, 0], angle: 0.0 },
        head:          { axis: [0, 0, 1], angle: -0.08 },
      },
    },

    LeanForward: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.5,
      transitionSpeed: 4,
      bones: {
        spine:      { axis: [1, 0, 0], angle: 0.08 },
        chest:      { axis: [1, 0, 0], angle: 0.06 },
        upperChest: { axis: [1, 0, 0], angle: 0.04 },
      },
    },

    HoldOnFinger: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 2.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        rightHand:     { axis: [0, 0, 1], angle: 0.05 },
      },
      fingers: {
        rightIndexProximal:       { axis: [1, 0, 0], angle: 0.0 },
        rightMiddleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightRingProximal:        { axis: [1, 0, 0], angle: 1.3 },
        rightLittleProximal:      { axis: [1, 0, 0], angle: 1.3 },
        rightThumbProximal:       { axis: [0, 0, 1], angle: 0.5 },
        rightMiddleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
        rightRingIntermediate:    { axis: [1, 0, 0], angle: 1.0 },
        rightLittleIntermediate:  { axis: [1, 0, 0], angle: 1.0 },
      },
    },

    IdleBreathing: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: Infinity,
      transitionSpeed: 4,
      bones: {},
      oscillation: {
        chest:      { axis: [1, 0, 0], amplitude: 0.012, frequency: 1.5 },
        upperChest: { axis: [1, 0, 0], amplitude: 0.008, frequency: 1.5 },
        leftShoulder:  { axis: [0, 0, 1], amplitude: -0.01, frequency: 1.5 },
        rightShoulder: { axis: [0, 0, 1], amplitude: 0.01, frequency: 1.5 },
      },
    },

    IdleWeightShiftLeft: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 4.0,
      transitionSpeed: 3,
      bones: {
        hips:  { axis: [0, 0, 1], angle: 0.03 },
        spine: { axis: [0, 0, 1], angle: -0.02 },
      },
    },

    IdleWeightShiftRight: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 4.0,
      transitionSpeed: 3,
      bones: {
        hips:  { axis: [0, 0, 1], angle: -0.03 },
        spine: { axis: [0, 0, 1], angle: 0.02 },
      },
    },

    IdleShoulderAdjust: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 2.5,
      transitionSpeed: 4,
      bones: {
        rightShoulder: { axis: [0, 0, 1], angle: 0.08 },
        leftShoulder:  { axis: [0, 0, 1], angle: -0.04 },
      },
    },

    IdleNeckStretch: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 3.0,
      transitionSpeed: 3,
      bones: {
        neck: { axis: [0, 0, 1], angle: 0.12 },
        head: { axis: [0, 0, 1], angle: 0.06 },
      },
    },

    IdleFingerFidget: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 2.0,
      transitionSpeed: 5,
      bones: {},
      fingers: {
        rightIndexProximal:  { axis: [1, 0, 0], angle: 0.3 },
        rightMiddleProximal: { axis: [1, 0, 0], angle: 0.2 },
      },
      oscillation: {
        rightHand: { axis: [0, 0, 1], amplitude: 0.04, frequency: 3.0 },
      },
    },

    IdleLookAway: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 3.0,
      transitionSpeed: 3,
      bones: {
        head: { axis: [0, 1, 0], angle: 0.2 },
        neck: { axis: [0, 1, 0], angle: 0.08 },
      },
    },

    IdleArmCross: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 5.0,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.85 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.6 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.85 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.6 },
        rightHand:     { axis: [1, 0, 0], angle: 0.1 },
        leftHand:      { axis: [1, 0, 0], angle: 0.1 },
      },
    },

    IdleHandsBehindBack: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 5.0,
      transitionSpeed: 4,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 1.3 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.8 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -1.3 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.8 },
      },
    },

    IdleHandsOnHips: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 5.0,
      transitionSpeed: 4,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.95 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.2 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.95 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 1.2 },
      },
    },

    IdleSway: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 6.0,
      transitionSpeed: 3,
      bones: {},
      oscillation: {
        spine: { axis: [0, 0, 1], amplitude: 0.02, frequency: 0.5 },
        head:  { axis: [0, 0, 1], amplitude: 0.015, frequency: 0.6 },
      },
    },

    TalkNeutral: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 3.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.9 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.4 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.9 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.4 },
      },
      oscillation: {
        rightUpperArm: { axis: [1, 0, 0], amplitude: 0.06, frequency: 2.0 },
        leftUpperArm:  { axis: [1, 0, 0], amplitude: 0.06, frequency: 1.8 },
        head:          { axis: [1, 0, 0], amplitude: 0.03, frequency: 2.5 },
      },
    },

    TalkExcited: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 2.5,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.9 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.5 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.9 },
      },
      oscillation: {
        rightUpperArm: { axis: [1, 0, 0], amplitude: 0.12, frequency: 3.0 },
        leftUpperArm:  { axis: [1, 0, 0], amplitude: 0.12, frequency: 2.8 },
        head:          { axis: [1, 0, 0], amplitude: 0.06, frequency: 3.0 },
        chest:         { axis: [1, 0, 0], amplitude: 0.02, frequency: 2.5 },
      },
    },

    TalkCalm: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 3.5,
      transitionSpeed: 4,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 1.0 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.3 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -1.0 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.3 },
      },
      oscillation: {
        rightUpperArm: { axis: [1, 0, 0], amplitude: 0.03, frequency: 1.2 },
        leftUpperArm:  { axis: [1, 0, 0], amplitude: 0.03, frequency: 1.0 },
      },
    },

    TalkEmphatic: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 2.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { euler: [0, 0.2, 0.4] },
        rightLowerArm: { euler: [0, -1.5, 0] },
        rightHand:     { euler: [0, 0, 0] },
        spine:         { euler: [0.08, 0, 0] },
        head:          { euler: [0.05, 0, 0] },
      },
      oscillation: {
        rightLowerArm: { axis: [1, 0, 0], amplitude: 0.15, frequency: 10 },
      }
    },


    TalkExplain: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 3.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { euler: [0, 0.4, 0.6] },
        rightLowerArm: { euler: [0, -1.2, 0] },
        rightHand:     { euler: [-0.3, 0, 0] },
        spine:         { euler: [0.03, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0.1] },
        rightMiddleProximal: { euler: [0, 0, 0.2] },
        rightRingProximal: { euler: [0, 0, 0.3] },
        rightLittleProximal: { euler: [0, 0, 0.4] },
      }
    },


    TalkQuestion: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 3.0,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { euler: [0, 0.3, 0.8] },
        rightLowerArm: { euler: [0, -1.2, 0] },
        rightHand:     { euler: [-1.2, 0, 0] },
        head:          { euler: [0, 0, -0.1] },
        spine:         { euler: [-0.03, 0, 0] },
      }
    },


    TalkList: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 2.5,
      transitionSpeed: 7,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.5 },
        rightLowerArm: { axis: [0, 1, 0], angle: -1.0 },
        rightHand:     { axis: [1, 0, 0], angle: -0.2 },
      },
      oscillation: {
        rightUpperArm: { axis: [1, 0, 0], amplitude: 0.08, frequency: 2.0 },
        rightHand:     { axis: [0, 0, 1], amplitude: 0.1,  frequency: 2.5 },
      },
    },

    TalkConclude: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 2.0,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.65 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.7 },
        rightHand:     { axis: [1, 0, 0], angle: 0.3 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.65 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.7 },
        leftHand:      { axis: [1, 0, 0], angle: 0.3 },
        head:          { axis: [1, 0, 0], angle: 0.06 },
      },
    },

    TalkAgree: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 2.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.85 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.35 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.85 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.35 },
      },
      oscillation: {
        head: { axis: [1, 0, 0], amplitude: 0.12, frequency: 2.5 },
        neck: { axis: [1, 0, 0], amplitude: 0.04, frequency: 2.5 },
      },
    },

    TalkDisagree: {
      category: GESTURE_CATEGORIES.TALKING,
      duration: 2.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { axis: [0, 0, 1], angle: 0.85 },
        rightLowerArm: { axis: [0, 1, 0], angle: -0.35 },
        leftUpperArm:  { axis: [0, 0, 1], angle: -0.85 },
        leftLowerArm:  { axis: [0, 1, 0], angle: 0.35 },
      },
      oscillation: {
        head: { axis: [0, 1, 0], amplitude: 0.15, frequency: 3.5 },
      },
    },

    Think: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 4.0,
      transitionSpeed: 3,
      bones: {
        rightUpperArm: { euler: [0, 0.4, 1.2] },
        rightLowerArm: { euler: [0, -2.4, 0] },
        rightHand:     { euler: [0, 0, 0.5] },
        head:          { euler: [-0.1, 0, 0] },
        neck:          { euler: [0, 0.1, 0] },
        spine:         { euler: [0.05, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0.1] },
        rightMiddleProximal: { euler: [0, 0, 1.2] },
        rightRingProximal: { euler: [0, 0, 1.2] },
        rightLittleProximal: { euler: [0, 0, 1.2] },
      }
    },
    CrossArms: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 4.0,
      transitionSpeed: 4,
      bones: {
        rightUpperArm: { euler: [0, 0.6, 1.2] },
        rightLowerArm: { euler: [0, -2.0, 0] },
        leftUpperArm:  { euler: [0, -0.6, -1.2] },
        leftLowerArm:  { euler: [0, 2.0, 0] },
        chest:         { euler: [-0.05, 0, 0] },
        spine:         { euler: [-0.05, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0.5] },
        leftIndexProximal: { euler: [0, 0, -0.5] },
      }
    },
    HandOnHipLeft: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 4.0,
      transitionSpeed: 3.5,
      bones: {
        leftUpperArm:  { euler: [0, -0.2, -0.5] },
        leftLowerArm:  { euler: [0, 1.5, 0] },
        leftHand:      { euler: [0, 0, -0.3] }, 
        hips:          { euler: [0, 0, 0.08] },
        spine:         { euler: [0, 0, -0.05] },
        chest:         { euler: [0, 0, -0.03] },
      }
    },
    HandOnHipRight: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 4.0,
      transitionSpeed: 3.5,
      bones: {
        rightUpperArm:  { euler: [0, 0.2, 0.5] }, 
        rightLowerArm:  { euler: [0, -1.5, 0] },
        rightHand:      { euler: [0, 0, 0.3] },
        hips:           { euler: [0, 0, -0.08] },
        spine:          { euler: [0, 0, 0.05] },
        chest:          { euler: [0, 0, 0.03] },
      }
    },
    BothHandsOnHips: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 4.0,
      transitionSpeed: 4,
      bones: {
        leftUpperArm:   { euler: [0, -0.2, -0.5] },
        leftLowerArm:   { euler: [0, 1.5, 0] },
        leftHand:       { euler: [0, 0, -0.3] },
        rightUpperArm:  { euler: [0, 0.2, 0.5] },
        rightLowerArm:  { euler: [0, -1.5, 0] },
        rightHand:      { euler: [0, 0, 0.3] },
        chest:          { euler: [-0.1, 0, 0] },
      }
    },
    Bow: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 3.5,
      transitionSpeed: 3,
      bones: {
        hips:  { euler: [0.3, 0, 0] },
        spine: { euler: [0.2, 0, 0] },
        chest: { euler: [0.1, 0, 0] },
        head:  { euler: [0.2, 0, 0] },
        leftUpperArm: { euler: [0, -0.2, -1.0] },
        rightUpperArm: { euler: [0, 0.2, 1.0] },
      }
    },
    WaveHello: {
      category: GESTURE_CATEGORIES.INTERACTION,
      duration: 3.0,
      transitionSpeed: 6,
      bones: {
        rightUpperArm: { euler: [0, 0, 1.4] },
        rightLowerArm: { euler: [0, -0.3, 0] },
        rightHand:     { euler: [-0.5, 0, 0] },
        spine:         { euler: [-0.05, 0, 0] },
        chest:         { euler: [0, -0.1, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0] },
        rightMiddleProximal: { euler: [0, 0, 0] },
        rightRingProximal: { euler: [0, 0, 0] },
        rightLittleProximal: { euler: [0, 0, 0] },
      },
      oscillation: {
        rightLowerArm: { axis: [1, 0, 0], amplitude: 0.3, frequency: 15 },
        rightHand:     { axis: [0, 0, 1], amplitude: 0.2, frequency: 15 },
      }
    },
    Explain: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 3.0,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { euler: [0, 0, 0.5] },
        rightLowerArm: { euler: [0, -1.2, 0] },
        rightHand:     { euler: [-1.5, 0, 0] }, 
        leftUpperArm:  { euler: [0, 0, -0.5] },
        leftLowerArm:  { euler: [0, 1.2, 0] },
        leftHand:      { euler: [1.5, 0, 0] },
        spine:         { euler: [0.05, 0, 0] },
        head:          { euler: [-0.05, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0.1] },
        leftIndexProximal: { euler: [0, 0, -0.1] },
      }
    },
    Facepalm: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 4.0,
      transitionSpeed: 4,
      bones: {
        rightUpperArm: { euler: [0, 0.5, 1.2] },
        rightLowerArm: { euler: [0, -2.3, 0] },
        rightHand:     { euler: [0.3, 0, 0] },
        spine:         { euler: [0.2, 0, 0] },
        chest:         { euler: [0.1, 0, 0] },
        head:          { euler: [0.3, 0, 0] },
      }
    },
    Defensive: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 3.0,
      transitionSpeed: 8,
      bones: {
        rightUpperArm: { euler: [0, 0.3, 0.8] },
        rightLowerArm: { euler: [0, -1.8, 0] },
        rightHand:     { euler: [0.8, 0, 0] },
        leftUpperArm:  { euler: [0, -0.3, -0.8] },
        leftLowerArm:  { euler: [0, 1.8, 0] },
        leftHand:      { euler: [-0.8, 0, 0] },
        spine:         { euler: [-0.2, 0, 0] },
        hips:          { euler: [0.1, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, -0.1] },
        leftIndexProximal: { euler: [0, 0, 0.1] },
      }
    },
    ExcitedJump: {
      category: GESTURE_CATEGORIES.EMOTIONAL,
      duration: 1.5,
      transitionSpeed: 10,
      bones: {
        rightUpperArm: { euler: [0, 0, 0.6] },
        rightLowerArm: { euler: [0, -1.8, 0] },
        leftUpperArm:  { euler: [0, 0, -0.6] },
        leftLowerArm:  { euler: [0, 1.8, 0] },
        hips:          { euler: [0.1, 0, 0] },
        leftUpperLeg:  { euler: [-0.2, 0, 0] },
        rightUpperLeg: { euler: [-0.2, 0, 0] },
        leftLowerLeg:  { euler: [0.3, 0, 0] },
        rightLowerLeg: { euler: [0.3, 0, 0] },
      },
      oscillation: {
        hips: { axis: [0, 1, 0], amplitude: 0.05, frequency: 15 },
        chest: { axis: [1, 0, 0], amplitude: 0.05, frequency: 15 },
      }
    },
    YawnStretch: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 4.5,
      transitionSpeed: 3,
      bones: {
        rightUpperArm: { euler: [0, 0, 2.2] },
        leftUpperArm:  { euler: [0, 0, -2.2] },
        rightLowerArm: { euler: [0, -0.2, 0] },
        leftLowerArm:  { euler: [0, 0.2, 0] },
        spine:         { euler: [-0.2, 0, 0] },
        chest:         { euler: [-0.1, 0, 0] },
        head:          { euler: [-0.2, 0, 0] },
      }
    },
    AdjustHair: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 3.5,
      transitionSpeed: 4,
      bones: {
        rightUpperArm: { euler: [0, 0.2, 1.4] },
        rightLowerArm: { euler: [0, -2.2, 0] },
        rightHand:     { euler: [-0.2, 0, 0] },
        head:          { euler: [0, 0, 0.15] },
        neck:          { euler: [0, 0, 0.05] },
        spine:         { euler: [0, 0, 0.05] },
      }
    },
    HandsBehindBack: {
      category: GESTURE_CATEGORIES.IDLE,
      duration: 5.0,
      transitionSpeed: 3,
      bones: {
        rightUpperArm: { euler: [0, -0.2, 1.1] },
        rightLowerArm: { euler: [0, -0.5, 0] }, 
        leftUpperArm:  { euler: [0, 0.2, -1.1] },
        leftLowerArm:  { euler: [0, 0.5, 0] },
        chest:         { euler: [-0.1, 0, 0] },
        spine:         { euler: [-0.05, 0, 0] },
      }
    },
    PointSelf: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 2.5,
      transitionSpeed: 5,
      bones: {
        rightUpperArm: { euler: [0, 0.4, 0.6] },
        rightLowerArm: { euler: [0, -2.0, 0] },
        rightHand:     { euler: [0, 0, 0.8] },
        spine:         { euler: [-0.05, 0, 0] },
        head:          { euler: [0.05, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0] },
        rightMiddleProximal: { euler: [0, 0, 1.4] },
        rightRingProximal: { euler: [0, 0, 1.4] },
        rightLittleProximal: { euler: [0, 0, 1.4] },
      }
    },
    ShrugHeavy: {
      category: GESTURE_CATEGORIES.CONVERSATIONAL,
      duration: 3.0,
      transitionSpeed: 6,
      bones: {
        rightShoulder: { euler: [0, 0, 0.3] },
        leftShoulder:  { euler: [0, 0, -0.3] },
        rightUpperArm: { euler: [0, 0, 0.6] },
        leftUpperArm:  { euler: [0, 0, -0.6] },
        rightLowerArm: { euler: [0, -1.2, 0] },
        leftLowerArm:  { euler: [0, 1.2, 0] },
        rightHand:     { euler: [-0.8, 0, 0] },
        leftHand:      { euler: [0.8, 0, 0] },
        head:          { euler: [0, 0, 0.1] },
        hips:          { euler: [0.05, 0, 0] },
      },
      fingers: {
        rightIndexProximal: { euler: [0, 0, 0.2] },
        leftIndexProximal: { euler: [0, 0, -0.2] },
      }
    },




  };
}

const BASE_ARMS_DOWN = {
  leftUpperArm:  { axis: [0, 0, 1], angle: -1.2 },
  rightUpperArm: { axis: [0, 0, 1], angle: 1.2 },
  leftLowerArm:  { axis: [0, 1, 0], angle: 0.15 },
  rightLowerArm: { axis: [0, 1, 0], angle: -0.15 },
  leftHand:      { axis: [0, 0, 1], angle: 0.1 },
  rightHand:     { axis: [0, 0, 1], angle: -0.1 },
  leftIndexProximal:  { axis: [0, 0, 1], angle: -0.2 },
  leftMiddleProximal: { axis: [0, 0, 1], angle: -0.25 },
  leftRingProximal:   { axis: [0, 0, 1], angle: -0.3 },
  leftLittleProximal: { axis: [0, 0, 1], angle: -0.35 },
  leftThumbProximal:  { axis: [0, 0, 1], angle: -0.15 },
  rightIndexProximal: { axis: [0, 0, 1], angle: 0.2 },
  rightMiddleProximal:{ axis: [0, 0, 1], angle: 0.25 },
  rightRingProximal:  { axis: [0, 0, 1], angle: 0.3 },
  rightLittleProximal:{ axis: [0, 0, 1], angle: 0.35 },
  rightThumbProximal: { axis: [0, 0, 1], angle: 0.15 },
  
  // Contrapposto Stance
  hips:          { axis: [0, 0, 1], angle: -0.05 }, // Tilt left hip down
  spine:         { axis: [0, 0, 1], angle: 0.03 },  // Counter-tilt spine
  chest:         { axis: [0, 0, 1], angle: 0.02 },  // Counter-tilt chest
  leftUpperLeg:  { axis: [1, 0, 0], angle: -0.1 },  // Left knee slightly bent forward
  leftLowerLeg:  { axis: [1, 0, 0], angle: 0.15 },  // Left calf compensates
  leftFoot:      { axis: [1, 0, 0], angle: -0.05 }, // Keep foot flat
};

const VRM_BONE_MAP = {
  hips:          'hips',
  spine:         'spine',
  chest:         'chest',
  upperChest:    'upperChest',
  neck:          'neck',
  head:          'head',
  leftEye:       'leftEye',
  rightEye:      'rightEye',
  leftShoulder:  'leftShoulder',
  rightShoulder: 'rightShoulder',
  leftUpperArm:  'leftUpperArm',
  rightUpperArm: 'rightUpperArm',
  leftLowerArm:  'leftLowerArm',
  rightLowerArm: 'rightLowerArm',
  leftHand:      'leftHand',
  rightHand:     'rightHand',
  rightThumbMetacarpal:       'rightThumbMetacarpal',
  rightThumbProximal:         'rightThumbProximal',
  rightThumbDistal:           'rightThumbDistal',
  rightIndexProximal:         'rightIndexProximal',
  rightIndexIntermediate:     'rightIndexIntermediate',
  rightIndexDistal:           'rightIndexDistal',
  rightMiddleProximal:        'rightMiddleProximal',
  rightMiddleIntermediate:    'rightMiddleIntermediate',
  rightMiddleDistal:          'rightMiddleDistal',
  rightRingProximal:          'rightRingProximal',
  rightRingIntermediate:      'rightRingIntermediate',
  rightRingDistal:            'rightRingDistal',
  rightLittleProximal:        'rightLittleProximal',
  rightLittleIntermediate:    'rightLittleIntermediate',
  rightLittleDistal:          'rightLittleDistal',
  leftThumbMetacarpal:        'leftThumbMetacarpal',
  leftThumbProximal:          'leftThumbProximal',
  leftThumbDistal:            'leftThumbDistal',
  leftIndexProximal:          'leftIndexProximal',
  leftIndexIntermediate:      'leftIndexIntermediate',
  leftIndexDistal:            'leftIndexDistal',
  leftMiddleProximal:         'leftMiddleProximal',
  leftMiddleIntermediate:     'leftMiddleIntermediate',
  leftMiddleDistal:           'leftMiddleDistal',
  leftRingProximal:           'leftRingProximal',
  leftRingIntermediate:       'leftRingIntermediate',
  leftRingDistal:             'leftRingDistal',
  leftLittleProximal:         'leftLittleProximal',
  leftLittleIntermediate:     'leftLittleIntermediate',
  leftLittleDistal:           'leftLittleDistal',
  leftUpperLeg:               'leftUpperLeg',
  rightUpperLeg:              'rightUpperLeg',
  leftLowerLeg:               'leftLowerLeg',
  rightLowerLeg:              'rightLowerLeg',
  leftFoot:                   'leftFoot',
  rightFoot:                  'rightFoot',
};

export class GestureEngine {
  constructor(THREE) {
    this.THREE = THREE;
    this.gestures = createGestureDefinitions();
    this.boneNodes = {};
    this.currentPose = {};
    this.activeGesture = null;
    this.gestureTimer = 0;
    this.gestureQueue = [];
    this.initialized = false;
    this.isMobile = false;
    this.isVrm = false;
  }

  init(vrm, scene, isMobile) {
    this.isMobile = !!isMobile;
    this.boneNodes = {};
    
    if (vrm && vrm.humanoid) {
      this.isVrm = true;
      for (const [logicalName, vrmName] of Object.entries(VRM_BONE_MAP)) {
        // three-vrm v1+ getNormalizedBoneNode or fallback to getRawBoneNode
        const node = vrm.humanoid.getNormalizedBoneNode(vrmName) || vrm.humanoid.getRawBoneNode(vrmName);
        if (node) {
          this.boneNodes[logicalName] = node;
          this.currentPose[logicalName] = new this.THREE.Quaternion().copy(node.quaternion);
        }
      }
    } else if (scene) {
      scene.traverse((node) => {
        if (node.isBone) {
          for (const [logicalName, searchName] of Object.entries(VRM_BONE_MAP)) {
            if (node.name.toLowerCase().includes(searchName.toLowerCase())) {
              this.boneNodes[logicalName] = node;
              this.currentPose[logicalName] = new this.THREE.Quaternion().copy(node.quaternion);
            }
          }
        }
      });
    }
    this.initialized = true;
  }

  setGesture(gestureName) {
    if (!this.initialized || !gestureName) {
      this.activeGesture = null;
      return;
    }
    if (this.gestures[gestureName]) {
      this.activeGesture = gestureName;
      this.gestureTimer = 0;
    }
  }

  queueGestures(gestures) {
    if (!Array.isArray(gestures)) return;
    this.gestureQueue.push(...gestures);
  }

  clearQueue() {
    this.gestureQueue = [];
  }

  isGestureActive() {
    return this.activeGesture !== null;
  }

  update(t, delta) {
    if (!this.initialized) return;

    const targetPose = {};
    const Q = this.THREE.Quaternion;
    const E = this.THREE.Euler;
    
    for (const [boneName, transform] of Object.entries(BASE_ARMS_DOWN)) {
      if (!this.boneNodes[boneName]) continue;
      const q = new Q();
      if (transform.euler) {
        q.setFromEuler(new E(...transform.euler));
      } else if (transform.axis && transform.angle !== undefined) {
        q.setFromAxisAngle(new this.THREE.Vector3(...transform.axis).normalize(), transform.angle);
      }
      targetPose[boneName] = q;
    }

    let transitionSpeed = 5;
    if (this.activeGesture && this.gestures[this.activeGesture]) {
      const gesture = this.gestures[this.activeGesture];
      this.gestureTimer += delta;
      transitionSpeed = gesture.transitionSpeed || 5;

      const progress = Math.min(this.gestureTimer / gesture.duration, 1.0);
      const weight = Math.sin(progress * Math.PI); 

      if (this.gestureTimer >= gesture.duration) {
        if (this.gestureQueue.length > 0) {
          this.activeGesture = this.gestureQueue.shift();
          this.gestureTimer = 0;
        } else {
          this.activeGesture = null;
        }
      }
      this.applyGestureTransforms(gesture, targetPose, weight, t, Q, E);
    }

    for (const boneName in targetPose) {
      if (!this.currentPose[boneName]) {
        this.currentPose[boneName] = new Q().copy(targetPose[boneName]);
      } else {
        this.currentPose[boneName].slerp(targetPose[boneName], delta * transitionSpeed);
      }
    }

    for (const boneName in this.currentPose) {
      const node = this.boneNodes[boneName];
      if (!node) continue;
      const q = this.currentPose[boneName].clone();
      
      if (BONE_LIMITS[boneName]) {
        const euler = new E().setFromQuaternion(q);
        const limit = BONE_LIMITS[boneName];
        euler.x = Math.max(limit.minX, Math.min(limit.maxX, euler.x));
        euler.y = Math.max(limit.minY, Math.min(limit.maxY, euler.y));
        euler.z = Math.max(limit.minZ, Math.min(limit.maxZ, euler.z));
        q.setFromEuler(euler);
      }
      node.quaternion.copy(q);
    }
  }

  applyGestureTransforms(gesture, targetPose, weight, t, Q, E) {
    const applySection = (section) => {
      if (!section) return;
      for (const [boneName, transform] of Object.entries(section)) {
        if (!this.boneNodes[boneName]) continue;
        const q = new Q();
        if (transform.euler) {
          q.setFromEuler(new E(...transform.euler));
        } else if (transform.axis && transform.angle !== undefined) {
          q.setFromAxisAngle(new this.THREE.Vector3(...transform.axis).normalize(), transform.angle);
        }
        if (targetPose[boneName]) {
          targetPose[boneName].slerp(q, weight);
        } else {
          targetPose[boneName] = new Q().slerp(q, weight);
        }
      }
    };

    applySection(gesture.bones);
    applySection(gesture.fingers);

    if (gesture.oscillation) {
      for (const [boneName, osc] of Object.entries(gesture.oscillation)) {
        if (!this.boneNodes[boneName]) continue;
        const offset = Math.sin(t * osc.frequency * Math.PI * 2) * osc.amplitude * weight;
        const qOsc = new Q().setFromAxisAngle(new this.THREE.Vector3(...osc.axis).normalize(), offset);
        if (targetPose[boneName]) {
          targetPose[boneName].multiply(qOsc);
        } else {
          targetPose[boneName] = qOsc;
        }
      }
    }
  }
}
