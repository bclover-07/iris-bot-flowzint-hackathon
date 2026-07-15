

const SMALLEST_API_URL = 'https://api.smallest.ai/waves/v1/lightning-v3.1/get_speech';

/**
 * Synthesize speech from text using Smallest.ai Waves API.
 * Returns a Buffer containing the WAV audio data.
 *
 * @param {string} text - The text to convert to speech
 * @param {object} options - Optional overrides
 * @param {string} options.voiceId - Voice identifier (default: 'emily')
 * @param {number} options.sampleRate - Audio sample rate (default: 24000)
 * @param {number} options.speed - Speech speed multiplier (default: 1.0)
 * @returns {Promise<Buffer>} WAV audio buffer
 */
export async function synthesizeSpeech(text, options = {}) {
  const {
    voiceId = 'emily',
    sampleRate = 24000,
    speed = 1.0,
  } = options;

  const apiKey = process.env.SMALLEST_API_KEY;
  if (!apiKey || apiKey === 'your_smallest_api_key_here') {
    throw new Error('SMALLEST_API_KEY is not configured');
  }

  // Truncate extremely long text to keep latency under control
  const sanitizedText = text.slice(0, 2000);

  const startMs = Date.now();

  const response = await fetch(SMALLEST_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: sanitizedText,
      voice_id: voiceId,
      sample_rate: sampleRate,
      speed,
      add_wav_header: true,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Smallest.ai TTS failed (${response.status}): ${errBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const latencyMs = Date.now() - startMs;

  console.log(`[TTS] Smallest.ai synthesized ${sanitizedText.length} chars in ${latencyMs}ms`);

  return {
    audioBuffer: Buffer.from(arrayBuffer),
    latencyMs,
    charCount: sanitizedText.length,
  };
}
