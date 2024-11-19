import { useEffect, useRef, useState } from 'react';
import SettingMenu from '@Components/SettingMenu';
import SettingTemplate from '@Templates/SettingTemplate';
import { useMainStore } from './Stores';
import { T_SETTING } from './@types';
import ChatTemplate from '@Templates/ChatTemplate';

const App = () => {
    const mainStore = useMainStore();
    const [isSetting, IsSetting] = useState(false);
    const [isInit, IsInit] = useState(false);
    const chatUpdate = useRef<number | null>(null);

    const toggleSetting = () => {
        IsSetting((prevIsSetting) => !prevIsSetting);
    };

    const initSetting = () => {
        GM_listValues().map((v) => {
            mainStore.setSetting(v as T_SETTING, GM_getValue(v), false);
        });
        mainStore.addChat({ id: -1, username: '제작자', messageText: '비콩' });
        IsInit(true);
    };

    const updateChatMessages = () => {
        const chatArea = document.querySelector('#chat_area');

        if (!chatArea) return;

        const chatItems = chatArea.querySelectorAll('.chatting-list-item');
        const recentChats = Array.from(chatItems).slice(-10);

        if (recentChats.length <= 1) return;

        recentChats.forEach(chat => {
            const username = chat.querySelector('.username .author')?.textContent || null;
            const message = chat.querySelector('.message-text');

            if (!username || !message) return;

            const id = Number(message?.id) || 0;
            const messageText = chat.querySelector('.msg')?.textContent || '';

            mainStore.addChat({ id, username, messageText });
        });
    };

    useEffect(() => {
        initSetting();

        chatUpdate.current = setInterval(() => {
            updateChatMessages();
        }, 300);

        return () => {
            if (chatUpdate.current) clearInterval(chatUpdate.current);
        };
    }, []);

    return (
        isInit && <>
            <SettingMenu isSetting={isSetting} toggleSetting={toggleSetting} />
            <SettingTemplate isSetting={isSetting} toggleSetting={toggleSetting} />
            <ChatTemplate />
        </>
    );
};

export default App;