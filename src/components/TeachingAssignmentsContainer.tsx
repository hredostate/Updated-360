


import React from 'react';
import TeachingAssignmentsManager from './TeachingAssignmentsManager';
// FIX: Changed 'TeachingAssignment' to 'AcademicTeachingAssignment' to match the expected data structure.
import type { UserProfile, AcademicTeachingAssignment, BaseDataObject, ClassGroup, AcademicClass } from '../types';

type Props = {
  users: UserProfile[];
  assignments: AcademicTeachingAssignment[];
  subjects: BaseDataObject[];
  classes: BaseDataObject[];
  arms: BaseDataObject[];
  classGroups: ClassGroup[];
  academicClasses: AcademicClass[];
  onCreateAssignment: (
    assignmentData: { teacher_user_id: string; subject_id: number; class_id: number; arm_id: number | null },
    groupData: { name: string; description: string; group_type: 'class_teacher' | 'subject_teacher' }
  ) => Promise<boolean>;
  onDeleteAssignment: (groupId: number) => Promise<boolean>;
};

const TeachingAssignmentsContainer: React.FC<Props> = ({
  users,
  assignments,
  subjects,
  classes,
  arms,
  classGroups,
  academicClasses,
  onCreateAssignment,
  onDeleteAssignment,
}) => {
  const handleCreate = async (data: { user_id: string; subject_id: number; academic_class_id: number }): Promise<void> => {
    const academicClass = academicClasses.find(ac => ac.id === data.academic_class_id);
    const subject = subjects.find(s => s.id === data.subject_id);
    const teacher = users.find(u => u.id === data.user_id);

    if (!academicClass || !subject || !teacher) {
        console.error("Could not find all required data for assignment creation.");
        return;
    }

    const classRecord = classes.find(c => c.name === academicClass.level);
    const armRecord = academicClass.arm ? arms.find(a => a.name === academicClass.arm) : null;

    if (!classRecord) {
        console.error(`Could not find a base 'class' matching level: ${academicClass.level}`);
        return;
    }

    const groupName = `${subject.name} - ${academicClass.name}`;

    const assignmentData = {
        teacher_user_id: data.user_id,
        subject_id: data.subject_id,
        class_id: classRecord.id,
        arm_id: armRecord ? armRecord.id : null,
    };
    
    const groupData = {
        name: groupName,
        description: `Subject teacher group for ${groupName} taught by ${teacher.name}`,
        group_type: 'subject_teacher' as const,
    };

    await onCreateAssignment(assignmentData, groupData);
  };
  
  const handleDelete = async (assignmentId: number): Promise<void> => {
    const classGroup = classGroups.find(cg => cg.teaching_entity_id === assignmentId);
    if (!classGroup) {
        console.error("Could not find class group for assignment", assignmentId);
        return;
    }
    
    await onDeleteAssignment(classGroup.id);
  };

  return (
    <TeachingAssignmentsManager
      users={users}
      assignments={assignments}
      academicClasses={academicClasses}
// @ts-ignore
      onCreateAssignment={handleCreate}
// @ts-ignore
      onDeleteAssignment={handleDelete}
    />
  );
};

export default TeachingAssignmentsContainer;