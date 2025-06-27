import React from 'react';
import { CoupleTypeDefinition } from '../../lib/constants/coupleTypes';

interface DateIdeaProps {
    coupleType: CoupleTypeDefinition
}

const DateIdeas: React.FC<DateIdeaProps> = ({ coupleType }) => {
  return (
    <>
      <div className="bg-white rounded-lg border-2 border-gray-300 p-6">
        <h3 className="text-xl font-semibold mb-4">Date Ideas:</h3>
        <div className="space-y-3 text-gray-600">
          {coupleType.description.dateIdeas && coupleType.description.dateIdeas.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {coupleType.description.dateIdeas.map((idea, index) => (
                <li key={index}>{idea}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No date ideas available for this couple type yet.</p>
          )}
        </div>
      </div>

      {/* How to Resolve Conflict */}
      <div className="bg-white rounded-lg border-2 border-gray-300 p-6">
        <h3 className="text-xl font-semibold mb-4">How to Resolve Conflict</h3>
        <div className="space-y-3 text-gray-600">
          {coupleType.description.conflictResolution ? (
            <div className="space-y-3">
              <p className="font-medium">{coupleType.description.conflictResolution.style}</p>
              {coupleType.description.conflictResolution.tips && coupleType.description.conflictResolution.tips.length > 0 && (
                <ul className="list-disc list-inside space-y-1">
                  {coupleType.description.conflictResolution.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Conflict resolution guidance coming soon.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default DateIdeas;