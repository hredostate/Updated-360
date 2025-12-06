import React from 'react';
import type { SchoolConfig } from '../types';

interface GeofenceSettingsProps {
    schoolConfig: SchoolConfig | null;
    onSave: (config: Partial<SchoolConfig>) => Promise<boolean>;
}

const GeofenceSettings: React.FC<GeofenceSettingsProps> = ({ schoolConfig, onSave }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold">Geofence Settings</h3>
            <p className="text-sm text-slate-500 mt-2">
                Geofence settings are now managed per-campus. Please go to Structure -&gt; Campuses to configure them.
            </p>
            <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
                <p className="font-bold">Note for Admin:</p>
                <p>The global geofence settings have been deprecated in favor of campus-specific geofences.</p>
            </div>
        </div>
    );
};

export default GeofenceSettings;