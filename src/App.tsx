import { useEffect, useRef, useState } from 'react';
import SettingMenu from '@Components/SettingMenu';
import SettingTemplate from '@Templates/SettingTemplate';
import { useMainStore } from './Stores';
import { T_SETTING } from './@types';
import ChatTemplate from '@Templates/ChatTemplate';
import { subscribeToSoopChat } from '@Utils/soopChatSocket';
import { subscribeToSoopPictureInPicture } from '@Utils/soopPictureInPicture';

type WindowWithDocumentPictureInPicture = typeof unsafeWindow & {
    documentPictureInPicture?: {
        requestWindow: (options: { width: number; height: number }) => Promise<Window>;
    };
};

const COLORS = ['#f28ca5', '#9dd9a5', '#fff08c', '#a1b1eb', '#fac098', '#c88ed9', '#a2f7f7', '#f798f2', '#ddfa85'];

const App = () => {
    const mainStore = useMainStore();
    const [isSetting, IsSetting] = useState(false);
    const [isInit, IsInit] = useState(false);
    const [pipTarget, setPipTarget] = useState<HTMLDivElement | null>(null);
    const pipTargetRef = useRef<HTMLDivElement | null>(null);
    const colorIdxRef = useRef(0);

    const toggleSetting = () => {
        IsSetting((prevIsSetting) => !prevIsSetting);
    };

    const openPictureInPicture = async (video: HTMLVideoElement): Promise<Window | null> => {
        const pictureInPicture = (unsafeWindow as WindowWithDocumentPictureInPicture).documentPictureInPicture;
        if (!pictureInPicture) return null;

        const existingPipTarget = pipTargetRef.current;
        const existingPipWindow = existingPipTarget?.ownerDocument.defaultView;
        if (existingPipWindow && !existingPipWindow.closed) {
            existingPipWindow.focus();
            return existingPipWindow;
        }
        if (existingPipTarget) {
            pipTargetRef.current = null;
            setPipTarget(null);
        }

        const originalParent = video.parentElement;
        if (!originalParent) {
            window.alert('재생 중인 방송 영상을 찾을 수 없습니다.');
            return null;
        }

        const originalNextSibling = video.nextSibling;
        const originalStyle = video.getAttribute('style');
        const originalControls = video.controls;
        const pageDocument = video.ownerDocument;
        const restoreVideo = () => {
            if (video.parentElement !== originalParent) {
                if (originalNextSibling?.parentNode === originalParent) {
                    originalParent.insertBefore(video, originalNextSibling);
                } else {
                    originalParent.append(video);
                }
            }

            if (originalStyle === null) video.removeAttribute('style');
            else video.setAttribute('style', originalStyle);
            video.controls = originalControls;
        };

        let pipWindow: Window | null = null;
        try {
            pipWindow = await pictureInPicture.requestWindow({
                width: 640,
                height: 360,
            });

            const pipDocument = pipWindow.document;
            pageDocument.querySelectorAll('style').forEach((style) => {
                pipDocument.head.append(style.cloneNode(true));
            });

            const pipStyle = pipDocument.createElement('style');
            pipStyle.textContent =
                'html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#000;}#soop-chat-pip-root{position:relative;width:100vw;height:100vh;overflow:hidden;background:#000;}#soop-chat-pip-root>video{display:block;width:100%;height:100%;object-fit:contain;}';
            pipDocument.head.append(pipStyle);

            const root = pipDocument.createElement('div');
            root.id = 'soop-chat-pip-root';
            pipDocument.body.append(root);

            video.controls = true;
            video.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;';
            root.append(video);

            pipWindow.addEventListener(
                'pagehide',
                () => {
                    restoreVideo();
                    pipTargetRef.current = null;
                    setPipTarget(null);
                },
                { once: true },
            );
            pipTargetRef.current = root;
            setPipTarget(root);
            return pipWindow;
        } catch (error) {
            restoreVideo();
            pipWindow?.close();
            window.alert(`PIP 창을 열지 못했습니다: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    };

    const initSetting = () => {
        const storedKeys = GM_listValues();
        const broadcasterId = mainStore.broadcasterId;

        // 공통 설정 로드
        storedKeys.forEach((v) => {
            mainStore.setSetting(v as T_SETTING, GM_getValue(v), false);
        });

        // broadcaster-specific 설정: 개별 저장값이 있으면 덮어쓰기
        mainStore.broadcasterSpecificSettings.forEach((key) => {
            if (!broadcasterId) return;
            const broadcasterKey = `${key}_${broadcasterId}`;
            const value = GM_getValue(broadcasterKey);
            if (value !== undefined) {
                mainStore.setSetting(key as T_SETTING, value, false);
            }
        });

        mainStore.addChat({
            id: -1,
            username: '제작자',
            contentArray: [{ type: 'text', content: '비콩 (github.com/bcong)' }],
            color: '#e9ab00',
        });
        IsInit(true);
    };

    useEffect(() => {
        initSetting();
        const unsubscribe = subscribeToSoopChat(({ username, comment }) => {
            if (!comment.trim()) return;

            const idx = colorIdxRef.current;
            mainStore.addChat({
                id: mainStore.chatId + 1,
                username,
                contentArray: [{ type: 'text', content: comment }],
                color: COLORS[idx],
            });
            colorIdxRef.current = idx >= COLORS.length - 1 ? 0 : idx + 1;
        });
        const unsubscribePip = subscribeToSoopPictureInPicture(openPictureInPicture);

        return () => {
            unsubscribe();
            unsubscribePip();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        isInit && (
            <>
                <SettingMenu
                    isSetting={isSetting}
                    toggleSetting={toggleSetting}
                />
                <SettingTemplate isSetting={isSetting} toggleSetting={toggleSetting} />
                <ChatTemplate />
                {pipTarget && <ChatTemplate pipTarget={pipTarget} />}
            </>
        )
    );
};

export default App;
