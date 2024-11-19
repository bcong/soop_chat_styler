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
        }
    ];

    @observable
    private _setting = new Map();

    @observable
    private _chats: I_CHAT[] = [];

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
        const lastId = this.chats[this.chats.length - 1]?.id;

        if (lastId >= chat.id) return;

        this.chats.push(chat);

        if (this.chats.length >= 100)
            this.chats.shift();
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
}
