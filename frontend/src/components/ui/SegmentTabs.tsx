import React, { useState } from 'react';

export interface SegmentTab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface SegmentTabsProps {
  tabs: SegmentTab[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
  dense?: boolean;
}

export default function SegmentTabs({
  tabs,
  value,
  defaultValue,
  onChange,
  className = '',
  dense = true,
}: SegmentTabsProps) {
  const [internal, setInternal] = useState(defaultValue || tabs[0]?.id);
  const active = value !== undefined ? value : internal;

  function handleClick(id: string) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  const baseContainer = dense ? 'p-0.5' : 'p-1';

  return (
    <div
      className={`inline-flex items-center rounded-full bg-gray-100 border border-gray-200 ${baseContainer} ${className}`}
      role="tablist"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(t.id)}
            className={`flex items-center gap-1.5 rounded-full transition-colors
              ${dense ? 'px-8 py-0.5 text-xs' : 'px-9 py-1 text-sm'}
              ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
          >
            {Icon && (
              <Icon
                sx={{ fontSize: dense ? 18 : 20 }} // For MUI icons
                className={`${isActive ? 'text-gray-700' : 'text-gray-500'}`}
              />
            )}
            <span className="flex items-center">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
