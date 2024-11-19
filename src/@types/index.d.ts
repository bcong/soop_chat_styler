export interface I_GLOBAL_PROPS {
    isSetting: boolean
    toggleSetting: () => void
}

export type T_SETTING =
    | 'enable'
    | 'chat_style'

export type T_SETTING_TYPE =
    | 'toggle'
    | 'list'

export interface I_OPTION {
    key: number
    name: string
}

export interface I_SETTING {
    type: T_SETTING_TYPE
    value: T
    options?: I_OPTION[]
    cb: (value: unknown) => void
}

export interface I_SETTINGS {
    name: string
    values: I_SETTING[]
}