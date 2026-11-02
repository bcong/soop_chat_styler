import assert from 'node:assert/strict';
import { test } from 'node:test';

const { isSoopBroadcastRoom } = await import('../src/Utils/index.ts');

test('recognizes live and offline SOOP broadcast room routes only', () => {
    const isRoom = (hostname, pathname) => isSoopBroadcastRoom({ hostname, pathname });

    assert.equal(isRoom('play.sooplive.com', '/joey1114/298274325'), true);
    assert.equal(isRoom('play.sooplive.com', '/joey1114/null'), true);
    assert.equal(isRoom('play.sooplive.com', '/LIVE/null'), false);
    assert.equal(isRoom('play.sooplive.com', '/joey1114'), false);
    assert.equal(isRoom('www.sooplive.com', '/joey1114/298274325'), false);
    assert.equal(isRoom('www.sooplive.com', '/'), false);
});
