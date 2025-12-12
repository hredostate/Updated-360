import React, { useState, useMemo } from 'react';
import type { RiskPrediction, Student, ReportRecord, ScoreEntry, AssessmentScore, Assessment, ClassGroup } from '../../types';
import { 
  predictStudentRisk, 
  batchPredictRisks, 
  generateAIRiskAnalysis 
} from '../../services/predictiveAnalytics';
import { AlertCircleIcon, TrendingDownIcon, TrendingUpIcon, MinusIcon, ActivityIcon } from '../common/icons';

interface EarlyWarningSystemProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
  // Real data sources
  reports?: ReportRecord[];
  scoreEntries?: ScoreEntry[];
  assessments?: Assessment[];
  assessmentScores?: AssessmentScore[];
  classGroups?: ClassGroup[];
}

const EarlyWarningSystem: React.FC<EarlyWarningSystemProps> = ({ 
  students, 
  onViewStudent,
  reports = [],
  scoreEntries = [],
  assessments = [],
  assessmentScores = [],
  classGroups = []
}) => {
  // Add null safety with default empty array
  const safeStudents = students || [];
  const safeReports = reports || [];
  const safeScoreEntries = scoreEntries || [];
  const safeAssessments = assessments || [];
  const safeAssessmentScores = assessmentScores || [];
  const safeClassGroups = classGroups || [];

  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<RiskPrediction | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  /**
   * Calculate attendance rate for a student from class group records.
   * @returns Percentage (0-100) or null if no attendance data exists
   */
  const calculateAttendanceRate = (studentId: number): number | null => {
    const studentRecords: { status?: string; session_date?: string }[] = [];
    
    // Collect all attendance records for this student from all class groups
    safeClassGroups.forEach(group => {
      const member = group.members?.find(m => m.student_id === studentId);
      if (member && member.records) {
        studentRecords.push(...member.records);
      }
    });
    
    if (studentRecords.length === 0) return null;
    
    const presentCount = studentRecords.filter(r => 
      ['present', 'p'].includes(r.status?.toLowerCase() || '')
    ).length;
    
    return (presentCount / studentRecords.length) * 100;
  };

  /**
   * Calculate grade average for a student from score entries.
   * @returns Average score or null if no grade data exists
   */
  const calculateGradeAverage = (studentId: number): number | null => {
    const studentScores = safeScoreEntries.filter(se => se.student_id === studentId);
    
    if (studentScores.length === 0) return null;
    
    const totalScore = studentScores.reduce((sum, se) => sum + (se.total_score || 0), 0);
    return totalScore / studentScores.length;
  };

  /**
   * Count behavior incidents for a student from infraction reports.
   * @returns Number of infractions (0 if none)
   */
  const countBehaviorIncidents = (studentId: number): number => {
    return safeReports.filter(r => 
      r.report_type === 'Infraction' && r.involved_students?.includes(studentId)
    ).length;
  };

  /**
   * Calculate assignment completion rate for a student.
   * @returns Percentage (0-100) or null if no assignment data exists
   */
  const calculateAssignmentCompletionRate = (studentId: number): number | null => {
    if (safeAssessments.length === 0) return null;
    
    const studentAssessmentScores = safeAssessmentScores.filter(as => as.student_id === studentId);
    
    if (studentAssessmentScores.length === 0) return null;
    
    const completedCount = studentAssessmentScores.filter(as => as.score !== null).length;
    return (completedCount / studentAssessmentScores.length) * 100;
  };

  /**
   * Get recent grades for a student, sorted by most recent first.
   * @returns Array of up to 'count' most recent scores (empty array if no data)
   */
  const getRecentGrades = (studentId: number, count: number = 6): number[] => {
    const studentScoresWithTimestamp = safeScoreEntries
      .filter(se => se.student_id === studentId)
      .map(se => ({ 
        total_score: se.total_score || 0, 
        timestamp: new Date(se.created_at || '').getTime() 
      }));
    
    const studentScores = studentScoresWithTimestamp
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
      .map(se => se.total_score);
    
    return studentScores;
  };

  /**
   * Get recent attendance records for a student, sorted by most recent first.
   * @returns Array of up to 'count' most recent attendance statuses (empty array if no data)
   */
  const getRecentAttendance = (studentId: number, count: number = 10): boolean[] => {
    const studentRecordsWithTimestamp: { status?: string; timestamp: number }[] = [];
    
    safeClassGroups.forEach(group => {
      const member = group.members?.find(m => m.student_id === studentId);
      if (member && member.records) {
        member.records.forEach(r => {
          studentRecordsWithTimestamp.push({
            status: r.status,
            timestamp: new Date(r.session_date || '').getTime()
          });
        });
      }
    });
    
    const sortedRecords = studentRecordsWithTimestamp
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
    
    return sortedRecords.map(r => ['present', 'p'].includes(r.status?.toLowerCase() || ''));
  };

  // Generate predictions for all students
  const generatePredictions = async () => {
    setLoading(true);
    try {
      if (safeStudents.length === 0) {
        console.warn('No students available for prediction analysis');
        setPredictions([]);
        return;
      }

      // Calculate real metrics from database
      const studentsData = safeStudents.slice(0, 20).map(student => {
        const attendanceRate = calculateAttendanceRate(student.id);
        const gradeAverage = calculateGradeAverage(student.id);
        const behaviorIncidents = countBehaviorIncidents(student.id);
        const assignmentCompletionRate = calculateAssignmentCompletionRate(student.id);
        const recentGrades = getRecentGrades(student.id);
        const recentAttendance = getRecentAttendance(student.id);

        // Note: Using 0 for missing data is intentional - students with no data 
        // will appear at-risk, which alerts staff to engage with them
        return {
          student,
          attendanceRate: attendanceRate ?? 0,  // 0 indicates no attendance data
          gradeAverage: gradeAverage ?? 0,      // 0 indicates no grade data
          behaviorIncidents,
          assignmentCompletionRate: assignmentCompletionRate ?? 0,  // 0 indicates no assignment data
          recentGrades: recentGrades.length > 0 ? recentGrades : [0],
          recentAttendance: recentAttendance.length > 0 ? recentAttendance : [false],
        };
      });

      const results = await batchPredictRisks(studentsData);
      setPredictions(results);
      
      if (results.length > 0) {
        console.log(`Successfully generated ${results.length} risk predictions`);
      }
    } catch (error: any) {
      console.error('Error generating predictions:', error);
      setPredictions([]);
      // Note: In a production app, we would show an error toast here
      // addToast('Failed to generate predictions. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get AI analysis for selected prediction
  const getAIAnalysis = async (prediction: RiskPrediction) => {
    setSelectedPrediction(prediction);
    setAiAnalysis('Generating AI-powered analysis...');
    
    try {
      const analysis = await generateAIRiskAnalysis(prediction);
      setAiAnalysis(analysis);
    } catch (error: any) {
      console.error('Error getting AI analysis:', error);
      // Provide a meaningful fallback based on the prediction data
      const fallback = `Student ${prediction.studentName} has been identified as ${prediction.riskLevel} risk with a score of ${prediction.riskScore}/100. Key concerns: ${prediction.factors.slice(0, 2).map(f => f.name).join(', ')}. ${prediction.recommendedActions[0] || 'Immediate attention is recommended.'}`;
      setAiAnalysis(`⚠️ Unable to generate AI analysis at this time. ${fallback}`);
    }
  };

  // Filter predictions by risk level
  const filteredPredictions = useMemo(() => {
    if (filterLevel === 'all') return predictions;
    return predictions.filter(p => p.riskLevel === filterLevel);
  }, [predictions, filterLevel]);

  // Calculate risk distribution
  const riskDistribution = useMemo(() => {
    const dist = { low: 0, moderate: 0, high: 0, critical: 0 };
    predictions.forEach(p => dist[p.riskLevel]++);
    return dist;
  }, [predictions]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'moderate': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'low': return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'declining': return <TrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default: return <MinusIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ActivityIcon className="w-6 h-6" />
            Early Warning System
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI-powered student risk predictions 2-4 weeks ahead
          </p>
        </div>
        <button
          onClick={generatePredictions}
          disabled={loading || safeStudents.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Generate Predictions'}
        </button>
      </div>

      {safeStudents.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 text-center">
          <AlertCircleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-amber-800 dark:text-amber-200 text-lg font-medium mb-2">
            No Students Available
          </p>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            Please add students to the system to use the Early Warning System.
          </p>
        </div>
      )}

      {predictions.length > 0 && (
        <>
          {/* Risk Distribution Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-500/10 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {riskDistribution.low}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Low Risk</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {riskDistribution.moderate}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Moderate Risk</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {riskDistribution.high}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">High Risk</div>
            </div>
            <div className="bg-red-500/10 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {riskDistribution.critical}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">Critical Risk</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterLevel === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              All ({predictions.length})
            </button>
            <button
              onClick={() => setFilterLevel('critical')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterLevel === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Critical ({riskDistribution.critical})
            </button>
            <button
              onClick={() => setFilterLevel('high')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterLevel === 'high'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              High ({riskDistribution.high})
            </button>
          </div>

          {/* Predictions List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Top At-Risk Students
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPredictions.slice(0, 10).map((prediction) => (
                  <div
                    key={prediction.studentId}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => getAIAnalysis(prediction)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {prediction.studentName}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Predicted issue date: {prediction.predictedDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(prediction.trend)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(prediction.riskLevel)}`}>
                          {prediction.riskScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Confidence:</span> {prediction.confidence}%
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Risk Factors:
                        </div>
                        {prediction.factors.slice(0, 3).map((factor, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-slate-600 dark:text-slate-400 pl-2"
                          >
                            • {factor.name}: {factor.currentValue.toFixed(1)} (threshold: {factor.threshold})
                          </div>
                        ))}
                      </div>

                      {prediction.recommendedActions.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Recommended Actions:
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {prediction.recommendedActions[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                AI Analysis
              </h3>
              {selectedPrediction ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                      {selectedPrediction.studentName}
                    </h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selectedPrediction.riskLevel)}`}>
                      {selectedPrediction.riskLevel.toUpperCase()} RISK - Score: {selectedPrediction.riskScore}/100
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Trend:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400 capitalize">
                        {selectedPrediction.trend}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Confidence:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">
                        {selectedPrediction.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      AI Analysis:
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {aiAnalysis}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Detailed Risk Factors:
                    </div>
                    <div className="space-y-2">
                      {selectedPrediction.factors.map((factor, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {factor.name}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 ml-2">
                            {factor.description}
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                factor.currentValue < factor.threshold
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (factor.currentValue / factor.threshold) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Recommended Interventions:
                    </div>
                    <ul className="space-y-1">
                      {selectedPrediction.recommendedActions.map((action, idx) => (
                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                          <AlertCircleIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                  <AlertCircleIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Click on a student to view detailed AI analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {predictions.length === 0 && !loading && safeStudents.length > 0 && (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
          <ActivityIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Click "Generate Predictions" to analyze student risk factors
          </p>
        </div>
      )}
    </div>
  );
};

export default EarlyWarningSystem;
