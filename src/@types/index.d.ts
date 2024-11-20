export interface I_GLOBAL_PROPS {
    isSetting: boolean
    toggleSetting: () => void
}

export type T_SETTING =
    | 'enable'
    | 'chat_style'
    | 'defalut_chat_enable'

    // 오버레이
    | 'overlay_x'
    | 'overlay_y'
    | 'overlay_view_count'
    | 'overlay_random_username'
    | 'overlay_view_width'
    | 'overlay_background_opacity'
    | 'overlay_chat_opacity'
    | 'overlay_sort_chat_messages'

    // 프레임
    | 'frame_chat_position'
    | 'frame_random_username'
    | 'frame_view_count'
    | 'frame_chat_opacity'
    | 'frame_background_opacity'
    | 'frame_background_area'
    | 'frame_chat_background'
    | 'frame_view_width'
    | 'frame_sort_chat_messages'

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
    color: string
}

export interface I_INIT_SETTING {
    key: T_SETTING
    value: unknown
}