import { useState } from 'react';
import SettingMenu from './Components/SettingMenu';
import Setting from './Components/Setting';

const App = () => {
    const [isSetting, setIsSetting] = useState(true);

    const toggleSetting = () => {
        setIsSetting((prevIsSetting) => !prevIsSetting);
    };

    return (
        <div>
            <SettingMenu isSetting={isSetting} toggleSetting={toggleSetting} />
            <Setting isSetting={isSetting} toggleSetting={toggleSetting} />
        </div>
    );
};

export default App;