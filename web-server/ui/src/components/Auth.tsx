import { ChangeEvent, useState } from "react";
import { useAuth } from "../hooks/auth";

export const AuthComponent: React.FC = () => {
  const { login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  const handleOnUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorText("");
    setUsername(event.target.value);
  };

  const handleOnPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorText("");
    setPassword(event.target.value);
  };

  const handleOnAuthTypeChange = () => {
    setIsLoggingIn(!isLoggingIn);
  };

  const handleOnConfirmPasswordChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setErrorText("");
    setConfirmPassword(event.target.value);
  };

  const handleOnLoginClick = async () => {
    if (username === "" || password === "") {
      setErrorText("Enter username and password");
      return;
    }

    const response = await fetch(
      import.meta.env.VITE_BASE_URL + ":80/login",
      {
        method: "POST",
        body: JSON.stringify({ username: username, password: password }),
      }
    );

    if (response.status !== 200) {
      console.log("login failed");
      return;
    }
    login();
  };

  const handleOnRegisterClick = async () => {
    if (username === "" || password === "" || confirmPassword === "") {
      setErrorText("Fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setErrorText("Passwords do not match");
      return;
    }

    const response = await fetch(
      import.meta.env.VITE_BASE_URL + ":80/register",
      {
        method: "POST",
        body: JSON.stringify({ username: username, password: password }),
      }
    );

    if (response.status !== 201) {
      console.log("Registration failed");
      return;
    }

    setIsLoggingIn(true);
  };

  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <div className="flex flex-row gap-2 justify-center">
        <label htmlFor="changeAuth">{isLoggingIn ? "Login" : "Register"}</label>
        <input
          type="checkbox"
          name="changeAuth"
          checked={isLoggingIn}
          onChange={handleOnAuthTypeChange}
        />
      </div>

      <div className="flex flex-row gap-2 justify-center">
        <label htmlFor="username">Username</label>
        <input type="text" name="username" onChange={handleOnUsernameChange} />
      </div>
      <div className="flex flex-row gap-2 justify-center">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          onChange={handleOnPasswordChange}
        />
      </div>

      {!isLoggingIn && (
        <div className="flex flex-row gap-2 justify-center">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            onChange={handleOnConfirmPasswordChange}
          />
        </div>
      )}
      {errorText !== "" && (
        <p className="text-red-400 text-center">{errorText}</p>
      )}
      <button
        onClick={isLoggingIn ? handleOnLoginClick : handleOnRegisterClick}
      >
        {isLoggingIn ? "Login" : "Register"}
      </button>
    </div>
  );
};
