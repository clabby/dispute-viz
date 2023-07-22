import styled from "styled-components";

export const Footer = styled.div`
  width: 100%;
  height: 100px;
  text-align: center !important;
  margin: 50px 0;
  bottom: 0;
`

export const Code = styled.span`
  background-color: var(--text) !important;
  color: var(--bg) !important;
  padding: 0 5px;
  border-radius: 5px;

  &:hover {
    cursor: pointer;
    background-color: var(--text-dark) !important;
  }
`
