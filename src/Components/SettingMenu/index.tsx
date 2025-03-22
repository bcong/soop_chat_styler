import React, { useEffect } from 'react';
import styles from './style.module.less';
import { I_GLOBAL_PROPS } from '@Types/index';
import { useMainStore } from '@Stores/index';

interface I_PROPS extends I_GLOBAL_PROPS {

}

const SettingMenuComponent: React.FC<I_PROPS> = ({
    toggleSetting
}) => {
    const mainStore = useMainStore();
    const id = 'chatStylerSetting';

    const addViewChat = () => {
        const isAdd = document.getElementById('new_btn_chat');

        if (isAdd) return;

        const oldElements = document.getElementsByClassName("btn_chat");

        if (oldElements.length > 0) {
            const oldElement = oldElements[0];

            if (oldElement && oldElement.parentElement) {
                const newLiElement = document.createElement("li");
                newLiElement.className = "btn_chat";
                newLiElement.style.display = 'block';
                newLiElement.id = "new_btn_chat";

                const newButtonElement = document.createElement("button");
                newButtonElement.type = "button";

                const newSpanElement = document.createElement("span");
                newSpanElement.textContent = "test 채팅창 on/off";

                newButtonElement.appendChild(newSpanElement);

                newLiElement.onclick = () => {
                    mainStore.setSetting("defalut_chat_enable", !mainStore.setting.get("defalut_chat_enable"), true);
                };

                newLiElement.appendChild(newButtonElement);

                oldElement.parentElement.insertBefore(newLiElement, oldElement.nextSibling);
            } else {
                console.error("btn_chat 클래스를 가진 요소의 부모를 찾을 수 없습니다.");
            }
        } else {
            console.error("btn_chat 클래스를 가진 요소를 찾을 수 없습니다.");
        }
    };

    const addViewChatBox = () => {
        const isAdd = document.getElementById('new_setbox_close');

        if (isAdd) return;

        const oldElement = document.getElementById("setbox_close");

        if (oldElement && oldElement.parentElement) {
            oldElement.style.display = 'none';

            const newLiElement = document.createElement("li");
            newLiElement.className = "close";
            newLiElement.id = "new_setbox_close";

            const newAnchorElement = document.createElement("a");
            newAnchorElement.className = "tip-right";
            newAnchorElement.setAttribute("tip", "닫기");
            newAnchorElement.textContent = "새로운 채팅 영역 숨기기";

            newLiElement.appendChild(newAnchorElement);

            newLiElement.onclick = () => {
                mainStore.setSetting('defalut_chat_enable', !mainStore.setting.get('defalut_chat_enable'), true);
            };

            oldElement.parentElement.insertBefore(newLiElement, oldElement.nextSibling);
        } else {
            console.error("setbox_close 요소 또는 부모 요소를 찾을 수 없습니다.");
        }
    };

    useEffect(() => {
        addViewChat();
        addViewChatBox();
    }, []);

    useEffect(() => {
        const checkAndInsertElement = () => {
            const serviceUtilElement = document.querySelector('.serviceUtil');

            if (!serviceUtilElement) {
                setTimeout(checkAndInsertElement, 1000);
                return;
            }

            const existingItem = document.getElementById(id);

            if (existingItem)
                existingItem.remove();

            const newDivElement = document.createElement('div');
            newDivElement.id = id;
            newDivElement.className = styles.SettingMenu;

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
        };

        checkAndInsertElement();
    }, []);

    return null;
};

export default SettingMenuComponent;