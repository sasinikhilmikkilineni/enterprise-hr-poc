import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Users, Filter } from "lucide-react";
import { useOktaAuth } from "@okta/okta-react";
import apiClient from "../api/client.js";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";

function formatSalary(n) {
  if (!n && n !== 0) return "—";
  return `$${Number(n).toLocaleString("en-US")}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function GenderBadge({ gender }) {
  if (!gender) return <span className="text-slate-400">—</span>;
  const isM = gender === "M";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        isM ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
      }`}
    >
      {isM ? "Male" : "Female"}
    </span>
  );
}

export default function Employees() {
  const { authState } = useOktaAuth();
  const groups = authState?.idToken?.claims?.groups || [];
  const isHR = groups.includes("HR_Users") || groups.includes("Admin");

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/api/employees", {
        params: { page, limit: LIMIT },
      });
      setEmployees(data.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    apiClient
      .get("/api/departments")
      .then((r) => setDepartments(r.data.data || []))
      .catch(() => {});
  }, []);

  const filtered = employees.filter((e) => {
    const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase());
    const matchDept = !selectedDept || e.dept_name === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent appearance-none transition"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_no} value={d.dept_name}>
                {d.dept_name}
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-sm text-slate-500">
          {filtered.length} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Emp #", "Name", "Department", "Title", ...(isHR ? ["Salary", "Hire Date", "Gender"] : [])].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: isHR ? 7 : 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={isHR ? 7 : 4}
                    className="px-4 py-12 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users className="w-10 h-10 opacity-30" />
                      <p className="font-medium">No employees found</p>
                      <p className="text-sm">
                        Try adjusting your search or department filter
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filtered.map((emp, i) => (
                  <tr
                    key={`${emp.emp_no}-${i}`}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {emp.emp_no}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {emp.dept_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {emp.title || "—"}
                    </td>
                    {isHR && (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                          {formatSalary(emp.salary)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(emp.hire_date)}
                        </td>
                        <td className="px-4 py-3">
                          <GenderBadge gender={emp.gender} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-slate-500">Page {page}</span>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={employees.length < LIMIT}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
