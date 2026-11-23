import { useContext, useEffect, useState } from "react";
import TextInputDialog from "../shared/TextInputDialog";
import ErrorMessagePanel from "../shared/ErrorMessagePanel";
import AdminFrontpage from "./Frontpage";
import { LocaleContext } from "../../providers/LocaleProvider";
import { ADMIN_TOKEN_STORAGE_KEY, clearAdminToken, getAdminAuthorizationHeader } from "./adminAuth";

const UNAUTHORIZED = 401;

/** Resolves to whether the server accepts the token; rejects when the server could not decide. */
async function isAdminTokenValid(token: string): Promise<boolean> {
  const response = await fetch(`/api/admin/login`, {
    method: "POST",
    headers: {
      Authorization: getAdminAuthorizationHeader(token),
    },
  });

  if (!response.ok && response.status !== UNAUTHORIZED) {
    throw new Error(`Admin login failed with status ${response.status}`);
  }

  return response.ok;
}

const Admin = () => {
  const { locale } = useContext(LocaleContext);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const login = (token: string) => {
    isAdminTokenValid(token)
      .then((isValid) => {
        if (isValid) {
          localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
          setErrorMessage("");
          setIsLoggedIn(true);
        } else {
          clearAdminToken();
          setErrorMessage(locale.admin_login.error_message_invalid_token);
        }
      })
      .catch(() => setErrorMessage(locale.admin_login.error_message_server_unreachable));
  };

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (!token) {
      return;
    }

    isAdminTokenValid(token)
      .then((isValid) => {
        if (isValid) {
          setIsLoggedIn(true);
        }
      })
      .catch((error) => console.error("Failed to verify the saved admin token", error));
  }, []);

  if (isLoggedIn) {
    return <AdminFrontpage />;
  }

  return (
    <div className="flex items-center justify-center h-full w-full flex-col">
      <TextInputDialog<string>
        isSecret={true}
        title={locale.admin_login.login_input_dialog_title}
        message={locale.admin_login.login_input_dialog_message}
        placeholder={locale.admin_login.login_input_dialog_placeholder}
        canCloseOnBackgroundClick={false}
        onAccept={(result: string) => login(result)}
        buttonAcceptText={locale.admin_login.button_login_text}
      />

      {errorMessage !== "" && (
        <ErrorMessagePanel
          title={locale.admin_login.error_message_login_failed}
          message={errorMessage}
        />
      )}
    </div>
  );
};

export default Admin;
