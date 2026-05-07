import React, { useState } from "react";
import { useOktaAuth } from "@okta/okta-react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Lock,
  Download,
  FileText,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import apiClient from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

const MOCK_DOCS = [
  { name: "employee-handbook-2025.pdf", size: "3.4 MB", uploadedBy: "HR Admin", date: "Jan 15, 2025" },
  { name: "benefits-guide-q2.pdf", size: "1.8 MB", uploadedBy: "Benefits Team", date: "Mar 28, 2025" },
  { name: "onboarding-checklist.pdf", size: "0.6 MB", uploadedBy: "HR Admin", date: "Feb 01, 2025" },
  { name: "payroll-schedule-2025.pdf", size: "0.3 MB", uploadedBy: "Payroll Dept", date: "Dec 20, 2024" },
  { name: "performance-review-template.pdf", size: "0.9 MB", uploadedBy: "People Ops", date: "Apr 10, 2025" },
];

function AccessDenied({ email }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">
          HR Permissions Required
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Your account (<strong>{email}</strong>) does not have access to the
          Document Center. This area is restricted to{" "}
          <strong>HR_Users</strong> and <strong>Admin</strong> groups.
          <br />
          <br />
          Please contact your IT administrator to request access.
        </p>
      </div>
    </div>
  );
}

function UploadZone({ onUploadComplete }) {
  const toast = useToast();
  const { authState } = useOktaAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // 1. Get presigned URL
      const { data } = await apiClient.get("/api/documents/presigned-url", {
        params: { filename: file.name, action: "upload" },
      });

      // 2. Upload directly to S3
      await axios.put(data.url, file, {
        headers: { "Content-Type": "application/pdf" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      setProgress(100);

      // 3. Slack notification (silent fail)
      const uploaderName =
        authState?.idToken?.claims?.name ||
        authState?.idToken?.claims?.email ||
        "Unknown";
      await apiClient
        .post("/api/notifications/slack", {
          filename: file.name,
          uploader: uploaderName,
          action: "upload",
        })
        .catch(() => {});

      toast(`${file.name} uploaded successfully`, "success");
      onUploadComplete?.();
    } catch (e) {
      toast(e.message || "Upload failed", "error");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 800);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
        } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          ) : (
            <UploadCloud
              className={`w-10 h-10 ${isDragActive ? "text-indigo-500" : "text-slate-300"}`}
            />
          )}
          <div>
            <p className="font-semibold text-slate-700">
              {uploading
                ? "Uploading…"
                : isDragActive
                ? "Drop PDF here"
                : "Drag & drop a PDF, or click to browse"}
            </p>
            <p className="text-sm text-slate-400 mt-1">PDF files only</p>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Uploading to S3…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentCenter() {
  const { authState } = useOktaAuth();
  const toast = useToast();
  const [downloading, setDownloading] = useState(null);

  const groups = authState?.idToken?.claims?.groups || [];
  const hasAccess =
    groups.includes("HR_Users") || groups.includes("Admin");
  const email = authState?.idToken?.claims?.email || "";

  const handleDownload = async (filename) => {
    setDownloading(filename);
    try {
      const { data } = await apiClient.get("/api/documents/presigned-url", {
        params: { filename, action: "download" },
      });
      window.open(data.url, "_blank", "noopener,noreferrer");
      toast(`Download started: ${filename}`, "success");
    } catch (e) {
      toast(e.message || "Download failed", "error");
    } finally {
      setDownloading(null);
    }
  };

  if (!hasAccess) {
    return <AccessDenied email={email} />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">
            Upload Document
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload HR documents directly to secure S3 storage
          </p>
        </div>
        <UploadZone />
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            HR Documents
          </h2>
          <span className="text-xs text-slate-400">{MOCK_DOCS.length} files</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Filename", "Size", "Uploaded By", "Date", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {MOCK_DOCS.map((doc) => (
                <tr
                  key={doc.name}
                  className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors duration-150"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        {doc.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{doc.size}</td>
                  <td className="px-5 py-3 text-slate-500">{doc.uploadedBy}</td>
                  <td className="px-5 py-3 text-slate-400">{doc.date}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDownload(doc.name)}
                      disabled={downloading === doc.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloading === doc.name ? "…" : "Download"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
