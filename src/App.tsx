import { useEffect, useState } from 'react';
import SettingMenu from '@Components/SettingMenu';
import SettingTemplate from '@Templates/SettingTemplate';
import { useMainStore } from './Stores';
import { T_SETTING } from './@types';
import ChatTemplate from '@Templates/ChatTemplate';

const App = () => {
    const mainStore = useMainStore();
    const [isSetting, IsSetting] = useState(false);
    const [isInit, IsInit] = useState(false);

    const toggleSetting = () => {
        IsSetting((prevIsSetting) => !prevIsSetting);
    };

    const initSetting = () => {
        GM_listValues().map((v) => {
            mainStore.setSetting(v as T_SETTING, GM_getValue(v), false);
        });
        mainStore.addChat({ id: -1, username: '제작자', contentArray: [{ type: 'text', content: '비콩 (github.com/bcong)' }], color: '#e9ab00' });
        IsInit(true);
    };

    useEffect(() => {
        initSetting();
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