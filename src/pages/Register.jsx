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
  Checkbox
} from "@heroui/react";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@heroui/react";
import { authApi } from "../../apiroutes.jsx";
import "./css/loginRegister.css";

import { MeshGradient  } from '@paper-design/shaders-react';

export default function Register() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      const email = String(data.email || "").trim().toLowerCase();
      const password = String(data.password || "");
      const confirmPassword = String(data.confirmPassword || "");

      if (password !== confirmPassword) {
        toast.warning("Passwords do not match.");
        setIsPending(false);
        return;
      }

      const response = await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email,
        password,
      });

      toast.success(
        response?.message ||
          `Account created! Check ${email} to confirm your email.`
      );
      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      const message = error?.data?.error || error?.message || "Registration failed. Please try again.";
      toast.danger(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
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
        
      {/*<div className="loginBackground" /> */}
      <div className="logo" />

      <Card
        className="p-8 w-full max-w-md space-y-4 glass fadedUp RegisterCard"
      >
        <h2 className="text-2xl font-bold">
          Register
        </h2>

        <p className="text-sm text-gray-500 text-left">
          Have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Sign in
          </Link>
        </p>

        <Form onSubmit={onSubmit} className="space-y-4">
          {/* first name and last name but its two TextField components but have them next to each other */}
          <div className="flex space-x-4">
            <TextField isRequired className="w-1/2" name="firstName">
              <Label>First Name</Label>
              <InputGroup>
                <InputGroup.Input
                  className="w-full"
                  placeholder="John"
                  type="text"
                />
              </InputGroup>
              <FieldError>Please enter a valid first name</FieldError>
            </TextField>

            <TextField isRequired className="w-1/2" name="lastName">
              <Label>Last Name</Label>
              <InputGroup>
                <InputGroup.Input
                  className="w-full"
                  placeholder="Doe"
                  type="text"
                />
              </InputGroup>
              <FieldError>Please enter a valid last name</FieldError>
            </TextField>
          </div>

          <TextField isRequired className="w-full" name="username">
            <Label>Username</Label>
            <InputGroup>
              <InputGroup.Input
                className="w-full"
                placeholder="johndoe"
                type="text"
              />
            </InputGroup>
            <FieldError>Please enter a valid username</FieldError>
          </TextField>

          <TextField isRequired className="w-full" name="email">
            <Label>Email address</Label>
            <InputGroup>
              <InputGroup.Input
                className="w-full"
                placeholder="name@email.com"
                type="email"
              />
            </InputGroup>
            <FieldError>Please enter a valid email address</FieldError>
          </TextField>

          <TextField isRequired className="w-full" name="password">
            <Label>Password</Label>
            <InputGroup>
              <InputGroup.Input
                className="w-full"
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
                  {isVisible ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeSlash className="size-4" />
                  )}
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
            <FieldError>Please enter a valid password</FieldError>
          </TextField>

          <TextField isRequired className="w-full" name="confirmPassword">
            <Label>Confirm Password</Label>
            <InputGroup>
              <InputGroup.Input
                className="w-full"
                placeholder="confirm your password"
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
                  {isVisible ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeSlash className="size-4" />
                  )}
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
            <FieldError>Please enter a valid password</FieldError>
          </TextField>

          <br />

          <Checkbox id="basic-terms">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label htmlFor="basic-terms">
                I agree to the
                <a href="/terms" className="text-blue-500" target="_blank" rel="noopener noreferrer"> Terms of Service </a>
                and
                <a href="/privacy" className="text-blue-500" target="_blank" rel="noopener noreferrer"> Privacy Policy</a></Label>
            </Checkbox.Content>
          </Checkbox>

          <br />
          <Button
            className="LoginBtn"
            fullWidth
            type="submit"
            isPending={isPending}
            isDisabled={isPending}
          >
            {({ isPending: pending }) => (
              <>
                {pending && (
                  <Spinner color="current" size="sm" className="mr-2" />
                )}
                {pending ? "Registering..." : "Register"}
              </>
            )}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
