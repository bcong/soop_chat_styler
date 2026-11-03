export const getFullscreenElement = (target: Document = document): Element | null => {
    if (target.fullscreenElement) return target.fullscreenElement;
    return target.body?.classList.contains('fullScreen_mode') ? target.body : null;
};

export const subscribeToFullscreenChange = (listener: (isFullscreen: boolean) => void, target: Document = document) => {
    const update = () => listener(getFullscreenElement(target) !== null);
    const body = target.body;
    const classObserver = body ? new MutationObserver(update) : null;

    target.addEventListener('fullscreenchange', update);
    classObserver?.observe(body, { attributes: true, attributeFilter: ['class'] });
    update();

    return () => {
        target.removeEventListener('fullscreenchange', update);
        classObserver?.disconnect();
    };
};
