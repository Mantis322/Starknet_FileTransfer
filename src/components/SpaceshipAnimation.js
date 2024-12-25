import React from 'react';

export default function SpaceshipAnimation({ onComplete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="transform -rotate-45">
        <div className="rocket">
          <div className="rocket-body">
            <div className="body"></div>
            <div className="fin fin-left"></div>
            <div className="fin fin-right"></div>
            <div className="window"></div>
          </div>
          <div className="exhaust-flame"></div>
        </div>
      </div>
    </div>
  );
}