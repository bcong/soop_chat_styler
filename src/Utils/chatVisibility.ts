export type ChatVisibilityMode = 'normal' | 'fullscreen' | 'pip';
export type ChatVisibilityByMode = Record<ChatVisibilityMode, boolean>;

export const getChatVisibilityMode = (isPip: boolean, isFullscreen: boolean): ChatVisibilityMode =>
    isPip ? 'pip' : isFullscreen ? 'fullscreen' : 'normal';

export const isChatAllowedInMode = (fullscreenOnly: boolean, isFullscreen: boolean, isPip: boolean): boolean =>
    !fullscreenOnly || isFullscreen || isPip;

export const getVisibilityTogglePortalTarget = (
    isPip: boolean,
    fullscreenTarget: Element | null | undefined,
    body: HTMLElement,
): Element | null => (isPip ? null : (fullscreenTarget ?? body));

export const toggleChatVisibility = (
    visibility: ChatVisibilityByMode,
    mode: ChatVisibilityMode,
): ChatVisibilityByMode => ({
    ...visibility,
    [mode]: !visibility[mode],
});
