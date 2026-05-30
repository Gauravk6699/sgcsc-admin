// src/components/HasPermission.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Usage:
 * <HasPermission permission="students.create">
 *   <button>New Student</button>
 * </HasPermission>
 */
export default function HasPermission({ permission, children, fallback = null }) {
  const { user } = useContext(AuthContext);
  if (!user) return fallback;

  if (user.role === 'superadmin') return children;
  if (user.permissions?.includes(permission)) return children;
  return fallback;
}
