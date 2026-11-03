import FrameChat from '@Components/FrameChat';
import OverlayChat from '@Components/OverlayChat';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { addLocationChangeCallback, isSoopBroadcastRoom } from '@Utils/index';
import { getFullscreenElement, subscribeToFullscreenChange } from '@Utils/fullscreen';
import type { ChatVisibilityByMode } from '@Utils/chatVisibility';
import {
    getChatVisibilityMode,
    isChatAllowedInMode,
    toggleChatVisibility as toggleVisibilityForMode,
} from '@Utils/chatVisibility';

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
    const isFullscreen = fullscreenElement !== null;
    const isPip = Boolean(pipTarget);
    const chatMode = getChatVisibilityMode(isPip, isFullscreen);
    const isChatVisible = visibilityByMode[chatMode];
    const enable = mainStore.setting.get('enable');
    const chat_style = mainStore.setting.get('chat_style');
    const fullscreenOnly = mainStore.setting.get('fullscreen_only');
    const handleToggleChatVisibility = () =>
        setVisibilityByMode((visibility) => toggleVisibilityForMode(visibility, chatMode));

    useEffect(() => {
        const observer = addLocationChangeCallback(() => setIsBroadcastRoom(isSoopBroadcastRoom()));
        return () => observer.disconnect();
    }, []);

    useEffect(() => subscribeToFullscreenChange(() => setFullscreenElement(getFullscreenElement())), []);

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
                />
            );
            break;
    }

    return enable && chatElem;
});

export default Chat;
