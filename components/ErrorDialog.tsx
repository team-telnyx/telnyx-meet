import React from 'react';

import { Box, Button, Text, Layer, Heading } from 'grommet';
import { FormClose } from 'grommet-icons';

const ErrorDialog = ({
  onClose,
  title,
  body,
}: {
  onClose: (
    event:
      | React.MouseEvent<HTMLElement, MouseEvent>
      | React.KeyboardEvent<HTMLElement>
  ) => void;
  title: string;
  body: string;
}) => {
  return (
    <Layer
      position='center'
      onClickOutside={onClose}
      onEsc={onClose}
      data-testid='room-controls-error'
    >
      <Box pad='medium' gap='small' width='medium'>
        <Button alignSelf='end' icon={<FormClose />} onClick={onClose} />
        <Heading level={3} margin='none'>
          {title}
        </Heading>
        <Text>{body}</Text>
        <Box
          as='footer'
          gap='small'
          direction='row'
          align='center'
          justify='end'
          pad={{ top: 'medium', bottom: 'small' }}
        />
        <Button
          label={
            <Text color='white'>
              <strong>Dismiss</strong>
            </Text>
          }
          onClick={onClose}
          primary
          color='status-critical'
        />
      </Box>
    </Layer>
  );
};

export default ErrorDialog;
