import OverlayChat from "@Components/OverlayChat";
import { useMainStore } from "@Stores/index";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import ReactDOM from "react-dom";

const Chat = observer(() => {
    const mainStore = useMainStore();
    const enable = mainStore.setting.get('enable');
    const chat_style = mainStore.setting.get('chat_style');
    const defalut_chat_enable = mainStore.setting.get('defalut_chat_enable');

    useEffect(() => {
        const sideElement = document.querySelector('#webplayer_contents .wrapping.side') as HTMLElement;
        if (sideElement)
            sideElement.style.display = defalut_chat_enable ? 'block' : 'none';
    }, [defalut_chat_enable]);

    let chatElem;
    switch (chat_style) {
        case 0:
            chatElem = <OverlayChat />;
            break;
        case 1:
            break;
    }

    return (
        ReactDOM.createPortal(
            enable && chatElem,
            document.body
        )
    );
});

export default Chat;