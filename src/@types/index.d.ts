export interface I_GLOBAL_PROPS {
    isSetting: boolean
    toggleSetting: () => void
}

export type T_SETTING =
    | 'enable'
    | 'chat_style'
    | 'overlay_x'
    | 'overlay_y'
    | 'overlay_view_count'
    | 'defalut_chat_enable'

export type T_SETTING_TYPE =
    | 'toggle'
    | 'list'
    | 'input'
    | 'slider'

export interface I_OPTION {
    key: number
    name: string
}

export interface I_SETTING {
    type: T_SETTING_TYPE
    value: T
    options?: I_OPTION[]
    disable?: boolean
    inputType?: string
    max?: number
    min?: number
    cb: (value: unknown) => void
}

export interface I_SETTINGS {
    name: string
    disable?: boolean
    values: I_SETTING[]
}

export interface I_CHAT {
    id: number
    username: string
    messageText: string
}

export interface I_INIT_SETTING {
    key: T_SETTING
    value: unknown
}