import { useEffect, useState } from 'react';
import SettingMenu from '@Components/SettingMenu';
import SettingTemplate from '@Templates/SettingTemplate';
import { useMainStore } from './Stores';
import { T_SETTING } from './@types';

const App = () => {
    const mainStore = useMainStore();
    const [isSetting, setIsSetting] = useState(true);

    const toggleSetting = () => {
        setIsSetting((prevIsSetting) => !prevIsSetting);
    };

    const initSetting = () => {
        GM_listValues().map((v) => {
            mainStore.setSetting(v as T_SETTING, GM_getValue(v), false);
        });
    };

    useEffect(() => {
        initSetting();
    }, []);

    return (
        <>
            <SettingMenu isSetting={isSetting} toggleSetting={toggleSetting} />
            <SettingTemplate isSetting={isSetting} toggleSetting={toggleSetting} />
        </>
    );
};

export default App;