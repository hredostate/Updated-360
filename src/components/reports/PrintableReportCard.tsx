import React from 'react';
import { getAttendanceStatus, getAttendanceProgressColor, getAttendanceProgressColorPrint } from '../../utils/attendanceHelpers';

interface Subject {
  name: string;
  score: number;
  grade: string;
  position?: number;
  teacher_comment?: string;
}

interface ReportCardData {
  student: {
    name: string;
    admission_number: string;
    class: string;
    photo_url?: string;
  };
  school: {
    name: string;
    logo_url?: string;
    address?: string;
    motto?: string;
  };
  term: {
    name: string;
    year: string;
  };
  subjects: Subject[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    unexcused: number;
    total: number;
    rate: number;
  };
  conduct?: {
    behavior: string;
    punctuality: string;
    neatness: string;
  };
  classTeacherRemark?: string;
  principalRemark?: string;
  nextTermBegins?: string;
}

interface PrintableReportCardProps {
  data: ReportCardData;
  template?: 'classic' | 'modern' | 'minimal';
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({
  data,
  template = 'classic',
}) => {
  const { student, school, term, subjects, attendance, conduct, classTeacherRemark, principalRemark, nextTermBegins } = data;

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A1' || grade === 'A+') return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  const attendancePercentage = attendance.rate.toFixed(1);
  const attendanceStatus = getAttendanceStatus(attendance.rate);

  if (template === 'modern') {
    return (
      <div className="report-card modern bg-white text-black p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center border-b-4 border-blue-600 pb-6 mb-6">
          {school.logo_url && (
            <img src={school.logo_url} alt="School Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-3xl font-bold text-blue-900">{school.name}</h1>
          {school.address && <p className="text-sm text-gray-600 mt-1">{school.address}</p>}
          {school.motto && <p className="text-xs italic text-gray-500 mt-1">"{school.motto}"</p>}
          <div className="mt-4 inline-block bg-blue-100 px-6 py-2 rounded-full">
            <h2 className="text-xl font-semibold text-blue-900">
              {term.name} Report Card - {term.year}
            </h2>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex gap-6 mb-6">
          {student.photo_url && (
            <div className="flex-shrink-0">
              <img
                src={student.photo_url}
                alt={student.name}
                className="w-32 h-32 object-cover rounded-lg border-4 border-blue-200"
              />
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student Name</p>
              <p className="font-semibold text-lg">{student.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission Number</p>
              <p className="font-semibold text-lg">{student.admission_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="font-semibold text-lg">{student.class}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Attendance</p>
              <p className="font-semibold text-lg">{attendancePercentage}% ({attendance.present}/{attendance.total} days)</p>
            </div>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 bg-blue-50 px-4 py-2 rounded">
            Academic Performance
          </h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-blue-700 px-4 py-2 text-left">Subject</th>
                <th className="border border-blue-700 px-4 py-2 text-center">Score</th>
                <th className="border border-blue-700 px-4 py-2 text-center">Grade</th>
                <th className="border border-blue-700 px-4 py-2 text-center">Position</th>
                <th className="border border-blue-700 px-4 py-2 text-left">Teacher's Comment</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{subject.name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{subject.score}</td>
                  <td className={`border border-gray-300 px-4 py-2 text-center font-bold ${getGradeColor(subject.grade)}`}>
                    {subject.grade}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {subject.position ? `${subject.position}${subject.position === 1 ? 'st' : subject.position === 2 ? 'nd' : subject.position === 3 ? 'rd' : 'th'}` : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{subject.teacher_comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed Attendance Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 bg-blue-50 px-4 py-2 rounded">
            Attendance Summary
          </h3>
          {attendance.total > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase">Days Present</p>
                  <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase">Days Absent</p>
                  <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase">Days Late</p>
                  <p className="text-2xl font-bold text-orange-600">{attendance.late}</p>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase">Excused Absences</p>
                  <p className="text-2xl font-bold text-blue-600">{attendance.excused}</p>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase">Unexcused Absences</p>
                  <p className="text-2xl font-bold text-red-700">{attendance.unexcused}</p>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase">Total Days</p>
                  <p className="text-2xl font-bold text-gray-700">{attendance.total}</p>
                </div>
              </div>
              
              <div className={`border-2 rounded p-4 ${attendanceStatus.bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Attendance Rate</span>
                  <span className={`text-lg font-bold ${attendanceStatus.color}`}>{attendancePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className={`h-4 rounded-full transition-all ${getAttendanceProgressColor(attendance.rate)}`}
                    style={{ width: `${Math.min(attendance.rate, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-center text-sm font-semibold ${attendanceStatus.color}`}>
                  {attendanceStatus.emoji} {attendanceStatus.label}
                </p>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">No attendance records available for this term.</p>
          )}
        </div>

        {/* Conduct */}
        {conduct && (
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Behavior</p>
              <p className="font-semibold">{conduct.behavior}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Punctuality</p>
              <p className="font-semibold">{conduct.punctuality}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Neatness</p>
              <p className="font-semibold">{conduct.neatness}</p>
            </div>
          </div>
        )}

        {/* Remarks */}
        <div className="space-y-4 mb-6">
          {classTeacherRemark && (
            <div>
              <p className="text-sm font-semibold text-gray-700">Class Teacher's Remark:</p>
              <p className="text-sm border border-gray-300 p-3 rounded bg-gray-50">{classTeacherRemark}</p>
            </div>
          )}
          {principalRemark && (
            <div>
              <p className="text-sm font-semibold text-gray-700">Principal's Remark:</p>
              <p className="text-sm border border-gray-300 p-3 rounded bg-gray-50">{principalRemark}</p>
            </div>
          )}
        </div>

        {/* Grading Scale */}
        <div className="mb-6 bg-gray-100 p-4 rounded">
          <p className="text-sm font-semibold text-gray-700 mb-2">Grading Scale:</p>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div><span className="font-semibold">A (80-100):</span> Excellent</div>
            <div><span className="font-semibold">B (70-79):</span> Very Good</div>
            <div><span className="font-semibold">C (60-69):</span> Good</div>
            <div><span className="font-semibold">D (50-59):</span> Pass</div>
            <div><span className="font-semibold">F (0-49):</span> Fail</div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-8">Class Teacher's Signature:</p>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">Signature & Date</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-8">Principal's Signature:</p>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">Signature & Date</p>
            </div>
          </div>
        </div>

        {nextTermBegins && (
          <div className="text-center text-sm text-gray-600 mt-4">
            <p>Next term begins: <span className="font-semibold">{nextTermBegins}</span></p>
          </div>
        )}
      </div>
    );
  }

  // Classic template (default)
  return (
    <div className="report-card classic bg-white text-black p-8 max-w-4xl mx-auto border-8 border-double border-gray-800">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        {school.logo_url && (
          <img src={school.logo_url} alt="School Logo" className="w-20 h-20 mx-auto mb-3 object-contain" />
        )}
        <h1 className="text-2xl font-bold uppercase">{school.name}</h1>
        {school.address && <p className="text-sm mt-1">{school.address}</p>}
        {school.motto && <p className="text-xs italic mt-1">"{school.motto}"</p>}
        <h2 className="text-xl font-semibold mt-3 uppercase">
          {term.name} Report Card - {term.year}
        </h2>
      </div>

      {/* Student Info */}
      <div className="flex gap-4 mb-6 border border-gray-300 p-4">
        {student.photo_url && (
          <div className="flex-shrink-0">
            <img
              src={student.photo_url}
              alt={student.name}
              className="w-24 h-24 object-cover border-2 border-gray-400"
            />
          </div>
        )}
        <div className="flex-1">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="font-semibold py-1">Student Name:</td>
                <td className="py-1">{student.name}</td>
              </tr>
              <tr>
                <td className="font-semibold py-1">Admission Number:</td>
                <td className="py-1">{student.admission_number}</td>
              </tr>
              <tr>
                <td className="font-semibold py-1">Class:</td>
                <td className="py-1">{student.class}</td>
              </tr>
              <tr>
                <td className="font-semibold py-1">Attendance:</td>
                <td className="py-1">{attendance.present} out of {attendance.total} days ({attendancePercentage}%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 uppercase">Academic Record</h3>
        <table className="w-full border-2 border-gray-800">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-800 px-3 py-2 text-left">Subject</th>
              <th className="border border-gray-800 px-3 py-2 text-center">Score</th>
              <th className="border border-gray-800 px-3 py-2 text-center">Grade</th>
              <th className="border border-gray-800 px-3 py-2 text-center">Position</th>
              <th className="border border-gray-800 px-3 py-2 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={index}>
                <td className="border border-gray-800 px-3 py-2">{subject.name}</td>
                <td className="border border-gray-800 px-3 py-2 text-center">{subject.score}</td>
                <td className={`border border-gray-800 px-3 py-2 text-center font-bold ${getGradeColor(subject.grade)}`}>
                  {subject.grade}
                </td>
                <td className="border border-gray-800 px-3 py-2 text-center">
                  {subject.position || '-'}
                </td>
                <td className="border border-gray-800 px-3 py-2 text-sm">{subject.teacher_comment || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Attendance Summary */}
      <div className="mb-6 border border-gray-800 p-4">
        <h3 className="text-lg font-semibold mb-3 uppercase">Attendance Summary</h3>
        {attendance.total > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 border border-gray-400 p-3 text-center">
                <p className="text-xs text-gray-600 uppercase font-semibold">Days Present</p>
                <p className="text-2xl font-bold text-green-700">{attendance.present}</p>
              </div>
              <div className="bg-gray-50 border border-gray-400 p-3 text-center">
                <p className="text-xs text-gray-600 uppercase font-semibold">Days Absent</p>
                <p className="text-2xl font-bold text-red-700">{attendance.absent}</p>
              </div>
              <div className="bg-gray-50 border border-gray-400 p-3 text-center">
                <p className="text-xs text-gray-600 uppercase font-semibold">Days Late</p>
                <p className="text-2xl font-bold text-orange-700">{attendance.late}</p>
              </div>
              <div className="bg-gray-50 border border-gray-400 p-3 text-center">
                <p className="text-xs text-gray-600 uppercase font-semibold">Excused</p>
                <p className="text-2xl font-bold text-blue-700">{attendance.excused}</p>
              </div>
              <div className="bg-gray-50 border border-gray-400 p-3 text-center">
                <p className="text-xs text-gray-600 uppercase font-semibold">Unexcused</p>
                <p className="text-2xl font-bold text-red-800">{attendance.unexcused}</p>
              </div>
              <div className="bg-gray-50 border border-gray-400 p-3 text-center">
                <p className="text-xs text-gray-600 uppercase font-semibold">Total Days</p>
                <p className="text-2xl font-bold text-gray-800">{attendance.total}</p>
              </div>
            </div>
            
            <div className={`border-2 p-3 ${attendanceStatus.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Overall Attendance Rate</span>
                <span className={`text-lg font-bold ${attendanceStatus.color}`}>{attendancePercentage}%</span>
              </div>
              <div className="w-full bg-gray-300 h-4 mb-2 border border-gray-400">
                <div 
                  className={`h-full ${getAttendanceProgressColorPrint(attendance.rate)}`}
                  style={{ width: `${Math.min(attendance.rate, 100)}%` }}
                ></div>
              </div>
              <p className={`text-center text-sm font-semibold ${attendanceStatus.color}`}>
                {attendanceStatus.emoji} {attendanceStatus.label}
              </p>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600 py-4">No attendance records available for this term.</p>
        )}
      </div>

      {/* Conduct */}
      {conduct && (
        <div className="mb-6 border border-gray-800 p-3">
          <h3 className="text-lg font-semibold mb-2 uppercase">Conduct & Attributes</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Behavior:</span> {conduct.behavior}
            </div>
            <div>
              <span className="font-semibold">Punctuality:</span> {conduct.punctuality}
            </div>
            <div>
              <span className="font-semibold">Neatness:</span> {conduct.neatness}
            </div>
          </div>
        </div>
      )}

      {/* Remarks */}
      <div className="space-y-3 mb-6">
        {classTeacherRemark && (
          <div className="border border-gray-800 p-3">
            <p className="text-sm font-semibold uppercase">Class Teacher's Remark:</p>
            <p className="text-sm mt-1">{classTeacherRemark}</p>
          </div>
        )}
        {principalRemark && (
          <div className="border border-gray-800 p-3">
            <p className="text-sm font-semibold uppercase">Principal's Remark:</p>
            <p className="text-sm mt-1">{principalRemark}</p>
          </div>
        )}
      </div>

      {/* Grading Legend */}
      <div className="mb-6 border border-gray-800 p-3">
        <p className="text-sm font-semibold uppercase mb-1">Grading Scale:</p>
        <p className="text-xs">
          A (80-100): Excellent | B (70-79): Very Good | C (60-69): Good | D (50-59): Pass | F (0-49): Fail
        </p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-semibold mb-6">Class Teacher's Signature:</p>
          <div className="border-t-2 border-gray-800"></div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-6">Principal's Signature:</p>
          <div className="border-t-2 border-gray-800"></div>
        </div>
      </div>

      {nextTermBegins && (
        <div className="text-center text-sm mt-4">
          <p>Next term begins: <span className="font-semibold">{nextTermBegins}</span></p>
        </div>
      )}
    </div>
  );
};

export default PrintableReportCard;
