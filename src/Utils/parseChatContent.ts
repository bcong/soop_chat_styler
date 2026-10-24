import type { I_CONTENT } from '../@types';

export const parseChatContent = (message: Element): I_CONTENT[] => {
    const contentArray: I_CONTENT[] = [];

    const appendContent = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent) {
                const previousContent = contentArray.at(-1);
                if (previousContent?.type === 'text') previousContent.content += node.textContent;
                else contentArray.push({ type: 'text', content: node.textContent });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.classList.contains('message-translation')) {
                return;
            } else if (element.classList.contains('emoticon-box')) {
                const imageSrc = element.querySelector('img.emoticon')?.getAttribute('src');
                if (imageSrc) contentArray.push({ type: 'image', content: imageSrc });
            } else if (element.tagName === 'IMG') {
                const imageSrc = element.getAttribute('src');
                if (imageSrc) contentArray.push({ type: 'image', content: imageSrc });
            } else {
                element.childNodes.forEach(appendContent);
            }
        }
    };

    message.childNodes.forEach(appendContent);
    const hasImage = contentArray.some((content) => content.type === 'image');

    return contentArray.flatMap((content) => {
        if (content.type !== 'text' || !hasImage) return [content];

        const text = content.content
            .replace(/(^|\s)\/[^/\s]+\/(?=\s|$)/g, '$1')
            .replace(/\s+/g, ' ');
        return text ? [{ type: 'text', content: text }] : [];
    });
};
