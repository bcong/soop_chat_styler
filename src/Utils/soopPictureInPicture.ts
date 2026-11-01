type DocumentPictureInPictureApi = {
    requestWindow: (options: { width: number; height: number }) => Promise<Window>;
};

type PageWindow = Pick<typeof unsafeWindow, 'HTMLVideoElement'> & {
    documentPictureInPicture?: DocumentPictureInPictureApi;
};

type PictureInPictureHandler = (video: HTMLVideoElement) => Promise<Window | null>;

let handler: PictureInPictureHandler | null = null;
let hookInstalled = false;

export const subscribeToSoopPictureInPicture = (nextHandler: PictureInPictureHandler) => {
    handler = nextHandler;
    return () => {
        if (handler === nextHandler) handler = null;
    };
};

export const installSoopPictureInPictureHook = (pageWindow: PageWindow = unsafeWindow) => {
    if (hookInstalled) return;

    const prototype = pageWindow.HTMLVideoElement.prototype;
    const nativeRequest = prototype.requestPictureInPicture;
    if (!nativeRequest) return;

    prototype.requestPictureInPicture = function () {
        if (!handler || !pageWindow.documentPictureInPicture) return nativeRequest.call(this);

        return handler(this).then((pipWindow) =>
            // Document PiP replaces the native window through an API typed for video-only PiP.
            pipWindow ? (pipWindow as unknown as PictureInPictureWindow) : nativeRequest.call(this),
        );
    };

    hookInstalled = true;
};
