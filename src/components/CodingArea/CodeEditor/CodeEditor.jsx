import Split from "react-split";
import LanguageSelector from "./LanguageSelector";
import CodeMirror from "@uiw/react-codemirror";
import { bbedit } from "@uiw/codemirror-theme-bbedit";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import CodeEditorFooter from "./CodeEditorFooter";
import { useRef, useState, useEffect } from "react";
import axios from "axios"; // For sending HTTP requests to Judge0

function CodeEditor({ Problem }) {
  const [caseNumber, setCaseNumber] = useState(1);
  const inputCode = useRef(Problem.starterCode);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript"); // Default to JavaScript
  const [output, setOutput] = useState(''); // State for output

  useEffect(() => {
    if (!localStorage.getItem(Problem.id)) {
      localStorage.setItem(Problem.id, Problem.starterCode);
    }
  }, [Problem]);

  function handleOnChange(newValue) {
    localStorage.setItem(Problem.id, newValue);
  }

  const languageIdMap = {
    javascript: 63, // Node.js (JavaScript)
    cpp: 54, // C++ (G++ 9.2.0)
    go: 60, // Go (1.13.5)
  };

  const handleSubmit = async () => {
    const sourceCode = localStorage.getItem(Problem.id);
    const languageId = languageIdMap[selectedLanguage];

    try {
      // API request to RapidAPI Judge0 endpoint
      const response = await axios({
        method: "POST",
        url: "https://judge0-ce.p.rapidapi.com/submissions?wait=true",
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": "37d29d860bmshde406fab8273074p1d712ajsn3d22e880b291", // Replace with your RapidAPI key
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        data: {
          source_code: sourceCode,
          language_id: languageId,
          stdin: Problem.examples[caseNumber - 1].inputText, // Test case input
        },
      });

      const { stdout, stderr } = response.data;

      if (stderr) {
        setOutput(`Error: ${stderr}`);
      } else {
        if (stdout.trim() === Problem.examples[caseNumber - 1].outputText.trim()) {
          setOutput("Congratulations! All tests passed");
          localStorage.setItem(`status_${Problem.id}`, "yes");
        } else {
          setOutput(`Wrong answer! Your output: ${stdout}`);
        }
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const getExtensionsForLanguage = () => {
    switch (selectedLanguage) {
      case "javascript":
        return [javascript()];
      case "cpp":
        return [cpp()];
      case "go":
        return [go()];
      default:
        return [javascript()];
    }
  };

  return (
    <div className="min-w-0 mb-2 bg-white m-2 ml-0.5 rounded-md">
      <LanguageSelector
        Problem={Problem}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
      />
      <Split
        className="splitver h-[calc(100vh-160px)]"
        direction="vertical"
        sizes={[55, 45]}
        minSize={60}
      >
        <div className="w-full overflow-auto">
          <CodeMirror
            value={
              localStorage.getItem(Problem.id) != null
                ? localStorage.getItem(Problem.id)
                : inputCode.current
            }
            onChange={handleOnChange}
            theme={bbedit}
            extensions={getExtensionsForLanguage()} // Dynamically load language
            style={{ fontSize: 16 }}
          />
        </div>
        <div className="w-full px-5 overflow-hidden">
          <div className="flex h-10 items-center space-x-6">
            <div className="relative flex h-full flex-col justify-center cursor-pointer">
              <div className="text-sm font-medium leading-5">TestCases</div>
              <hr className="absolute bottom-0 h-0.5 w-full rounded-full border-none bg-black" />
            </div>
          </div>
          <div className="flex">
            {Problem.examples.map((item) => (
              <div className="mr-2 items-start mt-2 text-black" key={item.id}>
                <div className="flex flex-wrap items-center gap-y-4">
                  <div
                    onClick={() => {
                      setCaseNumber(item.id);
                    }}
                    className="font-medium items-center transition-all focus:outline-none inline-flex bg-gray-200 hover:bg-gray-300 relative rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap"
                  >
                    Case {item.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="font-semibold my-4">
            <p className="text-sm font-medium mt-1">Input:</p>
            <div className="w-full cursor-text rounded-lg border px-3 py-[10px] bg-gray-200 border-transparent mt-2">
              {Problem.examples[caseNumber - 1].inputText}
            </div>
            <p className="text-sm font-medium mt-1 ">Output:</p>
            <div className="w-full cursor-text rounded-lg border px-3 py-[10px] bg-gray-200 border-transparent mt-2">
              {Problem.examples[caseNumber - 1].outputText}
            </div>
          </div>
        </div>
      </Split>
      <CodeEditorFooter handleSubmit={handleSubmit} />

      {/* Output Section */}
      <div className="output-section mt-4 p-4 border rounded bg-gray-100">
        <h3 className="font-semibold text-lg">Program Output:</h3>
        <pre>{output}</pre> {/* Display the output or error here */}
      </div>
    </div>
  );
}

export default CodeEditor;
