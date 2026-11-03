import assert from 'node:assert/strict';
import { test } from 'node:test';

const { getChatVisibilityMode, isChatAllowedInMode, toggleChatVisibility } = await import(
    '../src/Utils/chatVisibility.ts'
);

test('allows PIP chat when fullscreen-only is enabled outside fullscreen', () => {
    assert.equal(isChatAllowedInMode(true, false, true), true);
    assert.equal(isChatAllowedInMode(true, false, false), false);
    assert.equal(isChatAllowedInMode(false, false, false), true);
});

test('selects independent visibility modes for normal, fullscreen, and PIP', () => {
    assert.equal(getChatVisibilityMode(false, false), 'normal');
    assert.equal(getChatVisibilityMode(false, true), 'fullscreen');
    assert.equal(getChatVisibilityMode(true, true), 'pip');

    const initialVisibility = { normal: true, fullscreen: true, pip: true };
    const afterNormalToggle = toggleChatVisibility(initialVisibility, 'normal');
    assert.deepEqual(afterNormalToggle, { normal: false, fullscreen: true, pip: true });

    const afterFullscreenToggle = toggleChatVisibility(afterNormalToggle, 'fullscreen');
    assert.deepEqual(afterFullscreenToggle, { normal: false, fullscreen: false, pip: true });

    const afterPipToggle = toggleChatVisibility(afterFullscreenToggle, 'pip');
    assert.deepEqual(afterPipToggle, { normal: false, fullscreen: false, pip: false });
});
