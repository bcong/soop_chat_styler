import { useEffect, useRef, useState } from 'react';
import SettingMenu from '@Components/SettingMenu';
import SettingTemplate from '@Templates/SettingTemplate';
import { useMainStore } from './Stores';
import { I_CONTENT, T_SETTING } from './@types';
import ChatTemplate from '@Templates/ChatTemplate';

const COLORS = ['#f28ca5', '#9dd9a5', '#fff08c', '#a1b1eb', '#fac098', '#c88ed9', '#a2f7f7', '#f798f2', '#ddfa85'];

const App = () => {
    const mainStore = useMainStore();
    const [isSetting, IsSetting] = useState(false);
    const [isInit, IsInit] = useState(false);
    const colorIdxRef = useRef(0);
    const processedChats = useRef(new WeakSet<Element>());
    const chatObserver = useRef<MutationObserver | null>(null);
    const observedChatArea = useRef<Element | null>(null);
    const retryTimer = useRef<number | null>(null);

    const toggleSetting = () => {
        IsSetting((prevIsSetting) => !prevIsSetting);
    };

    const initSetting = () => {
        const storedKeys = GM_listValues();
        const broadcasterId = mainStore.broadcasterId;

        // 공통 설정 로드
        storedKeys.forEach((v) => {
            mainStore.setSetting(v as T_SETTING, GM_getValue(v), false);
        });

        // broadcaster-specific 설정: 개별 저장값이 있으면 덮어쓰기
        mainStore.broadcasterSpecificSettings.forEach((key) => {
            if (!broadcasterId) return;
            const broadcasterKey = `${key}_${broadcasterId}`;
            const value = GM_getValue(broadcasterKey);
            if (value !== undefined) {
                mainStore.setSetting(key as T_SETTING, value, false);
            }
        });

        mainStore.addChat({
            id: -1,
            username: '제작자',
            contentArray: [{ type: 'text', content: '비콩 (github.com/bcong)' }],
            color: '#e9ab00',
        });
        IsInit(true);
    };

    const processChatItem = (chat: Element) => {
        if (processedChats.current.has(chat)) return;

        const username = chat.querySelector('.username .author')?.textContent || null;
        const message = chat.querySelector('.message-text');

        if (!username || !message) return;

        const messageOriginal = message.querySelector('#message-original') ?? message;

        processedChats.current.add(chat);

        const contentArray: I_CONTENT[] = [];
        messageOriginal.childNodes.forEach((node: ChildNode) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent?.trim();
                if (textContent) contentArray.push({ type: 'text', content: textContent });
            } else if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'IMG') {
                const imgSrc = (node as HTMLImageElement).getAttribute('src');
                if (imgSrc) contentArray.push({ type: 'image', content: imgSrc });
            }
        });

        if (contentArray.length === 0) return;

        const idx = colorIdxRef.current;
        mainStore.addChat({ id: mainStore.chatId + 1, username, contentArray, color: COLORS[idx] });
        colorIdxRef.current = idx >= COLORS.length - 1 ? 0 : idx + 1;
    };

    const disconnectObserver = () => {
        if (chatObserver.current) {
            chatObserver.current.disconnect();
            chatObserver.current = null;
        }
        observedChatArea.current = null;
    };

    const observeChatArea = () => {
        const elements = document.querySelectorAll('#chat_area');
        const chatArea = elements.length ? elements[elements.length - 1] : null;

        if (!chatArea) {
            retryTimer.current = window.setTimeout(observeChatArea, 1000);
            return;
        }

        if (observedChatArea.current === chatArea) return;

        disconnectObserver();
        observedChatArea.current = chatArea;

        chatArea.querySelectorAll('.chatting-list-item').forEach(processChatItem);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type !== 'childList') continue;
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    const elem = node as Element;
                    if (elem.matches('.chatting-list-item')) {
                        processChatItem(elem);
                    } else {
                        elem.querySelectorAll('.chatting-list-item').forEach(processChatItem);
                    }
                });
            }
        });

        observer.observe(chatArea, { childList: true, subtree: true });
        chatObserver.current = observer;
    };

    const checkViewChat = () => {
        const buttonElement = document.querySelector('.view_ctrl .btn_chat') as HTMLLIElement;
        if (!buttonElement) return;
        const computedStyle = window.getComputedStyle(buttonElement);
        const button = buttonElement.querySelector('button') as HTMLButtonElement;
        if (!button) return;
        if (computedStyle.display === 'block') button.click();
    };

    useEffect(() => {
        initSetting();
        checkViewChat();
        observeChatArea();

        const fallbackTimer = setInterval(observeChatArea, 3000);
        const viewChatTimer = setInterval(checkViewChat, 2000);

        return () => {
            clearInterval(fallbackTimer);
            clearInterval(viewChatTimer);
            if (retryTimer.current) clearTimeout(retryTimer.current);
            disconnectObserver();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        isInit && (
            <>
                <SettingMenu isSetting={isSetting} toggleSetting={toggleSetting} />
                <SettingTemplate isSetting={isSetting} toggleSetting={toggleSetting} />
                <ChatTemplate />
            </>
        )
    );
};

export default App;
