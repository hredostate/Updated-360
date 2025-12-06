
import React from 'react';

/**
 * @deprecated This component has been replaced by DataUploader.tsx
 */
const UserUploader: React.FC = () => {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
      <h3 className="font-bold">Component Deprecated</h3>
      <p>Please use the "Data Upload" feature in the main menu instead.</p>
    </div>
  );
};

export default UserUploader;
