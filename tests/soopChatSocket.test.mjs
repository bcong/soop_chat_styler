import assert from 'node:assert/strict';
import { test } from 'node:test';

const { installSoopChatSocketHook, parseSoopChatPacket, subscribeToSoopChat } = await import(
    '../src/Utils/soopChatSocket.ts'
);

const makePacket = (type, fields) => {
    const payload = `\x0c${fields.join('\x0c')}\x0c`;
    const length = new TextEncoder().encode(payload).length.toString().padStart(6, '0');
    return `\x1d\t${type}${length}00${payload}`;
};

class FakeWebSocket extends EventTarget {
    constructor(url) {
        super();
        this.url = url;
    }

    dispatchMessage(data) {
        const event = new Event('message');
        Object.defineProperty(event, 'data', { value: data });
        this.dispatchEvent(event);
    }
}

const chatPacket = makePacket('0005', ['안녕하세요', 'viewer-id', '', '', '', '시청자']);

test('parses only valid SOOP chat packets', () => {
    assert.deepEqual(parseSoopChatPacket(chatPacket), { username: '시청자', comment: '안녕하세요' });
    assert.deepEqual(
        parseSoopChatPacket(new TextEncoder().encode(chatPacket).buffer),
        { username: '시청자', comment: '안녕하세요' },
    );
    assert.equal(parseSoopChatPacket(makePacket('0104', ['notice'])), null);
    assert.equal(parseSoopChatPacket('not a socket packet'), null);
});

test('hooks initial and reconnected page WebSockets and buffers until subscribed', () => {
    const pageWindow = { WebSocket: FakeWebSocket };
    installSoopChatSocketHook(pageWindow);

    const socket = new pageWindow.WebSocket('wss://socket.example/changed-endpoint');
    socket.dispatchMessage(new TextEncoder().encode(chatPacket).buffer);

    const received = [];
    const unsubscribe = subscribeToSoopChat((chat) => received.push(chat));
    assert.deepEqual(received, [{ username: '시청자', comment: '안녕하세요' }]);

    socket.dispatchEvent(new Event('close'));
    const reconnectedSocket = new pageWindow.WebSocket('wss://socket.example/reconnected-endpoint');
    reconnectedSocket.dispatchMessage(new TextEncoder().encode(chatPacket).buffer);
    assert.deepEqual(received, [
        { username: '시청자', comment: '안녕하세요' },
        { username: '시청자', comment: '안녕하세요' },
    ]);

    unsubscribe();

    const unrelatedSocket = new pageWindow.WebSocket('wss://socket.example/another-endpoint');
    unrelatedSocket.dispatchMessage(chatPacket);
    assert.equal(received.length, 2);
});
