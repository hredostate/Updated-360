
import React, { Suspense } from 'react';
import type { StudentProfile, SurveyWithQuestions } from '../types';
import Spinner from './common/Spinner';

// Lazy load to prevent chunking warnings
const SurveyListView = React.lazy(() => import('./SurveyListView'));

interface StudentSurveysViewProps {
    studentProfile: StudentProfile;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    surveys: SurveyWithQuestions[];
    takenSurveyIds: Set<number>;
    onNavigate: (view: string) => void;
}

const StudentSurveysView: React.FC<StudentSurveysViewProps> = ({ studentProfile, addToast, surveys, takenSurveyIds, onNavigate }) => {
    
    const handleTakeSurvey = (survey: SurveyWithQuestions) => {
        onNavigate(`Take Quiz/${survey.id}`);
    }

    return (
        <div className="animate-fade-in">
            <Suspense fallback={<div className="flex justify-center p-8"><Spinner size="lg" /></div>}>
                <SurveyListView 
                    surveys={surveys} 
                    onTakeSurvey={handleTakeSurvey} 
                    takenSurveyIds={takenSurveyIds} 
                />
            </Suspense>
        </div>
    );
}

export default StudentSurveysView;
