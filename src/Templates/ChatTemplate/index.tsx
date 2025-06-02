import FrameChat from "@Components/FrameChat";
import OverlayChat from "@Components/OverlayChat";
import { useMainStore } from "@Stores/index";
import { LiveDetail, LiveStreamInfo, RTMPResponse, SendAddInfoOptions, SendJoinLogOptions } from "@Types/soop";
import { colors, extractID, generateGUID, generateRandomNumber, generateUUID } from "@Utils/index";
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

    const getSoopLiveStreamInfo = async (liveDetail: LiveDetail) => {
        // 1. 쿼리 스트링 생성 (예: bjid)
        const queryParams = new URLSearchParams();
        queryParams.append('bjid', liveDetail.CHANNEL.BJID);

        // 2. POST body용 파라미터 생성
        const params = new URLSearchParams();
        params.append('bid', liveDetail.CHANNEL.BJID);
        params.append('bno', liveDetail.CHANNEL.BNO);
        params.append('type', 'live');
        params.append('pwd', '');
        params.append('player_type', 'html5');
        params.append('stream_type', 'common');
        params.append('quality', 'HD');
        params.append('mode', 'landing');
        params.append('from_api', '0');
        params.append('is_revive', 'false');

        // 3. URL에 쿼리스트링 추가
        const url = `https://live.sooplive.co.kr/afreeca/player_live_api.php?${queryParams.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(), // URLSearchParams는 .toString()으로 변환 필요
                credentials: 'include', // 쿠키 필요시
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 서버 응답이 JSON이 아닐 수도 있으니, 실제 응답 타입에 따라 파싱
            const text = await response.text();
            try {
                return JSON.parse(text) as LiveStreamInfo;
            } catch (e) {
                // JSON 파싱 실패 시 원본 텍스트 반환
                return null;
            }
        } catch (error) {
            console.error('SOOP LIVE 스트림 정보 요청 실패:', error);
            return null;
        }
    };

    const buildJoinLog = (options: SendJoinLogOptions): string => {
        let log = `${options.logType}\u0011`;

        // 메인 엔트리 추가
        for (const [key, value] of Object.entries(options.entries)) {
            log += `\u0006&\u0006${key}\u0006=\u0006${value}`;
        }

        // 추가 로그 처리
        log += options.extraLogs
            ? `\u0012${options.extraLogs.logType}\u0011${Object.entries(options.extraLogs.entries)
                .map(([k, v]) => `\u0006&\u0006${k}\u0006=\u0006${v}`)
                .join('')}\u0012`
            : `\u0012`;

        return log;
    };


    const buildAddInfo = (options: SendAddInfoOptions): string => {
        let info = "";
        for (const [key, value] of Object.entries(options)) {
            info += `${key}\u0011${value}\u0012`;
        }
        return info;
    };

    const connect = async (newChannelId: string) => {
        if (mainStore.currentChat) {
            await disconnect();
        }

        const liveDetail = await fetchLiveDetails(newChannelId);

        if (!liveDetail) throw Error('Not liveDetail');

        console.log(liveDetail);

        const streamKey = await getSoopLiveStreamInfo(liveDetail);

        if (streamKey) {
            console.log(streamKey);

            const ws = new WebSocket("ws://localhost:21201/Websocket", ['package']);
            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                console.log('WebSocket connection established');

                ws.send(JSON.stringify({
                    SVC: "CAPTION",
                    RESULT: 1,
                    DATA: {
                        nCaption: 5
                    }
                }));
                console.log('Sent CONNECT packet');
            };

            ws.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    try {
                        const response = JSON.parse(event.data) as RTMPResponse;

                        console.log(response);

                        if (response.DATA.HTMLPLAYER_PORT) {
                            const uuid = generateUUID();
                            const guid = generateGUID();

                            const ws = new WebSocket(`ws://localhost:${response.DATA.HTMLPLAYER_PORT}/Websocket/${streamKey.CHANNEL.BJID}`, ['agent']);
                            ws.binaryType = 'arraybuffer';

                            ws.onopen = () => {
                                console.log('WebSocket connection established');

                                const baseEntries: Record<string, any> = {
                                    uuid: uuid,
                                    geo_cc: streamKey.CHANNEL.geo_cc,
                                    geo_rc: streamKey.CHANNEL.geo_rc,
                                    acpt_lang: streamKey.CHANNEL.acpt_lang,
                                    svc_lang: streamKey.CHANNEL.svc_lang,
                                    os: "win",
                                    is_streamer: true,
                                    is_rejoin: false,
                                    is_auto: false,
                                    is_support_adaptive: true,
                                    uuid_3rd: uuid,
                                    subscribe: -1,
                                    player_mode: "landing"
                                };

                                // join_cc 값이 있을 때만 추가
                                if (streamKey.CHANNEL.join_cc !== undefined && streamKey.CHANNEL.join_cc !== null && streamKey.CHANNEL.join_cc !== "") {
                                    baseEntries.join_cc = streamKey.CHANNEL.join_cc;
                                }

                                const joinLogStr = buildJoinLog({
                                    logType: "log",
                                    entries: baseEntries,
                                    extraLogs: {
                                        logType: "liveualog",
                                        entries: {
                                            is_clearmode: true,
                                            lowlatency: 1,
                                            is_streamer: true
                                        }
                                    }
                                });

                                const addInfoStr = buildAddInfo({
                                    ad_lang: streamKey.CHANNEL.acpt_lang,
                                    is_auto: 0
                                });

                                const connectPacket = {
                                    SVC: 40,
                                    RESULT: 0,
                                    DATA: {
                                        gate_ip: streamKey.CHANNEL.GWIP,
                                        gate_port: Number(streamKey.CHANNEL.GWPT),
                                        center_ip: streamKey.CHANNEL.CTIP,
                                        center_port: Number(streamKey.CHANNEL.CTPT),
                                        broadno: Number(streamKey.CHANNEL.BNO),
                                        cookie: streamKey.CHANNEL.TK || "",
                                        guid: guid,
                                        cli_type: 42,
                                        passwd: "",
                                        category: streamKey.CHANNEL.CATE,
                                        JOINLOG: joinLogStr,
                                        BJID: streamKey.CHANNEL.BJID,
                                        fanticket: streamKey.CHANNEL.FTK,
                                        addinfo: addInfoStr,
                                        update_info: 0
                                    }
                                };

                                ws.send(JSON.stringify(connectPacket));

                                console.log('Sent CONNECT packet');
                            };

                            ws.onmessage = (event) => {
                                if (typeof event.data === 'string') {
                                    try {
                                        const response = JSON.parse(event.data);

                                        if (response.SVC == 39) {
                                            const joinLog = buildJoinLog({
                                                logType: 'log',
                                                entries: {
                                                    uuid: uuid,
                                                    geo_cc: streamKey.CHANNEL.geo_cc,
                                                    geo_rc: streamKey.CHANNEL.geo_rc,
                                                    acpt_lang: streamKey.CHANNEL.acpt_lang,
                                                    svc_lang: streamKey.CHANNEL.svc_lang,
                                                    os: 'win',
                                                    is_streamer: true,
                                                    is_rejoin: false,
                                                    is_auto: false,
                                                    is_support_adaptive: true,
                                                    uuid_3rd: uuid,
                                                    subscribe: 0,
                                                    player_mode: 'landing',
                                                    category_tag: streamKey.CHANNEL.CATEGORY_TAGS.join(","),
                                                    tag: streamKey.CHANNEL.HASH_TAGS.join(","),
                                                    is_embed: false
                                                },
                                                extraLogs: {
                                                    logType: 'liveualog',
                                                    entries: {
                                                        is_clearmode: true,
                                                        lowlatency: 1,
                                                        is_streamer: true
                                                    }
                                                }
                                            });

                                            const responseData = {
                                                SVC: 4,
                                                RESULT: 0,
                                                DATA: {
                                                    CIP: streamKey.CHANNEL.CTIP,
                                                    CPORT: Number(streamKey.CHANNEL.CTPT),
                                                    BNO: Number(response.DATA.uiBroadId),
                                                    PARENTBNO: 0,
                                                    SCRAPBJ: false,
                                                    PASSWORD: "",
                                                    GUID: guid,
                                                    TICKETLEN: String(response.DATA.pcTicket).length,
                                                    TICKET: response.DATA.pcTicket,
                                                    QUALITY: 2,
                                                    APPDATA: response.DATA.pcAppendDat,
                                                    JOINLOG: joinLog,
                                                    SIP: Number(response.DATA.uiIpAddr),
                                                    SPORT: Number(response.DATA.iPort),
                                                    SPROTOCOL: 2,
                                                    BJID: streamKey.CHANNEL.BJID,
                                                    SETBPS: Number(streamKey.CHANNEL.BPS),
                                                    SSBUF: 2
                                                }
                                            };

                                            ws.send(JSON.stringify(responseData));

                                            console.log(responseData);
                                        } else if (response.SVC == 41) {
                                            const responseData = {
                                                SVC: 51,
                                                RESULT: 0,
                                                DATA: {
                                                    BUFFERING_CAUSE: "initializing",
                                                }
                                            };

                                            ws.send(JSON.stringify(responseData));

                                            console.log(responseData);
                                        } else if (response.SVC == 34) {
                                            const responseData = {
                                                SVC: 30,
                                                RESULT: 0,
                                                DATA: {
                                                    UID: "",
                                                }
                                            };

                                            ws.send(JSON.stringify(responseData));

                                            console.log(responseData);
                                        } else if (response.SVC == 4) {
                                            const responseData = {
                                                SVC: 5,
                                                RESULT: 0,
                                                DATA: {}
                                            };

                                            ws.send(JSON.stringify(responseData));

                                            console.log(responseData);
                                        } else if (response.SVC == 5) {
                                            const responseData = {
                                                SVC: 500,
                                                RESULT: 0,
                                                DATA: {
                                                    cutc: Date.now() / 1000
                                                }
                                            };

                                            ws.send(JSON.stringify(responseData));

                                            console.log(responseData);
                                        } else {
                                            console.log(event);
                                        }
                                    } catch (error) {
                                        console.error('WebSocket 에러:', error);
                                    }
                                }
                            };

                            ws.onerror = (error) => {
                                console.error('WebSocket 에러:', error);
                            };

                            ws.onclose = (event) => {
                                console.log('WebSocket 연결 종료:', event.reason);
                            };

                        }
                    } catch (error) {
                        console.error('JSON 파싱 오류:', error);
                    }
                } else {
                    console.log('바이너리 데이터 수신:', event.data);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket 에러:', error);
            };

            ws.onclose = (event) => {
                console.log('WebSocket 연결 종료:', event.reason);
            };
        }

        mainStore.setLiveDetail(liveDetail);

        const chatUrl = makeChatUrl(liveDetail);

        if (!chatUrl) throw Error('Not chatUrl');

        const ws = new WebSocket(chatUrl, ['chat']);

        ws.binaryType = 'arraybuffer';

        mainStore.setCurrentChat(ws);

        ws.onopen = () => {
            console.log('WebSocket connection opened');
            setReconnectAttempts(0);
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