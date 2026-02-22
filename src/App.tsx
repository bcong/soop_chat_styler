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
    const chatUpdate = useRef<number | null>(null);
    const colorIdxRef = useRef(0);
    const chatAreaRef = useRef<Element | null>(null);

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

    const getChatArea = (): Element | null => {
        if (chatAreaRef.current?.isConnected) return chatAreaRef.current;
        const elements = document.querySelectorAll('#chat_area');
        chatAreaRef.current = elements.length ? elements[elements.length - 1] : null;
        return chatAreaRef.current;
    };

    const updateChatMessages = () => {
        const chatArea = getChatArea();
        if (!chatArea) return;

        const chatItems = chatArea.querySelectorAll('.chatting-list-item');
        const total = chatItems.length;
        if (total <= 1) return;

        const start = Math.max(0, total - mainStore.maxChats * 2);
        let lastId = mainStore.lastChat().id;

        for (let i = start; i < total; i++) {
            const chat = chatItems[i];
            const username = chat.querySelector('.username .author')?.textContent || null;
            const message = chat.querySelector('.message-text');

            if (!username || !message) continue;

            const id = Number(message.id) || 0;
            if (id <= lastId) continue;

            const messageOriginal = message.querySelector('#message-original');
            if (!messageOriginal) continue;

            const contentArray: I_CONTENT[] = [];

            messageOriginal.childNodes.forEach((node: ChildNode) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const textContent = node.textContent?.trim();
                    if (textContent) {
                        contentArray.push({ type: 'text', content: textContent });
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;

                    if (element.tagName === 'IMG') {
                        const imgSrc = (element as HTMLImageElement).getAttribute('src');
                        if (imgSrc) {
                            contentArray.push({ type: 'image', content: imgSrc });
                        }
                    }
                }
            });

            const idx = colorIdxRef.current;
            mainStore.addChat({ id, username, contentArray, color: COLORS[idx] });
            colorIdxRef.current = idx >= COLORS.length - 1 ? 0 : idx + 1;
            lastId = id;
        }
    };

    const checkViewChat = () => {
        const buttonElement = document.querySelector('.view_ctrl .btn_chat') as HTMLLIElement;

        if (!buttonElement) return;

        const computedStyle = window.getComputedStyle(buttonElement) as CSSStyleDeclaration;
        const button = buttonElement.querySelector('button') as HTMLButtonElement;

        if (!button) return;

        computedStyle.display == 'block' && button.click();
    };

    useEffect(() => {
        initSetting();
        checkViewChat();

        chatUpdate.current = setInterval(() => {
            updateChatMessages();
            checkViewChat();
        }, 500);

        return () => {
            if (chatUpdate.current) clearInterval(chatUpdate.current);
            chatAreaRef.current = null;
        };
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
