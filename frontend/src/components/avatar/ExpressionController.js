'use strict';

const BLINK_MORPH_KEYS = [
  'Fcl_EYE_Close', 'Blink', 'blink', 'blinkLeft', 'blinkRight',
  'Blink_L', 'Blink_R', 'eyeBlinkLeft', 'eyeBlinkRight',
  'vrc.blink_left', 'vrc.blink_right', 'Fcl_EYE_Close_L', 'Fcl_EYE_Close_R',
];

const VISEME_MAP = {
  aa: ['Fcl_MTH_A', 'vrc.v_aa', 'MTH_A', 'mouthOpen', 'jawOpen', 'viseme_aa', 'aa', 'A'],
  ih: ['Fcl_MTH_I', 'vrc.v_ih', 'MTH_I', 'viseme_ih', 'ih', 'I'],
  ou: ['Fcl_MTH_U', 'vrc.v_ou', 'MTH_U', 'viseme_ou', 'ou', 'U'],
  ee: ['Fcl_MTH_E', 'vrc.v_ee', 'MTH_E', 'viseme_ee', 'ee', 'E'],
  oh: ['Fcl_MTH_O', 'vrc.v_oh', 'MTH_O', 'viseme_oh', 'oh', 'O'],
};

const EXPRESSION_PRESETS = {
  happy:     ['Happy', 'happy', 'Joy', 'joy', 'Fcl_ALL_Joy', 'Fun', 'fun'],
  angry:     ['Angry', 'angry', 'Fcl_ALL_Angry'],
  sad:       ['Sad', 'sad', 'Sorrow', 'sorrow', 'Fcl_ALL_Sorrow'],
  surprised: ['Surprised', 'surprised', 'Fcl_ALL_Surprised'],
  neutral:   ['Neutral', 'neutral', 'Fcl_ALL_Neutral'],
  relaxed:   ['Relaxed', 'relaxed'],
};

const PHONEME_PATTERNS = [
  { regex: /[aA]/, viseme: 'aa', weight: 0.85 },
  { regex: /[iI]/, viseme: 'ih', weight: 0.7 },
  { regex: /[uU]/, viseme: 'ou', weight: 0.75 },
  { regex: /[eE]/, viseme: 'ee', weight: 0.65 },
  { regex: /[oO]/, viseme: 'oh', weight: 0.8 },
  { regex: /[bBpPmM]/, viseme: 'aa', weight: 0.5 },
  { regex: /[fFvV]/, viseme: 'ih', weight: 0.4 },
  { regex: /[sS]/, viseme: 'ee', weight: 0.35 },
  { regex: /[tTdDnNlL]/, viseme: 'ih', weight: 0.45 },
  { regex: /[kKgG]/, viseme: 'oh', weight: 0.4 },
  { regex: /[rR]/, viseme: 'ou', weight: 0.5 },
  { regex: /[wW]/, viseme: 'ou', weight: 0.6 },
  { regex: /[yYjJ]/, viseme: 'ee', weight: 0.5 },
];

export class ExpressionController {
  constructor() {
    this.morphMeshes = [];
    this.vrm = null;
    this.useVRMExpressions = false;

    this.blinkState = 'open';
    this.blinkTimer = 0;
    this.nextBlinkTime = this._randomBlinkInterval();
    this.blinkPhase = 0;
    this.doubleBlink = false;

    this.currentExpression = 'neutral';
    this.targetExpression = 'neutral';
    this.expressionWeight = 0;
    this.targetExpressionWeight = 0;
    this.expressionTransitionSpeed = 3;

    this.visemeWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    this.targetVisemeWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    this.isSpeaking = false;
    this.visemeIndex = 0;
    this.visemeTimer = 0;
    this.currentText = '';
    this.visemeSequence = [];

    this.gazeX = 0;
    this.gazeY = 0;
    this.targetGazeX = 0;
    this.targetGazeY = 0;
    this.saccadeTimer = 0;
    this.nextSaccadeTime = 1.5;
    this.gazeEnabled = true;

    this.browRaise = 0;
    this.targetBrowRaise = 0;
  }

  init(vrm, morphMeshes) {
    this.vrm = vrm;
    this.morphMeshes = morphMeshes || [];

    if (vrm && vrm.expressionManager) {
      this.useVRMExpressions = true;
    }
    return true;
  }

  update(delta, time) {
    this._updateBlink(delta);
    this._updateExpression(delta);
    this._updateVisemes(delta, time);
    this._updateGaze(delta, time);
    this._updateBrow(delta);
  }

  setExpression(expressionName, weight = 1.0) {
    this.targetExpression = expressionName;
    this.targetExpressionWeight = Math.max(0, Math.min(1, weight));
  }

  clearExpression() {
    this.targetExpression = 'neutral';
    this.targetExpressionWeight = 0;
  }

  startSpeaking(text) {
    this.isSpeaking = true;
    this.currentText = text || '';
    this.visemeSequence = this._textToVisemes(text);
    this.visemeIndex = 0;
    this.visemeTimer = 0;
  }

  stopSpeaking() {
    this.isSpeaking = false;
    this.currentText = '';
    this.visemeSequence = [];
    this.visemeIndex = 0;
    Object.keys(this.targetVisemeWeights).forEach(k => {
      this.targetVisemeWeights[k] = 0;
    });
  }

  setGazeTarget(x, y) {
    this.targetGazeX = Math.max(-1, Math.min(1, x));
    this.targetGazeY = Math.max(-1, Math.min(1, y));
  }

  setBrowRaise(value) {
    this.targetBrowRaise = Math.max(-1, Math.min(1, value));
  }

  _updateBlink(delta) {
    this.blinkTimer += delta;

    switch (this.blinkState) {
      case 'open':
        if (this.blinkTimer >= this.nextBlinkTime) {
          this.blinkState = 'closing';
          this.blinkPhase = 0;
          this.blinkTimer = 0;
          this.doubleBlink = Math.random() < 0.15;
        }
        break;

      case 'closing':
        this.blinkPhase += delta / 0.06;
        if (this.blinkPhase >= 1) {
          this.blinkPhase = 1;
          this.blinkState = 'closed';
          this.blinkTimer = 0;
        }
        break;

      case 'closed':
        if (this.blinkTimer >= 0.04) {
          this.blinkState = 'opening';
          this.blinkTimer = 0;
        }
        break;

      case 'opening':
        this.blinkPhase -= delta / 0.08;
        if (this.blinkPhase <= 0) {
          this.blinkPhase = 0;
          if (this.doubleBlink) {
            this.doubleBlink = false;
            this.blinkState = 'closing';
            this.blinkTimer = 0;
          } else {
            this.blinkState = 'open';
            this.blinkTimer = 0;
            this.nextBlinkTime = this._randomBlinkInterval();
          }
        }
        break;
    }

    const blinkVal = this._easeInOutQuad(Math.max(0, Math.min(1, this.blinkPhase)));
    this._applyBlinkMorph(blinkVal);
  }

  _updateExpression(delta) {
    const lerpSpeed = this.expressionTransitionSpeed * delta;
    if (this.currentExpression !== this.targetExpression) {
      this.expressionWeight = Math.max(0, this.expressionWeight - lerpSpeed);
      if (this.expressionWeight <= 0.01) {
        this.currentExpression = this.targetExpression;
        this.expressionWeight = 0;
      }
    } else {
      const diff = this.targetExpressionWeight - this.expressionWeight;
      this.expressionWeight += diff * Math.min(1, lerpSpeed);
    }

    this._applyExpression(this.currentExpression, this.expressionWeight);
  }

  _updateVisemes(delta, time) {
    if (!this.isSpeaking || this.visemeSequence.length === 0) {
      Object.keys(this.visemeWeights).forEach(key => {
        this.visemeWeights[key] += (this.targetVisemeWeights[key] - this.visemeWeights[key]) * Math.min(1, 12 * delta);
      });
      this._applyVisemes();
      return;
    }

    this.visemeTimer += delta;
    const visemeDuration = 0.08 + Math.random() * 0.04;

    if (this.visemeTimer >= visemeDuration) {
      this.visemeTimer = 0;
      this.visemeIndex = (this.visemeIndex + 1) % this.visemeSequence.length;

      const current = this.visemeSequence[this.visemeIndex];
      Object.keys(this.targetVisemeWeights).forEach(k => {
        this.targetVisemeWeights[k] = 0;
      });
      if (current) {
        this.targetVisemeWeights[current.viseme] = current.weight * (0.8 + Math.random() * 0.2);
      }
    }

    Object.keys(this.visemeWeights).forEach(key => {
      this.visemeWeights[key] += (this.targetVisemeWeights[key] - this.visemeWeights[key]) * Math.min(1, 15 * delta);
    });

    this._applyVisemes();
  }

  _updateGaze(delta, time) {
    if (!this.gazeEnabled) return;

    this.saccadeTimer += delta;
    if (this.saccadeTimer >= this.nextSaccadeTime) {
      this.saccadeTimer = 0;
      this.nextSaccadeTime = 1.0 + Math.random() * 2.5;
      this.targetGazeX += (Math.random() - 0.5) * 0.15;
      this.targetGazeY += (Math.random() - 0.5) * 0.1;
      this.targetGazeX = Math.max(-0.3, Math.min(0.3, this.targetGazeX));
      this.targetGazeY = Math.max(-0.2, Math.min(0.2, this.targetGazeY));
    }

    const gazeLerp = Math.min(1, 8 * delta);
    this.gazeX += (this.targetGazeX - this.gazeX) * gazeLerp;
    this.gazeY += (this.targetGazeY - this.gazeY) * gazeLerp;

    this._applyGaze();
  }

  _updateBrow(delta) {
    const browLerp = Math.min(1, 5 * delta);
    this.browRaise += (this.targetBrowRaise - this.browRaise) * browLerp;
  }

  _applyBlinkMorph(value) {
    if (this.useVRMExpressions && this.vrm?.expressionManager) {
      try {
        this.vrm.expressionManager.setValue('blink', value);
      } catch (e) {
        this._applyMorphByKeys(BLINK_MORPH_KEYS, value);
      }
    } else {
      this._applyMorphByKeys(BLINK_MORPH_KEYS, value);
    }
  }

  _applyExpression(name, weight) {
    if (weight < 0.01 || name === 'neutral') return;

    if (this.useVRMExpressions && this.vrm?.expressionManager) {
      try {
        this.vrm.expressionManager.setValue(name, weight);
        return;
      } catch (e) {}
    }

    const keys = EXPRESSION_PRESETS[name];
    if (keys) {
      this._applyMorphByKeys(keys, weight);
    }
  }

  _applyVisemes() {
    Object.entries(this.visemeWeights).forEach(([visemeName, weight]) => {
      const keys = VISEME_MAP[visemeName];
      if (keys) {
        this._applyMorphByKeys(keys, weight);
      }
    });
  }

  _applyGaze() {
    if (this.useVRMExpressions && this.vrm?.expressionManager) {
      try {
        if (this.gazeX > 0.02) {
          this.vrm.expressionManager.setValue('lookRight', Math.abs(this.gazeX));
          this.vrm.expressionManager.setValue('lookLeft', 0);
        } else if (this.gazeX < -0.02) {
          this.vrm.expressionManager.setValue('lookLeft', Math.abs(this.gazeX));
          this.vrm.expressionManager.setValue('lookRight', 0);
        } else {
          this.vrm.expressionManager.setValue('lookLeft', 0);
          this.vrm.expressionManager.setValue('lookRight', 0);
        }
        if (this.gazeY > 0.02) {
          this.vrm.expressionManager.setValue('lookUp', Math.abs(this.gazeY));
          this.vrm.expressionManager.setValue('lookDown', 0);
        } else if (this.gazeY < -0.02) {
          this.vrm.expressionManager.setValue('lookDown', Math.abs(this.gazeY));
          this.vrm.expressionManager.setValue('lookUp', 0);
        } else {
          this.vrm.expressionManager.setValue('lookUp', 0);
          this.vrm.expressionManager.setValue('lookDown', 0);
        }
      } catch (e) {}
    }
  }

  _applyMorphByKeys(keys, value) {
    this.morphMeshes.forEach(mesh => {
      if (!mesh.morphTargetDictionary) return;
      keys.forEach(key => {
        const idx = mesh.morphTargetDictionary[key];
        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = Math.max(0, Math.min(1, value));
        }
      });
    });
  }

  _textToVisemes(text) {
    if (!text) return [];
    const sequence = [];
    const chars = text.replace(/[^a-zA-Z\s]/g, '').split('');

    for (const char of chars) {
      if (char === ' ') {
        sequence.push(null);
        continue;
      }
      let matched = false;
      for (const pattern of PHONEME_PATTERNS) {
        if (pattern.regex.test(char)) {
          sequence.push({ viseme: pattern.viseme, weight: pattern.weight });
          matched = true;
          break;
        }
      }
      if (!matched) {
        sequence.push({ viseme: 'aa', weight: 0.3 });
      }
    }
    return sequence;
  }

  _randomBlinkInterval() {
    return 2.0 + Math.random() * 4.0;
  }

  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}
