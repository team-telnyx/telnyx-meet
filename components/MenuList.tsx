import { useState } from 'react';
import { Box, Menu, Text } from 'grommet';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faAngleDown } from '@fortawesome/free-solid-svg-icons';
const breakpointMedium = 1023;

const FontAwesomeIconStyled = styled(FontAwesomeIcon)`
  @media (max-width: ${breakpointMedium}px) {
    font-size: 25px;
  }
`;

export function MenuList({
  title,
  data,
  onChange,
  disabled = false,
  size = 'medium',
}: {
  title: string;
  data: Array<{ label: string; value: string }>;
  onChange: (item: { label: string; value: string }) => void;
  disabled?: boolean;
  size?: string;
}) {
  const [selectedValue, setSelectedValue] = useState('');

  if (!data || data.length < 1) {
    return null;
  }

  return (
    <Menu
      size={size}
      label={title}
      items={data.map((item) => ({
        label: item.label,
        icon: (
          <Box>
            {item.value === selectedValue && (
              <Text color='accent-1'>
                <FontAwesomeIconStyled icon={faCheck} fixedWidth />
              </Text>
            )}
          </Box>
        ),
        // TODO give some sort UI feedback that device was successfully changed
        onClick: () => {
          setSelectedValue(item.value);
          onChange(item);
        },
      }))}
      disabled={disabled}
      icon={<FontAwesomeIcon icon={faAngleDown} fixedWidth />}
    ></Menu>
  );
}
