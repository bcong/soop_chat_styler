import type { I_CONTENT } from '../@types';

type SignatureEmoticon = { title: string; pc_img: string };

const SIGNATURE_API = 'https://live.sooplive.com/api/signature_emoticon_api.php';
const SIGNATURE_IMAGE_BASE = 'https://static.file.sooplive.com/signature_emoticon';
const EMOTICON_CODE = /(^|\s)\/([^/\s]+)\/(?=\s|$)/g;

const emoticonImages = new Map<string, string>();

export const loadSignatureEmoticons = async (broadcasterId: string): Promise<void> => {
    if (!broadcasterId) return;

    const response = await fetch(`${SIGNATURE_API}?work=list&szBjId=${encodeURIComponent(broadcasterId)}`);
    const body: unknown = await response.json();
    const list = (body as { data?: SignatureEmoticon[] } | null)?.data;
    if (!Array.isArray(list)) return;

    list.forEach(({ title, pc_img }) => {
        if (title && pc_img) emoticonImages.set(title, `${SIGNATURE_IMAGE_BASE}/${broadcasterId}/${pc_img}`);
    });
};

// `/이름/` 형태의 이모티콘 코드를 이미지로 바꾼다 (모르는 코드는 글자 그대로 둔다)
export const parseEmoticonComment = (comment: string): I_CONTENT[] => {
    const contents: I_CONTENT[] = [];
    let lastIndex = 0;

    const pushText = (text: string) => {
        if (text) contents.push({ type: 'text', content: text });
    };

    for (const match of comment.matchAll(EMOTICON_CODE)) {
        const src = emoticonImages.get(match[2]);
        if (!src) continue;

        pushText(comment.slice(lastIndex, match.index) + match[1]);
        contents.push({ type: 'image', content: src });
        lastIndex = match.index + match[0].length;
    }

    pushText(comment.slice(lastIndex));
    return contents;
};
