import { T_SETTING } from "@Types/index";
import { makeObservable, observable, action, computed } from "mobx";

export default class MainStore {
    @observable
    private _setting = new Map();

    constructor() {
        makeObservable(this);
    }

    @action
    setSetting = (key: T_SETTING, value: unknown, save: boolean) => {
        this._setting.set(key, value);
        save && GM_setValue(key, value);
    };

    @computed
    get setting() {
        return this._setting;
    }
}
