import { createGlobalStyle } from "styled-components";

export const MOBILE_MARGIN = 10;

export const GlobalStyle = createGlobalStyle`
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

    @media (max-width: ${(props) => props.theme.breakpointPhone}) {
      padding-bottom: 0;
    }
  }

  #main {
    background: ${(props) => props.theme.backgroundMain};
    max-width: 1024px;
    margin: auto;

    @media (max-width: ${(props) => props.theme.breakpointPhone}) {
      margin: 0 0 10px 0;
    }
  }

  input[type='text'],
  input[type='number'],
  input[type='password'],
  textarea {
    font-size: ${(props) => props.theme.fontSizeNormal};
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
