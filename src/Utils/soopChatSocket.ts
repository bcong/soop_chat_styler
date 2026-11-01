export type SoopSocketChat = {
    username: string;
    comment: string;
};

const listeners = new Set<(chat: SoopSocketChat) => void>();
const pendingChats: SoopSocketChat[] = [];
const MAX_PENDING_CHATS = 100;

let hookInstalled = false;

export const parseSoopChatPacket = (data: unknown): SoopSocketChat | null => {
    const packet = data instanceof ArrayBuffer ? new TextDecoder().decode(data) : data;
    if (typeof packet !== 'string' || !packet.startsWith('\x1d\t') || packet.slice(2, 6) !== '0005') return null;

    const fields = packet.split('\x0c');
    const comment = fields[1];
    const username = fields[6];

    if (!comment?.trim() || !username?.trim()) return null;
    return { username, comment };
};

export const subscribeToSoopChat = (listener: (chat: SoopSocketChat) => void) => {
    listeners.add(listener);
    pendingChats.splice(0).forEach(listener);
    return () => listeners.delete(listener);
};

export const installSoopChatSocketHook = (pageWindow: Pick<typeof unsafeWindow, 'WebSocket'> = unsafeWindow) => {
    if (hookInstalled) return;

    const WebSocketConstructor = pageWindow.WebSocket;
    pageWindow.WebSocket = new Proxy(WebSocketConstructor, {
        construct(target, args, newTarget) {
            const socket = Reflect.construct(target, args, newTarget) as WebSocket;

            socket.addEventListener('message', (event) => {
                const chat = parseSoopChatPacket(event.data);
                if (!chat) return;

                if (listeners.size) {
                    listeners.forEach((listener) => listener(chat));
                } else {
                    // ponytail: keep only recent pre-mount chats; the overlay does not need an unbounded backlog.
                    if (pendingChats.length === MAX_PENDING_CHATS) pendingChats.shift();
                    pendingChats.push(chat);
                }
            });

            return socket;
        },
    });

    hookInstalled = true;
};
