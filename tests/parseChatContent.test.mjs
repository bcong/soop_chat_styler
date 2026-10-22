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
        children: [element('IMG', { classes: ['emoticon'], attributes: { src } }), text('/WOW_S/')],
    });

test('emoticon-only messages render just the image', () => {
    assert.deepEqual(parseChatContent(element('DIV', { children: [emoticon('emoji.png')] })), [
        { type: 'image', content: 'emoji.png' },
    ]);
});

test('nested emoticons stay in order with surrounding text and spaces', () => {
    assert.deepEqual(
        parseChatContent(
            element('DIV', {
                children: [
                    element('SPAN', {
                        classes: ['text-original'],
                        children: [text('before '), emoticon('emoji.png'), text(' after')],
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
