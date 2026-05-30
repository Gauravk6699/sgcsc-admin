// src/components/Sidebar.jsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBuilding,
  FaUserGraduate,
  FaBook,
  FaImages,
  FaClipboardList,
  FaIdCard,
  FaCertificate,
  FaCog,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const subLinkClass = ({ isActive }) =>
    `nav-link small d-flex align-items-center ${
      isActive ? "text-primary fw-semibold" : "text-dark"
    } py-1`;

  return (
    <div
      className="bg-light border-end vh-100 d-flex flex-column p-3"
      style={{ width: "260px" }}
    >
      <h2 className="fs-4 fw-bold mb-4 text-primary">Admin Panel</h2>

      <ul className="nav nav-pills flex-column mb-auto">

        {/* Franchise */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("franchise")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaBuilding />
              Franchise
            </span>
            {openMenu === "franchise" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "franchise" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/franchise/create" className={subLinkClass}>Create Franchise</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/franchise/list" end className={subLinkClass}>List Franchise</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/franchise/credits" className={subLinkClass}>Franchise Credits</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/franchise-certificates/create" className={subLinkClass}>Create Franchise Certificate</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/franchise-certificates" className={subLinkClass}>List Franchise Certificates</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Students */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("students")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaUserGraduate />
              Students
            </span>
            {openMenu === "students" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "students" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/students/add" className={subLinkClass}>Add Student</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/students" end className={subLinkClass}>Student List</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/fee-receipt" className={subLinkClass}>Fee Receipt</NavLink>
                <NavLink to="/receipt-management" className={subLinkClass}>Receipt Management</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Courses */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("courses")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaBook />
              Courses
            </span>
            {openMenu === "courses" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "courses" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/courses/create" className={subLinkClass}>Create Course</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/subjects/create" className={subLinkClass}>Create Subject</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/courses" end className={subLinkClass}>Course List</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/subjects" end className={subLinkClass}>Subjects List</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* ID Card */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("idcard")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaIdCard />
              ID Card
            </span>
            {openMenu === "idcard" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "idcard" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/id-cards/create" className={subLinkClass}>Generate ID Card</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/id-cards" className={subLinkClass}>List ID Cards</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Admit Card */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("admit")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaIdCard />
              Admit Card
            </span>
            {openMenu === "admit" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "admit" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/admit-cards/create" className={subLinkClass}>Generate Admit Card</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/admit-cards" end className={subLinkClass}>List Admit Cards</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Marksheet */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("marksheets")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaClipboardList />
              Marksheet
            </span>
            {openMenu === "marksheets" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "marksheets" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/marksheets/create" className={subLinkClass}>Generate Marksheet</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/marksheets" end className={subLinkClass}>List Marksheets</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Typing Certificate */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("typing-certificates")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaCertificate />
              Typing Certificate
            </span>
            {openMenu === "typing-certificates" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "typing-certificates" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/typing-certificates/create" className={subLinkClass}>Generate Typing Certificate</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/typing-certificates" className={subLinkClass}>List Typing Certificates</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Student Certificate */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("certificates")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaCertificate />
              Student Certificate
            </span>
            {openMenu === "certificates" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "certificates" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/certificates/create" className={subLinkClass}>Generate Certificate</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/certificates" end className={subLinkClass}>List Certificates</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Gallery */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("gallery")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaImages />
              Gallery
            </span>
            {openMenu === "gallery" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "gallery" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/gallery/categories/create" className={subLinkClass}>Add Images</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/gallery" end className={subLinkClass}>List Images</NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Settings */}
        <li className="nav-item mb-2">
          <button
            type="button"
            className="btn btn-toggle w-100 text-start d-flex justify-content-between align-items-center text-dark"
            onClick={() => toggleMenu("settings")}
          >
            <span className="d-flex align-items-center gap-2">
              <FaCog />
              Settings
            </span>
            {openMenu === "settings" ? <FaChevronDown /> : <FaChevronRight />}
          </button>
          {openMenu === "settings" && (
            <ul className="btn-toggle-nav list-unstyled ps-4 pt-2 pb-1">
              <li className="mb-1">
                <NavLink to="/settings/social" className={subLinkClass}>Social Links</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/settings/credit-pricing" className={subLinkClass}>Credit Pricing</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/settings/credit-qr" className={subLinkClass}>Credit QR</NavLink>
              </li>
              <li className="mb-1">
                <NavLink to="/settings/template-config" className={subLinkClass}>Template Config</NavLink>
              </li>
            </ul>
          )}
        </li>

      </ul>
    </div>
  );
}