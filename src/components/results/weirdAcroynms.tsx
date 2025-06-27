"use client";

import React, { useState } from 'react';
import { CoupleTypeDefinition } from '../../lib/constants/coupleTypes';

interface WeirdAcronymsProps {
  coupleType: CoupleTypeDefinition;
}

const WeirdAcronyms: React.FC<WeirdAcronymsProps> = ({ coupleType }) => {
  const [selectedTab, setSelectedTab] = useState<string>('s&p');

  const tabs = [
    { key: 's&p', label: 'S & P' },
    { key: 'p&e', label: 'P & E' },
    { key: 'a&r', label: 'A & R' }
  ];

  const getDescriptorContent = (key: string) => {
    const baseDescriptor = coupleType.description.descriptorWords?.[key as keyof typeof coupleType.description.descriptorWords] || '';
    
    switch (key) {
      case 's&p':
        return {
          title: 'Structured & Planned',
          content: `${baseDescriptor}. You both thrive when there's a clear plan in place. Whether it's organizing your weekly schedules, planning vacations months in advance, or maintaining organized living spaces, structure brings you comfort and success. You appreciate routines and find security in predictability.`
        };
      case 'p&e':
        return {
          title: 'Private & Emotional',
          content: `${baseDescriptor}. Your relationship flourishes in intimate, private settings where you can be vulnerable and authentic with each other. You value deep emotional connections over surface-level interactions. Heart-to-heart conversations, meaningful gestures, and creating safe spaces for sharing feelings are central to your bond.`
        };
      case 'a&r':
        return {
          title: 'Analytical & Reflective',
          content: `${baseDescriptor}. You both enjoy thinking deeply about life, relationships, and personal growth. You approach challenges thoughtfully, prefer to understand the 'why' behind things, and often process experiences through discussion and reflection. Your conversations tend to be meaningful and thought-provoking.`
        };
      default:
        return { title: '', content: '' };
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Tab Buttons */}
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setSelectedTab(tab.key)}
          className={`w-full rounded-lg border-2 p-4 text-lg font-semibold transition-colors ${
            selectedTab === tab.key
              ? 'bg-blue-100 border-blue-300 text-blue-800'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
      
      {/* Descriptor Box */}
      <div className="bg-white rounded-lg border-2 border-gray-300 p-6 flex-1 flex flex-col">
        <div className="text-left flex-1">
          <h4 className="text-lg font-semibold mb-3 text-gray-800">
            {getDescriptorContent(selectedTab).title}
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getDescriptorContent(selectedTab).content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeirdAcronyms;