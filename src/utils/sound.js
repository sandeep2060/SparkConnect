// Web Audio API Sound Generator for Dating & Social Notifications
// Zero-dependency pure synthesized audio for messages, friend requests, and accepts

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * 1. Message Sound: Soft, pleasant two-tone chime (587Hz D5 -> 880Hz A5)
 */
export const playMessageSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    console.warn('Message audio notification not allowed or failed:', err);
  }
};

/**
 * 2. Friend Request Sound: Melodic ascending 3-note notification (440Hz -> 554Hz -> 659Hz)
 */
export const playFriendRequestSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25]; // A4, C#5, E5
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    });
  } catch (err) {
    console.warn('Friend request audio notification failed:', err);
  }
};

/**
 * 3. Friend Accept Sound: Joyous triumphant celebration chord (C5 + E5 + G5 + C6)
 */
export const playFriendAcceptSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });
  } catch (err) {
    console.warn('Friend accept audio notification failed:', err);
  }
};

/**
 * Trigger browser push notification if permitted and play corresponding sound
 */
export const triggerBrowserNotification = async (title, body, soundType = 'message', icon = '/favicon.ico') => {
  // Play sound effect
  if (soundType === 'message') {
    playMessageSound();
  } else if (soundType === 'friend_request') {
    playFriendRequestSound();
  } else if (soundType === 'friend_accept') {
    playFriendAcceptSound();
  }

  // Request browser Notification API
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body, icon });
      }
    }
  } catch (e) {
    console.warn('Browser Notification API error:', e);
  }
};
