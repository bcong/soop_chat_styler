import assert from 'node:assert/strict';
import { test } from 'node:test';

const { getFullscreenElement, subscribeToFullscreenChange } = await import('../src/Utils/fullscreen.ts');

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

test('detects SOOP fullscreen mode from the body class', () => {
    const body = { classList: { contains: (className) => className === 'fullScreen_mode' } };

    assert.equal(getFullscreenElement({ fullscreenElement: null, body }), body);
});
