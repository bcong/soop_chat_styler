import React from 'react';
import ReactDOM from 'react-dom';
import styles from './style.module.less';
import { classes } from '@Utils/index';

interface I_PROPS {
    isSetting: boolean;
    toggleSetting: () => void;
}

const SettingComponent: React.FC<I_PROPS> = ({
    isSetting,
    toggleSetting
}) => {
    const content = (
        <div className={classes(styles.Setting, isSetting ? styles.View : false)}>

        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

export default SettingComponent;