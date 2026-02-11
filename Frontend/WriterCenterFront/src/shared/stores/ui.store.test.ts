import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './ui.store';

describe('ui.store', () => {
  beforeEach(() => {
    useUIStore.setState({
      leftSidebarOpen: true,
      rightPanelOpen: false,
      rightPanelType: null,
      focusMode: false,
      selectedSpeechIds: [],
    });
  });

  it('should toggle left sidebar state', () => {
    useUIStore.getState().toggleLeftSidebar();
    expect(useUIStore.getState().leftSidebarOpen).toBe(false);
  });

  it('should open right panel with specific type', () => {
    useUIStore.getState().openRightPanel('ai');

    expect(useUIStore.getState().rightPanelOpen).toBe(true);
    expect(useUIStore.getState().rightPanelType).toBe('ai');
  });

  it('should toggle speech selection list', () => {
    useUIStore.getState().toggleSpeechSelection('speech-1');
    expect(useUIStore.getState().selectedSpeechIds).toEqual(['speech-1']);

    useUIStore.getState().toggleSpeechSelection('speech-1');
    expect(useUIStore.getState().selectedSpeechIds).toEqual([]);
  });
});
