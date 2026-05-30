import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/members");
      setMembers(Array.isArray(res.data.data) ? res.data.data : []);

    } catch (err) {
      console.error("fetch members error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await API.delete(`/members/${id}`);
      fetchMembers();
    } catch (err) {
      console.error("delete member error:", err);
      alert("Failed to delete member");
    }
  };

  // ✅ EDIT → reuse AddMember
  const handleEdit = (member) => {
    navigate("/members/add", { state: { member } });
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between mb-3">
        <h2 className="fw-bold">Institute Members</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/members/add")}
        >
          Add Member
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-primary">
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Status</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id}>

                    <td>
  <div
    style={{
      width: 50,
      height: 50,
      borderRadius: "50%",
      overflow: "hidden",
      backgroundColor: "#f1f1f1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {m.photoUrl ? (
      <img
        src={
          m.photoUrl.startsWith("http")
            ? m.photoUrl
            : `http://localhost:5000${m.photoUrl}`
        }
        alt={m.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/no-user.png"; // optional fallback
        }}
      />
    ) : (
      <span style={{ fontSize: 12, color: "#777" }}>
        No Image
      </span>
    )}
  </div>
</td>

                    <td>{m.name}</td>
                    <td>{m.designation || "-"}</td>
                    <td>
                      {m.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Hidden</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEdit(m)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(m._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
