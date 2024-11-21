import { observer } from 'mobx-react-lite';
import styles from './style.module.less';
import { useMainStore } from '@Stores/index';
import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const OverlayChat = observer(() => {
    const mainStore = useMainStore();
    const chatRef = useRef<HTMLDivElement | null>(null);
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
        if (!chatRef.current) return;

        const left = mainStore.setting.get('overlay_x');
        const top = mainStore.setting.get('overlay_y');

        setTranslate({ x: left || 0, y: top || 0 });

        chatRef.current.style.transform = `translate(${left}px, ${top}px)`;
    }, []);

    const chatsElem = mainStore.chats
        .slice(overlayViewCount > 20 ? -20 : -overlayViewCount || -1)
        .map(({ id, username, messageText, color }) => {
            return (
                <div key={id} className={styles.Chat} style={{ backgroundColor: `rgba(0,0,0,${overlayViewOpacity}%)` }}>
                    <p className={styles.Username} style={{
                        fontSize: `${overlayFontSize}px`,
                        width: overlaySortChatMessages ? '130px' : '',
                        color: overlayRandomUsername ? color : '#9dd9a5',
                    }}>
                        {username}
                    </p>
                    <p className={styles.Message} style={{ fontSize: `${overlayFontSize}px` }} >
                        {messageText}
                    </p>
                </div >
            );
        });

    return (
        ReactDOM.createPortal(
            <div
                ref={chatRef}
                className={styles.OverlayChat}
                onMouseDown={handleMouseDown}
                style={{ transform: `translate(${translate.x}px, ${translate.y}px)`, width: overlayViewWidth, backgroundColor: `rgba(0,0,0,${overlayBackgroundOpacity}%)` }}
            >
                {chatsElem}
            </div>
            , document.body)
    );
});

export default OverlayChat;