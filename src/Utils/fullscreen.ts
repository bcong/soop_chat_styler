export const subscribeToFullscreenChange = (listener: (isFullscreen: boolean) => void, target: Document = document) => {
    const update = () => listener(target.fullscreenElement !== null);
    target.addEventListener('fullscreenchange', update);
    update();
    return () => target.removeEventListener('fullscreenchange', update);
};
