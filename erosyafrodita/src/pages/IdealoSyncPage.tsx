import React from 'react';
import { IdealoSync } from '../components/IdealoSync';

const IdealoSyncPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Integración con Idealo</h1>
      <IdealoSync />
    </div>
  );
};

export default IdealoSyncPage;
