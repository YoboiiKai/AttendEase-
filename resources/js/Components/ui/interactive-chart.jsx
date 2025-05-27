import React, { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';

const InteractiveChart = ({ 
  chartType = 'pie',
  data,
  options,
  title,
  icon,
  loading = false,
  error = null,
  height = "h-80",
  className = ""
}) => {
  const [activeSegment, setActiveSegment] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const enhancedOptions = {
    ...options,
    plugins: {
      ...options.plugins,
      tooltip: {
        ...options.plugins?.tooltip,
        callbacks: {
          ...options.plugins?.tooltip?.callbacks,
          label: function(context) {
            // Store hover information
            setHoverInfo({
              label: context.label,
              value: context.raw,
              datasetLabel: context.dataset.label
            });
            
            // Return the original label
            if (options.plugins?.tooltip?.callbacks?.label) {
              return options.plugins.tooltip.callbacks.label(context);
            }
            return `${context.label}: ${context.formattedValue}`;
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        setActiveSegment(activeSegment === index ? null : index);
      } else {
        setActiveSegment(null);
      }
      
      // Call original onClick if provided
      if (options.onClick) {
        options.onClick(event, elements);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {icon && (
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-lg mr-3 shadow-md">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          
          {hoverInfo && (
            <div className="text-sm text-green-600">
              {hoverInfo.label}: {hoverInfo.value}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className={`flex justify-center items-center ${height}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className={`flex justify-center items-center ${height} text-red-500`}>{error}</div>
        ) : !data || (data.datasets && data.datasets.length === 0) ? (
          <div className={`flex justify-center items-center ${height} text-gray-500`}>No data available</div>
        ) : (
          <div className={height}>
            {chartType === 'pie' ? (
              <Pie data={data} options={enhancedOptions} />
            ) : (
              <Bar data={data} options={enhancedOptions} />
            )}
            
            {activeSegment !== null && data.labels && (
              <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                <p className="font-medium text-green-700">{data.labels[activeSegment]}</p>
                <p className="text-sm text-green-600">
                  Value: {data.datasets[0].data[activeSegment]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveChart;
