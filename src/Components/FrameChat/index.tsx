import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './style.module.less';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { classes } from '@Utils/index';

type Props = {
    pipTarget?: HTMLElement;
    fullscreenTarget?: Element | null;
    isChatVisible: boolean;
    onToggleChatVisibility: () => void;
};

const FrameChat = observer(({ pipTarget, fullscreenTarget, isChatVisible, onToggleChatVisibility }: Props) => {
    const mainStore = useMainStore();
    const [playerSizeDiv, setPlayerSizeDiv] = useState<Element | null>(pipTarget ?? document.body);
    const [visibilityTogglePosition, setVisibilityTogglePosition] = useState<{ left: number; top: number } | null>(
        null,
    );
    const frameChatRef = useRef<HTMLDivElement | null>(null);
    const visibilityToggleAnchorRef = useRef<HTMLDivElement | null>(null);
    const visibilityToggleLayerRef = useRef<HTMLDivElement | null>(null);
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
    const isRightAligned = frameChatPosition === 2 || frameChatPosition === 3;
    const visibilityToggleTarget = pipTarget ? null : (fullscreenTarget ?? null);

    const updateVisibilityTogglePosition = useCallback(() => {
        const anchor = visibilityToggleAnchorRef.current;
        const layer = visibilityToggleLayerRef.current;
        if (!anchor || !layer) return;

        const anchorRect = anchor.getBoundingClientRect();
        const layerRect = layer.getBoundingClientRect();
        const left = anchorRect.left - layerRect.left;
        const top = anchorRect.top - layerRect.top;

        setVisibilityTogglePosition((current) => {
            if (current && current.left === left && current.top === top) return current;
            return { left, top };
        });
    }, []);

    useEffect(() => {
        if (pipTarget) {
            setPlayerSizeDiv(pipTarget);
            return;
        }

        const updatePlayerTarget = () => {
            const videoLayer = document.querySelector('#videoLayer');
            const playerArea = document.querySelector('#player_area');
            const isVisible = (element: Element | null): element is Element => {
                if (!element?.getClientRects().length) return false;

                for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
                    const { display, visibility, opacity } = window.getComputedStyle(ancestor);
                    if (display === 'none' || visibility === 'hidden' || Number(opacity) === 0) return false;
                }

                const { width, height } = element.getBoundingClientRect();
                return width > 0 && height > 0;
            };
            const target = isVisible(videoLayer) ? videoLayer : isVisible(playerArea) ? playerArea : null;
            setPlayerSizeDiv((current) => (current === target ? current : target));
        };

        const observer = new MutationObserver((mutations) => {
            const playerTargetChanged = mutations.some((mutation) => {
                const playerSelector = '#videoLayer, #player_area';
                if (mutation.target instanceof Element) {
                    if (mutation.target.matches(playerSelector) || mutation.target.closest(playerSelector)) return true;
                    if (mutation.type === 'attributes' && mutation.target.querySelector(playerSelector)) return true;
                }

                if (mutation.type !== 'childList') return false;
                return [...mutation.addedNodes, ...mutation.removedNodes].some(
                    (node) =>
                        node instanceof Element &&
                        (node.matches(playerSelector) || node.querySelector(playerSelector) !== null),
                );
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

    useLayoutEffect(() => {
        if (!visibilityToggleTarget) {
            setVisibilityTogglePosition(null);
            return;
        }

        updateVisibilityTogglePosition();
    }, [
        visibilityToggleTarget,
        updateVisibilityTogglePosition,
        playerSizeDiv,
        frameChatPosition,
        frameFontSize,
        frameOffsetX,
        frameOffsetY,
        isChatVisible,
        chatsElem,
    ]);

    useEffect(() => {
        if (!visibilityToggleTarget) return;

        const frameChat = frameChatRef.current;
        if (!frameChat) return;

        const resizeObserver = new ResizeObserver(updateVisibilityTogglePosition);
        resizeObserver.observe(frameChat);
        if (playerSizeDiv && playerSizeDiv !== frameChat) resizeObserver.observe(playerSizeDiv);
        resizeObserver.observe(visibilityToggleTarget);

        const targetWindow = visibilityToggleTarget.ownerDocument.defaultView ?? window;
        targetWindow.addEventListener('resize', updateVisibilityTogglePosition);
        targetWindow.addEventListener('scroll', updateVisibilityTogglePosition, true);

        return () => {
            resizeObserver.disconnect();
            targetWindow.removeEventListener('resize', updateVisibilityTogglePosition);
            targetWindow.removeEventListener('scroll', updateVisibilityTogglePosition, true);
        };
    }, [visibilityToggleTarget, playerSizeDiv, updateVisibilityTogglePosition]);

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
    const visibilityToggle = (
        <button
            type="button"
            className={classes(
                styles.VisibilityToggle,
                isRightAligned ? styles.RightAligned : false,
                visibilityToggleTarget ? styles.VisibilityTogglePortal : false,
            )}
            style={
                visibilityToggleTarget && visibilityTogglePosition
                    ? {
                          fontSize: `${frameFontSize}px`,
                          left: `${visibilityTogglePosition.left}px`,
                          top: `${visibilityTogglePosition.top}px`,
                      }
                    : undefined
            }
            aria-label={isChatVisible ? '채팅 프레임 숨기기' : '채팅 프레임 표시'}
            title={isChatVisible ? '채팅 프레임 숨기기' : '채팅 프레임 표시'}
            onClick={onToggleChatVisibility}>
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                {isChatVisible ? (
                    <>
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                    </>
                ) : (
                    <>
                        <path d="M3 3 21 21" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a14.7 14.7 0 0 1-3.1 3.8" />
                        <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.5 7 10 7c1 0 1.9-.2 2.8-.5" />
                    </>
                )}
            </svg>
        </button>
    );

    return playerSizeDiv ? (
        <>
            {ReactDOM.createPortal(
                <div
                    ref={frameChatRef}
                    className={classes(styles.FrameChat, frameChatPositionCls, !isChatVisible ? styles.Hidden : false)}
                    style={{
                        fontSize: `${frameFontSize}px`,
                        background: isChatVisible && frameBackground ? chatBackgroundStyle : '',
                        paddingLeft: isChatVisible ? `${frameOffsetX}px` : '0',
                        paddingRight: isChatVisible ? `${frameOffsetX}px` : '0',
                        paddingTop: isChatVisible ? `${frameOffsetY}px` : '0',
                        paddingBottom: isChatVisible ? `${frameOffsetY}px` : '0',
                    }}>
                    {visibilityToggleTarget ? (
                        <div
                            ref={visibilityToggleAnchorRef}
                            className={classes(
                                styles.VisibilityToggle,
                                styles.VisibilityToggleAnchor,
                                isRightAligned ? styles.RightAligned : false,
                            )}
                            aria-hidden="true"
                        />
                    ) : (
                        visibilityToggle
                    )}
                    {isChatVisible && chatsElem}
                </div>,
                playerSizeDiv,
            )}
            {visibilityToggleTarget &&
                ReactDOM.createPortal(
                    <div ref={visibilityToggleLayerRef} className={styles.VisibilityLayer}>
                        {visibilityTogglePosition ? visibilityToggle : null}
                    </div>,
                    visibilityToggleTarget,
                )}
        </>
    ) : null;
});

export default FrameChat;
