import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';

const ContainerOverlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  top: 0;
  padding: 0px 5px;
`;

const CloseButton = styled.button`
  background-color: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
`;

const TabButton = styled.button<{ active: boolean }>`
  min-width: 56px;
  font-size: 11px;
  ${(props) => (props.active ? `border-bottom: 2px solid red;` : '')}
`;

interface IStreamQualitySelector {
  callOnClick: (quality: string) => void;
  callOnClose: MouseEventHandler<any>;
}

function StreamQualityControls({ callOnClick, callOnClose }: IStreamQualitySelector) {
  const [tab, setTab] = React.useState('');

  return (
    <ContainerOverlay>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CloseButton onClick={callOnClose}>[x]</CloseButton>
      </div>
      <TabButton
        active={tab === 'low'}
        onClick={() => {
          setTab('low');
          callOnClick('low');
        }}
      >
        low
      </TabButton>
      <TabButton
        active={tab === 'medium'}
        onClick={() => {
          setTab('medium');
          callOnClick('medium');
        }}
      >
        medium
      </TabButton>
      <TabButton
        active={tab === 'high'}
        onClick={() => {
          setTab('high');
          callOnClick('high');
        }}
      >
        high
      </TabButton>
    </ContainerOverlay>
  );
}
export { StreamQualityControls };
