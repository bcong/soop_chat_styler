import assert from 'node:assert/strict';
import { test } from 'node:test';

const { installSoopPictureInPictureHook, subscribeToSoopPictureInPicture } = await import(
    '../src/Utils/soopPictureInPicture.ts'
);

class FakeVideo {
    nativeRequests = 0;

    requestPictureInPicture() {
        this.nativeRequests++;
        return Promise.resolve({ mode: 'native' });
    }
}

test('routes SOOP PIP requests through the chat PIP handler and falls back to native PIP', async () => {
    const pageWindow = {
        HTMLVideoElement: FakeVideo,
        documentPictureInPicture: {},
    };
    installSoopPictureInPictureHook(pageWindow);

    const video = new FakeVideo();
    const unsubscribe = subscribeToSoopPictureInPicture(async (requestedVideo) => {
        assert.equal(requestedVideo, video);
        return { mode: 'chat' };
    });

    assert.deepEqual(await video.requestPictureInPicture(), { mode: 'chat' });
    unsubscribe();

    assert.deepEqual(await video.requestPictureInPicture(), { mode: 'native' });
    assert.equal(video.nativeRequests, 1);
});
