'use strict';

const BREAKPOINTS = {
  MOBILE_PORTRAIT:  640,
  TABLET:          1024,
  DESKTOP:         1440,
};

const CAMERA_PRESETS = {
  mobilePortrait: {
    fov: 35,
    position: [0, 1.55, 2.8],
    lookAt: [0, 1.2, 0],
    pixelRatioMax: 1.5,
    shadowsEnabled: false,
    slerpSpeedMultiplier: 0.7,
  },
  mobileLandscape: {
    fov: 28,
    position: [0, 1.45, 3.0],
    lookAt: [0, 1.1, 0],
    pixelRatioMax: 1.5,
    shadowsEnabled: false,
    slerpSpeedMultiplier: 0.7,
  },
  tablet: {
    fov: 32,
    position: [0, 1.48, 3.0],
    lookAt: [0, 1.1, 0],
    pixelRatioMax: 2,
    shadowsEnabled: true,
    slerpSpeedMultiplier: 0.85,
  },
  desktop: {
    fov: 30,
    position: [0, 1.45, 3.2],
    lookAt: [0, 1.05, 0],
    pixelRatioMax: 2,
    shadowsEnabled: true,
    slerpSpeedMultiplier: 1.0,
  },
};

export class MobileResponsiveCamera {
  constructor(THREE) {
    this.THREE = THREE;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.currentPreset = 'desktop';
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 0.8;
    this.startPosition = null;
    this.startLookAt = null;
    this.startFov = 30;
    this.targetPresetData = null;
    this.currentLookAt = null;
    this.lightRef = null;
    this.isMobile = false;
  }

  init(camera, renderer, container, keyLight) {
    this.camera = camera;
    this.renderer = renderer;
    this.container = container;
    this.lightRef = keyLight;
    this.currentLookAt = new this.THREE.Vector3(0, 1.05, 0);
    this.startPosition = new this.THREE.Vector3();
    this.startLookAt = new this.THREE.Vector3();

    this._detectAndApply();

    this._onResize = () => this._detectAndApply();
    window.addEventListener('resize', this._onResize);

    if (window.screen && window.screen.orientation) {
      this._onOrientationChange = () => {
        setTimeout(() => this._detectAndApply(), 100);
      };
      window.screen.orientation.addEventListener('change', this._onOrientationChange);
    }

    return this;
  }

  update(delta) {
    if (!this.isTransitioning || !this.camera || !this.targetPresetData) return;

    this.transitionProgress += delta / this.transitionDuration;

    if (this.transitionProgress >= 1) {
      this.transitionProgress = 1;
      this.isTransitioning = false;
    }

    const t = this._easeInOutCubic(this.transitionProgress);

    this.camera.fov = this.startFov + (this.targetPresetData.fov - this.startFov) * t;
    this.camera.updateProjectionMatrix();

    this.camera.position.lerpVectors(
      this.startPosition,
      new this.THREE.Vector3(...this.targetPresetData.position),
      t
    );

    const targetLookAt = new this.THREE.Vector3(...this.targetPresetData.lookAt);
    this.currentLookAt.lerpVectors(this.startLookAt, targetLookAt, t);
    this.camera.lookAt(this.currentLookAt);
  }

  getIsMobile() {
    return this.isMobile;
  }

  getCurrentPreset() {
    return this.currentPreset;
  }

  getSlerpMultiplier() {
    const preset = CAMERA_PRESETS[this.currentPreset];
    return preset ? preset.slerpSpeedMultiplier : 1.0;
  }

  handleResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }
    if (this._onOrientationChange && window.screen?.orientation) {
      window.screen.orientation.removeEventListener('change', this._onOrientationChange);
    }
  }

  _detectAndApply() {
    if (!this.container) return;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const isPortrait = h > w;
    let newPreset = 'desktop';

    if (w < BREAKPOINTS.MOBILE_PORTRAIT) {
      newPreset = isPortrait ? 'mobilePortrait' : 'mobileLandscape';
      this.isMobile = true;
    } else if (w < BREAKPOINTS.TABLET) {
      newPreset = 'tablet';
      this.isMobile = false;
    } else {
      newPreset = 'desktop';
      this.isMobile = false;
    }

    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileDevice && newPreset === 'desktop') {
      newPreset = 'tablet';
    }
    if (isMobileDevice) {
      this.isMobile = true;
    }

    if (newPreset !== this.currentPreset) {
      this._transitionTo(newPreset);
    }

    this.handleResize();

    const preset = CAMERA_PRESETS[this.currentPreset];
    if (this.renderer) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatioMax));
    }
    if (this.lightRef) {
      this.lightRef.castShadow = preset.shadowsEnabled;
    }
  }

  _transitionTo(presetName) {
    const preset = CAMERA_PRESETS[presetName];
    if (!preset || !this.camera) return;

    this.startPosition.copy(this.camera.position);
    this.startLookAt.copy(this.currentLookAt);
    this.startFov = this.camera.fov;

    this.targetPresetData = preset;
    this.currentPreset = presetName;
    this.isTransitioning = true;
    this.transitionProgress = 0;
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
