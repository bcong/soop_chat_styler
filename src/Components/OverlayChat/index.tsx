import { observer } from 'mobx-react-lite';
import styles from './style.module.less';
import { useMainStore } from '@Stores/index';
import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { classes } from '@Utils/index';

const OverlayChat = observer(() => {
    const mainStore = useMainStore();
    const chatRef = useRef<HTMLDivElement | null>(null);
    const [isView, IsView] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
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

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!chatRef.current) return;
        setIsDragging(true);
        setInitialPosition({
            x: e.clientX,
            y: e.clientY
        });
        setOffset({
            x: translate.x,
            y: translate.y
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !chatRef.current) return;
        const currentX = e.clientX - initialPosition.x;
        const currentY = e.clientY - initialPosition.y;
        const newTranslateX = offset.x + currentX;
        const newTranslateY = offset.y + currentY;

        setTranslate({ x: newTranslateX, y: newTranslateY });

        chatRef.current.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px)`;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        mainStore.setSetting('overlay_x', translate.x, true);
        mainStore.setSetting('overlay_y', translate.y, true);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [translate, isDragging]);

    useEffect(() => {
        const handleResize = () => {
            if (!chatRef.current) return;

            const rect = chatRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let newX = translate.x;
            let newY = translate.y;

            if (rect.left < 0) newX = 0;
            if (rect.right > windowWidth) newX = windowWidth - rect.width;
            if (rect.top < 0) newY = 0;
            if (rect.bottom > windowHeight) newY = windowHeight - rect.height;

            setTranslate({ x: newX, y: newY });

            chatRef.current.style.transform = `translate(${newX}px, ${newY}px)`;

            mainStore.setSetting('overlay_x', newX, true);
            mainStore.setSetting('overlay_y', newY, true);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [translate]);

    useEffect(() => {
        if (!chatRef.current) return;

        const left = mainStore.setting.get('overlay_x');
        const top = mainStore.setting.get('overlay_y');

        setTranslate({ x: left || 0, y: top || 0 });

        chatRef.current.style.transform = `translate(${left}px, ${top}px)`;
        IsView(true);
    }, []);

    const chatsElem = mainStore.chats
        .slice(-overlayViewCount)
        .map(({ id, username, messageText, color }) => {
            const background = overlayChatBackground ? `rgba(0, 0, 0, ${overlayViewOpacity}%)` : '';
            const fontSize = `${overlayFontSize}px`;

            const userNameElem = (
                <div className={styles.Username}>
                    <p style={{
                        color: overlayRandomUsername ? color : '#9dd9a5',
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
                        overlayChatBackground ? styles.Background : false,
                        overlaySortChatMessages ? styles.Sorted : false
                    )}
                    style={{
                        width: `${overlayViewWidth}px`,
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

    const chatBackgroundStyle = `linear-gradient(0deg, rgba(0, 0, 0, ${overlayBackgroundOpacity}%) ${overlayBackgroundArea}%, rgba(0, 0, 0, 0) 100%)`;

    return (
        ReactDOM.createPortal(
            <div
                ref={chatRef}
                className={classes(styles.OverlayChat, isView ? styles.View : false)}
                onMouseDown={handleMouseDown}
                style={{
                    transform: `translate(${translate.x}px, ${translate.y}px)`,
                    background: overlayBackground ? chatBackgroundStyle : '',
                }}
            >
                {chatsElem}
            </div>
            , document.body)
    );
});

export default OverlayChat;