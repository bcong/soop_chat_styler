import assert from 'node:assert/strict';
import { test } from 'node:test';

const { subscribeToFullscreenChange } = await import('../src/Utils/fullscreen.ts');

class FakeDocument extends EventTarget {
    fullscreenElement = null;
}

test('reports fullscreen entry and exit, then unsubscribes', () => {
    const document = new FakeDocument();
    const states = [];
    const unsubscribe = subscribeToFullscreenChange((isFullscreen) => states.push(isFullscreen), document);

    document.fullscreenElement = {};
    document.dispatchEvent(new Event('fullscreenchange'));
    document.fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    unsubscribe();
    document.fullscreenElement = {};
    document.dispatchEvent(new Event('fullscreenchange'));

    assert.deepEqual(states, [false, true, false]);
});
