import React, { useEffect } from 'react';
import styles from './style.module.less';
import { I_GLOBAL_PROPS } from '@Types/index';

interface I_PROPS extends I_GLOBAL_PROPS {

}

const SettingMenuComponent: React.FC<I_PROPS> = ({
    toggleSetting
}) => {
    const id = 'chatStylerSetting';

    useEffect(() => {
        const closeElement = document.getElementById('setbox_close');

        if (closeElement) {
            closeElement.remove();
        }
    }, []);

    useEffect(() => {
        const serviceUtilElement = document.querySelector('.serviceUtil');

        console.log(serviceUtilElement)

        if (!serviceUtilElement) return;

        const existingItem = document.getElementById(id);

        if (existingItem)
            existingItem.remove();

        const newDivElement = document.createElement('div');
        newDivElement.id = id;
        newDivElement.className = styles.SettingMenu;

        console.log(newDivElement)

        const buttonElement = document.createElement('button');
        buttonElement.setAttribute('tip', '채팅 스타일러 설정');

        const spanElement = document.createElement('p');
        spanElement.textContent = 'S';
        buttonElement.appendChild(spanElement);

        newDivElement.appendChild(buttonElement);

        serviceUtilElement.insertBefore(newDivElement, serviceUtilElement.firstChild);

        newDivElement.addEventListener('click', toggleSetting);

        return () => {
            newDivElement.removeEventListener('click', toggleSetting);
        };
    }, []);

    return null;
};

export default SettingMenuComponent;