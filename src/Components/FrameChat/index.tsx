import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './style.module.less';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { classes } from '@Utils/index';

type Props = {
    pipTarget?: HTMLElement;
};

const FrameChat = observer(({ pipTarget }: Props) => {
    const mainStore = useMainStore();
    const [playerSizeDiv, setPlayerSizeDiv] = useState<Element | null>(pipTarget ?? document.body);
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
    const frameOffsetX = mainStore.setting.get('frame_offset_x');
    const frameOffsetY = mainStore.setting.get('frame_offset_y');
    const showNicknames = mainStore.setting.get('show_nicknames');

    useEffect(() => {
        if (pipTarget) {
            setPlayerSizeDiv(pipTarget);
            return;
        }

        const updatePlayerTarget = () => {
            const videoLayer = document.querySelector('#videoLayer');
            let isVisible = !!videoLayer?.getClientRects().length;

            for (let ancestor = videoLayer; isVisible && ancestor; ancestor = ancestor.parentElement) {
                const { display, visibility, opacity } = window.getComputedStyle(ancestor);
                if (display === 'none' || visibility === 'hidden' || opacity === '0') isVisible = false;
            }

            const target = isVisible && videoLayer ? videoLayer : document.body;
            setPlayerSizeDiv((current) => current === target ? current : target);
        };

        const observer = new MutationObserver((mutations) => {
            const videoLayer = document.querySelector('#videoLayer');
            const playerTargetChanged = mutations.some((mutation) => {
                if (mutation.type === 'attributes') {
                    return videoLayer !== null && mutation.target instanceof Element &&
                        (mutation.target === videoLayer || mutation.target.contains(videoLayer));
                }

                return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
                    if (!(node instanceof Element)) return false;
                    return node.id === 'videoLayer' ||
                        (videoLayer ? node.contains(videoLayer) : node.querySelector('#videoLayer') !== null);
                });
            });

            if (playerTargetChanged) updatePlayerTarget();
        });

        updatePlayerTarget();
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden'],
        });
        return () => observer.disconnect();
    }, [pipTarget]);

    const chatsElem = mainStore.chats.slice(-frameViewCount).map(({ id, username, contentArray, color }) => {
        const background = frameChatBackground ? `rgba(0, 0, 0, ${frameChatOpacity}%)` : '';
        const fontSize = `${frameFontSize}px`;

        const userNameElem = (
            <div className={styles.Username}>
                <p
                    style={{
                        color: frameRandomUsername ? color : '#9dd9a5',
                        fontSize: fontSize,
                    }}>
                    {username}
                </p>
            </div>
        );

        const messageContent = contentArray.map((content, index) => {
            if (content.type == 'image') {
                return <img key={index} src={content.content} style={{ width: fontSize, height: fontSize }} />;
            } else {
                return (
                    <p style={{ fontSize: fontSize }} key={index}>
                        {content.content}
                    </p>
                );
            }
        });

        const messageElem = <div className={styles.Message}>{messageContent}</div>;

        return (
            <div
                key={id}
                className={classes(
                    styles.Chat,
                    frameChatBackground ? styles.Background : false,
                    frameSortChatMessages ? styles.Sorted : false,
                )}
                style={{
                    width: `${frameViewWidth}px`,
                }}>
                <div
                    className={styles.MessageContainer}
                    style={{
                        background: background,
                    }}>
                    {showNicknames && userNameElem}
                    {messageElem}
                </div>
            </div>
        );
    });

    let frameChatPositionCls = '',
        frameChatDegree;
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

    return playerSizeDiv
        ? ReactDOM.createPortal(
              <div
                  className={classes(styles.FrameChat, frameChatPositionCls)}
                  style={{
                      background: frameBackground ? chatBackgroundStyle : '',
                      paddingLeft: `${frameOffsetX}px`,
                      paddingRight: `${frameOffsetX}px`,
                      paddingTop: `${frameOffsetY}px`,
                      paddingBottom: `${frameOffsetY}px`,
                  }}>
                  {chatsElem}
              </div>,
              playerSizeDiv,
          )
        : null;
});

export default FrameChat;
