import React, { useEffect } from 'react';
import styles from './style.module.less';
import { I_GLOBAL_PROPS } from '@Types/index';

interface I_PROPS extends I_GLOBAL_PROPS {

}

const SettingMenuComponent: React.FC<I_PROPS> = ({
    toggleSetting
}) => {
    useEffect(() => {
        const chatTitleElement = document.querySelector('.chat_title ul');
        if (!chatTitleElement) return;

        const listItemElement = document.createElement('li');
        listItemElement.className = styles.SettingMenu;

        const anchorElement = document.createElement('a');
        anchorElement.setAttribute('tip', '채팅 스타일러 설정');

        const paragraphElement = document.createElement('p');
        paragraphElement.textContent = 'S';

        anchorElement.appendChild(paragraphElement);
        listItemElement.appendChild(anchorElement);

        chatTitleElement.insertBefore(listItemElement, chatTitleElement.firstChild);

        listItemElement.addEventListener('click', toggleSetting);

        return () => {
            listItemElement.removeEventListener('click', toggleSetting);
        };
    }, []);

    return null;
};

export default SettingMenuComponent;