import { I_CHAT, I_INIT_SETTING, T_SETTING } from "@Types/index";
import { makeObservable, observable, action, computed } from "mobx";

export default class MainStore {
    private _initSetting: I_INIT_SETTING[] = [
        {
            key: 'chat_style',
            value: 0,
        },
        {
            key: 'enable',
            value: true,
        },
        {
            key: 'overlay_view_count',
            value: 10,
        },
        {
            key: 'defalut_chat_enable',
            value: true,
        },

        // 오버레이
        {
            key: 'overlay_background_opacity',
            value: 0
        },
        {
            key: 'overlay_chat_opacity',
            value: 80
        },
        {
            key: 'overlay_random_username',
            value: true,
        },
        {
            key: 'overlay_view_width',
            value: 300
        },
        {
            key: 'overlay_sort_chat_messages',
            value: false,
        },
        {
            key: 'overlay_font_size',
            value: 14,
        },

        // 프레임
        {
            key: 'frame_chat_position',
            value: 1,
        },
        {
            key: 'frame_random_username',
            value: true,
        },
        {
            key: 'frame_chat_background',
            value: false,
        },
        {
            key: 'frame_view_count',
            value: 3,
        },
        {
            key: 'frame_chat_opacity',
            value: 80
        },
        {
            key: 'frame_background_opacity',
            value: 70
        },
        {
            key: 'frame_background_area',
            value: 0
        },
        {
            key: 'frame_view_width',
            value: 300
        },
        {
            key: 'frame_sort_chat_messages',
            value: false,
        },
        {
            key: 'frame_font_size',
            value: 14,
        },
    ];

    @observable
    private _setting = new Map();

    @observable
    private _chats: I_CHAT[] = [];

    @observable
    private _maxChats = 20;

    constructor() {
        makeObservable(this);
        this.init();
    }

    @action
    init = () => {
        for (const setting of this.initSetting) {
            this.setting.set(setting.key, setting.value);
        }
    };

    @action
    setSetting = (key: T_SETTING, value: unknown, save: boolean) => {
        this.setting.set(key, value);
        save && GM_setValue(key, value);
    };

    @action
    addChat = (chat: I_CHAT) => {
        this.chats.push(chat);

        if (this.chats.length >= this.maxChats)
            this.chats.shift();
    };

    @action
    lastChat = () => {
        return this.chats[this.chats.length - 1];
    };

    @computed
    get initSetting() {
        return this._initSetting;
    }

    @computed
    get setting() {
        return this._setting;
    }

    @computed
    get chats() {
        return this._chats;
    }

    @computed
    get maxChats() {
        return this._maxChats;
    }
}
