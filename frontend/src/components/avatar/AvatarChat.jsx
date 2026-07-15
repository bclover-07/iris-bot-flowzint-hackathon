'use client';
'use no memo';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { RiSendPlaneLine, RiMicLine, RiMicOffLine, RiLoader4Line, RiVolumeUpLine, RiVolumeMuteLine } from 'react-icons/ri';
import { GestureEngine } from './GestureEngine';
import { ExpressionController } from './ExpressionController';
import { TextToGesture } from './TextToGesture';
import { IdleAnimationSystem } from './IdleAnimationSystem';
import { MobileResponsiveCamera } from './MobileResponsiveCamera';

export default function AvatarChat() {
  const mountRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const currentActionRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animIdRef = useRef(null);
  const threeRef = useRef(null);
  const vrmRef = useRef(null);
  const lastTimeRef = useRef(null);

  const gestureEngineRef = useRef(null);
  const expressionCtrlRef = useRef(null);
  const textToGestureRef = useRef(null);
  const idleSystemRef = useRef(null);
  const responsiveCameraRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: 'avatar', text: "Hi! I'm Iris Bot, your AI learning assistant! Ask me anything — I'll help you learn. ✨" }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Loading avatar...');
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [avatarReady, setAvatarReady] = useState(false);
  const chatEndRef = useRef(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const THREE = await import('three');
      threeRef.current = THREE;
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { VRMLoaderPlugin } = await import('@pixiv/three-vrm');
      lastTimeRef.current = performance.now();

      const container = mountRef.current;
      if (!container || cancelled) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        30,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.set(0, 1.45, 3.2);
      camera.lookAt(0, 1.05, 0);
      cameraRef.current = camera;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
      keyLight.position.set(2, 3, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x7c3aed, 0.4);
      fillLight.position.set(-2, 1.5, -1);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0x4d96ff, 0.3);
      rimLight.position.set(0, 2, -3);
      scene.add(rimLight);

      const groundGeo = new THREE.CircleGeometry(2, 32);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.8,
        transparent: true,
        opacity: 0.5,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      scene.add(ground);

      const gestureEngine = new GestureEngine(THREE);
      gestureEngineRef.current = gestureEngine;

      const expressionCtrl = new ExpressionController();
      expressionCtrlRef.current = expressionCtrl;

      const textToGesture = new TextToGesture();
      textToGestureRef.current = textToGesture;

      const idleSystem = new IdleAnimationSystem();
      idleSystemRef.current = idleSystem;

      const responsiveCamera = new MobileResponsiveCamera(THREE);
      responsiveCameraRef.current = responsiveCamera;
      responsiveCamera.init(camera, renderer, container, keyLight);

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      loader.load(
        '/3d-model/avatar.glb',
        (gltf) => {
          if (cancelled) return;
          const vrm = gltf.userData.vrm;
          const avatar = vrm ? vrm.scene : gltf.scene;

          if (vrm) {
            vrmRef.current = vrm;
          }

          const box = new THREE.Box3().setFromObject(avatar);
          const center = box.getCenter(new THREE.Vector3());
          avatar.position.x -= center.x;
          avatar.position.y -= box.min.y;
          scene.add(avatar);

          const morphMeshes = [];
          avatar.traverse((node) => {
            if (node.isMesh && node.morphTargetDictionary) {
              morphMeshes.push(node);
            }
          });

          // AnimationMixer removed to prevent conflicts with procedural VRM gestures

          const isMobile = responsiveCamera.getIsMobile();
          try {
            if (gestureEngine.init) gestureEngine.init(vrm, scene, isMobile);
            if (expressionCtrl.init) expressionCtrl.init(vrm, morphMeshes);
            if (idleSystem.init) idleSystem.init(gestureEngine, expressionCtrl);
          } catch (initErr) {
            console.error('Error initializing avatar systems:', initErr);
          }

          setAvatarReady(true);
          setStatus('Ready');

          setTimeout(() => {
            if (ttsEnabled) {
              expressionCtrl.startSpeaking("Hi! I'm Iris, your AI assistant! How can I help you today?");
              gestureEngine.setGesture('WaveHello');
              expressionCtrl.setExpression('happy', 0.6);
              idleSystem.setTalking(true);

              speakText("Hi! I'm Iris, your AI assistant! How can I help you today?", () => {
                expressionCtrl.stopSpeaking();
                expressionCtrl.clearExpression();
                gestureEngine.setGesture(null);
                idleSystem.setTalking(false);
              });
            }
          }, 800);
        },
        (progress) => {
          if (progress.total > 0) {
            const pct = Math.round((progress.loaded / progress.total) * 100);
            setStatus(`Loading avatar... ${pct}%`);
          }
        },
        (error) => {
          console.error('Avatar load error:', error);
          setStatus('Avatar load failed');
          setAvatarReady(true);
        }
      );

      const animate = () => {
        animIdRef.current = requestAnimationFrame(animate);
        const now = performance.now();
        const delta = Math.min((now - lastTimeRef.current) / 1000, 0.05);
        lastTimeRef.current = now;
        const t = now / 1000;



        try {
          if (gestureEngineRef.current?.initialized && gestureEngineRef.current.update) {
            gestureEngineRef.current.update(t, delta);
          }
          if (expressionCtrlRef.current && expressionCtrlRef.current.update) {
            expressionCtrlRef.current.update(delta, t);
          }
        } catch (updateErr) {
          console.error('Avatar update error:', updateErr);
        }

        if (idleSystemRef.current) {
          idleSystemRef.current.update(delta, t);
        }

        if (responsiveCameraRef.current) {
          responsiveCameraRef.current.update(delta);
        }

        if (vrmRef.current) vrmRef.current.update(delta);

        renderer.render(scene, camera);
      };
      animate();
    };

    init();

    return () => {
      cancelled = true;
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (responsiveCameraRef.current) {
        responsiveCameraRef.current.destroy();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        const canvas = rendererRef.current.domElement;
        canvas?.parentNode?.removeChild(canvas);
      }
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const findAction = (name) => {
    const actions = actionsRef.current;
    return actions[name] ||
      actions[Object.keys(actions).find(k => k.toLowerCase().includes(name.toLowerCase()))];
  };

  const audioContextRef = useRef(null);
  const currentSourceRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const fallbackBrowserTTS = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) {
      setIsSpeaking(false);
      if (onEnd) setTimeout(onEnd, Math.min(text.length * 50, 3000));
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.pitch = 1.15;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice =
      voices.find(v => v.name.includes('Zira')) ||
      voices.find(v => v.name.includes('Samantha')) ||
      voices.find(v => v.name.includes('Google UK English Female')) ||
      voices.find(v => v.name.includes('Female') && v.lang.startsWith('en')) ||
      voices.find(v => v.name.includes('Victoria')) ||
      voices.find(v => v.name.includes('Karen')) ||
      voices.find(v => v.name.includes('Susan')) ||
      voices.find(v => v.lang.startsWith('en'));

    if (femaleVoice) utt.voice = femaleVoice;

    setIsSpeaking(true);
    utt.onend = () => { setIsSpeaking(false); if (onEnd) onEnd(); };
    utt.onerror = () => { setIsSpeaking(false); if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utt);
  }, []);

  const speakText = useCallback(async (text, onEnd) => {
    if (!ttsEnabled || typeof window === 'undefined') {
      if (onEnd) setTimeout(onEnd, Math.min(text.length * 50, 3000));
      return;
    }

    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) {}
      currentSourceRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_URL}/api/tts/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, voiceId: 'emily', speed: 1.0 }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.fallback) {
          fallbackBrowserTTS(text, onEnd);
          return;
        }
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const ctx = getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;

      source.onended = () => {
        setIsSpeaking(false);
        currentSourceRef.current = null;
        if (onEnd) onEnd();
      };

      source.start(0);
    } catch (err) {
      fallbackBrowserTTS(text, onEnd);
    }
  }, [ttsEnabled, getAudioContext, fallbackBrowserTTS]);

  const handleSend = useCallback(async (text, options = {}) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isSending) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsSending(true);
    isSendingRef.current = true;
    setStatus('Thinking...');

    const gestureEngine = gestureEngineRef.current;
    const expressionCtrl = expressionCtrlRef.current;
    const textToGesture = textToGestureRef.current;
    const idleSystem = idleSystemRef.current;

    if (gestureEngine && textToGesture) {
      const userAnalysis = textToGesture.analyzeUserInput(trimmed);
      if (userAnalysis.gestures.length > 0) {
        gestureEngine.setGesture(userAnalysis.gestures[0]);
        if (userAnalysis.gestures.length > 1) {
          gestureEngine.queueGestures(userAnalysis.gestures.slice(1));
        }
      }
    }

    if (gestureEngine) {
      const thinkAnalysis = textToGesture?.analyzeThinking();
      if (thinkAnalysis) {
        setTimeout(() => {
          if (isSendingRef.current) {
            gestureEngine.setGesture('ChinTap');
            if (expressionCtrl) {
              expressionCtrl.setExpression('neutral', 0.2);
              expressionCtrl.setBrowRaise(0.15);
            }
          }
        }, 600);
      }
    }

    let reply = '';
    try {
      let currentSessionId = 'demo-session-id';
      try {
        const authData = await api.get('/api/auth/me');
        if (authData?.user) {
          currentSessionId = authData.user._id || authData.user.id;
        }
      } catch (e) {}

      const payload = {
        message: trimmed,
        sessionId: currentSessionId,
      };

      if (options.webSearch) payload.webSearchMode = true;
      if (options.socratic) payload.socraticMode = true;

      const res = await api.post('/api/ai/chat', payload);
      reply = res.answer || "I'm here to help! Ask me anything.";
    } catch (err) {
      console.error('Avatar chat error:', err);
      reply = err?.data?.message || "I'm having trouble connecting right now. Please try again!";
    }

    setMessages(prev => [...prev, { role: 'avatar', text: reply }]);
    setIsSending(false);
    isSendingRef.current = false;

    if (gestureEngine && textToGesture) {
      const responseAnalysis = textToGesture.analyzeResponse(reply);

      if (responseAnalysis.gestures.length > 0) {
        gestureEngine.setGesture(responseAnalysis.gestures[0]);
        if (responseAnalysis.gestures.length > 1) {
          gestureEngine.queueGestures(responseAnalysis.gestures.slice(1));
        }
      }

      if (expressionCtrl) {
        // Backend Sentiment driven expressions
        let finalExpression = responseAnalysis.expression;
        let finalWeight = responseAnalysis.expressionWeight;
        
        if (res.sentiment && res.sentiment.label) {
          const sentLabel = res.sentiment.label;
          if (sentLabel === 'VERY_POSITIVE' || sentLabel === 'POSITIVE') {
            finalExpression = 'happy';
            finalWeight = 0.8;
          } else if (sentLabel === 'VERY_NEGATIVE' || sentLabel === 'NEGATIVE' || sentLabel === 'FRUSTRATED') {
            finalExpression = 'sad'; // Empathetic concern
            finalWeight = 0.7;
          }
        }
        
        expressionCtrl.setExpression(finalExpression, finalWeight);
        expressionCtrl.setBrowRaise(responseAnalysis.browRaise || 0);
      }

      if (idleSystem) {
        idleSystem.setTalking(true);
        idleSystem.setDoingGesture(true);
      }
    }

    if (ttsEnabled && expressionCtrl) {
      expressionCtrl.startSpeaking(reply);
      setStatus('Speaking...');
      speakText(reply, () => {
        if (expressionCtrl) {
          expressionCtrl.stopSpeaking();
          expressionCtrl.clearExpression();
          expressionCtrl.setBrowRaise(0);
        }
        if (gestureEngine) {
          gestureEngine.clearQueue();
          gestureEngine.setGesture(null);
        }
        if (idleSystem) {
          idleSystem.setTalking(false);
          idleSystem.setDoingGesture(false);
        }
        setStatus('Ready');
      });
    } else {
      setStatus('Ready');
      setTimeout(() => {
        if (expressionCtrl) expressionCtrl.clearExpression();
        if (gestureEngine) {
          gestureEngine.clearQueue();
          gestureEngine.setGesture(null);
        }
        if (idleSystem) {
          idleSystem.setTalking(false);
          idleSystem.setDoingGesture(false);
        }
      }, 3000);
    }
  }, [isSending, ttsEnabled, speakText]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.avatarSpeak = (reply) => {
        const gestureEngine = gestureEngineRef.current;
        const expressionCtrl = expressionCtrlRef.current;
        const textToGesture = textToGestureRef.current;
        const idleSystem = idleSystemRef.current;

        if (gestureEngine && textToGesture) {
          const analysis = textToGesture.analyzeResponse(reply);
          if (analysis.gestures.length > 0) {
            gestureEngine.setGesture(analysis.gestures[0]);
            gestureEngine.queueGestures(analysis.gestures.slice(1));
          }
          if (expressionCtrl) {
            expressionCtrl.setExpression(analysis.expression, analysis.expressionWeight);
          }
          if (idleSystem) {
            idleSystem.setTalking(true);
          }
        }

        if (ttsEnabled && expressionCtrl) {
          expressionCtrl.startSpeaking(reply);
          setStatus('Speaking...');
          speakText(reply, () => {
            if (expressionCtrl) {
              expressionCtrl.stopSpeaking();
              expressionCtrl.clearExpression();
            }
            if (gestureEngine) {
              gestureEngine.clearQueue();
              gestureEngine.setGesture(null);
            }
            if (idleSystem) {
              idleSystem.setTalking(false);
            }
            setStatus('Ready');
          });
        } else {
          setStatus('Ready');
        }
      };

      window.avatarThink = () => {
        const gestureEngine = gestureEngineRef.current;
        const expressionCtrl = expressionCtrlRef.current;
        if (gestureEngine) gestureEngine.setGesture('ChinTap');
        if (expressionCtrl) expressionCtrl.setBrowRaise(0.15);
        setStatus('Thinking...');
      };

      window.avatarReceiveNativeSTT = (text) => {
        handleSend(text);
      };
    }
  }, [ttsEnabled, speakText, handleSend]);

  const handleMic = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      handleSend(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  }, [handleSend]);

  const toggleTTS = useCallback(() => {
    if (isSpeaking) {
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (e) {}
        currentSourceRef.current = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (expressionCtrlRef.current) {
        expressionCtrlRef.current.stopSpeaking();
        expressionCtrlRef.current.clearExpression();
      }
      if (gestureEngineRef.current) {
        gestureEngineRef.current.clearQueue();
        gestureEngineRef.current.setGesture(null);
      }
      if (idleSystemRef.current) {
        idleSystemRef.current.setTalking(false);
        idleSystemRef.current.setDoingGesture(false);
      }
      setIsSpeaking(false);
      setStatus('Ready');
    }
    setTtsEnabled(prev => !prev);
  }, [isSpeaking]);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">

      {/* 3D Avatar Viewport */}
      <div className="avatar-viewport flex-1 min-h-[350px] lg:min-h-0 bg-white border-[4px] border-ink rounded-3xl shadow-[8px_8px_0_#1A1A2E] overflow-hidden relative">
        <div ref={mountRef} className="w-full h-full" />

        {/* Status pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-ink/80 backdrop-blur-sm border-[3px] border-ink rounded-full shadow-[4px_4px_0_#7C3AED]"
          >
            <motion.div
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'Ready' ? 'bg-mint' :
                status === 'Speaking...' ? 'bg-iris-purple' :
                status === 'Thinking...' ? 'bg-sunny' : 'bg-sky'
              }`}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-white font-bold text-xs uppercase tracking-wider">{status}</span>
          </motion.div>
        </div>

        {/* TTS toggle */}
        <button
          onClick={toggleTTS}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white border-[3px] border-ink rounded-full flex items-center justify-center shadow-[3px_3px_0_#1A1A2E] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1A1A2E] active:translate-y-[2px] active:shadow-[1px_1px_0_#1A1A2E] transition-all"
          title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
        >
          {ttsEnabled ? (
            <RiVolumeUpLine className="w-5 h-5 text-ink" />
          ) : (
            <RiVolumeMuteLine className="w-5 h-5 text-ink/50" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      <div className="chat-panel w-full lg:w-[380px] shrink-0 flex flex-col bg-white border-[4px] border-ink rounded-3xl shadow-[8px_8px_0_#1A1A2E] overflow-hidden h-[400px] lg:h-auto">

        {/* Chat header */}
        <div className="px-5 py-4 border-b-[4px] border-ink bg-cream flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-iris-purple rounded-full border-[3px] border-ink flex items-center justify-center shadow-[2px_2px_0_#1A1A2E]">
            <span className="text-white font-black text-sm">IR</span>
          </div>
          <div>
            <h3 className="font-black text-ink text-base leading-tight">Iris Avatar</h3>
            <p className="text-ink/50 font-bold text-xs uppercase tracking-wider">3D AI Assistant</p>
          </div>
          <motion.div
            className={`ml-auto w-3 h-3 rounded-full border-[2px] border-ink shadow-[2px_2px_0_#1A1A2E] ${avatarReady ? 'bg-mint' : 'bg-coral'}`}
            animate={avatarReady ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-cream/50">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 font-medium text-sm leading-relaxed border-[3px] border-ink rounded-2xl shadow-[3px_3px_0_#1A1A2E] ${
                    m.role === 'user'
                      ? 'bg-iris-purple text-white rounded-br-sm'
                      : 'bg-white text-ink rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border-[3px] border-ink rounded-2xl rounded-bl-sm px-4 py-3 shadow-[3px_3px_0_#1A1A2E]">
                <div className="flex items-center gap-2">
                  <motion.div className="w-2 h-2 rounded-full bg-iris-purple" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.div className="w-2 h-2 rounded-full bg-iris-purple" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-2 h-2 rounded-full bg-iris-purple" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t-[4px] border-ink bg-white p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Talk to Iris..."
              disabled={isSending}
              className="flex-1 bg-cream border-[3px] border-ink rounded-xl px-4 py-3 text-ink font-medium text-sm outline-none transition-all shadow-[3px_3px_0_#1A1A2E] focus:border-iris-purple focus:shadow-[3px_3px_0_var(--color-iris-purple)] disabled:opacity-50 placeholder:text-ink/40"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isSending}
              className="w-11 h-11 bg-iris-purple text-white border-[3px] border-ink rounded-xl flex items-center justify-center shadow-[3px_3px_0_#1A1A2E] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1A1A2E] active:translate-y-[2px] active:shadow-[1px_1px_0_#1A1A2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSending ? (
                <RiLoader4Line className="w-5 h-5 animate-spin" />
              ) : (
                <RiSendPlaneLine className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleMic}
              disabled={isSending}
              className={`w-11 h-11 border-[3px] border-ink rounded-xl flex items-center justify-center shadow-[3px_3px_0_#1A1A2E] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#1A1A2E] active:translate-y-[2px] active:shadow-[1px_1px_0_#1A1A2E] transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-coral text-white'
                  : 'bg-sunny text-ink'
              }`}
            >
              {isListening ? (
                <RiMicOffLine className="w-5 h-5" />
              ) : (
                <RiMicLine className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
