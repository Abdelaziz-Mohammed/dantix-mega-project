"use client";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-8 border border-gray-200">
        <Image
          src="/assets/logo.jpg"
          alt="Dantix Logo"
          className="rounded-lg shadow mb-2"
          width={80}
          height={80}
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-black">
          Welcome to Dantix AutoML Platform
        </h1>
        <p className="text-lg text-gray-700 text-center max-w-xl">
          <span className="font-semibold text-black">Dantix</span> is your
          all-in-one platform for automated machine learning on tabular data.
          Effortlessly upload your datasets, select your target column, and let
          our system handle data cleaning, model selection, and evaluation. Get
          predictions, monitor model drift, and generate reports—all in one
          place.
        </p>
        <div className="w-full flex flex-col gap-6 mt-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-4">
            <h2 className="font-semibold text-blue-700 mb-1">
              How to Use Dantix
            </h2>
            <ol className="list-decimal pl-5 text-gray-700 text-base space-y-1">
              <li>
                <span className="font-medium text-black">
                  Sign Up or Log In:
                </span>{" "}
                Create an account or log in to access your dashboard.
              </li>
              <li>
                <span className="font-medium text-black">
                  Upload Your Dataset:
                </span>{" "}
                Go to{" "}
                <Link href="/upload" className="text-blue-600 underline">
                  Upload Dataset
                </Link>{" "}
                and select your CSV, Excel, or JSON file.
              </li>
              <li>
                <span className="font-medium text-black">
                  Select Target Column:
                </span>{" "}
                Choose the column you want to predict and enable AutoML if
                desired.
              </li>
              <li>
                <span className="font-medium text-black">Run Analysis:</span>{" "}
                Let Dantix automatically clean your data, train models, and
                evaluate results.
              </li>
              <li>
                <span className="font-medium text-black">
                  Predict & Monitor:
                </span>{" "}
                Use the{" "}
                <Link href="/predict" className="text-blue-600 underline">
                  Predict
                </Link>{" "}
                page for new data, and monitor your models for drift and
                performance.
              </li>
              <li>
                <span className="font-medium text-black">
                  Download Reports:
                </span>{" "}
                Generate and download detailed reports for your projects.
              </li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2">
            <Link
              href="/auth/login"
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-800 transition"
            >
              Get Started
            </Link>
            <Link
              href="/upload"
              className="bg-white border border-black text-black px-6 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
            >
              Try Upload
            </Link>
          </div>
        </div>
      </div>
      <footer className="mt-10 text-xs text-gray-400 text-center">
        &copy; {new Date().getFullYear()} Dantix AutoML. All rights reserved.
      </footer>
    </main>
  );
}
