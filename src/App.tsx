import { useEffect, useRef, useState } from 'react';
import SettingMenu from '@Components/SettingMenu';
import SettingTemplate from '@Templates/SettingTemplate';
import { useMainStore } from './Stores';
import { T_SETTING } from './@types';

const App = () => {
    const mainStore = useMainStore();
    const [isSetting, setIsSetting] = useState(true);
    const chatUpdate = useRef<number | null>(null);

    const toggleSetting = () => {
        setIsSetting((prevIsSetting) => !prevIsSetting);
    };

    const initSetting = () => {
        GM_listValues().map((v) => {
            mainStore.setSetting(v as T_SETTING, GM_getValue(v), false);
        });
    };

    const updateChatMessages = () => {
        const chatArea = document.querySelector('#chat_area');

        if (!chatArea) return;

        const chatItems = chatArea.querySelectorAll('.chatting-list-item');
        const recentChats = Array.from(chatItems).slice(-10); // 최근 10개만 가져옴

        if (recentChats.length <= 1) return;

        recentChats.forEach(chat => {
            const username = chat.querySelector('.username .author')?.textContent || null;

            if (!username) return;

            const message = chat.querySelector('.message-text');
            const id = message?.id || 0;
            const messageText = chat.querySelector('.msg')?.textContent || '';

            console.log(id, username, messageText);

        });
    };

    useEffect(() => {
        initSetting();

        chatUpdate.current = setInterval(() => {
            updateChatMessages();
        }, 500);

        return () => {
            if (chatUpdate.current) clearInterval(chatUpdate.current);
        };
    }, []);

    return (
        <>
            <SettingMenu isSetting={isSetting} toggleSetting={toggleSetting} />
            <SettingTemplate isSetting={isSetting} toggleSetting={toggleSetting} />
        </>
    );
};

export default App;