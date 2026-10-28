/**
 * Web Audio synthesizer for original retro sounds:
 * - Authentic MSN Messenger incoming message sound ("Ding-doodle-ling" chime)
 * - Authentic MSN Messenger Nudge / Zumbido ("Double-thump bass + mechanical rattle")
 * - Original sent pop / blip
 * - Room entrance chime
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('oki_chat_muted') === 'true';
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('oki_chat_muted', muted ? 'true' : 'false');
}

/**
 * Sonido ORIGINAL de mensaje entrante de MSN Messenger (El clásico "ding-doodle-ling" chime)
 */
export function playReceiveSound(): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Nota 1 (G5 - 783.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Nota 2 (C6 - 1046.50 Hz) después de 70ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.07);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.28, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.46);

    // Nota 3 armónica de campana brillante (E6 - 1318.51 Hz) después de 140ms
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1318.51, now + 0.14);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.2, now + 0.14);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.14);
    osc3.stop(now + 0.61);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

/**
 * Auténtico TIMBRE / ZUMBIDO (NUDGE) de MSN Messenger
 * Con su característico doble golpe grave ("thump-thump") y vibración metálica
 */
export function playMsnNudgeSound(): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Primer golpe grave (Sub-bass thump 90Hz -> 45Hz)
    const sub1 = ctx.createOscillator();
    const subGain1 = ctx.createGain();
    sub1.type = 'sine';
    sub1.frequency.setValueAtTime(95, now);
    sub1.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    subGain1.gain.setValueAtTime(0.5, now);
    subGain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    sub1.connect(subGain1);
    subGain1.connect(ctx.destination);
    sub1.start(now);
    sub1.stop(now + 0.15);

    // Segundo golpe grave más potente (a los 130ms)
    const sub2 = ctx.createOscillator();
    const subGain2 = ctx.createGain();
    sub2.type = 'triangle';
    sub2.frequency.setValueAtTime(110, now + 0.13);
    sub2.frequency.exponentialRampToValueAtTime(45, now + 0.32);
    subGain2.gain.setValueAtTime(0.001, now);
    subGain2.gain.setValueAtTime(0.65, now + 0.13);
    subGain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    sub2.connect(subGain2);
    subGain2.connect(ctx.destination);
    sub2.start(now + 0.13);
    sub2.stop(now + 0.36);

    // Ruido / Rattle metálico de resorte (vibración clásica de la ventana)
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Simular impulsos rápidos periódicos tipo resorte vibrando
      const t = i / ctx.sampleRate;
      const pulse = Math.sin(2 * Math.PI * 45 * t);
      data[i] = (Math.random() * 2 - 1) * Math.abs(pulse) * Math.exp(-t * 8);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(420, now);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.05);
    noise.stop(now + 0.42);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

/**
 * Sonido al enviar un mensaje propio (suave blip/pop de confirmación)
 */
export function playSentSound(): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.07);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

/**
 * Sonido de entrada a la sala ("Ding" de campana retro)
 */
export function playEnterRoomSound(): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(987.77, now + 0.08); // B5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}
