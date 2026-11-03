import FrameChat from '@Components/FrameChat';
import OverlayChat from '@Components/OverlayChat';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addLocationChangeCallback, isSoopBroadcastRoom } from '@Utils/index';
import { getFullscreenElement, subscribeToFullscreenChange } from '@Utils/fullscreen';
import type { ChatVisibilityByMode } from '@Utils/chatVisibility';
import {
    getChatVisibilityMode,
    isChatAllowedInMode,
    toggleChatVisibility as toggleVisibilityForMode,
} from '@Utils/chatVisibility';

const VISIBILITY_TOGGLE_HIDE_DELAY = 2000;

type Props = {
    pipTarget?: HTMLElement;
};

const Chat = observer(({ pipTarget }: Props) => {
    const mainStore = useMainStore();
    const [isBroadcastRoom, setIsBroadcastRoom] = useState(isSoopBroadcastRoom);
    const [fullscreenElement, setFullscreenElement] = useState(getFullscreenElement);
    const [visibilityByMode, setVisibilityByMode] = useState<ChatVisibilityByMode>({
        normal: true,
        fullscreen: true,
        pip: true,
    });
    const [isVisibilityToggleVisible, setIsVisibilityToggleVisible] = useState(false);
    const visibilityToggleTimeoutRef = useRef<number | null>(null);
    const isFullscreen = fullscreenElement !== null;
    const isPip = Boolean(pipTarget);
    const chatMode = getChatVisibilityMode(isPip, isFullscreen);
    const isChatVisible = visibilityByMode[chatMode];
    const enable = mainStore.setting.get('enable');
    const chat_style = mainStore.setting.get('chat_style');
    const fullscreenOnly = mainStore.setting.get('fullscreen_only');
    const handleToggleChatVisibility = () =>
        setVisibilityByMode((visibility) => toggleVisibilityForMode(visibility, chatMode));
    const showVisibilityToggle = useCallback(() => {
        if (visibilityToggleTimeoutRef.current !== null) {
            window.clearTimeout(visibilityToggleTimeoutRef.current);
            visibilityToggleTimeoutRef.current = null;
        }
        setIsVisibilityToggleVisible(true);
    }, []);
    const scheduleVisibilityToggleHide = useCallback(() => {
        if (visibilityToggleTimeoutRef.current !== null) {
            window.clearTimeout(visibilityToggleTimeoutRef.current);
        }
        visibilityToggleTimeoutRef.current = window.setTimeout(() => {
            visibilityToggleTimeoutRef.current = null;
            setIsVisibilityToggleVisible(false);
        }, VISIBILITY_TOGGLE_HIDE_DELAY);
    }, []);

    useEffect(() => {
        const observer = addLocationChangeCallback(() => setIsBroadcastRoom(isSoopBroadcastRoom()));
        return () => observer.disconnect();
    }, []);

    useEffect(() => subscribeToFullscreenChange(() => setFullscreenElement(getFullscreenElement())), []);

    useEffect(() => {
        const hoverTarget =
            pipTarget ??
            fullscreenElement ??
            document.querySelector('#player_area') ??
            document.querySelector('#videoLayer');
        if (!hoverTarget) return;

        hoverTarget.addEventListener('pointerenter', showVisibilityToggle);
        hoverTarget.addEventListener('pointermove', showVisibilityToggle);
        hoverTarget.addEventListener('pointerleave', scheduleVisibilityToggleHide);

        return () => {
            hoverTarget.removeEventListener('pointerenter', showVisibilityToggle);
            hoverTarget.removeEventListener('pointermove', showVisibilityToggle);
            hoverTarget.removeEventListener('pointerleave', scheduleVisibilityToggleHide);
        };
    }, [pipTarget, fullscreenElement, showVisibilityToggle, scheduleVisibilityToggleHide]);

    useEffect(
        () => () => {
            if (visibilityToggleTimeoutRef.current !== null) {
                window.clearTimeout(visibilityToggleTimeoutRef.current);
                visibilityToggleTimeoutRef.current = null;
            }
        },
        [],
    );

    if (!isBroadcastRoom || !isChatAllowedInMode(fullscreenOnly, isFullscreen, isPip)) return null;

    let chatElem;
    switch (chat_style) {
        case 0:
            chatElem = (
                <OverlayChat
                    pipTarget={pipTarget}
                    fullscreenTarget={fullscreenElement}
                    persistPosition={!pipTarget}
                    isChatVisible={isChatVisible}
                    onToggleChatVisibility={handleToggleChatVisibility}
                    isVisibilityToggleVisible={isVisibilityToggleVisible}
                    onVisibilityTogglePointerEnter={showVisibilityToggle}
                    onVisibilityTogglePointerLeave={scheduleVisibilityToggleHide}
                />
            );
            break;
        case 1:
            chatElem = (
                <FrameChat
                    pipTarget={pipTarget}
                    fullscreenTarget={fullscreenElement}
                    isChatVisible={isChatVisible}
                    onToggleChatVisibility={handleToggleChatVisibility}
                    isVisibilityToggleVisible={isVisibilityToggleVisible}
                    onVisibilityTogglePointerEnter={showVisibilityToggle}
                    onVisibilityTogglePointerLeave={scheduleVisibilityToggleHide}
                />
            );
            break;
    }

    return enable && chatElem;
});

export default Chat;
