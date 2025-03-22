import FrameChat from "@Components/FrameChat";
import OverlayChat from "@Components/OverlayChat";
import { useMainStore } from "@Stores/index";
import { LiveDetail } from "@Types/soop";
import { colors, extractID, generateRandomNumber } from "@Utils/index";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";

enum ChatDelimiter {
    STARTER = "\u001B\t",
    SEPARATOR = "\f"
}

enum ChatType {
    PING = "0000",
    CONNECT = "0001",
    ENTERCHATROOM = "0002",
    EXIT = "0004",
    CHAT = "0005",
    DISCONNECT = "0007",
    TEXTDONATION = "0018",
    ADBALLOONDONATION = "0087",
    SUBSCRIBE = "0093",
    NOTIFICATION = "0104",
    EMOTICON = "0109",
    VIDEODONATION = "0105",
    VIEWER = "0127"
}

const Chat = observer(() => {
    const mainStore = useMainStore();
    const enable = mainStore.setting.get('enable');
    const chat_style = mainStore.setting.get('chat_style');
    const pathUpdate = useRef<number | null>(null);
    const pingIntervalId = useRef<number | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
    const reconnectDelay: number = 60000; // 재연결 간격 (밀리초)
    const maxReconnectAttempts: number = 5; // 최대 재연결 시도 횟수
    const decoder = new TextDecoder('utf-8');
    let colorIdx = 0;

    const checkChannelId = () => {
        try {
            const newPathname = window.location.pathname;
            const extractedID = extractID(newPathname);

            if (extractedID == 'live') return;

            if (mainStore.channelId != extractedID) {
                mainStore.setChannelId(extractedID);
                connect(extractedID);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const calculateByteSize = (input: string): number => {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(input);
        return encoded.length + 6;
    };

    const makeChatUrl = (liveDetail: LiveDetail | null): string => {
        if (!liveDetail || !liveDetail.CHANNEL) {
            throw new Error('Live details are not available');
        }
        return `wss://${liveDetail.CHANNEL.CHDOMAIN.toLowerCase()}:${Number(liveDetail.CHANNEL.CHPT) + 1}/Websocket/${liveDetail.CHANNEL.BJID}`;
    };

    const fetchLiveDetails = async (newChannelId: string) => {
        const url = 'https://live.sooplive.co.kr/afreeca/player_live_api.php';
        const formData = new URLSearchParams({ bid: newChannelId });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                return null;
            }

            const data: LiveDetail = await response.json();

            if (!data || !data.CHANNEL) {
                return null;
            }

            return data;
        } catch (err) {
            return null;
        }
    };

    const connect = async (newChannelId: string) => {
        if (mainStore.currentChat) {
            await disconnect();
        }

        const liveDetail = await fetchLiveDetails(newChannelId);

        if (!liveDetail) throw Error('Not liveDetail');

        mainStore.setLiveDetail(liveDetail);

        const chatUrl = makeChatUrl(liveDetail);

        if (!chatUrl) throw Error('Not chatUrl');

        const ws = new WebSocket(chatUrl, ['chat']);

        ws.binaryType = 'arraybuffer';

        mainStore.setCurrentChat(ws);

        ws.onopen = () => {
            console.log('WebSocket connection opened');
            setReconnectAttempts(0);
            // const userAgent = navigator.userAgent;
            // ws?.send(JSON.stringify({ type: 'agent', data: userAgent }));
            const CONNECT_PACKET =
                `${ChatDelimiter.STARTER}${ChatType.CONNECT}00000600${ChatDelimiter.SEPARATOR.repeat(3)}16${ChatDelimiter.SEPARATOR}`;
            ws?.send(CONNECT_PACKET);
            console.log('Sent CONNECT packet:', CONNECT_PACKET);

            const receivedTime = new Date().toISOString();
            mainStore.clearChat();
            mainStore.addChat({ id: generateRandomNumber(receivedTime), username: '제작자', contentArray: [{ type: 'text', content: '비콩 (github.com/bcong)' }], color: '#e9ab00' });
        };

        ws.onmessage = (data) => handleMessage(data.data);

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            stopPingInterval();
            reconnect();
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws?.close();
        };

        startPingInterval();
    };

    const reconnect = () => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error(`Max reconnect attempts (${maxReconnectAttempts}) reached. Giving up.`);
            return;
        }

        setTimeout(async () => {
            try {
                console.log(`Reconnecting... Attempt ${reconnectAttempts + 1}`);
                setReconnectAttempts(reconnectAttempts + 1);
                await connect(mainStore.channelId);
            } catch (error: any) {
                console.error('Reconnect failed:', error.message);
                reconnect();
            }
        }, reconnectDelay);
    };

    const parseMessageType = (packet: string): string => {
        if (!packet.startsWith(ChatDelimiter.STARTER)) {
            throw new Error("Invalid data: does not start with STARTER byte");
        }
        if (packet.length >= 5) {
            return packet.substring(2, 6);
        }
        throw new Error("Invalid data: does not have any data for opcode");
    };

    const parseSubscribe = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, to, from, fromUsername, amount, , , , tier] = parts;
        return { to, from, fromUsername, amount, tier };
    };

    const parseAdBalloonDonation = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , to, from, fromUsername, , , , , , amount, fanClubOrdinal] = parts;
        return { to, from, fromUsername, amount, fanClubOrdinal };
    };

    const parseVideoDonation = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , to, from, fromUsername, amount, fanClubOrdinal] = parts;
        return { to, from, fromUsername, amount, fanClubOrdinal };
    };

    const parseViewer = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        if (parts.length > 4) {
            return { userId: parts.filter((_, index) => index % 2 === 1) };
        } else {
            const [, userId] = parts;
            return { userId: [userId] };
        }
    };

    const parseExit = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , userId, username] = parts;
        return { userId, username };
    };

    const parseEmoticon = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , , emoticonId, , , userId, username] = parts;
        return { userId, username, emoticonId };
    };

    const parseTextDonation = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, to, from, fromUsername, amount] = parts;
        return { to, from, fromUsername, amount };
    };

    const parseNotification = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , , , notification] = parts;
        return { notification };
    };

    const parseChat = (packet: string) => {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, comment, userId, , , , username] = parts;
        return { userId, comment, username };
    };

    const startPingInterval = () => {
        if (pingIntervalId.current) clearInterval(pingIntervalId.current);

        pingIntervalId.current = setInterval(() => {
            if (mainStore.currentChat?.readyState === WebSocket.OPEN) {
                const PING_PACKET = `${ChatDelimiter.STARTER}${ChatType.PING}0000000100${ChatDelimiter.SEPARATOR}`;
                mainStore.currentChat.send(PING_PACKET);
                console.log('Sent PING packet:', PING_PACKET);
            }
        }, 30000);
    };

    const stopPingInterval = () => {
        if (pingIntervalId.current) clearInterval(pingIntervalId.current);
        pingIntervalId.current = null;
    };

    const disconnect = async () => {
        if (mainStore.currentChat) {
            console.log("Disconnecting WebSocket...");
            await new Promise((resolve) => resolve(mainStore.currentChat?.close()));
            mainStore.setCurrentChat(null);
            mainStore.clearChat();
            stopPingInterval();
        }
    };

    const handleMessage = async (data: any) => {
        if (!mainStore.liveDetail) return;

        const receivedTime = new Date().toISOString();
        const packet = decoder.decode(data);
        const messageType = parseMessageType(packet);

        switch (messageType) {
            case ChatType.CONNECT: {
                // this.emit('connect', { streamerId: this.options.streamerId, receivedTime });
                const JOIN_PACKET = `${ChatDelimiter.STARTER}${ChatType.ENTERCHATROOM}${calculateByteSize(mainStore.liveDetail.CHANNEL.CHATNO).toString().padStart(6, '0')}00${ChatDelimiter.SEPARATOR}${mainStore.liveDetail.CHANNEL.CHATNO}${ChatDelimiter.SEPARATOR.repeat(5)}`;
                mainStore.currentChat?.send(JOIN_PACKET);
                console.log('Sent JOIN packet:', JOIN_PACKET);
                break;
            }

            case ChatType.CHAT: {
                const chat = parseChat(packet);
                // console.log(chat);
                // this.emit('chat', { ...chat, receivedTime });
                mainStore.addChat({
                    id: generateRandomNumber(receivedTime),
                    username: chat.username,
                    contentArray: [{ type: 'text', content: chat.comment }],
                    color: colors[colorIdx]
                });
                colorIdx = (colorIdx + 1) % colors.length;
                break;
            }

            case ChatType.NOTIFICATION: {
                const notification = parseNotification(packet);
                // console.log("notification", notification);
                // this.emit('notification', { ...notification, receivedTime });
                break;
            }

            case ChatType.VIDEODONATION: {
                const videoDonation = parseVideoDonation(packet);
                // console.log("videoDonation", videoDonation);
                // this.emit('videoDonation', { ...videoDonation, receivedTime });
                break;
            }

            case ChatType.TEXTDONATION: {
                const textDonation = parseTextDonation(packet);
                // console.log("textDonation", textDonation);
                // this.emit('textDonation', { ...textDonation, receivedTime });
                break;
            }

            case ChatType.ADBALLOONDONATION: {
                const adBalloonDonation = parseAdBalloonDonation(packet);
                // console.log("adBalloonDonation", adBalloonDonation);
                // this.emit('adBalloonDonation', { ...adBalloonDonation, receivedTime });
                break;
            }

            case ChatType.EMOTICON: {
                const emoticon = parseEmoticon(packet);
                // console.log("emoticon", emoticon);
                // this.emit('emoticon', { ...emoticon, receivedTime });
                break;
            }

            case ChatType.VIEWER: {
                const viewer = parseViewer(packet);
                // console.log("viewer", viewer);
                // this.emit('viewer', { ...viewer, receivedTime });
                break;
            }

            case ChatType.SUBSCRIBE: {
                const subscribe = parseSubscribe(packet);
                // console.log("subscribe", subscribe);
                // this.emit('subscribe', { ...subscribe, receivedTime });
                break;
            }

            case ChatType.EXIT: {
                const exitData = parseExit(packet);
                // console.log("exitData", exitData);
                // this.emit('exit', { ...exitData, receivedTime });
                break;
            }

            case ChatType.DISCONNECT:
                await disconnect();
                break;

            default: {
                const parts = packet.split(ChatDelimiter.SEPARATOR);
                // console.log("parts", parts);
                // this.emit('unknown', parts);
                break;
            }
        }
    };

    useEffect(() => {
        checkChannelId();

        pathUpdate.current = setInterval(() => {
            checkChannelId();
        }, 1000);

        return () => {
            if (pathUpdate.current) clearInterval(pathUpdate.current);
        };
    }, []);

    let chatElem;
    switch (chat_style) {
        case 0:
            chatElem = <OverlayChat />;
            break;
        case 1:
            chatElem = <FrameChat />;
            break;
    }

    return (
        enable && chatElem
    );
});

export default Chat;