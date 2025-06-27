
import React from 'react';
import { CoupleTypeDefinition } from '../../lib/constants/coupleTypes';

interface LoveLanguagesProps {
  coupleType: CoupleTypeDefinition;
}

const LoveLanguages: React.FC<LoveLanguagesProps> = ({ coupleType }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-300 p-6">
      <h3 className="text-xl font-semibold mb-6">Love Languages</h3>
      
      {coupleType.description.loveLanguages ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Primary Love Languages - Left Side */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Primary Love Languages:</h4>
            {coupleType.description.loveLanguages.primary && coupleType.description.loveLanguages.primary.length > 0 ? (
              <div className="space-y-2">
                {coupleType.description.loveLanguages.primary.map((language, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                    <span className="text-gray-800 font-medium">{language}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No primary love languages defined</p>
            )}
          </div>

          {/* Secondary Love Languages - Right Side */}
          <div>
            <h4 className="font-semibold text-gray-600 mb-3">Secondary Love Languages:</h4>
            {coupleType.description.loveLanguages.secondary && coupleType.description.loveLanguages.secondary.length > 0 ? (
              <div className="space-y-2">
                {coupleType.description.loveLanguages.secondary.map((language, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                    <span className="text-gray-600">{language}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No secondary love languages defined</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 italic">Love language information coming soon.</p>
      )}
    </div>
  );
};

export default LoveLanguages;
