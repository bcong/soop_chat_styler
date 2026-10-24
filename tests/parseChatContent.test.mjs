import assert from 'node:assert/strict';
import { test } from 'node:test';

globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
const { parseChatContent } = await import('../src/Utils/parseChatContent.ts');

const text = (textContent) => ({ nodeType: 3, textContent });

const element = (tagName, { classes = [], children = [], attributes = {} } = {}) => ({
    nodeType: 1,
    tagName,
    classList: { contains: (name) => classes.includes(name) },
    childNodes: children,
    getAttribute: (name) => attributes[name] ?? null,
    querySelector: (selector) => {
        if (selector !== 'img.emoticon') return null;
        const pending = [...children];
        while (pending.length) {
            const node = pending.shift();
            if (node.nodeType !== 1) continue;
            if (node.tagName === 'IMG' && node.classList.contains('emoticon')) return node;
            pending.push(...node.childNodes);
        }
        return null;
    },
});

const emoticon = (src) =>
    element('SPAN', {
        classes: ['emoticon-box'],
        children: [element('IMG', { classes: ['emoticon'], attributes: { src } }), text('/fallback_emote/')],
    });

test('emoticon-only messages render just the image', () => {
    assert.deepEqual(parseChatContent(element('DIV', { children: [emoticon('emoji.png')] })), [
        { type: 'image', content: 'emoji.png' },
    ]);
});

test('message translation copy button is not included in chat content', () => {
    const message = element('DIV', {
        classes: ['message-text'],
        children: [
            emoticon('emoji.png'),
            element('DIV', {
                classes: ['message-translation'],
                children: [
                    element('P', { classes: ['msg'] }),
                    element('BUTTON', { classes: ['btn-border'], children: [text('원문 복사')] }),
                ],
            }),
        ],
    });

    assert.deepEqual(parseChatContent(message), [{ type: 'image', content: 'emoji.png' }]);
});

test('emoticon commands with any name are removed when an image is present', () => {
    assert.deepEqual(
        parseChatContent(
            element('DIV', {
                children: [
                    element('SPAN', {
                        classes: ['text-original'],
                        children: [text('before /first_emote/ '), emoticon('emoji.png'), text(' /second_emote/ after')],
                    }),
                ],
            }),
        ),
        [
            { type: 'text', content: 'before ' },
            { type: 'image', content: 'emoji.png' },
            { type: 'text', content: ' after' },
        ],
    );
});

test('slash-wrapped text remains when there is no image', () => {
    assert.deepEqual(parseChatContent(element('DIV', { children: [text('/literal_text/')] })), [
        { type: 'text', content: '/literal_text/' },
    ]);
});
