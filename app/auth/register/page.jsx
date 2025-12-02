"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const errors = {};

    // Username validation
    if (!form.userName.trim()) {
      errors.userName = "Username is required.";
    } else if (form.userName.trim().length < 3) {
      errors.userName = "Username must be at least 3 characters.";
    }

    // Full name validation
    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (form.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters.";
    }

    // Phone number validation (optional but if provided, must be valid)
    if (form.phoneNumber1.trim()) {
      if (!/^[0-9+\-\s()]{7,}$/.test(form.phoneNumber1)) {
        errors.phoneNumber1 = "Phone number must be at least 7 digits and contain only numbers, +, -, (), or spaces.";
      }
    }

    // Email validation
    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    } else if (!/[A-Z]/.test(form.password)) {
      errors.password = "Password must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(form.password)) {
      errors.password = "Password must contain at least one number.";
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
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
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
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
              className={fieldErrors.userName ? "border-red-500" : ""}
            />
            {fieldErrors.userName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.userName}</p>
            )}
          </FormField>

          <FormField>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={fieldErrors.fullName ? "border-red-500" : ""}
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
            )}
          </FormField>

          <FormField>
            <Label htmlFor="phoneNumber1">Phone number (optional)</Label>
            <Input
              id="phoneNumber1"
              name="phoneNumber1"
              value={form.phoneNumber1}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className={fieldErrors.phoneNumber1 ? "border-red-500" : ""}
            />
            {fieldErrors.phoneNumber1 && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.phoneNumber1}</p>
            )}
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
              className={fieldErrors.email ? "border-red-500" : ""}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
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
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">Must contain: uppercase letter, number, 6+ characters</p>
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
              className={fieldErrors.confirmPassword ? "border-red-500" : ""}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
            )}
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
