import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStudioStore } from './studio.store';

describe('studio.store', () => {
  beforeEach(() => {
    useStudioStore.setState({
      activeBookId: null,
      activeChapterId: null,
      editingSpeechId: null,
      editingText: '',
      isDirty: false,
      lastSavedAt: null,
    });
  });

  it('should set active book and chapter', () => {
    useStudioStore.getState().setActiveBook('book-1');
    useStudioStore.getState().setActiveChapter('chapter-1');

    expect(useStudioStore.getState().activeBookId).toBe('book-1');
    expect(useStudioStore.getState().activeChapterId).toBe('chapter-1');
  });

  it('should mark editing text as dirty', () => {
    useStudioStore.getState().startEditingSpeech('speech-1', 'texto');
    useStudioStore.getState().updateEditingText('novo texto');

    expect(useStudioStore.getState().editingSpeechId).toBe('speech-1');
    expect(useStudioStore.getState().editingText).toBe('novo texto');
    expect(useStudioStore.getState().isDirty).toBe(true);
  });

  it('should update lastSavedAt and clean dirty flag', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));

    useStudioStore.setState({ isDirty: true });
    useStudioStore.getState().updateLastSavedAt();

    expect(useStudioStore.getState().isDirty).toBe(false);
    expect(useStudioStore.getState().lastSavedAt).toEqual(new Date('2026-01-01T12:00:00.000Z'));

    vi.useRealTimers();
  });
});
