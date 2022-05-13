import { createGlobalStyle } from "styled-components";
import { Theme } from "client/theme";

export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  html {
    color: ${(props) => props.theme.textMain};
    display: flex;
    font-family: Helvetica, Arial, Verdana, Tahoma, sans-serif;
    font-size: ${(props) => props.theme.fontSizeNormal};
  }

  body {
    background: ${(props) => props.theme.backgroundBody};
    padding-bottom: 32px;
    margin: 0;
    width: 100%;
  }

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    body {
      background: ${(props) => props.theme.backgroundBody};
      padding-bottom: 0;
    }
  }

  #main {
    background: ${(props) => props.theme.backgroundMain};
    max-width: 1024px;
    margin: auto;
  }

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    #main {
      margin: 0 0 10px 0;
    }
  }

  select {
    font-size: ${(props) => props.theme.fontSizeNormal};
    padding: 4px;
    border-radius: 4px;
  }

  input[type='text'],
  input[type='number'],
  input[type='password'],
  textarea {
    font-size: ${(props) => props.theme.fontSizeNormal};
  }

  input {
    border-radius: 6px;
    box-sizing: border-box;
  }

  input::placeholder {
    color: ${(props) => props.theme.inputTextPlaceholder};
  }

  input:focus {
    border: 1px solid ${(props) => props.theme.inputBorderFocus};
    box-shadow: 0 0 5px 0 ${(props) => props.theme.inputBorderFocus};
    box-sizing: border-box;
  }

  a {
    color: ${(props) => props.theme.textLink};
    text-decoration: underline;
  }

  a:hover,
  a:focus {
    cursor: pointer;
  }

  label {
    margin: 0 10px 0 0;
  }

  ul {
    margin: 10px 0 0 30px;
    padding: 0;
  }
`;
