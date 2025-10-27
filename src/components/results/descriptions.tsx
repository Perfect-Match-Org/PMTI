import React from 'react';
import { CoupleTypeDefinition } from '../../lib/constants/coupleTypes';

interface DescriptionsProps {
  coupleType: CoupleTypeDefinition;
}

const Descriptions: React.FC<DescriptionsProps> = ({ coupleType }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 p-8 h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4">{coupleType.displayName}</h3>
      <div className="text-gray-600 space-y-4 flex-1">
        <p className="text-gray-800 font-medium">{coupleType.shortDescription}</p>
        
        {coupleType.description.summary && (
          <p>{coupleType.description.summary}</p>
        )}
        
        {coupleType.description.traits && coupleType.description.traits.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Key Traits:</h4>
            <ul className="list-disc list-inside space-y-1">
              {coupleType.description.traits.map((trait, index) => (
                <li key={index}>{trait}</li>
              ))}
            </ul>
          </div>
        )}
        
        {coupleType.description.strengths && coupleType.description.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Strengths:</h4>
            <ul className="list-disc list-inside space-y-1">
              {coupleType.description.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Descriptions;