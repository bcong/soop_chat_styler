export interface I_GLOBAL_PROPS {
    isSetting: boolean
    toggleSetting: () => void
}

export type T_SETTING =
    | 'enable'
    | 'chat_style'