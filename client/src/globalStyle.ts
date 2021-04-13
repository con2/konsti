import { createGlobalStyle } from 'styled-components';
import { Theme } from 'client/theme';

export const GlobalStyle = createGlobalStyle<{ theme: Theme }>`
  html {
    color: ${(props) => props.theme.mainText};
    display: flex;
    font-family: Helvetica, Arial, Verdana, Tahoma, sans-serif;
    font-size: ${(props) => props.theme.fontSizeNormal};
  }

  body {
    background-color: #f5f5f5;
    padding-bottom: 32px;
    margin: 0;
    width: 100%;
  }

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    body {
      background-color: #f5f5f5;
      padding-bottom: 0;
    }
  }

  #main {
    background-color: #F2F3F5;
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
    color: ${(props) => props.theme.inputPlaceholder};
  }

  input:focus {
    border: 1px solid #4d90fe;
    box-shadow: 0 0 5px 0 #4d90fe;
    box-sizing: border-box;
  }

  a {
    color: #1f4ba0;
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

  button {
    background: #fff;
    border: 1px solid #abd0a57a;
    border-bottom: 2px solid #abd0a5;
    border-radius: 5px;
    color: ${(props) => props.theme.buttonText};
    cursor: pointer;
    margin: 10px 10px 10px 0;
    padding: 6px 20px;
    font-size: ${(props) => props.theme.buttonFontSize};
  }

  button:hover,
  button:focus {
    background-color: ${(props) => props.theme.backgroundActive};
    border: 1px solid ${(props) => props.theme.borderActive};
    color: ${(props) => props.theme.borderActive};
  }

  button:disabled {
    background-color: ${(props) => props.theme.disabled};
  }

  button:disabled:hover,
  button:disabled:focus {
    color: ${(props) => props.theme.buttonText};
  }

  .small {
    font-size: 14px;
  }

  .bold {
    font-weight: 600;
  }

  .italic {
    font-style: italic;
  }

  .no-wrap {
    white-space: nowrap;
  }

  .break-long {
    word-break: break-word;
  }
`;
