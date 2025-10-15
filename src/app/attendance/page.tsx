'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, TrendingUp, UserCheck, UserX, Coffee, Plane, Heart, FileText, Plus, Filter, Download } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'on-leave';
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number;
  overtime_hours: number;
  break_duration: number;
  notes: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'emergency';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_date: string;
  approved_by: string | null;
  approved_date: string | null;
}

interface AttendanceSummary {
  employee_id: string;
  employee_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  leave_days: number;
  total_hours: number;
  overtime_hours: number;
  attendance_rate: number;
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'summary'>('attendance');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Mock data
  useEffect(() => {
    const mockAttendanceRecords: AttendanceRecord[] = [
      {
        id: '1',
        employee_id: 'EMP001',
        employee_name: 'Ahmed Ali',
        date: '2024-01-15',
        status: 'present',
        clock_in: '2024-01-15T09:00:00',
        clock_out: '2024-01-15T18:00:00',
        total_hours: 8,
        overtime_hours: 0,
        break_duration: 60,
        notes: ''
      },
      {
        id: '2',
        employee_id: 'EMP002',
        employee_name: 'Fatima Khan',
        date: '2024-01-15',
        status: 'late',
        clock_in: '2024-01-15T09:30:00',
        clock_out: '2024-01-15T18:30:00',
        total_hours: 8,
        overtime_hours: 0,
        break_duration: 60,
        notes: 'Traffic delay'
      },
      {
        id: '3',
        employee_id: 'EMP003',
        employee_name: 'Hassan Sheikh',
        date: '2024-01-15',
        status: 'present',
        clock_in: '2024-01-15T08:45:00',
        clock_out: '2024-01-15T19:00:00',
        total_hours: 9.25,
        overtime_hours: 1.25,
        break_duration: 60,
        notes: ''
      },
      {
        id: '4',
        employee_id: 'EMP004',
        employee_name: 'Ayesha Malik',
        date: '2024-01-15',
        status: 'half-day',
        clock_in: '2024-01-15T09:00:00',
        clock_out: '2024-01-15T13:00:00',
        total_hours: 4,
        overtime_hours: 0,
        break_duration: 0,
        notes: 'Medical appointment'
      },
      {
        id: '5',
        employee_id: 'EMP005',
        employee_name: 'Usman Ahmed',
        date: '2024-01-15',
        status: 'on-leave',
        clock_in: null,
        clock_out: null,
        total_hours: 0,
        overtime_hours: 0,
        break_duration: 0,
        notes: 'Vacation leave'
      }
    ];

    const mockLeaveRequests: LeaveRequest[] = [
      {
        id: '1',
        employee_id: 'EMP001',
        employee_name: 'Ahmed Ali',
        leave_type: 'vacation',
        start_date: '2024-01-20',
        end_date: '2024-01-25',
        days_requested: 6,
        reason: 'Family vacation',
        status: 'approved',
        applied_date: '2024-01-10',
        approved_by: 'HR Manager',
        approved_date: '2024-01-12'
      },
      {
        id: '2',
        employee_id: 'EMP002',
        employee_name: 'Fatima Khan',
        leave_type: 'sick',
        start_date: '2024-01-18',
        end_date: '2024-01-19',
        days_requested: 2,
        reason: 'Flu symptoms',
        status: 'pending',
        applied_date: '2024-01-17',
        approved_by: null,
        approved_date: null
      },
      {
        id: '3',
        employee_id: 'EMP003',
        employee_name: 'Hassan Sheikh',
        leave_type: 'personal',
        start_date: '2024-01-22',
        end_date: '2024-01-22',
        days_requested: 1,
        reason: 'Personal matters',
        status: 'approved',
        applied_date: '2024-01-15',
        approved_by: 'HR Manager',
        approved_date: '2024-01-16'
      },
      {
        id: '4',
        employee_id: 'EMP004',
        employee_name: 'Ayesha Malik',
        leave_type: 'maternity',
        start_date: '2024-02-01',
        end_date: '2024-04-30',
        days_requested: 90,
        reason: 'Maternity leave',
        status: 'approved',
        applied_date: '2024-01-05',
        approved_by: 'HR Manager',
        approved_date: '2024-01-06'
      }
    ];

    const mockAttendanceSummary: AttendanceSummary[] = [
      {
        employee_id: 'EMP001',
        employee_name: 'Ahmed Ali',
        total_days: 22,
        present_days: 20,
        absent_days: 0,
        late_days: 1,
        half_days: 0,
        leave_days: 1,
        total_hours: 160,
        overtime_hours: 5,
        attendance_rate: 95.5
      },
      {
        employee_id: 'EMP002',
        employee_name: 'Fatima Khan',
        total_days: 22,
        present_days: 19,
        absent_days: 1,
        late_days: 2,
        half_days: 0,
        leave_days: 0,
        total_hours: 152,
        overtime_hours: 2,
        attendance_rate: 90.9
      },
      {
        employee_id: 'EMP003',
        employee_name: 'Hassan Sheikh',
        total_days: 22,
        present_days: 21,
        absent_days: 0,
        late_days: 0,
        half_days: 0,
        leave_days: 1,
        total_hours: 172,
        overtime_hours: 12,
        attendance_rate: 100
      },
      {
        employee_id: 'EMP004',
        employee_name: 'Ayesha Malik',
        total_days: 22,
        present_days: 15,
        absent_days: 2,
        late_days: 1,
        half_days: 4,
        leave_days: 0,
        total_hours: 128,
        overtime_hours: 0,
        attendance_rate: 81.8
      },
      {
        employee_id: 'EMP005',
        employee_name: 'Usman Ahmed',
        total_days: 22,
        present_days: 18,
        absent_days: 3,
        late_days: 1,
        half_days: 0,
        leave_days: 0,
        total_hours: 144,
        overtime_hours: 3,
        attendance_rate: 86.4
      }
    ];

    setTimeout(() => {
      setAttendanceRecords(mockAttendanceRecords);
      setLeaveRequests(mockLeaveRequests);
      setAttendanceSummary(mockAttendanceSummary);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    const icons = {
      present: <UserCheck className="h-4 w-4 text-green-600" />,
      absent: <UserX className="h-4 w-4 text-red-600" />,
      late: <Clock className="h-4 w-4 text-yellow-600" />,
      'half-day': <Coffee className="h-4 w-4 text-blue-600" />,
      'on-leave': <Plane className="h-4 w-4 text-purple-600" />
    };
    return icons[status as keyof typeof icons] || icons.present;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'half-day': 'bg-blue-100 text-blue-800 border-blue-200',
      'on-leave': 'bg-purple-100 text-purple-800 border-purple-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${statusStyles[status as keyof typeof statusStyles] || statusStyles.present}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const getLeaveTypeIcon = (type: string) => {
    const icons = {
      vacation: <Plane className="h-4 w-4 text-blue-600" />,
      sick: <Heart className="h-4 w-4 text-red-600" />,
      personal: <Users className="h-4 w-4 text-gray-600" />,
      maternity: <Heart className="h-4 w-4 text-pink-600" />,
      emergency: <FileText className="h-4 w-4 text-orange-600" />
    };
    return icons[type as keyof typeof icons] || icons.personal;
  };

  const getLeaveStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (statusFilter === 'all') return true;
    return record.status === statusFilter;
  });

  const totalEmployees = attendanceSummary.length;
  const averageAttendanceRate = attendanceSummary.reduce((sum, emp) => sum + emp.attendance_rate, 0) / totalEmployees;
  const totalPresentToday = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const totalAbsentToday = attendanceRecords.filter(r => r.status === 'absent').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance & Leave Management</h1>
          <p className="mt-2 text-gray-600">Track employee attendance and manage leave requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-gray-900">{totalPresentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="text-2xl font-bold text-gray-900">{totalAbsentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{averageAttendanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(req => req.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Daily Attendance
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leaves'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Leave Requests
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Monthly Summary
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'attendance' && (
              <>
                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="half-day">Half Day</option>
                        <option value="on-leave">On Leave</option>
                      </select>
                    </div>
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>

                {/* Attendance Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clock In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clock Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Overtime
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {record.employee_name.split(' ').map(n => n.charAt(0)).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {record.employee_name}
                                </div>
                                <div className="text-sm text-gray-500">{record.employee_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.total_hours.toFixed(1)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.overtime_hours > 0 ? `${record.overtime_hours.toFixed(1)}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'leaves' && (
              <>
                {/* Leave Requests Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
                  <button
                    onClick={() => setShowLeaveForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Leave Request
                  </button>
                </div>

                {/* Leave Requests Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leave Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaveRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {request.employee_name.split(' ').map(n => n.charAt(0)).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {request.employee_name}
                                </div>
                                <div className="text-sm text-gray-500">{request.employee_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getLeaveTypeIcon(request.leave_type)}
                              <span className="text-sm text-gray-900 capitalize">
                                {request.leave_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.days_requested}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                            {request.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getLeaveStatusBadge(request.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.applied_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'summary' && (
              <>
                {/* Month Selector */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <label htmlFor="month" className="text-sm font-medium text-gray-700">
                      Select Month:
                    </label>
                    <input
                      type="month"
                      id="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Download className="h-4 w-4" />
                    Export Summary
                  </button>
                </div>

                {/* Summary Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Late
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Half Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leave Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceSummary.map((summary) => (
                        <tr key={summary.employee_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {summary.employee_name.split(' ').map(n => n.charAt(0)).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {summary.employee_name}
                                </div>
                                <div className="text-sm text-gray-500">{summary.employee_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {summary.total_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {summary.present_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {summary.absent_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                            {summary.late_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {summary.half_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                            {summary.leave_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {summary.total_hours}h
                            {summary.overtime_hours > 0 && (
                              <span className="text-xs text-purple-600 ml-1">
                                (+{summary.overtime_hours}h OT)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    summary.attendance_rate >= 95 ? 'bg-green-500' :
                                    summary.attendance_rate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${summary.attendance_rate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {summary.attendance_rate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}