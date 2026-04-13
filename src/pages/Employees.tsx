import '../styles/App.css';
import '../styles/index.css';

// Helper to format date as YYYY-MM-DD for input type="date"
function formatDateForInput(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { useEffect, useState } from 'react';

import Loading from '../components/Loading';
import { EmployeeModal, type Employee } from '../components/EmployeeModal';
import { AttachmentPreviewCell } from '../components/AttachmentPreviewCell';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 25;
  const [theme, setTheme] = useState(localStorage.getItem('hrapp.theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('hrapp.theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = search
          ? `${import.meta.env.VITE_API_BASE_URL}/employees?search=${encodeURIComponent(search)}`
          : `${import.meta.env.VITE_API_BASE_URL}/employees`;
        const res = await fetch(url, {
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();
        setEmployees(
          data.map((row: Record<string, unknown>) => ({
            id: row.KAMIId ?? row.id,
            kamiId: row.KAMIId ?? row.kamiId,
            firstName: row.FirstName ?? row.firstName ?? undefined,
            middleName: row.MiddleName ?? row.middleName ?? undefined,
            lastName: row.LastName ?? row.lastName ?? undefined,
            fullName: row.FullName ?? row.fullName ?? '',
            address: row.Address ?? row.address ?? undefined,
            civilStatus: row.CivilStatus ?? row.civilStatus ?? undefined,
            placeOfBirth: row.PlaceOfBirth ?? row.placeOfBirth ?? undefined,
            fatherName: row.FatherName ?? row.fatherName ?? undefined,
            motherName: row.MotherName ?? row.motherName ?? undefined,
            employer: row.Employer ?? row.employer ?? undefined,
            bu: row.BU ?? row.bu ?? '',
            position: row.Position ?? row.position ?? '',
            drivingExperience: row.DrivingExperience ?? row.drivingExperience ?? undefined,
            positionStatus: row.PositionStatus ?? row.positionStatus ?? undefined,
            status: row.Status ?? row.status ?? undefined,
            assignment: row.Assignment ?? row.assignment ?? undefined,
            employmentStatus: row.EmploymentStatus ?? row.employmentStatus ?? '',
            sssNumber: row.SSSNumber ?? row.sssNumber ?? undefined,
            pagibigNumber: row.PagibigNumber ?? row.pagibigNumber ?? undefined,
            philHealthNumber: row.PhilHealthNumber ?? row.philHealthNumber ?? undefined,
            tinNumber: row.TINNumber ?? row.tinNumber ?? undefined,
            driversLicense: row.DriversLicense ?? row.driversLicense ?? undefined,
            restrictioncode: row.Restrictioncode ?? row.restrictioncode ?? undefined,
            driversLicenseExpiryDate: formatDateForInput(String(row.DriversLicenseExpiryDate ?? row.driversLicenseExpiryDate ?? '')),
            updatedAt: row.UpdatedAt ?? row.updatedAt ?? undefined,
            applicationFormAttachment: row.ApplicationFormAttachment ?? [],
            certificateOfEmploymentAttachment: row.CertificateOfEmploymentAttachment ?? [],
            medicalDiagnosticAttachment: row.MedicalDiagnosticAttachment ?? [],
            nbiClearanceAttachment: row.NBIClearanceAttachment ?? [],
            policeClearanceAttachment: row.PoliceClearanceAttachment ?? [],
            barangayClearanceAttachment: row.BarangayClearanceAttachment ?? [],
            gender: row.Gender ?? row.gender ?? undefined,
            contactNumber: row.ContactNumber ?? row.contactNumber ?? undefined,
            email: row.Email ?? row.email ?? undefined,
            dateHired: row.DateHired ?? row.dateHired ?? undefined,
            tenure: row.tenure ?? null,
          }))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [search]);

  return (
    <div className="employees-bg">
      <TopBar theme={theme} setTheme={setTheme} handleLogout={() => { localStorage.removeItem('hrapp.token'); window.location.hash = '#/login'; }} />
      <div className="employees-content-row">
        <Sidebar />
        <main className="employees-main">
          <h2 className="employees-title">Employees</h2>
          <div className="employees-header-row">
            <button className="sidebar-btn employees-btn employees-back-btn" onClick={() => window.location.hash = '#/'}>Back to Dashboard</button>
          </div>
          <div className="employees-table-card">
            <h3 className="employees-table-title">Employee Data</h3>
            <div className="search-wrapper">
              <input
                type="search"
                id="employeeSearch"
                placeholder="Search by name, Cost Center, Area Assignment, or status"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
            <div className="employees-table-wrapper">
              {loading && <Loading message="Loading employees..." />}
              {error && <p className="employees-error">Error: {error}</p>}
              {!loading && !error && (
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Cost Center</th>
                      <th>Area Assignment</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Employment Status</th>
                      <th>Attachments</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr><td colSpan={8} className="employees-table-empty">No employees found.</td></tr>
                    ) : (
                      (() => {
                        const total = employees.length;
                        const totalPages = Math.max(1, Math.ceil(total / perPage));
                        const page = Math.min(Math.max(1, currentPage), totalPages);
                        const start = (page - 1) * perPage;
                        const end = start + perPage;
                        return employees.slice(start, end).map(emp => (
                          <tr key={emp.id}>
                            <td>{emp.fullName}</td>
                            <td>{emp.bu}</td>
                            <td>{emp.assignment || ''}</td>
                            <td>{emp.position}</td>
                            <td>{emp.status || ''}</td>
                            <td>{emp.employmentStatus}</td>
                            <td>
                              <AttachmentPreviewCell emp={emp} />
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => { setSelectedEmployee(emp); setModalOpen(true); }}
                                className="sidebar-btn modal-action-save">Edit</button>
                            </td>
                          </tr>
                        ));
                      })()
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {/* Pagination controls */}
            {!loading && !error && employees.length > perPage && (() => {
              const total = employees.length;
              const totalPages = Math.max(1, Math.ceil(total / perPage));
              const maxPagesToShow = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
              const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
              startPage = Math.max(1, endPage - maxPagesToShow + 1);
<<<<<<< HEAD
=======

              // Build visible page list ensuring page 1 is always present after Prev
              const pages: (number | 'ellipsis')[] = [];
              if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) pages.push('ellipsis');
              }
              for (let p = startPage; p <= endPage; p++) pages.push(p);
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push('ellipsis');
                pages.push(totalPages);
              }

>>>>>>> e005fba (Initial commit from workspace)
              return (
                <div className="employees-pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`sidebar-btn employees-pagination-btn${currentPage === 1 ? ' disabled' : ''}`}
                  >Prev</button>
<<<<<<< HEAD
                  {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`sidebar-btn employees-pagination-btn${p === currentPage ? ' active' : ''}`}
                    >{p}</button>
                  ))}
=======

                  {pages.map((item, idx) => {
                    if (item === 'ellipsis') return <span key={`e-${idx}`} className="employees-pagination-ellipsis">…</span>;
                    const p = item as number;
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`sidebar-btn employees-pagination-btn${p === currentPage ? ' active' : ''}`}
                      >{p}</button>
                    );
                  })}

>>>>>>> e005fba (Initial commit from workspace)
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`sidebar-btn employees-pagination-btn${currentPage === totalPages ? ' disabled' : ''}`}
                  >Next</button>
                </div>
              );
            })()}
            <EmployeeModal
              employee={modalOpen ? (selectedEmployee || {
                id: 0,
                kamiId: 0,
                fullName: '',
                bu: '',
                position: '',
                employmentStatus: '',
                address: '',
                assignment: '',
                status: '',
                positionStatus: '',
                civilStatus: '',
                placeOfBirth: '',
                drivingExperience: '',
                driversLicense: '',
                restrictioncode: '',
                driversLicenseExpiryDate: '',
                sssNumber: '',
                pagibigNumber: '',
                philHealthNumber: '',
                tinNumber: '',
                applicationFormAttachment: [],
                certificateOfEmploymentAttachment: [],
                medicalDiagnosticAttachment: [],
                nbiClearanceAttachment: [],
                policeClearanceAttachment: [],
                barangayClearanceAttachment: [],
                updatedAt: '',
                gender: '',
                contactNumber: '',
                email: '',
              }) : null}
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSave={async (emp: Employee, attachments: File[]) => {
                if (attachments && attachments.length > 0) {
                  alert('File upload is not supported by the backend. Please remove the attachment.');
                  return;
                }
                try {
                  let response;
                  const payload = {
                    id: emp.id,
                    kamiId: emp.kamiId,
                    fullName: emp.fullName,
                    bu: emp.bu,
                    position: emp.position,
                    employmentStatus: emp.employmentStatus,
                    address: emp.address ?? undefined,
                    assignment: emp.assignment ?? undefined,
                    status: emp.status ?? undefined,
                    positionStatus: emp.positionStatus ?? undefined,
                    civilStatus: emp.civilStatus ?? undefined,
                    placeOfBirth: emp.placeOfBirth ?? undefined,
                    drivingExperience: emp.drivingExperience !== undefined && emp.drivingExperience !== null ? String(emp.drivingExperience) : undefined,
                    driversLicense: emp.driversLicense ?? undefined,
                    restrictioncode: emp.restrictioncode ?? undefined,
                    driversLicenseExpiryDate: emp.driversLicenseExpiryDate ?? undefined,
                    sssNumber: emp.sssNumber ?? undefined,
                    pagibigNumber: emp.pagibigNumber ?? undefined,
                    philHealthNumber: emp.philHealthNumber ?? undefined,
                    tinNumber: emp.tinNumber ?? undefined,
                    updatedAt: emp.updatedAt ?? undefined,
                    firstName: emp.firstName ?? undefined,
                    middleName: emp.middleName ?? undefined,
                    lastName: emp.lastName ?? undefined,
                    fatherName: emp.fatherName ?? undefined,
                    motherName: emp.motherName ?? undefined,
                    employer: emp.employer ?? undefined,
                  };
                  if (emp.id && emp.id !== 0) {
                    response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employees/${emp.id}`, {
                      method: 'PUT',
                      headers: {
                        'x-api-key': import.meta.env.VITE_API_KEY,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(payload),
                    });
                  } else {
                    response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employees`, {
                      method: 'POST',
                      headers: {
                        'x-api-key': import.meta.env.VITE_API_KEY,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(payload),
                    });
                  }
                  if (!response.ok) throw new Error('Failed to save employee');
                  setEmployees(prev => {
                    const idx = prev.findIndex(e => e.id === emp.id);
                    if (idx !== -1) {
                      const updated = [...prev];
                      updated[idx] = { ...prev[idx], ...payload };
                      return updated;
                    }
                    return prev;
                  });
                  setModalOpen(false);
                } catch (err) {
                  alert('Error saving employee: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Employees;
