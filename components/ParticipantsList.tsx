import { Box, Button, Heading, Text } from 'grommet';
import { FormClose as FormCloseIcon } from 'grommet-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from '@fortawesome/free-solid-svg-icons';
import { Participant, Stream } from '@telnyx/video';
import { TelnyxRoom } from '../hooks/room';

export default function ParticipantsList({
  participants,
  getParticipantStream,
  onChangeParticipantsListVisible,
}: {
  participants: TelnyxRoom['state']['participants'];
  getParticipantStream: TelnyxRoom['getParticipantStream'];
  onChangeParticipantsListVisible: Function;
}) {
  console.log('participants:', participants);

  return (
    <Box background='#2a2a2a' round='xsmall' fill>
      <Box direction='row' align='center' justify='between' pad='small'>
        <Heading margin='none' size='1.2em' level={2}>
          Participants ({Object.keys(participants).length})
        </Heading>

        <Box>
          <Button
            icon={<FormCloseIcon />}
            onClick={() => onChangeParticipantsListVisible(false)}
            plain
          />
        </Box>
      </Box>

      <Box pad={{ horizontal: 'small' }} fill overflow='auto'>
        {Array.from(participants.values()).map((participant) => {
          const context: {
            id: string;
            username: string;
          } = JSON.parse(
            participant.context || JSON.stringify({ id: 0, username: 'anon' })
          );

          const selfStream = getParticipantStream(participant.id, 'self');

          return (
            <Box
              key={participant.id}
              direction='row'
              justify='between'
              align='center'
              pad={{ vertical: 'small' }}
            >
              <div>
                {context.username}&nbsp;
                {participant.origin === 'local' && <strong> (me)</strong>}
              </div>
              <Box direction='row' gap='xsmall'>
                <Text
                  size='small'
                  color={!selfStream?.hasAudio ? 'status-disabled' : 'accent-1'}
                >
                  <FontAwesomeIcon
                    icon={
                      !selfStream?.hasAudio ? faMicrophoneSlash : faMicrophone
                    }
                    fixedWidth
                  />
                </Text>
                <Text
                  size='small'
                  color={!selfStream?.hasVideo ? 'status-disabled' : 'accent-1'}
                >
                  <FontAwesomeIcon
                    icon={!selfStream?.hasVideo ? faVideoSlash : faVideo}
                    fixedWidth
                  />
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
