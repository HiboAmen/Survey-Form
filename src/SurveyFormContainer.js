import React, { useState, useEffect } from "react";
import SurveyQuestions from "./SurveyQuestions";
import { Resizable } from "react-resizable";
import "./SurveyFormContainer.css";

const SurveyFormContainer = () => {
  const [surveyState, setSurveyState] = useState({ surveyBackgroundColor: "#ffffff",selectedComponentIndex: 0, components: [],});
  const [formSaved, setFormSaved] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);

  useEffect(() => {
    // Fetch survey data from Survey.json
    fetch("/Survey.json")
      .then((response) => response.json())
      .then((data) => setSurveyState(data))
      .catch((error) => console.error("Error fetching survey data:", error));
  }, []);

  const handleColorChange = (newColor, property) => {
    if (!formSaved) {
      setSurveyState((prev) => ({
        ...prev,
        components: prev.components.map((component, index) => {
          if (index === prev.selectedComponentIndex) {
            return { ...component, [property]: newColor };
          } else {
            return component;
          }
        }),
      }));
    }
  };

  const handleComponentSelectionChange = (index) => {
    setSurveyState((prev) => ({ ...prev, selectedComponentIndex: index }));
  };

  const handleQuestionTextResize = (e, { size }) => {
    if (!formSaved) {
      setSurveyState((prev) => ({
        ...prev,
        components: prev.components.map((component, index) => {
          if (index === prev.selectedComponentIndex) {
            return { ...component, width: size.width, height: size.height };
          } else {
            return component;
          }
        }),
      }));
    }
  };

  const handleHeaderTextChange = (e) => {
    if (!formSaved) {
      setSurveyState((prev) => ({
        ...prev,
        components: prev.components.map((component, index) => {
          if (index === prev.selectedComponentIndex) {
            return { ...component, text: e.target.innerText };
          } else {
            return component;
          }
        }),
      }));
    }
  };
  const handleDownload = () => {
    const formContainer = document.getElementsByClassName("survey-form-container")[0].cloneNode(true);


    // Remove contenteditable attributes to prevent unwanted user interactions in the downloaded file
    const contentEditableElements = formContainer.querySelectorAll("[contenteditable]");
    contentEditableElements.forEach((element) => {
      element.removeAttribute("contenteditable");
    });


    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Survey Form</title>
          <style>
            body { margin: 0; }
          </style>
        </head>
        <body style="background-color: ${surveyState.surveyBackgroundColor};">
          ${formContainer.outerHTML}
        </body>
        <script>
          document.addEventListener("DOMContentLoaded", function() {
            const editableElements = document.querySelectorAll("[contenteditable]");


            editableElements.forEach((element) => {
              element.addEventListener("mouseup", handleMouseUp);
            });


            function handleMouseUp() {
              const selection = window.getSelection();
              const selectedText = selection.toString();
              const range = selection.getRangeAt(0);


              if (range.startContainer.parentNode.nodeName === 'H1') {
                const formattedText = "<span style='font-weight: bold;'>" + selectedText + "</span>";
                document.execCommand("delete", false, null);
                document.execCommand("insertHTML", false, formattedText);
              } else {
                const formattedText = "<span style='font-style: italic;'>" + selectedText + "</span>";
                document.execCommand("delete", false, null);
                document.execCommand("insertHTML", false, formattedText);
              }
            }
          });
        </script>
      </html>
    `;


    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "survey_form.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const saveChanges = () => {
    const userChanges = surveyState.components.map(({ type, ...rest }) => rest);
    console.log("Save changes:", userChanges);
    // Further actions with userChanges, e.g., send to server, update state, etc.
    // setSurveyState({ surveyBackgroundColor: "#f0f0f0", selectedComponentIndex: 0, components: [] }); // Uncomment if you want to clear components after saving changes
    setFormSaved(true);
    setShowDownloadButton(true); // Show download button after saving changes
  };

  return (
    <div className="survey-form-container" style={{ backgroundColor: surveyState.surveyBackgroundColor, position: "relative" }}>
      {!formSaved && (
        <div className="color-buttons">
          <label>
            Background:
            <input
              type="color"
              value={surveyState.components[surveyState.selectedComponentIndex]?.backgroundColor || "#fff"}
              onChange={(e) => handleColorChange(e.target.value, "backgroundColor")}
            />
          </label>

          <label>
            Text:
            <input
              type="color"
              value={surveyState.components[surveyState.selectedComponentIndex]?.textColor || "#000"}
              onChange={(e) => handleColorChange(e.target.value, "textColor")}
            />
          </label>

          <label>
            Survey Background Color:
            <input
              type="color"
              value={surveyState.surveyBackgroundColor}
              onChange={(e) => setSurveyState((prev) => ({ ...prev, surveyBackgroundColor: e.target.value }))}
            />
          </label>
        </div>
      )}

      {!formSaved && (
        <div className="options-panel">
          <div>
            <label>Select Component: </label>
            <select onChange={(e) => handleComponentSelectionChange(parseInt(e.target.value))}>
              {surveyState.components.map((component, i) => (
                <option key={i} value={i}>
                  {component.type}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {surveyState.components.map((component, index) => (
        <Resizable
          key={index}
          width={component.width || 200}
          height={component.height || 100}
          onResize={handleQuestionTextResize}
          handle={<div className="resize-handle" />}
        >
          <div
            key={index}
            style={{ backgroundColor: component.backgroundColor, color: component.textColor }}
          >
            {component.type === "header" && (
              <h1
                contentEditable={!formSaved}
                suppressContentEditableWarning
                onBlur={handleHeaderTextChange}
                dangerouslySetInnerHTML={{ __html: component.text }}
              />
            )}
            {component.type === "questions" && (
              <SurveyQuestions
                header={component.header}
                Subhader={component.Subhader}
                questions={component.questions}
                onHeaderChange={(newHeader) => {
                  const updatedComponents = [...surveyState.components];
                  updatedComponents[index].header = newHeader;
                  setSurveyState((prev) => ({ ...prev, components: updatedComponents }));
                }}
              />
            )}
             {component.type === "Subheader" && (
              <SurveyQuestions
            
                Subhader={component.Subhader}
               
                onHeaderChange={(newHeader) => {
                  const updatedComponents = [...surveyState.components];
                  updatedComponents[index].header = newHeader;
                  setSurveyState((prev) => ({ ...prev, components: updatedComponents }));
                }}
              />
            )}

         
          </div>
        </Resizable>
      ))}

      {!formSaved ? (
        <button className="survey-form-container button.save-changes " onClick={saveChanges}>Save Changes</button>
      ) : (
        showDownloadButton && <button onClick={handleDownload}>Download</button>
      )}
    </div>
  );
};

export default SurveyFormContainer;
