import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

export const useSettingsStore = defineStore('settings', () => {
  const soundEnabled = useLocalStorage('factopia_sound_enabled', true);

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value;
  }

  return {
    soundEnabled,
    toggleSound,
  };
});
