import React from 'react';
import WeirdAcronyms from './weirdAcroynms';
import Descriptions from './descriptions';
import DateIdeas from './dateIdeas';
import LoveLanguages from './loveLanguages';
import { COUPLE_TYPES, CoupleTypeCode } from '../../lib/constants/coupleTypes';

const ResultsMain: React.FC = () => {
  // Default to COZY_HOMEBODIES for testing purposes
  const defaultCoupleType = COUPLE_TYPES[CoupleTypeCode.COZY_HOMEBODIES];

  return (
    <section className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-12">

        {/* Top Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6 items-stretch">
          {/* Descriptions Box */}
          <div className="lg:col-span-2 h-full">
            <Descriptions coupleType={defaultCoupleType} />
          </div>
          {/* Type Indicators */}
          <div className="h-full">
            <WeirdAcronyms coupleType = {defaultCoupleType}/>
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <DateIdeas coupleType={defaultCoupleType}/>
        </div>

        {/* Bottom Row */}
        <LoveLanguages coupleType={defaultCoupleType} />
      </div>
    </section>
  );
};

export default ResultsMain;