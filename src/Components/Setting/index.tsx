import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './style.module.less';
import { classes } from '@Utils/index';

interface I_PROPS extends I_GLOBAL_PROPS { }

const SettingComponent: React.FC<I_PROPS> = ({
    isSetting,
    toggleSetting,
}) => {
    const settingRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!settingRef.current) return;
        setIsDragging(true);
        setInitialPosition({
            x: e.clientX,
            y: e.clientY
        });
        setOffset({
            x: settingRef.current.offsetLeft,
            y: settingRef.current.offsetTop
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !settingRef.current) return;
        const currentX = e.clientX - initialPosition.x;
        const currentY = e.clientY - initialPosition.y;
        const newLeft = offset.x + currentX;
        const newTop = offset.y + currentY;
        settingRef.current.style.left = `${newLeft}px`;
        settingRef.current.style.top = `${newTop}px`;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
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
    }, [isDragging]);

    return ReactDOM.createPortal(
        <div
            ref={settingRef}
            className={classes(styles.Setting, isSetting ? styles.View : false)}
            style={{ position: 'absolute' }}
        >
            <div className={styles.Header} onMouseDown={handleMouseDown}>
                <div className={styles.Title}>
                    <p>
                        채팅 스타일러
                    </p>
                </div>
                <div
                    className={styles.Menus}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div
                        className={styles.Menu}
                        onClick={toggleSetting}
                    >
                        <i className='fi fi-rr-cross-small' />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SettingComponent;