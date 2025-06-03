import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import "./index.css";

const amplifyConfig = parseAmplifyConfig(outputs);

// Configure Amplify with auto-generated configuration
Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <Authenticator>
        <App />
      </Authenticator>
    </ChakraProvider>
  </React.StrictMode>
);
