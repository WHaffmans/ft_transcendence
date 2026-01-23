import { sha256 } from "js-sha256";
import { arrayToString, base64UrlEncode, generateRandomString } from "./utils";
import { env } from "$env/dynamic/public";

//TODO: BIG REFACTOR
export function openPopup(
  url: string,
  name: string,
  width: number,
  height: number,
  callback: (code: string, state: string) => Promise<boolean>
) {
  return new Promise((resolve) => {
    const client_id = env.PUBLIC_CLIENT_ID ?? '';
    const redirect_uri = encodeURIComponent(env.PUBLIC_OAUTH_REDIRECT_URI ?? '');
    const state = generateRandomString(40);
    sessionStorage.setItem("pkce_state", state);

    const code_verifier = generateRandomString(128);
    sessionStorage.setItem("pkce_code_verifier", code_verifier);

    const code_challenge = base64UrlEncode(
      arrayToString(sha256.create().update(code_verifier).array())
    );

    const response_type = "code";
    const scope = encodeURIComponent("user:read");

    const popup = window.open(
        `${url}?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&scope=${scope}&state=${state}&code_challenge=${code_challenge}&code_challenge_method=S256`,
        name,
        `width=${width},height=${height}`);

    if (!popup) {
      console.error("Failed to open OAuth login popup");
      return;
    }

    // Listen for messages from the popup
    const messageListener = (event: MessageEvent) => {
      // Ensure the message is from the expected origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === "OAUTH_SUCCESS") {
        const { code, state: returnedState } = event.data;
        // this.handleOAuthCallbackFromPopup(code, returnedState).then(
        //   (success) => {
        //     window.removeEventListener("message", messageListener);
        //     popup.close();
        //     resolve(success);
        //   }
        // );
        callback(code, returnedState).then((success) => {
          window.removeEventListener("message", messageListener);
          popup.close();
          resolve(success);
        });
      } else if (event.data.type === "OAUTH_ERROR") {
        console.error("OAuth error from popup:", event.data.error);
        window.removeEventListener("message", messageListener);
        popup.close();
        resolve(false);
      }
    };

    window.addEventListener("message", messageListener);
    // Handle popup being closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        resolve(false);
      }
    }, 1000);
  });
}
