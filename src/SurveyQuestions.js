import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Select from "react-select";
import { MdDelete } from 'react-icons/md';
import "./SurveyQuestions.css";


const SurveyQuestion = () => { const { control, handleSubmit, setValue, watch,} = useForm({defaultValues:
     {questions: [],currentQuestionIndex: null,currentStepIndex: 0,
      selectedQuestionType: "",
      totalSteps: 0,
    },
  });


  const {fields,append,remove, } = useFieldArray({control,name: "questions", });


  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [surveyConfig, setSurveyConfig] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [saveButtonClicked, setSaveButtonClicked] = useState(false);  // Add this line


  const currentQuestionIndex = watch("currentQuestionIndex");


  useEffect(() => {
    fetch("/Survey.json")
      .then((response) => response.json())
      .then((data) => setSurveyConfig(data))
      .catch((error) => console.error("Error fetching survey configuration:", error));
  }, []);


  const addQuestion = (questionConfig) => {const questionTemplate = {id: fields.length + 1, header: questionConfig.header || "Question",
      subheader: questionConfig.subheader || "",
      type: questionConfig.type,
    };


    if (questionConfig.type === "multistep") {
      questionTemplate.steps = questionConfig.steps.map((step) => ({
        stepType: step.stepType,
        options: step.options || [],
        question: step.question || "",
      }));
    } else if (questionConfig.type === "selectOptions") {
      questionTemplate.options = questionConfig.options || [];
    }


    append(questionTemplate);
    setValue("currentQuestionIndex", fields.length);
    setValue("selectedQuestionType", questionConfig.type);
    setCurrentStepIndex(0);
    setReviewVisible(false);
    setReviewMode(false);
    setSelectedOption(null);
  };


  const handleNext = () => {
    const currentQuestion = fields[watch("currentQuestionIndex")];
    if (currentQuestion.type === "multistep" && currentStepIndex < currentQuestion.steps.length - 1) {
      setCurrentStepIndex((prevStep) => prevStep + 1);
    } else if (currentQuestionIndex < fields.length - 1) {
      setValue("currentQuestionIndex", (prevIndex) => prevIndex + 1);
      setCurrentStepIndex(0);
    }
  };


  const handlePrevious = () => {
    const currentQuestion = fields[watch("currentQuestionIndex")];
    if (currentQuestion.type === "multistep" && currentStepIndex > 0) {
      setCurrentStepIndex((prevStep) => prevStep - 1);
    } else if (currentStepIndex === 0 && currentQuestionIndex > 0) {
      setValue("currentQuestionIndex", (prevIndex) => prevIndex - 1);
      setCurrentStepIndex(0);
    }
  };


  const handleInputChange = (e, key, questionIndex, optionIndex) => {
    const value = e.target.value;
 
    const updatedQuestions = [...fields];
 
    if (optionIndex !== undefined) {
      // Edit option value
      const currentOptions = updatedQuestions[questionIndex].options || [];
      currentOptions[optionIndex] = value;
      updatedQuestions[questionIndex].options = currentOptions;
    } else {
      // Edit other input values
      if (key === "text") {
        updatedQuestions[questionIndex].text = value;
      } else if (key === "options") {
        updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options || [];
        updatedQuestions[questionIndex].options[optionIndex] = value;
      }
    }
 
    setValue("questions", updatedQuestions);
  };
 
  const handleFileChange = (e, questionIndex) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentQuestionText(file.name);
      setValue(`questions[${questionIndex}].attachment`, file);
    }
  };


  const handleContentEditableChange = (e, key, questionIndex) => {
    const updatedQuestions = [...fields];
    if (updatedQuestions[questionIndex]) {
      updatedQuestions[questionIndex][key] = e.currentTarget.innerHTML;
      setValue("questions", updatedQuestions);
    }
  };


  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...fields];
   
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];}
 
    updatedQuestions[questionIndex].options.push("");
    setValue("questions", updatedQuestions);
  };


  const handleRemoveOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...fields];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setValue("questions", updatedQuestions);
  };

  const handleSave = () => {
    // Save logic here
    // For now, let's just log the questions to the console
    console.log("Saved Questions:", fields);
    // You can add more logic here to persist the questions or perform other actions.

    // Disable user-adjustable components
    setReviewVisible(true);
    // Disable editing questions
    setReviewMode(true);
    // Hide Save button
    setSaveButtonClicked(true);
  };

  const renderCheckboxOptions = (question, questionIndex) => {
    const currentOptions = question.options || [];
 
    return (
      <div className="checkbox-options">
        {currentOptions.map((option, optionIndex) => (
          <div key={optionIndex} className="option-row">
            <label key={optionIndex}>
              <input
                type="radio"
                name={`questions[${questionIndex}].text`}
                value={option}
                checked={questionIndex === watch("currentQuestionIndex") && currentQuestionText === option}
                onChange={() => handleInputChange(option, "text", questionIndex)}
              />
              <input
                type="text"
                value={fields[questionIndex].options[optionIndex]}
                onChange={(e) => handleInputChange(e, "options", questionIndex, optionIndex)}
                disabled={reviewMode}
              />
              {!reviewMode && (
                <button type="remove-button" className="remove-option" onClick={() => handleRemoveOption(questionIndex, optionIndex)}>
                  Remove
                </button>
              )}
            </label>
          </div>
        ))}
        {!reviewMode && (
          <button type="button" className="add-option" onClick={() => handleAddOption(questionIndex)}>
            Add Option
          </button>
        )}
      </div>
    );
  };


  const renderQuestionComponents = () => {
    if (!surveyConfig || !surveyConfig.components) {
      return null;
    }


    return surveyConfig.components.map((component, index) => {
      switch (component.type) {
        case "questions":
          return (
            <div key={index}>
              <h1
                contentEditable={!reviewVisible}
                suppressContentEditableWarning
                onBlur={(e) => handleContentEditableChange(e, "header", 0)}
              >
                {watch("header", "ESG Questions")}
              </h1>
              <Select
                className={`select-container ${reviewVisible ? 'user-adjustable' : 'hidden'}`}
                options={component.questions.map((questionConfig) => ({
                  label: questionConfig.header,
                  value: questionConfig,
                }))}
                onChange={(selectedOption) => setSelectedOption(selectedOption)}
                isDisabled={reviewMode}
              />
              {selectedOption && (
                 <button
                 className={`create_button ${reviewMode ? 'hidden' : ''}`}
                 onClick={() => addQuestion(selectedOption.value)}
                 disabled={reviewMode}
               >
                 Create
               </button>
              )}
              {fields.map((question, questionIndex) => (
                <div key={questionIndex} className={`question-container ${questionIndex === watch("currentQuestionIndex") ? "visible" : "hidden"}`}>
                  <div className="question-header">
                    <h1
                      contentEditable={!reviewVisible}
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentEditableChange(e, "header", questionIndex)}
                      dangerouslySetInnerHTML={{ __html: question.header }}
                    />
                  </div>
                  <div className="question-subheader">
                    <h2
                      contentEditable={!reviewVisible}
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentEditableChange(e, "subheader", questionIndex)}
                      dangerouslySetInnerHTML={{ __html: question.subheader }}
                    />
                  </div>
                  <br></br>
                  {question.type === "text" && (
                    <div 
                      id={`question-${questionIndex}`}
                      className="textarea-input"
                      contentEditable={!reviewVisible}
                      dangerouslySetInnerHTML={{
                        __html: questionIndex === watch("currentQuestionIndex") ? currentQuestionText : question.text,
                      }}
                      onInput={(e) => handleContentEditableChange(e, "text", questionIndex)}
                    />
                  )}
                  {question.type === "multistep" && currentStepIndex < question.steps.length && (
                    <div  className="textarea-input">
                      { currentStepIndex === 0 && question.steps[currentStepIndex].stepType === "selectOptions" &&  (
                        renderCheckboxOptions(question, questionIndex)
                      )}
                      {currentStepIndex > 0 && question.steps[currentStepIndex].stepType === "textInput" && (
                        <div
                        id={`question-${questionIndex}`}
                        className="textarea-input"
                        contentEditable={!reviewVisible}
                        dangerouslySetInnerHTML={{
                          __html: questionIndex === watch("currentQuestionIndex") ? currentQuestionText : question.text,
                        }}
                        onInput={(e) => handleContentEditableChange(e, "text", questionIndex)}
                      />
                      )}
                      {currentStepIndex > 0 && question.steps[currentStepIndex].stepType === "upload" && (
                        <div className="transparent-box">
                          <div className="upload-container">
                            <input
                              type="file"
                              accept="*/*"
                              onChange={(e) => handleFileChange(e, questionIndex)}
                              className="custom-file-upload"
                            />
                            {currentQuestionText && <p>Selected File: {currentQuestionText}</p>}
                          </div>
                        </div>
                      )}
                      <div className="navigation-buttons">
                      {currentStepIndex > 0 && (
                                   <button
                          className="previous"
                               type="button"
                           onClick={handlePrevious}
                      disabled={currentStepIndex === 0 && questionIndex === 0}
                        >
                      Previous
                        </button>
                           )}
                        <button
                          className="next"
                          type="button"
                          onClick={handleNext}
                          disabled={
                            currentStepIndex === question.steps.length - 1 &&
                            questionIndex === fields.length - 1
                          }
                        >
                          Choose & Next
                        </button>
                      </div>
                    </div>
                  )}
                  {question.type === "selectOptions" && (
                    renderCheckboxOptions(question, questionIndex)
                  )}
                  {question.type === "upload" && (
                    <div className="transparent-box">
                      <div className="upload-container">
                        <input
                          type="file"
                          accept="*/*"
                          onChange={(e) => handleFileChange(e, questionIndex)}
                          className="custom-file-upload"
                          disabled={reviewMode}
                        />
                        {currentQuestionText && <p>Selected File: {currentQuestionText}</p>}
                      </div>
                    </div>
                  )}
                  <div className={`delete-question-btn ${reviewMode ? 'hidden' : ''}`} onClick={() => remove(questionIndex)} disabled={reviewMode}>
                    <MdDelete size={22} />
                  </div>
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="survey-form">
      {renderQuestionComponents()}
      <button type="save-button" onClick={handleSave} className={`save-button ${saveButtonClicked ? 'hidden' : ''}`}>
        Save
      </button>
    </div>
  );
};

export default SurveyQuestion;
