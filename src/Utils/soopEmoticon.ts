import type { I_CONTENT } from '../@types';

type DefaultEmoticonSet = {
    small_url?: string;
    groups?: { emoticons?: { keyword?: string; fileName?: string }[] }[];
};
type SignatureEmoticon = { title?: string; pc_img?: string };

const DEFAULT_API = 'https://st.sooplive.com/api/emoticons.php';
const SIGNATURE_API = 'https://live.sooplive.com/api/signature_emoticon_api.php';
const SIGNATURE_IMAGE_BASE = 'https://static.file.sooplive.com/signature_emoticon';

// 이모티콘 이름(슬래시 제외) → 이미지 주소
const emoticonImages = new Map<string, string>();

const loadDefaultEmoticons = async (): Promise<void> => {
    const body: unknown = await (await fetch(DEFAULT_API)).json();
    const sets = (body as { data?: Record<string, DefaultEmoticonSet> } | null)?.data;
    if (!sets) return;

    Object.values(sets).forEach(({ small_url, groups }) => {
        if (!small_url) return;
        groups?.forEach(({ emoticons }) =>
            emoticons?.forEach(({ keyword, fileName }) => {
                const name = keyword?.replace(/^\/|\/$/g, '');
                if (name && fileName && !emoticonImages.has(name)) emoticonImages.set(name, small_url + fileName);
            }),
        );
    });
};

const loadSignatureEmoticons = async (broadcasterId: string): Promise<void> => {
    const body: unknown = await (
        await fetch(`${SIGNATURE_API}?work=list&szBjId=${encodeURIComponent(broadcasterId)}`)
    ).json();
    const list = (body as { data?: SignatureEmoticon[] } | null)?.data;
    if (!Array.isArray(list)) return;

    list.forEach(({ title, pc_img }) => {
        if (title && pc_img) emoticonImages.set(title, `${SIGNATURE_IMAGE_BASE}/${broadcasterId}/${pc_img}`);
    });
};

export const loadEmoticons = async (broadcasterId: string): Promise<void> => {
    await Promise.allSettled([loadDefaultEmoticons(), broadcasterId ? loadSignatureEmoticons(broadcasterId) : null]);
};

// `/이름/` 코드를 이미지로 바꾼다. `/a//b/`처럼 붙어 있어도 처리하고, 모르는 코드는 글자 그대로 둔다.
export const parseEmoticonComment = (comment: string): I_CONTENT[] => {
    const contents: I_CONTENT[] = [];
    let text = '';
    let index = 0;

    while (index < comment.length) {
        const end = comment[index] === '/' ? comment.indexOf('/', index + 1) : -1;
        const src = end > index + 1 ? emoticonImages.get(comment.slice(index + 1, end)) : undefined;

        if (src) {
            if (text) contents.push({ type: 'text', content: text });
            contents.push({ type: 'image', content: src });
            text = '';
            index = end + 1;
        } else {
            text += comment[index];
            index++;
        }
    }

    if (text) contents.push({ type: 'text', content: text });
    return contents;
};
