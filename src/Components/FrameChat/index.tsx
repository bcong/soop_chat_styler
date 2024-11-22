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
    const frameFontSize = mainStore.setting.get('frame_font_size');
    const frameBackground = mainStore.setting.get('frame_background');
    const frameOffset = mainStore.setting.get('frame_offset');

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
            const fontSize = `${frameFontSize}px`;

            const userNameElem = (
                <div className={styles.Username}>
                    <p style={{
                        color: frameRandomUsername ? color : '#9dd9a5',
                        fontSize: fontSize
                    }}>
                        {username}
                    </p>
                </div>
            );

            const messageElem = (
                <div className={styles.Message}>
                    <p style={{
                        fontSize: fontSize
                    }}>
                        {messageText}
                    </p>
                </div>
            );

            return (
                <div key={id}
                    className={classes(styles.Chat,
                        frameChatBackground ? styles.Background : false,
                        frameSortChatMessages ? styles.Sorted : false
                    )}
                    style={{
                        width: `${frameViewWidth}px`,
                    }}
                >
                    <div className={styles.MessageContainer}
                        style={{
                            background: background
                        }}>
                        {userNameElem}
                        {messageElem}
                    </div>
                </div>
            );
        });

    let frameChatPositionCls = '', frameChatDegree;
    switch (frameChatPosition) {
        case 0:
            frameChatPositionCls = styles.LeftTop;
            frameChatDegree = 180;
            break;
        case 1:
            frameChatPositionCls = styles.LeftBottom;
            frameChatDegree = 0;
            break;
        case 2:
            frameChatPositionCls = styles.RightTop;
            frameChatDegree = 180;
            break;
        case 3:
            frameChatPositionCls = styles.RightBottom;
            frameChatDegree = 0;
            break;
    }

    const chatBackgroundStyle = `linear-gradient(${frameChatDegree}deg, rgba(0, 0, 0, ${frameBackgroundOpacity}%) ${frameBackgroundArea}%, rgba(0, 0, 0, 0) 100%)`;

    return playerSizeDiv ? ReactDOM.createPortal(
        <div
            className={classes(styles.FrameChat, frameChatPositionCls)}
            style={{
                background: frameBackground ? chatBackgroundStyle : '',
                padding: `${frameOffset}px`
            }}>
            {chatsElem}
        </div>,
        playerSizeDiv
    ) : null;
});

export default FrameChat;