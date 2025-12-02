"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/shared/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Form, FormField } from "@/components/ui/form";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    userName: "",
    fullName: "",
    phoneNumber1: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (
      !form.userName ||
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "Please fill in all required fields.";
    }
    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userName: form.userName,
        fullName: form.fullName,
        phoneNumber1: form.phoneNumber1,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      };

      const response = await register(payload);
      const message = response?.message || "User created successfully.";
      setSuccess(message);
    } catch (err) {
      const apiData = err?.response?.data;
      let message =
        apiData?.message ||
        err?.message ||
        "Registration failed. Please try again.";

      if (apiData?.errors && typeof apiData.errors === "object") {
        const collected = Object.values(apiData.errors)
          .flat()
          .filter(Boolean);
        if (collected.length) {
          message = collected.join(" \n");
        }
      } else if (typeof apiData === "string" && apiData.trim().length) {
        message = apiData;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-linear-to-br from-blue-50 via-white to-gray-50">
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Sign up to start uploading datasets and training models.
          </CardDescription>
        </CardHeader>

        {error ? (
          <div className="mb-4">
            <Alert variant="destructive">{error}</Alert>
          </div>
        ) : null}

        {success ? (
          <div className="mb-4">
            <Alert variant="success">{success}</Alert>
          </div>
        ) : null}

        <Form onSubmit={handleSubmit} className="space-y-4">
          <FormField>
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              name="userName"
              value={form.userName}
              onChange={handleChange}
              placeholder="Choose a username"
            />
          </FormField>

          <FormField>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </FormField>

          <FormField>
            <Label htmlFor="phoneNumber1">Phone number</Label>
            <Input
              id="phoneNumber1"
              name="phoneNumber1"
              value={form.phoneNumber1}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </FormField>

          <FormField>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </FormField>

          <FormField>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
          </FormField>

          <FormField>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          </FormField>

          <Button
            type="submit"
            className="w-full mt-2 bg-black text-white hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </Form>

        <CardFooter className="text-sm text-gray-600 flex items-center justify-between">
          <span>Already have an account?</span>
          <Link
            href="/auth/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Log in
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
