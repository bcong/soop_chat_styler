import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './style.module.less';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { classes } from '@Utils/index';

const FrameChat = observer(() => {
    const mainStore = useMainStore();
    const [playerSizeDiv, setPlayerSizeDiv] = useState<Element | null>(null);
    const frameChatPosition = mainStore.setting.get('frame_chat_position');
    const frameRandomUsername = mainStore.setting.get('frame_random_username');
    const frameViewCount = mainStore.setting.get('frame_view_count');
    const frameChatOpacity = mainStore.setting.get('frame_chat_opacity');
    const frameBackgroundOpacity = mainStore.setting.get('frame_background_opacity');
    const frameBackgroundArea = mainStore.setting.get('frame_background_area');
    const frameChatBackground = mainStore.setting.get('frame_chat_background');
    const frameViewWidth = mainStore.setting.get('frame_view_width');
    const frameSortChatMessages = mainStore.setting.get('frame_sort_chat_messages');

    useEffect(() => {
        const div = document.querySelector('#videoLayer');
        if (div) {
            setPlayerSizeDiv(div);
        }
    }, []);

    const chatsElem = mainStore.chats
        .slice(-frameViewCount)
        .map(({ id, username, messageText, color }) => {
            const background = frameChatBackground ? `rgba(0, 0, 0, ${frameChatOpacity}%)` : '';

            const userNameElem = (
                <p className={styles.Username} style={{
                    width: frameSortChatMessages ? '130px' : '',
                    color: frameRandomUsername ? color : '#9dd9a5',
                    background: background
                }}>
                    {username}
                </p>
            );

            const messageElem = (
                <p className={styles.Message} style={{ background: background }}>
                    {messageText}
                </p>
            );

            return (
                <div key={id} className={classes(styles.Chat, frameChatBackground ? styles.Background : false)}>
                    {userNameElem}
                    {messageElem}
                </div>
            );
        });

    let frameChatPositionCls = '', frameChatDegree, frameWidth;
    switch (frameChatPosition) {
        case 0:
            frameChatPositionCls = styles.Top;
            frameChatDegree = 180;
            frameWidth = `100%`;
            break;
        case 1:
            frameChatPositionCls = styles.Bottom;
            frameChatDegree = 0;
            frameWidth = `100%`;
            break;
        case 2:
            frameChatPositionCls = styles.Left;
            frameChatDegree = 90;
            frameWidth = `${frameViewWidth}px`;
            break;
        case 3:
            frameChatPositionCls = styles.Right;
            frameChatDegree = 270;
            frameWidth = `${frameViewWidth}px`;
            break;
    }

    const frameChatBackgroundStyle = `linear-gradient(${frameChatDegree}deg, rgba(0, 0, 0, ${frameBackgroundOpacity}%) ${frameBackgroundArea}%, rgba(0, 0, 0, 0) 100%)`;

    return playerSizeDiv ? ReactDOM.createPortal(
        <div className={classes(styles.FrameChat, frameChatPositionCls)} style={{ background: frameChatBackgroundStyle, width: frameWidth }}>
            {chatsElem}
        </div>,
        playerSizeDiv
    ) : null;
});

export default FrameChat;