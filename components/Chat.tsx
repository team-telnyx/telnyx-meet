import { Button, TextInput } from 'grommet';
import { Send } from 'grommet-icons';

import React, { MouseEventHandler } from 'react';
import Draggable from 'react-draggable';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: absolute;
  bottom: 10%;
  left: 40%;
  background-color: white;
  width: 400px;
  height: 500px;
  z-index: 1000;
  color: #000;
  border-radius: 4px;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
`;

export const Chat = ({
  sendMessage,
  messages,
  onClose,
}: {
  sendMessage: Function;
  onClose: MouseEventHandler<HTMLButtonElement>;
  messages: Array<any>;
}) => {
  const [value, setValue] = React.useState('');

  return (
    <Draggable>
      <Wrapper>
        <div
          style={{
            backgroundColor: '#b5a4a4',
            display: 'flex',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            style={{
              marginLeft: 5,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            x
          </button>
          <h4
            style={{
              fontWeight: 500,
              textAlign: 'center',
              margin: 0,
              padding: '5px 0px',
            }}
          >
            Chat
          </h4>
          <hr style={{ margin: 0, padding: 0 }}></hr>
        </div>
        <div
          style={{
            display: 'block',
            width: 400,
            wordWrap: 'break-word',
            overflowY: 'auto',
          }}
        >
          {messages && messages?.length > 0
            ? messages.map((item: any) => (
                <p style={{ color: 'black' }}>{item}</p>
              ))
            : null}
        </div>
        <hr style={{ margin: 0, padding: 0 }}></hr>
        <div style={{ display: 'flex' }}>
          <TextInput
            focusIndicator={false}
            style={{ height: '100%', outline: 'none', boxShadow: 'none' }}
            placeholder='Type message here...'
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage(value);
                setValue('');
              }
            }}
          />
          <Button
            style={{ borderRadius: 4 }}
            margin={'none'}
            icon={<Send color='brand' />}
            onClick={() => {
              sendMessage(value);
              setValue('');
            }}
          />
        </div>
      </Wrapper>
    </Draggable>
  );
};
