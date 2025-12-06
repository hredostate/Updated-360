// This file defines the structure for the dynamic lesson plan form.
// It acts as the "liquid code" to generate the form fields in the editor.

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
  rows?: number;
}

export interface RepeatableFieldTemplate {
  name: string;
  label: string;
  type: 'repeatable';
  itemTemplate: {
    fields: FormField[];
  };
}

export interface FormTemplate {
  fields: FormField[];
}

// Template for the main part of the lesson plan
export const lessonPlanTemplate: FormTemplate = {
  fields: [
    { name: "title", label: "Lesson Title", type: "text", placeholder: "e.g., Introduction to Photosynthesis" },
    { name: "grade_level", label: "Grade Level", type: "text", placeholder: "e.g., Grade 10" },
    { name: "smart_goals", label: "SMART Goals", type: "textarea", placeholder: "By the end of this lesson, students will be able to...", rows: 3 },
    { name: "objectives", label: "Learning Objectives", type: "textarea", placeholder: "List the key learning objectives...", rows: 3 },
    { name: "materials", label: "Materials", type: "textarea", placeholder: "e.g., Whiteboard, markers, textbooks...", rows: 2 },
    { name: "assessment_methods", label: "Assessment Methods", type: "textarea", placeholder: "e.g., Quiz, class participation, project...", rows: 2 },
    { name: "activities", label: "General Activities / Procedures", type: "textarea", placeholder: "Describe the main lesson activities in detail...", rows: 4 },
  ],
};

// Template for each individual session within the lesson plan
export const sessionTemplate: RepeatableFieldTemplate = {
  name: 'sessions',
  label: 'Lesson Sessions',
  type: 'repeatable',
  itemTemplate: {
    fields: [
      { name: 'title', label: 'Session Title', type: 'text', placeholder: "e.g., The Calvin Cycle" },
      { name: 'scope', label: 'Session Scope & Sequence', type: 'textarea', rows: 2 },
      { name: 'goals', label: 'Session Goals', type: 'textarea', rows: 2 },
      { name: 'hook', label: 'Hook / Engagement', type: 'textarea', rows: 2 },
      { name: 'real_world_connection', label: 'Real World Connection', type: 'textarea', rows: 2 },
      { name: 'peer_review', label: 'Peer Review / Collaboration', type: 'textarea', rows: 2 },
    ]
  }
};
