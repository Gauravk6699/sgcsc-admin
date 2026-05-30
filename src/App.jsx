// src/App.jsx
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import PrivateRoute from "./components/PrivateRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";


/* ------------------- Lazy Imports ------------------- */
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

/* Franchise */
const FranchiseCreate = lazy(() => import("./pages/FranchiseCreate"));
const FranchiseList = lazy(() => import("./pages/FranchiseList"));
const FranchiseCredits = lazy(() => import("./pages/FranchiseCredits"));
const FranchiseCertificateList = lazy(() => import("./pages/FranchiseCertificateList"));
const FranchiseCertificateCreate = lazy(() => import("./pages/FranchiseCertificateCreate"));

/* Typing Certificates */
const TypingCertificateList = lazy(() => import("./pages/TypingCertificateList"));
const TypingCertificateCreate = lazy(() => import("./pages/TypingCertificateCreate"));

/* Marksheet */
const MarksheetCreate = lazy(() => import("./pages/MarksheetCreate"));
const MarksheetList = lazy(() => import("./pages/MarksheetList"));

/* Students */
const Students = lazy(() => import("./pages/Students"));
const AddStudent = lazy(() => import("./pages/AddStudent"));
const StudentDetail = lazy(() => import("./pages/StudentDetail"));

/* Courses */
const Courses = lazy(() => import("./pages/Courses"));
const CreateCourse = lazy(() => import("./pages/CreateCourse"));
const CreateSubject = lazy(() => import("./pages/CreateSubject"));
const SubjectList = lazy(() => import("./pages/SubjectList"));

/* Gallery */
const GalleryPage = lazy(() => import("./pages/Gallery"));
const AddGalleryCategory = lazy(() => import("./pages/AddGalleryImage"));

/* Members */
const Members = lazy(() => import("./pages/Members"));
const AddMember = lazy(() => import("./pages/AddMember"));

/* Admit Cards */
const AdmitCardList = lazy(() => import("./pages/AdmitCardList"));
const AdmitCardCreate = lazy(() => import("./pages/AdmitCardCreate"));

/* ID Cards */
const IDCardList = lazy(() => import("./pages/IDCardList"));
const IDCardCreate = lazy(() => import("./pages/IDCardCreate"));

/* Certificates */
const CertificateList = lazy(() => import("./pages/CertificateList"));
const CertificateCreate = lazy(() => import("./pages/CertificateCreate"));

/* Study Material */
// const StudyUpload = lazy(() => import("./pages/StudyUpload"));
// const StudyList = lazy(() => import("./pages/StudyList"));

/* Assignments */
const AssignmentUpload = lazy(() => import("./pages/AssignmentUpload"));
const AssignmentList = lazy(() => import("./pages/AssignmentList"));

/* Settings (future expansion) */
// const SettingsHeader = lazy(() => import("./pages/SettingsHeader"));
// const SettingsFooter = lazy(() => import("./pages/SettingsFooter"));
const SettingsSocial = lazy(() => import("./pages/SettingsSocial"));
const SettingsCreditPricing = lazy(() => import("./pages/SettingsCreditPricing"));
const SettingsCreditQR = lazy(() => import("./pages/SettingsCreditQR"));
const SettingsTemplateConfig = lazy(() => import("./pages/SettingsTemplateConfig"));
const FeeReceipt = lazy(() => import("./pages/FeeReceipt"));
const ReceiptManagement = lazy(() => import("./pages/ReceiptManagement"));
// const SettingsBranding = lazy(() => import("./pages/SettingsBranding"));

/* Student Verification (Public) */
const StudentResultVerification = lazy(() => import("./pages/StudentResultVerification"));
const StudentCertificateVerification = lazy(() => import("./pages/StudentCertificateVerification"));

/* ----------------------------------------------------- */

function LoadingFallback() {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-2">Loading...</div>
      </div>
    </div>
  );
}

/* Layout wrapper for all authenticated pages */
function ProtectedLayout({ children }) {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const authed =
    typeof window !== "undefined" &&
    (localStorage.getItem("admin_token") || localStorage.getItem("token"));

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Franchise */}
          <Route
            path="/franchise/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <FranchiseCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/franchise/list"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <FranchiseList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/franchise/credits"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <FranchiseCredits />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Students */}
          <Route
            path="/students"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Students />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/students/add"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AddStudent />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <StudentDetail />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Fee Receipt */}
          <Route
            path="/fee-receipt"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <FeeReceipt />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/receipt-management"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <ReceiptManagement />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Courses & Subjects */}
          <Route
            path="/courses"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Courses />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <CreateCourse />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/subjects/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <CreateSubject />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SubjectList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Gallery */}
          <Route
            path="/gallery"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <GalleryPage />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/gallery/categories/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AddGalleryCategory />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Members */}
          <Route
            path="/members"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Members />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/members/add"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AddMember />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />



          {/* Admit Card */}
          <Route
            path="/admit-cards"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AdmitCardList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admit-cards/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AdmitCardCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* ID Card */}
          <Route
            path="/id-cards"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <IDCardList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/id-cards/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <IDCardCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Certificate */}
          <Route
            path="/certificates"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <CertificateList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/certificates/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <CertificateCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Franchise Certificates */}
          <Route
            path="/franchise-certificates"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <FranchiseCertificateList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/franchise-certificates/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <FranchiseCertificateCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Typing Certificates */}
          <Route
            path="/typing-certificates"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <TypingCertificateList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/typing-certificates/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <TypingCertificateCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Marksheet */}
          <Route
            path="/marksheets"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <MarksheetList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/marksheets/create"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <MarksheetCreate />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Study Material */}
          {/*
          <Route
            path="/study-material"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <StudyList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/study-material/upload"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <StudyUpload />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          */}

          {/* Assignments */}
          <Route
            path="/assignments"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AssignmentList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/assignments/upload"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AssignmentUpload />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Settings */}
          {/*
          <Route
            path="/settings/header"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsHeader />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/footer"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsFooter />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          */}
          <Route
            path="/settings/social"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsSocial />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/credit-pricing"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsCreditPricing />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/credit-qr"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsCreditQR />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/template-config"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsTemplateConfig />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          {/*
          <Route
            path="/settings/branding"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SettingsBranding />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          */}

          {/* Student Verification (Public) */}
          <Route path="/student/result-verification" element={<StudentResultVerification />} />
          <Route path="/student/certificate-verification" element={<StudentCertificateVerification />} />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              authed ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Logout */}
          <Route
            path="/logout"
            element={
              (() => {
                localStorage.clear();
                return <Navigate to="/login" replace />;
              })()
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="text-center mt-5">
                <h2>404 - Page Not Found</h2>
                <p className="text-muted">
                  The page you requested does not exist.
                </p>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}
