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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ userName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.userName || !form.password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    try {
      await login({
        userName: form.userName,
        password: form.password,
      });
      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-linear-to-br from-blue-50 via-white to-gray-50">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Log in to access your dashboard and manage your models.
          </CardDescription>
        </CardHeader>

        {error ? (
          <div className="mb-4">
            <Alert variant="destructive">{error}</Alert>
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
              placeholder="Enter your username"
              autoComplete="username"
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
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </FormField>

          <Button
            type="submit"
            className="w-full mt-2 bg-black text-white hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </Form>

        <CardFooter className="text-sm text-gray-600 flex items-center justify-between">
          <span>Don&apos;t have an account?</span>
          <Link
            href="/auth/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Create account
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
