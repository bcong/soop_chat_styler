import FrameChat from '@Components/FrameChat';
import OverlayChat from '@Components/OverlayChat';
import { useMainStore } from '@Stores/index';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { addLocationChangeCallback, isSoopBroadcastRoom } from '@Utils/index';
import { getFullscreenElement, subscribeToFullscreenChange } from '@Utils/fullscreen';

type Props = {
    pipTarget?: HTMLElement;
};

const Chat = observer(({ pipTarget }: Props) => {
    const mainStore = useMainStore();
    const [isBroadcastRoom, setIsBroadcastRoom] = useState(isSoopBroadcastRoom);
    const [fullscreenElement, setFullscreenElement] = useState(getFullscreenElement);
    const isFullscreen = fullscreenElement !== null;
    const enable = mainStore.setting.get('enable');
    const chat_style = mainStore.setting.get('chat_style');
    const fullscreenOnly = mainStore.setting.get('fullscreen_only');

    useEffect(() => {
        const observer = addLocationChangeCallback(() => setIsBroadcastRoom(isSoopBroadcastRoom()));
        return () => observer.disconnect();
    }, []);

    useEffect(() => subscribeToFullscreenChange(() => setFullscreenElement(getFullscreenElement())), []);

    if (!isBroadcastRoom || (fullscreenOnly && !isFullscreen)) return null;

    let chatElem;
    switch (chat_style) {
        case 0:
            chatElem = (
                <OverlayChat pipTarget={pipTarget} fullscreenTarget={fullscreenElement} persistPosition={!pipTarget} />
            );
            break;
        case 1:
            chatElem = <FrameChat pipTarget={pipTarget} />;
            break;
    }

    return enable && chatElem;
});

export default Chat;
