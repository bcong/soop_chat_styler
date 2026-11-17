import { observer } from 'mobx-react-lite';
import styles from './style.module.less';
import { useMainStore } from '@Stores/index';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { classes } from '@Utils/index';

type Props = {
    pipTarget?: HTMLElement;
    fullscreenTarget?: Element | null;
    persistPosition?: boolean;
    isChatVisible: boolean;
    onToggleChatVisibility: () => void;
    isVisibilityToggleVisible: boolean;
    onVisibilityTogglePointerEnter: () => void;
    onVisibilityTogglePointerLeave: () => void;
};

const OverlayChat = observer((props: Props) => {
    const {
        pipTarget,
        fullscreenTarget,
        persistPosition = true,
        isChatVisible,
        onToggleChatVisibility,
        isVisibilityToggleVisible,
        onVisibilityTogglePointerEnter,
        onVisibilityTogglePointerLeave,
    } = props;
    const mainStore = useMainStore();
    const chatRef = useRef<HTMLDivElement | null>(null);
    const [isView, IsView] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ left: 0, top: 0 });

    const overlayViewCount = mainStore.setting.get('overlay_view_count');
    const overlayViewOpacity = mainStore.setting.get('overlay_chat_opacity');
    const overlayBackgroundOpacity = mainStore.setting.get('overlay_background_opacity');
    const overlayRandomUsername = mainStore.setting.get('overlay_random_username');
    const overlayViewWidth = mainStore.setting.get('overlay_view_width');
    const overlaySortChatMessages = mainStore.setting.get('overlay_sort_chat_messages');
    const overlayFontSize = mainStore.setting.get('overlay_font_size');
    const overlayChatBackground = mainStore.setting.get('overlay_chat_background');
    const overlayBackground = mainStore.setting.get('overlay_background');
    const overlayBackgroundArea = mainStore.setting.get('overlay_background_area');
    const showNicknames = mainStore.setting.get('show_nicknames');
    const overlayWindow =
        chatRef.current?.ownerDocument.defaultView ??
        pipTarget?.ownerDocument.defaultView ??
        fullscreenTarget?.ownerDocument.defaultView ??
        window;
    const isLeftAligned = position.left + overlayViewWidth / 2 <= overlayWindow.innerWidth / 2;

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chatRef.current) return;
        setIsDragging(true);
        setInitialPosition({
            x: e.clientX,
            y: e.clientY,
        });
        setOffset({
            x: position.left,
            y: position.top,
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !chatRef.current) return;
        const currentX = e.clientX - initialPosition.x;
        const currentY = e.clientY - initialPosition.y;

        const newLeft = offset.x + currentX;
        const newTop = offset.y + currentY;

        setPosition({ left: newLeft, top: newTop });

        chatRef.current.style.left = `${newLeft}px`;
        chatRef.current.style.top = `${newTop}px`;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (persistPosition) {
            mainStore.setSetting('overlay_x', position.left, true);
            mainStore.setSetting('overlay_y', position.top, true);
        }
    };

    // 숨김/표시로 너비가 바뀌어도 우측 프레임에 붙어 있으면 계속 붙도록 유지
    const rightEdgeGapRef = useRef<number | null>(null);
    useLayoutEffect(() => {
        const chat = chatRef.current;
        if (!chat) return;
        const rect = chat.getBoundingClientRect();
        const chatWindow = chat.ownerDocument.defaultView ?? window;
        const gap = rightEdgeGapRef.current;
        if (gap !== null && Math.abs(gap) < 1 && Math.abs(chatWindow.innerWidth - rect.right) >= 1) {
            const left = Math.max(0, chatWindow.innerWidth - rect.width);
            setPosition((prev) => ({ ...prev, left }));
            chat.style.left = `${left}px`;
            if (persistPosition) mainStore.setSetting('overlay_x', left, true);
        }
    }, [isChatVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const chat = chatRef.current;
        if (!chat) return;
        const chatWindow = chat.ownerDocument.defaultView ?? window;
        rightEdgeGapRef.current = chatWindow.innerWidth - chat.getBoundingClientRect().right;
    });

    const isBottomAligned = position.top + (chatRef.current?.offsetHeight ?? 0) / 2 > overlayWindow.innerHeight / 2;
    const cornerIndex = isBottomAligned ? (isLeftAligned ? 3 : 2) : isLeftAligned ? 0 : 1;
    const handleCyclePosition = () => {
        const chat = chatRef.current;
        if (!chat) return;
        const rect = chat.getBoundingClientRect();
        const chatWindow = chat.ownerDocument.defaultView ?? window;
        const isRight = rect.left + rect.width / 2 > chatWindow.innerWidth / 2;
        const isBottom = rect.top + rect.height / 2 > chatWindow.innerHeight / 2;
        // 좌상단 → 우상단 → 우하단 → 좌하단 순환
        const nextRight = !isBottom;
        const nextBottom = isRight;
        const left = nextRight ? chatWindow.innerWidth - rect.width : 0;
        const top = nextBottom ? chatWindow.innerHeight - rect.height : 0;
        setPosition({ left, top });
        chat.style.left = `${left}px`;
        chat.style.top = `${top}px`;
        if (persistPosition) {
            mainStore.setSetting('overlay_x', left, true);
            mainStore.setSetting('overlay_y', top, true);
        }
    };

    useEffect(() => {
        const chatDocument = chatRef.current?.ownerDocument;
        if (!chatDocument) return;

        if (isDragging) {
            chatDocument.addEventListener('mousemove', handleMouseMove);
            chatDocument.addEventListener('mouseup', handleMouseUp);
        } else {
            chatDocument.removeEventListener('mousemove', handleMouseMove);
            chatDocument.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            chatDocument.removeEventListener('mousemove', handleMouseMove);
            chatDocument.removeEventListener('mouseup', handleMouseUp);
        };
    }, [position, isDragging, persistPosition]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const handleResize = () => {
            if (!chatRef.current) return;

            const rect = chatRef.current.getBoundingClientRect();
            const chatWindow = chatRef.current.ownerDocument.defaultView ?? window;
            const windowWidth = chatWindow.innerWidth;
            const windowHeight = chatWindow.innerHeight;

            let newLeft = position.left;
            let newTop = position.top;

            if (rect.left < 0 || rect.right > windowWidth) {
                if (rect.left < 0) newLeft = 0;
                if (rect.right > windowWidth) newLeft = windowWidth - rect.width;
            }

            if (rect.top < 0 || rect.bottom > windowHeight) {
                if (rect.top < 0) newTop = 0;
                if (rect.bottom > windowHeight) newTop = windowHeight - rect.height;
            }

            setPosition({ left: newLeft, top: newTop });

            chatRef.current.style.left = `${newLeft}px`;
            chatRef.current.style.top = `${newTop}px`;

            if (persistPosition) {
                mainStore.setSetting('overlay_x', newLeft, true);
                mainStore.setSetting('overlay_y', newTop, true);
            }
        };

        const chatWindow = chatRef.current?.ownerDocument.defaultView ?? window;
        chatWindow.addEventListener('resize', handleResize);

        return () => {
            chatWindow.removeEventListener('resize', handleResize);
        };
    }, [position, persistPosition]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!chatRef.current) return;

        const left = mainStore.setting.get('overlay_x') || 0;
        const top = mainStore.setting.get('overlay_y') || 0;

        setPosition({ left, top });

        chatRef.current.style.left = `${left}px`;
        chatRef.current.style.top = `${top}px`;
        IsView(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!pipTarget || !isView || !chatRef.current) return;

        const chatWindow = chatRef.current.ownerDocument.defaultView ?? window;
        const rect = chatRef.current.getBoundingClientRect();
        const left = Math.max(0, Math.min(position.left, chatWindow.innerWidth - rect.width));
        const top = Math.max(0, Math.min(position.top, chatWindow.innerHeight - rect.height));

        if (left !== position.left || top !== position.top) {
            setPosition({ left, top });
            chatRef.current.style.left = `${left}px`;
            chatRef.current.style.top = `${top}px`;
        }
    }, [isView, pipTarget, position]);

    const chatsElem = mainStore.chats.slice(-overlayViewCount).map(({ id, username, contentArray, color }) => {
        const background = overlayChatBackground ? `rgba(0, 0, 0, ${overlayViewOpacity}%)` : '';
        const fontSize = `${overlayFontSize}px`;

        const userNameElem = (
            <div className={styles.Username}>
                <p
                    style={{
                        color: overlayRandomUsername ? color : '#9dd9a5',
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
                    overlayChatBackground ? styles.Background : false,
                    overlaySortChatMessages ? styles.Sorted : false,
                )}
                style={{
                    width: `${overlayViewWidth}px`,
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

    const chatBackgroundStyle = `linear-gradient(0deg, rgba(0, 0, 0, ${overlayBackgroundOpacity}%) ${overlayBackgroundArea}%, rgba(0, 0, 0, 0) 100%)`;

    return ReactDOM.createPortal(
        <div
            ref={chatRef}
            className={classes(
                styles.OverlayChat,
                isView ? styles.View : false,
                !isChatVisible ? styles.Hidden : false,
            )}
            onMouseDown={handleMouseDown}
            onPointerEnter={onVisibilityTogglePointerEnter}
            onPointerLeave={onVisibilityTogglePointerLeave}
            style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
                fontSize: `${overlayFontSize}px`,
                background: isChatVisible && overlayBackground ? chatBackgroundStyle : '',
            }}>
            {isChatVisible && chatsElem}
            <div
                className={classes(
                    styles.Controls,
                    isLeftAligned ? false : styles.RightAligned,
                    !isVisibilityToggleVisible ? styles.VisibilityToggleHidden : false,
                )}>
                {isChatVisible && (
                    <button
                        type="button"
                        className={styles.VisibilityToggle}
                        aria-label="오버레이 위치 변경"
                        title="오버레이 위치 변경"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={handleCyclePosition}>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <rect
                                x={cornerIndex === 1 || cornerIndex === 2 ? 13 : 5}
                                y={cornerIndex >= 2 ? 13 : 5}
                                width="6"
                                height="6"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                )}
                <button
                    type="button"
                    className={styles.VisibilityToggle}
                    aria-label={isChatVisible ? '채팅 오버레이 숨기기' : '채팅 오버레이 표시'}
                    title={isChatVisible ? '채팅 오버레이 숨기기' : '채팅 오버레이 표시'}
                    onMouseDown={(event) => event.stopPropagation()}
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
                                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </>
                        ) : (
                            <>
                                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                                <path d="m3 3 18 18" />
                            </>
                        )}
                    </svg>
                </button>
            </div>
        </div>,
        pipTarget ?? fullscreenTarget ?? document.body,
    );
});

export default OverlayChat;
