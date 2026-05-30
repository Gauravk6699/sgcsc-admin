import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await API.get("/courses");
        setCourses(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load courses:", err);
        setError(
          err?.response?.data?.message || "Failed to load courses"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const groupedCourses = courses.reduce((acc, course) => {
    const type = course.type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(course);
    return acc;
  }, {});

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "certificate":
        return "bg-success";
      case "long":
        return "bg-primary";
      case "short":
        return "bg-warning text-dark";
      default:
        return "bg-secondary";
    }
  };

  const handleEdit = (course) => {
    navigate(`/courses/create?id=${course._id}`);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await API.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(
        err?.response?.data?.message || "Failed to delete course"
      );
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        Loading courses…
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Courses</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/courses/create")}
        >
          + Add Course
        </button>
      </div>

      {Object.entries(groupedCourses).map(([type, list]) => (
        <div key={type} className="mb-5">
          <h4 className="fw-bold mb-3 text-capitalize">
            {type.replace("-", " ")} Courses
          </h4>

          <div className="row g-4">
            {list.map((course) => (
              <div key={course._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body d-flex flex-column">
                    <h5 className="fw-bold mb-2">
                      {course.title}
                    </h5>

                    <div className="mb-2">
                      <span
                        className={`badge me-2 ${getTypeBadgeClass(course.type)}`}
                      >
                        {course.type}
                      </span>

                      {course.duration && (
                        <span className="badge bg-info text-dark me-2">
                          {course.duration}
                        </span>
                      )}

                      {course.feeAmount > 0 && (
                        <span className="badge bg-success">
                          ₹{course.feeAmount}
                        </span>
                      )}
                    </div>

                    <p className="text-muted small flex-grow-1">
                      {course.description || "No description provided."}
                    </p>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(course)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(course._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
