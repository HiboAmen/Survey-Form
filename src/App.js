// App.js
import React, { useState } from "react";
import SurveyFormContainer from "./SurveyFormContainer";
import "./App.css";

const App = () => {
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const handleColorChange = (newColor) => {
    setBackgroundColor(newColor);
  };

  return (
    <div className="app" style={{ backgroundColor }}>
      <SurveyFormContainer onColorChange={handleColorChange} />
    </div>
  );
};

export default App;
