import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const ChartCard = ({
  title,
  icon,
  loading,
  error,
  hasData,
  chartComponent,
  className = "",
  tabOptions = null,
  defaultTab = null,
  onTabChange = null,
}) => {
  return (
    <Card className={`hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          {icon && (
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg mr-3 shadow-md">
              {icon}
            </div>
          )}
          <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
        </div>
        
        {tabOptions && (
          <Tabs defaultValue={defaultTab || tabOptions[0].value} onValueChange={onTabChange}>
            <TabsList>
              {tabOptions.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-80 text-red-500">{error}</div>
        ) : !hasData ? (
          <div className="flex justify-center items-center h-80 text-gray-500">No data available</div>
        ) : (
          <div className="h-80 p-4">
            {tabOptions ? (
              <Tabs defaultValue={defaultTab || tabOptions[0].value} onValueChange={onTabChange}>
                {tabOptions.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value}>
                    {tab.content || chartComponent}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              chartComponent
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
