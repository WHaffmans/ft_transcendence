export function openOAuthPopup(
  url: string,
  name: string,
  width: number,
  height: number
) {
  return new Promise<{success: boolean, error?: string, errorDescription?: string}>((resolve) => {
    const popup = window.open(url, name, `width=${width},height=${height}`);

    if (!popup) {
      console.error("Failed to open OAuth login popup");
      return;
    }

    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", messageListener);
        popup.close();
        resolve({success: true});
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("OAuth error from popup:", event.data.error);
        window.removeEventListener("message", messageListener);
        popup.close();
        resolve({success: false, error: event.data.error, errorDescription: event.data.errorDescription});
      }
    };

    window.addEventListener("message", messageListener);
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        resolve({success: false, error: "popup_closed", errorDescription: "The popup was closed before completing the OAuth process."});
      }
    }, 1000);
  });
}
