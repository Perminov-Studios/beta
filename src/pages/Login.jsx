"use client";

import {
  Button,
  Card,
  InputGroup,
  Label,
  TextField,
  FieldError,
  Form,
  Spinner,
  Checkbox,
} from "@heroui/react";

import { MeshGradient  } from '@paper-design/shaders-react';

import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "@heroui/react";
import { authApi, getAuthSession, saveAuthSession } from "../../apiroutes.jsx";

import "./css/loginRegister.css";

export default function Login() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [email, setEmail] = useState("");
  const [isRemembered, setIsRemembered] = useState(false);

  useEffect(() => {
    const existingSession = getAuthSession();
    if (existingSession?.token) {
      navigate("/user", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      const email = String(data.email || "").trim().toLowerCase();
      const password = String(data.password || "");

      const response = await authApi.login({ email, password });

      saveAuthSession({
        token: response.token,
        user: response.user,
        remember: isRemembered,
      });

      toast.success(response.message || "Login successful! Welcome back.");
      navigate("/user", { replace: true });
    } catch (error) {
      console.error(error);
      const status = error?.status;
      const message =
        status === 401
          ? "Invalid email or password."
          : status === 403
            ? "Please confirm your email before logging in."
            : error?.data?.error || error?.message || "Something went wrong. Please try again.";

      if (status === 403) {
        toast.warning(message);
      } else {
        toast.danger(message);
      }
    } finally {
      setIsPending(false);
    }
  };

  const onForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.warning("Enter your email address first.");
      return;
    }

    setIsPending(true);

    try {
      const response = await authApi.requestPasswordReset({ email: normalizedEmail });
      toast.success(
        response?.message ||
          `If ${normalizedEmail} is registered, a password reset email has been sent.`
      );
    } catch (error) {
      console.error(error);
      const message = error?.data?.error || error?.message || "Unable to send reset email.";
      toast.danger(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <MeshGradient
          width="100%"
          height="100%"
          colors={["#0051ff", "#000000", "#000000", "#000000"]}
          distortion={0.47}
          swirl={0.2}
          grainMixer={0}
          grainOverlay={0.19}
          speed={0.5}
          style={{
              position: 'absolute',
              inset: 0,
              zIndex: -1,
            }}
        />
        {/* Background and logo elements 
        <Water
            width="100%"
            height="100%"
            image="/wallpaper.png"
            colorBack="#8f8f8f00"
            colorHighlight="#ffffff"
            highlights={0}
            layering={0}
            edges={0}
            waves={0.3}
            caustic={0.1}
            size={1}
            speed={0.13}
            scale={1.16}
            fit="cover"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              filter: 'grayscale(100%)'
            }}
          />*/}
        {/* Background and logo elements*/}
        <div className="loginBackground" /> 
        <div className="logo" />

        <Card
          className="p-8 w-full max-w-md space-y-4 glass fadedUp LoginCard"
        >
          <h2 className="text-2xl font-bold">
            Login
          </h2>

          <p className="text-sm text-gray-500 text-left">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-500">
              Sign up
            </Link>
          </p>

          <Form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <TextField isRequired className="w-full" name="email">
              <Label>Email address</Label>
              <InputGroup>
                <InputGroup.Input
                  autoComplete="username"
                  className="w-full"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@email.com"
                  value={email}
                  type="email"
                />
              </InputGroup>
              <FieldError>Please enter a valid email address</FieldError>
            </TextField>

            {/* Password */}
            <TextField isRequired className="w-full" name="password">
              <Label>Password</Label>
              <InputGroup>
                <InputGroup.Input
                  autoComplete="current-password"
                  className="w-full"
                  name="password"
                  placeholder="your password"
                  type={isVisible ? "text" : "password"}
                />
                <InputGroup.Suffix className="pr-0">
                  <Button
                    isIconOnly
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    size="sm"
                    variant="ghost"
                    onPress={() => setIsVisible(!isVisible)}
                  >
                    {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              <FieldError>Please enter a valid password</FieldError>
            </TextField>

            <Button
              className="self-start px-0"
              variant="light"
              size="sm"
              isDisabled={isPending || !email.trim()}
              onPress={onForgotPassword}
            >
              Forgot password?
            </Button>

            <Checkbox
              id="remember-me"
              isSelected={isRemembered}
              onChange={(value) => {
                if (typeof value === "boolean") {
                  setIsRemembered(value);
                  return;
                }

                setIsRemembered(Boolean(value?.target?.checked));
              }}
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label htmlFor="remember-me">Remember me</Label>
              </Checkbox.Content>
            </Checkbox>

            <Button
              className="LoginBtn"
              fullWidth
              type="submit"
              isPending={isPending}
              isDisabled={isPending}
            >
              {({ isPending: pending }) => (
                <>
                  {pending && <Spinner color="current" size="sm" className="mr-2" />}
                  {pending ? "Logging in..." : "Login"}
                </>
              )}
            </Button>
          </Form>

          {/* Terms */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            By logging in, you agree to our{" "}
            <a href="/terms" className="text-blue-500" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-500" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </p>
        </Card>
      </div>
    </>
  );
}
