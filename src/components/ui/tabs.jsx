import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

// Simple Tabs implementation for the 59-station dashboard
const TabsContext = createContext();

export const Tabs = ({ value, onValueChange, className = '', children }) => {
  const [internalValue, setInternalValue] = useState(value);
  
  const currentValue = value ?? internalValue;
  
  const handleValueChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className = '', children }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, className = '', children, ...props }) => {
  const context = useContext(TabsContext);
  const isActive = context.value === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-gray-950 shadow-sm' 
          : 'hover:bg-gray-200 hover:text-gray-900'
      } ${className}`}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, className = '', children }) => {
  const context = useContext(TabsContext);
  
  if (context.value !== value) {
    return null;
  }
  
  return (
    <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

// PropTypes
Tabs.propTypes = {
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

TabsList.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

TabsTrigger.propTypes = {
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

TabsContent.propTypes = {
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};