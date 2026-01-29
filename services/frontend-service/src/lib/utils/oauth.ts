export function openOAuthPopup(
  url: string,
  name: string,
  width: number,
  height: number
) {
  return new Promise((resolve) => {
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
        resolve(true);
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("OAuth error from popup:", event.data.error);
        window.removeEventListener("message", messageListener);
        popup.close();
        resolve(false);
      }
    };

    window.addEventListener("message", messageListener);
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        resolve(false);
      }
    }, 1000);
  });
}
