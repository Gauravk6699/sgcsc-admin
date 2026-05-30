import { useState, useMemo } from "react";
import API from "../api/axiosInstance";

// Default avatar image for students without a photo
const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="40" fill="#a0a0a0"/>
      <circle cx="40" cy="30" r="14" fill="#e0e0e0"/>
      <path d="M20 68 Q40 45 60 68" fill="#e0e0e0"/>
    </svg>`
  );

let API_ORIGIN = "";
try {
  const base = API?.defaults?.baseURL || "";
  if (base) API_ORIGIN = new URL(base).origin;
} catch {
  API_ORIGIN = window.location.origin;
}

function imgUrl(filenameOrUrl) {
  if (!filenameOrUrl) return DEFAULT_AVATAR;

  if (filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://")) {
    return filenameOrUrl;
  }

  // If DB ever stores "uploads/..." or "assignments/..." include as-is
  if (filenameOrUrl.includes("/")) {
    const rel = filenameOrUrl.startsWith("/")
      ? filenameOrUrl.slice(1)
      : filenameOrUrl;
    return `${API_ORIGIN}/${rel}`;
  }

  // Normal case: DB has just "17644....png"
  const path = `/uploads/${filenameOrUrl}`;
  return `${API_ORIGIN}${path}`;
}

export default function StudentTable({ students, onEdit, onDelete, onView }) {
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedStudents = useMemo(
    () =>
      [...(students || [])].sort((a, b) =>
        sortOrder === "asc"
          ? (a.name || a.studentName || "").localeCompare(
              b.name || b.studentName || ""
            )
          : (b.name || b.studentName || "").localeCompare(
              a.name || a.studentName || ""
            )
      ),
    [students, sortOrder]
  );

  const toggleSort = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleDateString("en-IN");
  };

  const renderCourse = (s) => {
    // If student has courses array, show first course name or count
    if (s.courses && Array.isArray(s.courses) && s.courses.length > 0) {
      const firstCourse = s.courses[0].courseName || "-";
      if (s.courses.length === 1) return firstCourse;
      return `${firstCourse} (+${s.courses.length - 1} more)`;
    }
    // Fallback to legacy fields
    return (
      s.courseName ||
      s.course?.title ||
      s.course?.name ||
      (typeof s.course === "string" ? s.course : "") ||
      "-"
    );
  };

  // Calculate total fee details from courses array or fallback to legacy
  const getFeeDetails = (s) => {
    if (s.courses && Array.isArray(s.courses) && s.courses.length > 0) {
      const totalFee = s.courses.reduce((sum, c) => sum + (Number(c.feeAmount) || 0), 0);
      const totalPaid = s.courses.reduce((sum, c) => sum + (Number(c.amountPaid) || 0), 0);
      return { fee: totalFee, paid: totalPaid };
    }
    // Fallback to legacy fields
    return {
      fee: Number(s.feeAmount) || 0,
      paid: Number(s.amountPaid) || 0,
    };
  };

  return (
    <div className="table-responsive bg-white rounded shadow-sm">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Photo</th>
            <th
              scope="col"
              style={{ cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={toggleSort}
              title="Sort by name"
            >
              Student {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th>Roll No</th>

            <th scope="col">Center</th>
            <th scope="col">Contact</th>
            <th scope="col">State / District / Address</th>
            <th scope="col">Course</th>
            <th scope="col">Exam / Board / Marks</th>
            <th scope="col">Session</th>
            <th scope="col">Fee Details</th>
            <th scope="col" className="text-center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedStudents.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center py-4 text-muted">
                No students found.
              </td>
            </tr>
          ) : (
            sortedStudents.map((s) => {
              const id = s._id || s.id;

              const name = s.name || s.studentName || "-";
              const center =
                s.centerName ||
                s.franchiseName ||
                s.instituteName ||
                s.center ||
                "-";

              const gender = s.gender || "";
              const dobStr = formatDate(s.dob);

              const email = s.email || "-";
              const mobile = s.mobile || s.contact || "-";

              const state = s.state || "";
              const district = s.district || "";
              const fullAddress = s.address || "";
              const shortAddress =
                fullAddress && fullAddress.length > 40
                  ? fullAddress.slice(0, 40) + "…"
                  : fullAddress || "";

              const course = renderCourse(s);

              const examLine = s.examPassed || "-";
              const boardPart = s.board ? `, ${s.board}` : "";
              const marksPart = s.marksOrGrade ? ` (${s.marksOrGrade})` : "";
              const examBoardMarks = `${examLine}${boardPart}${marksPart}`;

              const session =
                (s.sessionStart || s.sessionEnd) &&
                `${formatDate(s.sessionStart)} – ${formatDate(
                  s.sessionEnd
                )}`;

              const photoSrc = imgUrl(s.photo || s.photoUrl);

              return (
                <tr key={id || name}>
                  {/* Photo box – clickable to open in new tab */}
                  <td>
                    <a
                      href={photoSrc}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          overflow: "hidden",
                          borderRadius: 8,
                          border: "1px solid #dee2e6",
                          backgroundColor: "#f8f9fa",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={photoSrc}
                          alt={name || "Student"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>
                    </a>
                  </td>

                  <td>
                    <div className="fw-semibold">{name}</div>
                    <div className="small text-muted">
                      {gender || "-"}
                      {dobStr !== "-" ? ` • ${dobStr}` : ""}
                    </div>
                  </td>
                  <td>{s.rollNumber || "-"}</td>



                  <td>{center}</td>

                  <td>
                    <div className="small">{mobile}</div>
                    <div className="small text-muted">{email}</div>
                  </td>

                  <td>
                    <div className="small">
                      {state || "-"}
                      {district ? ` / ${district}` : ""}
                    </div>
                    {shortAddress && (
                      <div
                        className="small text-muted"
                        title={fullAddress || ""}
                      >
                        {shortAddress}
                      </div>
                    )}
                  </td>

                  <td>{course}</td>

                  <td className="small text-muted">{examBoardMarks}</td>

                  <td className="small text-muted">{session || "-"}</td>

                  <td className="small">
                        {(() => {
                          const { fee, paid } = getFeeDetails(s);
                          const pending = fee - paid;
                          return (
                            <>
                              <div>Fee: ₹{fee}</div>
                              <div>Paid: ₹{paid}</div>
                              <div className={pending > 0 ? "text-danger" : "text-success"}>
                                Pending: ₹{pending}
                              </div>
                            </>
                          );
                        })()}
                      </td>

                  <td className="text-center">
                    {onView && (
                      <button
                        type="button"
                        onClick={() => onView(s)}
                        className="btn btn-sm btn-outline-info me-2"
                      >
                        <i className="bi bi-eye" /> View
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit && onEdit(s)}
                      className="btn btn-sm btn-outline-primary me-2"
                    >
                      <i className="bi bi-pencil" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete && onDelete(id)}
                      className="btn btn-sm btn-outline-danger"
                    >
                      <i className="bi bi-trash" /> Delete
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
