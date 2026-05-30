// src/pages/Dashboard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

/* -----------------------------
   Utilities
------------------------------ */

// Format date exactly like StudentTable
function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN");
}

// Safe date → timestamp for sorting
function toTime(d) {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Derive base URL from axios instance, fall back safely
const API_BASE =
  (API?.defaults?.baseURL || "").replace(/\/$/, "") || "/api";

// Fetch helper WITHOUT axios interceptors
async function fetchJSON(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const json = await res.json().catch(() => ({}));
  return json?.data ?? json;
}

/* -----------------------------
   Component
------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [counts, setCounts] = useState({
    students: 0,
    courses: 0,
    results: 0,
    franchises: 0,
  });

  const [recentStudents, setRecentStudents] = useState([]);

  /* -----------------------------
     Load all dashboard data
  ------------------------------ */
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    const token =
      localStorage.getItem("admin_token") ||
      localStorage.getItem("token") ||
      "";

    try {
      const [studentsRes, coursesRes, resultsRes, franchisesRes] =
        await Promise.allSettled([
          fetchJSON("/students", token),
          fetchJSON("/courses", token),
          fetchJSON("/results", token),
          fetchJSON("/franchises", token),
        ]);

      const nextCounts = {
        students: 0,
        courses: 0,
        results: 0,
        franchises: 0,
      };

      if (studentsRes.status === "fulfilled" && Array.isArray(studentsRes.value)) {
        nextCounts.students = studentsRes.value.length;
        setRecentStudents(studentsRes.value);
      }

      if (coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value)) {
        nextCounts.courses = coursesRes.value.length;
      }

      if (resultsRes.status === "fulfilled" && Array.isArray(resultsRes.value)) {
        nextCounts.results = resultsRes.value.length;
      }

      if (
        franchisesRes.status === "fulfilled" &&
        Array.isArray(franchisesRes.value)
      ) {
        nextCounts.franchises = franchisesRes.value.length;
      }

      setCounts(nextCounts);
    } catch (err) {
      console.warn("Dashboard load error:", err);
      setError(
        "Some dashboard data could not be loaded. Check backend routes or authentication."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* -----------------------------
     Recent students (top 6)
  ------------------------------ */
  const formattedRecentStudents = useMemo(() => {
    const mapped = (recentStudents || []).map((s) => ({
      id: s._id || s.id,
      name: s.name || s.fullName || "Unknown",
      // rollNo: s.rollNo || s.registrationNumber || "-",
      email: s.email || "-",
      joinedAt: s.joinDate || s.createdAt || "",
    }));

    mapped.sort((a, b) => toTime(b.joinedAt) - toTime(a.joinedAt));
    return mapped.slice(0, 6);
  }, [recentStudents]);

  /* -----------------------------
     Render
  ------------------------------ */
  return (
    <div className="bg-light min-vh-100">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h1 className="h3 mb-0">Admin Dashboard</h1>
            <div className="small text-muted">
              Overview — quick actions and recent activity
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={loadAll}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/students")}
            >
              Manage Students
            </button>
          </div>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {/* Summary cards */}
        <div className="row gx-3 gy-3">
          {[
            { key: "students", label: "Students" },
            { key: "courses", label: "Courses" },
            { key: "results", label: "Results" },
            { key: "franchises", label: "Franchises" },
          ].map(({ key, label }) => (
            <div key={key} className="col-12 col-md-6 col-lg-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex flex-column justify-content-center">
                  <div className="small text-muted">{label}</div>
                  <div className="display-6 fw-semibold">
                    {loading ? "—" : counts[key]}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Students */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                  <h5 className="mb-0">Recent Students</h5>
                  <small className="text-muted">Latest registered</small>
                </div>

                {formattedRecentStudents.length === 0 ? (
                  <div className="text-muted">No recent students.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-borderless table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          {/* <th>Roll No</th> */}
                          <th>Email</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formattedRecentStudents.map((s) => (
                          <tr key={s.id}>
                            <td className="fw-semibold">{s.name}</td>
                            {/* <td className="text-muted">{s.rollNo}</td> */}
                            <td className="text-muted">{s.email}</td>
                            <td className="text-muted">
                              {fmtDate(s.joinedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
